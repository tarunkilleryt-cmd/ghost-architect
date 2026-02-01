import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyzeRequest {
  fileContent: string
  filePath: string
  fileName: string
  language: string
}

interface AIAnalysis {
  summary: string
  concepts: {
    name: string
    explanation: string
    difficulty: 'beginner' | 'intermediate' | 'expert'
  }[]
  patterns: string[]
  importanceScore: number
  category: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')

    // Get auth token from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with user's token
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { fileContent, filePath, fileName, language }: AnalyzeRequest = await req.json()

    console.log(`Analyzing file: ${filePath} for user: ${user.id}`)

    // Call Lovable AI Gateway for analysis
    let analysis: AIAnalysis

    if (lovableApiKey) {
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lovableApiKey}`
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            {
              role: 'system',
              content: `You are a code analysis AI for Ghost Architect. Analyze code files and return structured educational content. Always respond with valid JSON in this exact format:
{
  "summary": "2-3 sentence overview of what this file does",
  "concepts": [
    {
      "name": "Concept Name",
      "explanation": "Detailed markdown explanation of this concept",
      "difficulty": "beginner|intermediate|expert"
    }
  ],
  "patterns": ["Design pattern or technique used"],
  "importanceScore": 1-100,
  "category": "core|utility|interface|configuration"
}`
            },
            {
              role: 'user',
              content: `Analyze this ${language} file "${fileName}" and extract educational content:\n\n\`\`\`${language}\n${fileContent.slice(0, 8000)}\n\`\`\``
            }
          ],
          temperature: 0.3
        })
      })

      if (!aiResponse.ok) {
        console.error('AI Gateway error:', await aiResponse.text())
        throw new Error('AI analysis failed')
      }

      const aiData = await aiResponse.json()
      const content = aiData.choices[0]?.message?.content || ''
      
      // Parse the JSON response
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content]
        analysis = JSON.parse(jsonMatch[1] || content)
      } catch (parseError) {
        console.error('Failed to parse AI response:', content)
        // Fallback analysis
        analysis = generateFallbackAnalysis(fileName, language, fileContent)
      }
    } else {
      // Fallback to rule-based analysis if no AI key
      console.log('No LOVABLE_API_KEY, using fallback analysis')
      analysis = generateFallbackAnalysis(fileName, language, fileContent)
    }

    // Store in code_analysis table
    const { data: codeAnalysis, error: insertError } = await supabase
      .from('code_analysis')
      .upsert({
        user_id: user.id,
        file_path: filePath,
        ai_summary: analysis.summary,
        importance_score: analysis.importanceScore,
        category: analysis.category,
        language: language
      }, {
        onConflict: 'user_id,file_path',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      // Try to get existing record
      const { data: existing } = await supabase
        .from('code_analysis')
        .select()
        .eq('user_id', user.id)
        .eq('file_path', filePath)
        .single()
      
      if (existing) {
        // Update existing
        await supabase
          .from('code_analysis')
          .update({
            ai_summary: analysis.summary,
            importance_score: analysis.importanceScore,
            category: analysis.category,
            language: language,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
      }
    }

    // Store concepts in code_knowledge table
    if (codeAnalysis && analysis.concepts) {
      for (const concept of analysis.concepts) {
        await supabase
          .from('code_knowledge')
          .upsert({
            user_id: user.id,
            file_id: codeAnalysis.id,
            concept_name: concept.name,
            content_markdown: concept.explanation,
            difficulty_level: concept.difficulty
          })
      }
    }

    console.log('Analysis complete for:', filePath)

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        fileId: codeAnalysis?.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in analyze-code:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateFallbackAnalysis(fileName: string, language: string, content: string): AIAnalysis {
  // Count functions, classes, imports
  const functionMatches = content.match(/function\s+\w+|const\s+\w+\s*=\s*\(|=>\s*{/g) || []
  const classMatches = content.match(/class\s+\w+/g) || []
  const importMatches = content.match(/import\s+/g) || []
  const exportMatches = content.match(/export\s+/g) || []

  const complexity = functionMatches.length + classMatches.length * 2
  const isCore = exportMatches.length > 2 || classMatches.length > 0
  const isConfig = fileName.includes('config') || fileName.includes('.json')
  const isInterface = fileName.includes('types') || fileName.includes('interface')

  let category: 'core' | 'utility' | 'interface' | 'configuration' = 'utility'
  if (isCore) category = 'core'
  if (isConfig) category = 'configuration'
  if (isInterface) category = 'interface'

  const importanceScore = Math.min(100, 30 + complexity * 5 + exportMatches.length * 10)

  return {
    summary: `This ${language} file "${fileName}" contains ${functionMatches.length} functions, ${classMatches.length} classes, and ${importMatches.length} imports. It appears to be a ${category} module.`,
    concepts: [
      {
        name: `${language.charAt(0).toUpperCase() + language.slice(1)} Module Structure`,
        explanation: `This file demonstrates ${language} module patterns with ${exportMatches.length} exports.`,
        difficulty: complexity > 5 ? 'intermediate' : 'beginner'
      }
    ],
    patterns: complexity > 3 ? ['Modular Design', 'Separation of Concerns'] : ['Single Responsibility'],
    importanceScore,
    category
  }
}
