import { useEffect } from 'react';

const Presentation = () => {
  useEffect(() => {
    // Add print-specific styles
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .slide { page-break-after: always; break-after: page; }
        .slide:last-child { page-break-after: auto; }
        .no-print { display: none !important; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <div className="bg-[#0a0a1a] min-h-screen text-white">
      {/* Print Button */}
      <div className="no-print fixed top-4 right-4 z-50">
        <button 
          onClick={() => window.print()} 
          className="bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-3 rounded-lg font-bold hover:opacity-90 transition"
        >
          📄 Export as PDF (Ctrl+P)
        </button>
      </div>

      {/* Slide 1: Cover */}
      <div className="slide min-h-screen flex flex-col items-center justify-center p-12 bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a1a]">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            👻 Ghost Architect
          </h1>
          <p className="text-2xl text-gray-300 mb-8">Spatial Intelligence for Codebases</p>
          <div className="bg-white/10 backdrop-blur rounded-xl p-8 max-w-xl mx-auto">
            <table className="w-full text-left">
              <tbody>
                <tr className="border-b border-white/20">
                  <td className="py-3 font-bold text-cyan-400">Team Name</td>
                  <td className="py-3">Ghost Architects</td>
                </tr>
                <tr className="border-b border-white/20">
                  <td className="py-3 font-bold text-cyan-400">Team Leader</td>
                  <td className="py-3">Rinku</td>
                </tr>
                <tr className="border-b border-white/20">
                  <td className="py-3 font-bold text-cyan-400">Contact</td>
                  <td className="py-3">realtarun786@gmail.com</td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-cyan-400">Problem Statement</td>
                  <td className="py-3 text-sm">AI-powered solution for learning & productivity</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-8 text-gray-500">AWS AI for Bharat Hackathon 2026</p>
        </div>
      </div>

      {/* Slide 2: The Problem */}
      <div className="slide min-h-screen flex flex-col items-center justify-center p-12 bg-[#0a0a1a]">
        <h2 className="text-5xl font-bold mb-8 text-cyan-400">The Problem</h2>
        <div className="max-w-4xl space-y-6">
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6">
            <p className="text-2xl">Developers waste <span className="font-bold text-red-400">30-50% of their time</span> just trying to understand existing codebases.</p>
          </div>
          <div className="grid grid-cols-3 gap-6 mt-8">
            <div className="bg-white/5 rounded-xl p-6 text-center">
              <p className="text-4xl mb-2">📄</p>
              <p className="text-gray-400">Static docs are outdated</p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 text-center">
              <p className="text-4xl mb-2">🔍</p>
              <p className="text-gray-400">Code search lacks context</p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 text-center">
              <p className="text-4xl mb-2">❓</p>
              <p className="text-gray-400">No "WHY" explanations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Slide 3: The Solution */}
      <div className="slide min-h-screen flex flex-col items-center justify-center p-12 bg-gradient-to-br from-[#0a0a1a] to-[#1a1a3a]">
        <h2 className="text-5xl font-bold mb-8 text-purple-400">The Solution</h2>
        <div className="max-w-4xl">
          <p className="text-2xl text-center mb-8">
            Transform any GitHub repo into an <span className="text-cyan-400 font-bold">interactive, explorable knowledge graph</span> with AI-driven insights.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-cyan-500/20 to-transparent border border-cyan-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold text-cyan-400 mb-2">🗺️ Visual Code Maps</h3>
              <p className="text-gray-300">Interactive node graphs showing file relationships</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-transparent border border-purple-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold text-purple-400 mb-2">🤖 AI Intelligence</h3>
              <p className="text-gray-300">Strategic importance scoring & explanations</p>
            </div>
            <div className="bg-gradient-to-br from-green-500/20 to-transparent border border-green-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold text-green-400 mb-2">📚 Knowledge Base</h3>
              <p className="text-gray-300">Persistent analysis & learning progress</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500/20 to-transparent border border-yellow-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold text-yellow-400 mb-2">🔍 Semantic Search</h3>
              <p className="text-gray-300">Ask questions in plain English</p>
            </div>
          </div>
        </div>
      </div>

      {/* Slide 4: How It's Different */}
      <div className="slide min-h-screen flex flex-col items-center justify-center p-12 bg-[#0a0a1a]">
        <h2 className="text-5xl font-bold mb-8 text-cyan-400">How It's Different</h2>
        <div className="max-w-4xl w-full">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="py-4 text-left text-gray-400">Existing Tools</th>
                <th className="py-4 text-left text-cyan-400">Ghost Architect</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/10">
                <td className="py-4 text-gray-500">Static documentation (README)</td>
                <td className="py-4 text-white">Dynamic, AI-updated knowledge graph</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-4 text-gray-500">Code search (grep, GitHub)</td>
                <td className="py-4 text-white">Semantic understanding + visual navigation</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-4 text-gray-500">IDE navigation</td>
                <td className="py-4 text-white">Holistic architecture view + learning paths</td>
              </tr>
              <tr>
                <td className="py-4 text-gray-500">AI chatbots (ChatGPT)</td>
                <td className="py-4 text-white">Context-aware, codebase-specific AI tutor</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-8 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 rounded-xl p-6 text-center">
            <p className="text-xl font-bold">"The only tool that combines spatial visualization with semantic AI understanding."</p>
          </div>
        </div>
      </div>

      {/* Slide 5: Features */}
      <div className="slide min-h-screen flex flex-col items-center justify-center p-12 bg-gradient-to-br from-[#0a0a1a] to-[#1a1a3a]">
        <h2 className="text-5xl font-bold mb-8 text-purple-400">Core Features</h2>
        <div className="grid grid-cols-3 gap-6 max-w-5xl">
          <div className="bg-white/5 rounded-xl p-6 text-center hover:bg-white/10 transition">
            <p className="text-5xl mb-4">🔗</p>
            <h3 className="text-xl font-bold text-cyan-400 mb-2">One-Click Import</h3>
            <p className="text-gray-400">Paste GitHub URL → Get visual map</p>
          </div>
          <div className="bg-white/5 rounded-xl p-6 text-center hover:bg-white/10 transition">
            <p className="text-5xl mb-4">🧠</p>
            <h3 className="text-xl font-bold text-cyan-400 mb-2">AI Sidebar</h3>
            <p className="text-gray-400">Click any file → Get AI explanation</p>
          </div>
          <div className="bg-white/5 rounded-xl p-6 text-center hover:bg-white/10 transition">
            <p className="text-5xl mb-4">🔍</p>
            <h3 className="text-xl font-bold text-cyan-400 mb-2">Smart Search</h3>
            <p className="text-gray-400">"How does auth work?" → Learning path</p>
          </div>
          <div className="bg-white/5 rounded-xl p-6 text-center hover:bg-white/10 transition">
            <p className="text-5xl mb-4">🔥</p>
            <h3 className="text-xl font-bold text-purple-400 mb-2">Importance Heatmap</h3>
            <p className="text-gray-400">Critical files glow brighter</p>
          </div>
          <div className="bg-white/5 rounded-xl p-6 text-center hover:bg-white/10 transition">
            <p className="text-5xl mb-4">📁</p>
            <h3 className="text-xl font-bold text-purple-400 mb-2">Multi-Project</h3>
            <p className="text-gray-400">Manage multiple codebases</p>
          </div>
          <div className="bg-white/5 rounded-xl p-6 text-center hover:bg-white/10 transition">
            <p className="text-5xl mb-4">📊</p>
            <h3 className="text-xl font-bold text-purple-400 mb-2">Progress Tracking</h3>
            <p className="text-gray-400">Track your learning journey</p>
          </div>
        </div>
      </div>

      {/* Slide 6: Architecture */}
      <div className="slide min-h-screen flex flex-col items-center justify-center p-12 bg-[#0a0a1a]">
        <h2 className="text-5xl font-bold mb-8 text-cyan-400">Architecture</h2>
        <div className="max-w-4xl w-full space-y-4">
          <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-blue-400 mb-2">Frontend</h3>
            <p className="text-gray-300">React 18 + TypeScript + Tailwind CSS + shadcn/ui</p>
          </div>
          <div className="flex justify-center">
            <div className="text-4xl">⬇️</div>
          </div>
          <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-green-400 mb-2">Supabase Edge Functions</h3>
            <p className="text-gray-300">fetch-github-tree | analyze-code | search-knowledge</p>
          </div>
          <div className="flex justify-center">
            <div className="text-4xl">⬇️</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold text-purple-400 mb-2">Supabase Database</h3>
              <p className="text-gray-300">PostgreSQL + RLS + Auth</p>
            </div>
            <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold text-yellow-400 mb-2">AI Gateway</h3>
              <p className="text-gray-300">Gemini / GPT Integration</p>
            </div>
          </div>
        </div>
      </div>

      {/* Slide 7: Tech Stack */}
      <div className="slide min-h-screen flex flex-col items-center justify-center p-12 bg-gradient-to-br from-[#0a0a1a] to-[#1a1a3a]">
        <h2 className="text-5xl font-bold mb-8 text-purple-400">Tech Stack</h2>
        <div className="grid grid-cols-4 gap-6 max-w-4xl">
          {[
            { name: 'React 18', icon: '⚛️', color: 'cyan' },
            { name: 'TypeScript', icon: '📘', color: 'blue' },
            { name: 'Tailwind CSS', icon: '🎨', color: 'teal' },
            { name: 'Vite', icon: '⚡', color: 'yellow' },
            { name: 'Supabase', icon: '🔥', color: 'green' },
            { name: 'PostgreSQL', icon: '🐘', color: 'blue' },
            { name: 'Edge Functions', icon: '☁️', color: 'purple' },
            { name: 'AI Gateway', icon: '🤖', color: 'pink' },
          ].map((tech, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-6 text-center">
              <p className="text-4xl mb-2">{tech.icon}</p>
              <p className="font-bold">{tech.name}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <p className="text-gray-400">✅ Serverless First | ✅ Type-Safe | ✅ AI-Native | ✅ Cost Efficient</p>
        </div>
      </div>

      {/* Slide 8: Roadmap */}
      <div className="slide min-h-screen flex flex-col items-center justify-center p-12 bg-[#0a0a1a]">
        <h2 className="text-5xl font-bold mb-8 text-cyan-400">Roadmap</h2>
        <div className="max-w-4xl w-full space-y-6">
          <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-green-400 mb-2">✅ Phase 1: MVP (Current)</h3>
            <p className="text-gray-300">GitHub import, Visual graph, AI analysis, Auth, Knowledge Q&A</p>
          </div>
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-yellow-400 mb-2">🔜 Phase 2: Enhanced Learning</h3>
            <p className="text-gray-300">Collaborative annotations, Video explanations, Quiz generation</p>
          </div>
          <div className="bg-purple-500/20 border border-purple-500/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-purple-400 mb-2">📋 Phase 3: Team Features</h3>
            <p className="text-gray-300">Team workspaces, Shared knowledge, Code review integration</p>
          </div>
          <div className="bg-cyan-500/20 border border-cyan-500/50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-cyan-400 mb-2">🏢 Phase 4: Enterprise</h3>
            <p className="text-gray-300">Self-hosted, SSO/SAML, Private AI, Audit logs</p>
          </div>
        </div>
      </div>

      {/* Slide 9: Cost */}
      <div className="slide min-h-screen flex flex-col items-center justify-center p-12 bg-gradient-to-br from-[#0a0a1a] to-[#1a1a3a]">
        <h2 className="text-5xl font-bold mb-8 text-purple-400">Cost Estimate</h2>
        <div className="max-w-3xl w-full">
          <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-8 text-center mb-8">
            <p className="text-6xl font-bold text-green-400">$0</p>
            <p className="text-xl text-gray-300 mt-2">MVP Running Cost (Free Tier)</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="py-3 text-left text-gray-400">Service</th>
                <th className="py-3 text-left text-gray-400">Free Tier</th>
                <th className="py-3 text-left text-gray-400">Paid (Scale)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/10">
                <td className="py-3">Supabase DB</td>
                <td className="py-3 text-green-400">500MB free</td>
                <td className="py-3">$25/mo</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3">Edge Functions</td>
                <td className="py-3 text-green-400">500K/mo free</td>
                <td className="py-3">$2/million</td>
              </tr>
              <tr>
                <td className="py-3">AI Gateway</td>
                <td className="py-3 text-green-400">Included</td>
                <td className="py-3">$0.10/1K tokens</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide 10: Thank You */}
      <div className="slide min-h-screen flex flex-col items-center justify-center p-12 bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a1a]">
        <h1 className="text-7xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          👻 Ghost Architect
        </h1>
        <p className="text-3xl text-gray-300 mb-8">"See the code. Understand the why."</p>
        
        <div className="bg-white/10 backdrop-blur rounded-xl p-8 max-w-xl text-center space-y-4">
          <div>
            <p className="text-gray-400">Team Leader</p>
            <p className="text-xl font-bold">Rinku</p>
          </div>
          <div>
            <p className="text-gray-400">📧 Contact</p>
            <p className="text-cyan-400">realtarun786@gmail.com</p>
          </div>
          <div>
            <p className="text-gray-400">🐙 GitHub</p>
            <a href="https://github.com/tarunkilleryt-cmd/ghost-architect" className="text-cyan-400 hover:underline">
              github.com/tarunkilleryt-cmd/ghost-architect
            </a>
          </div>
        </div>
        
        <p className="mt-8 text-gray-500">AWS AI for Bharat Hackathon 2026</p>
        <p className="text-gray-600 text-sm mt-2">Powered by Supabase, React, and AI</p>
      </div>
    </div>
  );
};

export default Presentation;
