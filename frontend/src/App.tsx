import './index.css'

function App() {
  return (
    <div className="min-h-screen bg-chamber-bg">
      <header className="border-b border-chamber-border bg-chamber-surface">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent-blue rounded-lg flex items-center justify-center font-bold text-white text-sm">
              CS
            </div>
            <h1 className="text-xl font-bold text-chamber-text">
              Council Simulator
            </h1>
          </div>
          <span className="text-sm text-chamber-muted">
            AI-Powered City Council Debate Simulator
          </span>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-20">
          <h2 className="text-3xl font-bold mb-4">Council Simulator</h2>
          <p className="text-chamber-muted text-lg">
            Practice your data center pitch before the real city council meeting.
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
