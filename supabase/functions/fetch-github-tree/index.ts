import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GitHubTreeItem {
  path: string
  type: 'blob' | 'tree'
  sha: string
  size?: number
}

interface GitHubTreeResponse {
  sha: string
  tree: GitHubTreeItem[]
  truncated: boolean
}

interface ParsedFile {
  path: string
  name: string
  extension: string
  language: string
}

const CODE_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx', 'py', 'java', 'cs', 'go', 'rs', 'cpp', 'c', 'h', 'hpp', 'rb', 'php', 'swift', 'kt', 'scala', 'vue', 'svelte']

function detectLanguage(extension: string): string {
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    java: 'java',
    cs: 'csharp',
    go: 'unknown',
    rs: 'unknown',
    cpp: 'unknown',
    c: 'unknown',
    h: 'unknown',
    hpp: 'unknown',
    rb: 'unknown',
    php: 'unknown',
    swift: 'unknown',
    kt: 'unknown',
    scala: 'unknown',
    vue: 'javascript',
    svelte: 'javascript',
  }
  return langMap[extension.toLowerCase()] || 'unknown'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { owner, repo, branch } = await req.json()

    if (!owner || !repo) {
      return new Response(
        JSON.stringify({ error: 'Missing owner or repo parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Fetching GitHub tree for ${owner}/${repo}${branch ? ` (${branch})` : ''}`)

    // Get GitHub token for authenticated requests (5000 req/hour vs 60 unauthenticated)
    const githubToken = Deno.env.get('GITHUB_TOKEN')
    
    const githubHeaders: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Ghost-Architect-App',
    }
    
    if (githubToken) {
      githubHeaders['Authorization'] = `Bearer ${githubToken}`
      console.log('Using authenticated GitHub API requests')
    } else {
      console.log('Warning: No GITHUB_TOKEN found, using unauthenticated requests (60 req/hour limit)')
    }

    // First, get the default branch if not specified
    let targetBranch = branch
    if (!targetBranch) {
      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: githubHeaders,
      })

      if (!repoResponse.ok) {
        if (repoResponse.status === 404) {
          return new Response(
            JSON.stringify({ error: `Repository ${owner}/${repo} not found or is private` }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        if (repoResponse.status === 403) {
          const remaining = repoResponse.headers.get('X-RateLimit-Remaining')
          if (remaining === '0') {
            return new Response(
              JSON.stringify({ error: 'GitHub API rate limit exceeded. Please try again later.' }),
              { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }
        throw new Error(`GitHub API error: ${repoResponse.status}`)
      }

      const repoData = await repoResponse.json()
      targetBranch = repoData.default_branch || 'main'
    }

    // Fetch the full tree recursively
    const treeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${targetBranch}?recursive=1`,
      {
        headers: githubHeaders,
      }
    )

    if (!treeResponse.ok) {
      if (treeResponse.status === 404) {
        return new Response(
          JSON.stringify({ error: `Branch '${targetBranch}' not found in ${owner}/${repo}` }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw new Error(`GitHub API error: ${treeResponse.status}`)
    }

    const treeData: GitHubTreeResponse = await treeResponse.json()

    // Filter to only include code files
    const codeFiles: ParsedFile[] = []
    
    for (const item of treeData.tree) {
      if (item.type !== 'blob') continue
      
      const name = item.path.split('/').pop() || ''
      const dotIndex = name.lastIndexOf('.')
      
      if (dotIndex > 0) {
        const extension = name.slice(dotIndex + 1).toLowerCase()
        
        if (CODE_EXTENSIONS.includes(extension)) {
          codeFiles.push({
            path: item.path,
            name,
            extension,
            language: detectLanguage(extension),
          })
        }
      }
    }

    console.log(`Found ${codeFiles.length} code files in ${owner}/${repo}`)

    return new Response(
      JSON.stringify({
        success: true,
        owner,
        repo,
        branch: targetBranch,
        files: codeFiles,
        totalFiles: treeData.tree.filter(i => i.type === 'blob').length,
        truncated: treeData.truncated,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error fetching GitHub tree:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
