import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SetupForm from './components/setup/SetupForm';
import CouncilChamber from './components/chamber/CouncilChamber';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-chamber-bg">
        <header className="border-b border-chamber-border bg-chamber-surface">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 no-underline">
              <div className="w-8 h-8 bg-accent-blue rounded-lg flex items-center justify-center font-bold text-white text-sm">
                CS
              </div>
              <h1 className="text-xl font-bold text-chamber-text">
                Council Simulator
              </h1>
            </a>
            <span className="text-sm text-chamber-muted hidden sm:block">
              AI-Powered City Council Debate Simulator
            </span>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<SetupForm />} />
            <Route path="/simulation/:simulationId" element={<CouncilChamber />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
