import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './components/landing/LandingPage';
import SetupForm from './components/setup/SetupForm';
import CouncilChamber from './components/chamber/CouncilChamber';
import './index.css';

function AppContent() {
  const location = useLocation();
  const isSimulation = location.pathname.startsWith('/simulation') || location.pathname.startsWith('/setup');

  return (
    <div className="min-h-screen bg-chamber-bg bg-grid-pattern relative">
      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-accent-blue/5 rounded-full blur-3xl" />
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-accent-purple/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-accent-blue/3 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-chamber-border/50 bg-chamber-bg/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 no-underline group">
            <div className="relative">
              <div className="w-9 h-9 bg-gradient-to-br from-accent-blue to-accent-cyan rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-accent-blue/20 group-hover:shadow-accent-blue/40 transition-shadow">
                CS
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-chamber-text leading-tight font-display">
                Council Simulator
              </h1>
              <span className="text-[10px] font-medium text-accent-blue/80 uppercase tracking-widest leading-tight hidden sm:block">
                AI-Powered Debate Simulator
              </span>
            </div>
          </a>
          {!isSimulation && (
            <div className="hidden md:flex items-center gap-2 text-xs text-chamber-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
              Powered by Claude Opus 4.6
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/setup" element={<SetupForm />} />
          <Route path="/simulation/:simulationId" element={<CouncilChamber />} />
        </Routes>
      </main>

      {/* Footer - only on setup page */}
      {!isSimulation && (
        <footer className="relative z-10 border-t border-chamber-border/30 mt-12">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-chamber-muted/60">
              Built with Claude Agent SDK + Claude Opus 4.6
            </p>
            <p className="text-xs text-chamber-muted/40">
              Amplifying human judgment for data center policy decisions
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
