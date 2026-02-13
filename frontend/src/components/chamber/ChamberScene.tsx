import { motion, AnimatePresence } from 'framer-motion';
import type { Persona } from '../../types';

interface Props {
  personas: Persona[];
  currentSpeakerId: string | null;
  currentPhase: string | null;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// Position map for each role — percentage-based within the scene
const SEAT_POSITIONS: Record<string, { x: string; y: string }> = {
  moderator: { x: '50%', y: '12%' },
  'council-member': { x: '72%', y: '18%' },
  petitioner: { x: '28%', y: '60%' },
  'resident-1': { x: '55%', y: '78%' },
  'resident-2': { x: '72%', y: '72%' },
  'resident-3': { x: '38%', y: '78%' },
};

const PODIUM_POSITION = { x: '50%', y: '44%' };

export default function ChamberScene({ personas, currentSpeakerId, currentPhase }: Props) {
  if (personas.length === 0) return null;

  const currentSpeaker = personas.find(p => p.id === currentSpeakerId);

  return (
    <motion.div
      className="relative w-full h-[260px] sm:h-[300px] glass-card rounded-2xl overflow-hidden mb-5"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Background — council chamber atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628] via-[#0d1f3c] to-[#0a1628]" />

      {/* Radial light from above — council chamber lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-accent-blue/5 rounded-full blur-3xl" />

      {/* Council dais — arc at top */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 300" fill="none" preserveAspectRatio="xMidYMid meet">
        {/* Dais arc */}
        <path
          d="M200 70 Q400 10 600 70"
          stroke="rgba(99,102,241,0.15)"
          strokeWidth="2"
          fill="none"
        />
        {/* Dais surface */}
        <path
          d="M180 75 Q400 15 620 75 L600 85 Q400 30 200 85 Z"
          fill="rgba(99,102,241,0.04)"
          stroke="rgba(99,102,241,0.08)"
          strokeWidth="1"
        />

        {/* Podium — center */}
        <rect
          x="370" y="120"
          width="60" height="45"
          rx="4"
          fill="rgba(59,130,246,0.06)"
          stroke="rgba(59,130,246,0.15)"
          strokeWidth="1.5"
        />
        {/* Podium top */}
        <rect
          x="365" y="116"
          width="70" height="6"
          rx="2"
          fill="rgba(59,130,246,0.1)"
        />
        {/* Microphone */}
        <line x1="400" y1="120" x2="400" y2="108" stroke="rgba(148,163,184,0.3)" strokeWidth="1" />
        <circle cx="400" cy="106" r="3" fill="rgba(148,163,184,0.2)" stroke="rgba(148,163,184,0.3)" strokeWidth="1" />

        {/* Audience seating rows */}
        <path d="M150 210 Q400 195 650 210" stroke="rgba(148,163,184,0.06)" strokeWidth="1" fill="none" />
        <path d="M120 240 Q400 222 680 240" stroke="rgba(148,163,184,0.06)" strokeWidth="1" fill="none" />
        <path d="M100 270 Q400 250 700 270" stroke="rgba(148,163,184,0.06)" strokeWidth="1" fill="none" />
      </svg>

      {/* Phase label */}
      {currentPhase && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2">
          <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent-blue/40">
            {currentPhase.replace('_', ' ')}
          </div>
        </div>
      )}

      {/* Persona avatars at their seats */}
      {personas.map(persona => {
        const isSpeaking = persona.id === currentSpeakerId;
        const seatPos = SEAT_POSITIONS[persona.id] || SEAT_POSITIONS['resident-1'];

        return (
          <motion.div
            key={persona.id}
            className="absolute"
            style={{
              left: isSpeaking ? PODIUM_POSITION.x : seatPos.x,
              top: isSpeaking ? PODIUM_POSITION.y : seatPos.y,
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              left: isSpeaking ? PODIUM_POSITION.x : seatPos.x,
              top: isSpeaking ? PODIUM_POSITION.y : seatPos.y,
              scale: isSpeaking ? 1.2 : 0.85,
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          >
            {/* Glow ring when speaking */}
            <AnimatePresence>
              {isSpeaking && (
                <motion.div
                  className="absolute inset-[-6px] rounded-2xl"
                  style={{
                    boxShadow: `0 0 20px ${persona.color}40, 0 0 40px ${persona.color}20`,
                    border: `2px solid ${persona.color}60`,
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </AnimatePresence>

            {/* Avatar */}
            <div
              className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold text-white shadow-lg transition-all ${
                isSpeaking ? 'ring-2 ring-white/20' : 'opacity-60'
              }`}
              style={{ backgroundColor: persona.color }}
            >
              {getInitials(persona.name)}

              {/* Speaking indicator dots */}
              {isSpeaking && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-0.5">
                  <motion.div
                    className="w-1 h-1 rounded-full bg-white"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
                  />
                  <motion.div
                    className="w-1 h-1 rounded-full bg-white"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-1 h-1 rounded-full bg-white"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}
                  />
                </div>
              )}
            </div>

            {/* Name label */}
            <div className={`mt-1.5 text-center text-[9px] sm:text-[10px] font-medium whitespace-nowrap ${
              isSpeaking ? 'text-white' : 'text-chamber-muted/50'
            }`}>
              {persona.name.split(' ').slice(-1)[0]}
            </div>
          </motion.div>
        );
      })}

      {/* Current speaker label at podium */}
      <AnimatePresence>
        {currentSpeaker && (
          <motion.div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ bottom: '18%' }}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
          >
            <div className="text-xs font-semibold text-white/80 text-center whitespace-nowrap">
              {currentSpeaker.name}
            </div>
            <div className="text-[9px] text-chamber-muted/50 text-center uppercase tracking-wider">
              {currentSpeaker.role === 'council_member' ? 'Council Member' : currentSpeaker.role}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
