import Link from 'next/link'

const FEATURES = [
  {
    title: 'AI Drawing Agent',
    description:
      'Describe your scene in natural language. MangaForge draws it stroke by stroke using your choice of AI: Claude, GPT-4o, Gemini, or Grok.'
  },
  {
    title: 'Layer System',
    description:
      'Professional 5-layer workflow: Background, Sketch, Line Art, Shadows, and Color — just like a real manga studio.'
  },
  {
    title: 'Character Consistency',
    description:
      'Save character profiles with visual attributes and reuse them across frames to maintain consistent designs.'
  },
  {
    title: 'Export Ready',
    description:
      'Export your panels in formats optimized for Webtoon Canvas and Tapas, with correct aspect ratios and resolution.'
  }
]

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-purple-900 text-white">
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold mb-4">
          Manga<span className="text-purple-400">Forge</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-300 mb-2">AI-Assisted Manga Creation Platform</p>
        <p className="text-gray-400 max-w-2xl mx-auto mb-10 text-sm sm:text-base px-2">
          Describe your scene in natural language. MangaForge draws it — layer by layer, stroke by
          stroke — exactly like a human artist, orchestrated by AI.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16 sm:mb-24 px-4">
          <Link
            href="/canvas"
            className="px-8 py-3 bg-purple-600 rounded-lg text-base sm:text-lg font-semibold hover:bg-purple-700 transition-colors text-center"
          >
            Start Creating
          </Link>
          <a
            href="#features"
            className="px-8 py-3 border border-purple-400 rounded-lg text-base sm:text-lg hover:bg-purple-900/50 transition-colors text-center"
          >
            Learn More
          </a>
        </div>

        <section id="features" className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors"
            >
              <h3 className="text-lg font-semibold text-purple-300 mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
