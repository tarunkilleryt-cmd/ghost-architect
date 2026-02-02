import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StructureRequest {
  files: Array<{
    path: string;
    name: string;
    language: string;
  }>;
  projectName: string;
}

interface FileAnalysis {
  filePath: string;
  importance: number;
  category: 'core' | 'utility' | 'interface' | 'configuration';
  summary: string;
  connections: string[];
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

    const { files, projectName }: StructureRequest = await req.json()

    console.log(`Analyzing structure for project "${projectName}" with ${files.length} files for user ${user.id}`)

    let analyses: FileAnalysis[] = []

    if (lovableApiKey && files.length > 0) {
      // Build file list for AI - limit to first 100 files for API limits
      const filesToAnalyze = files.slice(0, 100)
      const fileList = filesToAnalyze.map(f => `- ${f.path} (${f.language})`).join('\n')

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
              content: `You are a code architecture analyzer for Ghost Architect. Given a list of files, analyze their importance, purpose, and relationships.

Return a JSON array of file analyses:
[
  {
    "filePath": "exact/path/from/input.ts",
    "importance": 1-100 (based on centrality and role),
    "category": "core|utility|interface|configuration",
    "summary": "2-3 sentences explaining what this file does, its purpose, and how it fits in the architecture",
    "connections": ["paths of files this likely imports or depends on"]
  }
]

Importance scoring guide:
- 90-100: Entry points (index.ts, main.ts, App.tsx), core routers, state stores
- 70-89: Major services, API handlers, important hooks, key pages
- 50-69: Components, utilities, helpers
- 30-49: Types, interfaces, configs
- 10-29: Tests, mocks, assets

Category definitions:
- core: Entry points, routers, stores, main pages, services, authentication
- utility: Helpers, hooks, shared components, utils
- interface: Types, interfaces, contracts
- configuration: Config files, constants, environment setup

IMPORTANT: Write detailed summaries explaining the PURPOSE and FUNCTION of each file. Users will search this to understand how things like authentication, routing, state management work.`
            },
            {
              role: 'user',
              content: `Project: ${projectName}\n\nFiles to analyze:\n${fileList}`
            }
          ],
          temperature: 0.3
        })
      })

      if (aiResponse.ok) {
        const aiData = await aiResponse.json()
        const content = aiData.choices[0]?.message?.content || '[]'
        
        try {
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content]
          analyses = JSON.parse(jsonMatch[1] || content)
        } catch (parseError) {
          console.error('Failed to parse AI response:', content)
          analyses = generateFallbackAnalyses(files)
        }
      } else {
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
        
        analyses = generateFallbackAnalyses(files)
      }
    } else {
      analyses = generateFallbackAnalyses(files)
    }

    console.log(`Generated ${analyses.length} file analyses, now storing in database...`)

    // Store all analyses in code_analysis table for searchability
    let storedCount = 0
    const analysesToStore = analyses.slice(0, 50) // Store top 50 files

    for (const analysis of analysesToStore) {
      try {
        const fileInfo = files.find(f => f.path === analysis.filePath)
        const language = fileInfo?.language || 'unknown'

        const { error: upsertError } = await supabase
          .from('code_analysis')
          .upsert({
            user_id: user.id,
            file_path: analysis.filePath,
            ai_summary: analysis.summary,
            importance_score: analysis.importance,
            category: analysis.category,
            language: language
          }, {
            onConflict: 'user_id,file_path'
          })

        if (upsertError) {
          console.error(`Failed to store analysis for ${analysis.filePath}:`, upsertError)
        } else {
          storedCount++
        }
      } catch (err) {
        console.error(`Error storing ${analysis.filePath}:`, err)
      }
    }

    console.log(`Stored ${storedCount} analyses in database for user ${user.id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        analyses,
        projectName,
        storedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in analyze-structure:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateFallbackAnalyses(files: Array<{ path: string; name: string; language: string }>): FileAnalysis[] {
  return files.map(file => {
    const pathLower = file.path.toLowerCase()
    const nameLower = file.name.toLowerCase()
    
    let importance = 40
    let category: 'core' | 'utility' | 'interface' | 'configuration' = 'utility'
    let summary = ''
    const connections: string[] = []
    
    // Entry points
    if (nameLower.includes('index') || nameLower.includes('main') || nameLower.includes('app.')) {
      importance = 90
      category = 'core'
      summary = `Main entry point file that bootstraps the application. This is where the app initializes and sets up core providers, routing, and global configuration.`
    }
    // Auth
    else if (pathLower.includes('auth') || nameLower.includes('auth')) {
      importance = 85
      category = 'core'
      summary = `Authentication module handling user login, signup, session management, and access control. Critical for user identity and security.`
    }
    // Routers/stores
    else if (pathLower.includes('router') || pathLower.includes('store') || pathLower.includes('context')) {
      importance = 80
      category = 'core'
      summary = `Core state management or routing file that controls application flow and data persistence across components.`
    }
    // Services/API
    else if (pathLower.includes('service') || pathLower.includes('api')) {
      importance = 75
      category = 'core'
      summary = `Service layer handling external API communication, data fetching, and backend integration logic.`
    }
    // Pages
    else if (pathLower.includes('page')) {
      importance = 65
      category = 'core'
      summary = `Page component representing a distinct view or route in the application. Contains layout and feature logic for this screen.`
    }
    // Hooks
    else if (pathLower.includes('hook') || nameLower.startsWith('use')) {
      importance = 60
      category = 'utility'
      summary = `Custom React hook providing reusable stateful logic and side effects that can be shared across components.`
    }
    // Components
    else if (pathLower.includes('component')) {
      importance = 55
      category = 'utility'
      summary = `Reusable UI component that encapsulates visual elements and interaction logic for the user interface.`
    }
    // Types
    else if (pathLower.includes('type') || pathLower.includes('interface') || nameLower.includes('.d.ts')) {
      importance = 35
      category = 'interface'
      summary = `Type definitions and interfaces that define data structures and contracts used throughout the codebase.`
    }
    // Config
    else if (pathLower.includes('config') || nameLower.includes('.json') || nameLower.includes('.yaml')) {
      importance = 30
      category = 'configuration'
      summary = `Configuration file containing settings, environment variables, or build parameters for the application.`
    }
    // Tests
    else if (pathLower.includes('test') || pathLower.includes('spec')) {
      importance = 20
      category = 'utility'
      summary = `Test file containing unit tests or integration tests to verify the functionality of related modules.`
    }
    else {
      summary = `${file.language} ${category} file: ${file.name}. Part of the project's ${pathLower.split('/')[0] || 'source'} module.`
    }
    
    // Find potential connections
    for (const other of files) {
      if (other.path === file.path) continue
      
      const otherDir = other.path.split('/').slice(0, -1).join('/')
      const fileDir = file.path.split('/').slice(0, -1).join('/')
      
      if (nameLower === 'index.ts' || nameLower === 'index.tsx') {
        if (otherDir === fileDir) {
          connections.push(other.path)
        }
      }
      
      if ((nameLower.includes('app') || nameLower.includes('main')) && 
          (other.name.toLowerCase().includes('router') || other.name.toLowerCase().includes('store'))) {
        connections.push(other.path)
      }
    }
    
    return {
      filePath: file.path,
      importance,
      category,
      summary,
      connections: connections.slice(0, 5)
    }
  })
}
