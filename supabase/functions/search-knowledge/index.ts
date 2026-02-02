import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

interface SearchRequest {
  query: string
}

interface FileReference {
  file_path: string
  file_id: string
  role: string
  what_it_does: string
  why_important: string
}

interface SearchResponse {
  answer: string
  explanation: string
  files: FileReference[]
  learning_path?: {
    step: number
    file_path: string
    file_id: string
    reason: string
  }[]
  patterns_detected?: string[]
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { query }: SearchRequest = await req.json()

    console.log(`Search query: "${query}" for user: ${user.id}`)

    // Fetch all code analysis and knowledge for this user
    const { data: analyses, error: fetchError } = await supabase
      .from('code_analysis')
      .select(`
        id,
        file_path,
        ai_summary,
        category,
        importance_score,
        language,
        code_knowledge (
          concept_name,
          content_markdown,
          difficulty_level
        )
      `)
      .eq('user_id', user.id)

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      throw new Error('Failed to fetch knowledge base')
    }

    if (!analyses || analyses.length === 0) {
      return new Response(
        JSON.stringify({
          answer: 'No analyzed files found.',
          explanation: 'You need to analyze some files first before I can answer questions about the codebase. Click on nodes in the graph and use "Analyze with AI" to build your knowledge base.',
          files: [],
          difficulty_level: 'beginner'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({
          answer: 'AI not configured',
          explanation: 'The Lovable AI Gateway is not configured. Please ensure the LOVABLE_API_KEY is set.',
          files: [],
          difficulty_level: 'beginner'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build rich context from knowledge base
    const knowledgeContext = analyses.map(a => ({
      file_path: a.file_path,
      file_id: a.id,
      summary: a.ai_summary,
      category: a.category,
      importance: a.importance_score,
      language: a.language,
      concepts: a.code_knowledge?.map((k: any) => ({
        name: k.concept_name,
        explanation: k.content_markdown,
        difficulty: k.difficulty_level
      })) || []
    }))

    const systemPrompt = `You are Ghost Architect's AI assistant - an expert code educator who helps developers understand codebases deeply.

Your role is to provide EDUCATIONAL, CONTEXTUAL answers that explain:
1. **What** - What the code/pattern/concept does
2. **Why** - Why it exists and what problem it solves
3. **Where** - Which files are involved and their roles
4. **How** - How the pieces connect and work together

RESPONSE FORMAT (JSON):
{
  "answer": "A clear, educational answer (2-3 sentences) directly addressing the question",
  "explanation": "A detailed explanation (3-5 paragraphs in markdown) covering the architecture, patterns, data flow, and reasoning. Use bullet points and headers for clarity.",
  "files": [
    {
      "file_path": "path/to/file.ts",
      "file_id": "uuid-from-context",
      "role": "What role this file plays (e.g., 'Entry Point', 'State Manager', 'UI Component')",
      "what_it_does": "Brief description of what this file does",
      "why_important": "Why this file matters for understanding the question"
    }
  ],
  "learning_path": [
    {
      "step": 1,
      "file_path": "path/to/first-file.ts",
      "file_id": "uuid",
      "reason": "Start here because..."
    }
  ],
  "patterns_detected": ["Pattern Name 1", "Pattern Name 2"],
  "difficulty_level": "beginner|intermediate|advanced"
}

GUIDELINES:
- If asked about architectural patterns (MVC, Atomic Design, etc.), explain what pattern is used AND why
- If asked for a learning path, create a numbered sequence with clear reasoning for each step
- Always connect files to their PURPOSE, not just list them
- Use the file summaries and concepts from the knowledge base to inform your answer
- If the knowledge base doesn't have enough info, say so honestly
- Format the explanation in markdown with headers, bullet points, and code references`

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `User Question: "${query}"

Knowledge Base (${knowledgeContext.length} analyzed files):
${JSON.stringify(knowledgeContext, null, 2)}

Provide an educational, contextual answer following the JSON format.`
          }
        ],
        temperature: 0.3
      })
    })

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text()
      console.error('AI Gateway error:', errorText)
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      throw new Error('AI Gateway error')
    }

    const aiData = await aiResponse.json()
    const content = aiData.choices[0]?.message?.content || '{}'
    
    console.log('AI Response:', content)

    try {
      // Parse JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content]
      const parsed: SearchResponse = JSON.parse(jsonMatch[1] || content)
      
      // Validate file references exist in our knowledge base
      if (parsed.files) {
        parsed.files = parsed.files.filter((f: FileReference) => 
          analyses.some(a => a.file_path === f.file_path)
        ).map((f: FileReference) => {
          const analysis = analyses.find(a => a.file_path === f.file_path)
          return {
            ...f,
            file_id: analysis?.id || f.file_id
          }
        })
      }

      if (parsed.learning_path) {
        parsed.learning_path = parsed.learning_path.filter(lp => 
          analyses.some(a => a.file_path === lp.file_path)
        ).map(lp => {
          const analysis = analyses.find(a => a.file_path === lp.file_path)
          return {
            ...lp,
            file_id: analysis?.id || lp.file_id
          }
        })
      }

      console.log(`Returning educational answer for: "${query}"`)

      return new Response(
        JSON.stringify(parsed),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, content)
      
      // Return a basic response if parsing fails
      return new Response(
        JSON.stringify({
          answer: 'I analyzed your question but had trouble formatting the response.',
          explanation: content,
          files: [],
          difficulty_level: 'intermediate'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Error in search-knowledge:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
