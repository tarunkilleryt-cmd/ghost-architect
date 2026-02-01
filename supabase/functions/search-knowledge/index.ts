import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchRequest {
  query: string
}

interface SearchResult {
  file_path: string
  file_id: string
  relevance: number
  reason: string
  concepts: string[]
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
          results: [],
          message: 'No analyzed files found. Analyze some files first to enable search.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let results: SearchResult[] = []

    if (lovableApiKey) {
      // Build context from knowledge base
      const knowledgeContext = analyses.map(a => ({
        file_path: a.file_path,
        summary: a.ai_summary,
        category: a.category,
        concepts: a.code_knowledge?.map((k: any) => k.concept_name) || []
      }))

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
              content: `You are a code search assistant for Ghost Architect. Given a user query and a knowledge base of analyzed files, find the most relevant files.

Return JSON array of results:
[
  {
    "file_path": "path/to/file.ts",
    "relevance": 0.0-1.0,
    "reason": "Brief explanation why this file matches"
  }
]

Only include files with relevance > 0.3. Max 5 results. Return empty array if no matches.`
            },
            {
              role: 'user',
              content: `Query: "${query}"

Knowledge Base:
${JSON.stringify(knowledgeContext, null, 2)}`
            }
          ],
          temperature: 0.2
        })
      })

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text()
        console.error('AI Gateway error:', errorText)
        
        // Check for rate limit or payment errors
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
        
        // Fallback to text search
        results = performTextSearch(query, analyses)
      } else {
        const aiData = await aiResponse.json()
        const content = aiData.choices[0]?.message?.content || '[]'
        
        try {
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content]
          const parsed = JSON.parse(jsonMatch[1] || content)
          
          results = parsed.map((r: any) => {
            const analysis = analyses.find(a => a.file_path === r.file_path)
            return {
              file_path: r.file_path,
              file_id: analysis?.id || '',
              relevance: r.relevance,
              reason: r.reason,
              concepts: analysis?.code_knowledge?.map((k: any) => k.concept_name) || []
            }
          }).filter((r: SearchResult) => r.file_id)
        } catch (parseError) {
          console.error('Failed to parse AI response:', content)
          results = performTextSearch(query, analyses)
        }
      }
    } else {
      // Fallback to text-based search
      results = performTextSearch(query, analyses)
    }

    console.log(`Found ${results.length} results for query: "${query}"`)

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in search-knowledge:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function performTextSearch(query: string, analyses: any[]): SearchResult[] {
  const queryLower = query.toLowerCase()
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2)

  const scored = analyses.map(a => {
    let score = 0
    const matchReasons: string[] = []

    // Check file path
    if (a.file_path.toLowerCase().includes(queryLower)) {
      score += 0.5
      matchReasons.push('File path matches')
    }

    // Check summary
    if (a.ai_summary?.toLowerCase().includes(queryLower)) {
      score += 0.4
      matchReasons.push('Summary contains query')
    }

    // Check concepts
    const conceptMatches = a.code_knowledge?.filter((k: any) => 
      k.concept_name.toLowerCase().includes(queryLower) ||
      k.content_markdown?.toLowerCase().includes(queryLower)
    ) || []
    
    if (conceptMatches.length > 0) {
      score += 0.3 * conceptMatches.length
      matchReasons.push(`${conceptMatches.length} concept(s) match`)
    }

    // Word-level matching
    for (const word of queryWords) {
      if (a.file_path.toLowerCase().includes(word)) score += 0.1
      if (a.ai_summary?.toLowerCase().includes(word)) score += 0.1
      if (a.category?.toLowerCase().includes(word)) score += 0.1
    }

    return {
      file_path: a.file_path,
      file_id: a.id,
      relevance: Math.min(1, score),
      reason: matchReasons.join('. ') || 'Partial word match',
      concepts: a.code_knowledge?.map((k: any) => k.concept_name) || []
    }
  })

  return scored
    .filter(s => s.relevance > 0.2)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5)
}
