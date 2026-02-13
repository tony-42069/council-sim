import { motion, AnimatePresence } from 'framer-motion';
import type { Persona } from '../../types';

interface Props {
  personas: Persona[];
  currentSpeakerId: string | null;
  currentPhase: string | null;
}

// SVG human figure — standing pose, gender-aware
function PersonFigure({ gender, color, scale = 1 }: { gender: 'male' | 'female'; color: string; scale?: number }) {
  if (gender === 'female') {
    return (
      <svg width={28 * scale} height={52 * scale} viewBox="0 0 28 52" fill="none">
        {/* Head */}
        <circle cx="14" cy="7" r="5.5" fill={color} />
        {/* Hair */}
        <path d="M8.5 5.5C8.5 3 10.5 1 14 1C17.5 1 19.5 3 19.5 5.5C19.5 5.5 20 7 19 9C19 9 18.5 6 14 6C9.5 6 9 9 9 9C8 7 8.5 5.5 8.5 5.5Z" fill={color} opacity="0.7" />
        {/* Neck */}
        <rect x="12" y="12" width="4" height="3" rx="1" fill={color} opacity="0.9" />
        {/* Torso — fitted top */}
        <path d="M8 15H20L19 28H9L8 15Z" fill={color} opacity="0.85" rx="2" />
        {/* Arms */}
        <path d="M8 16L4 26L6 27L9 19" fill={color} opacity="0.75" />
        <path d="M20 16L24 26L22 27L19 19" fill={color} opacity="0.75" />
        {/* Skirt / lower body */}
        <path d="M9 28L6 44H11L13 34H15L17 44H22L19 28H9Z" fill={color} opacity="0.7" />
        {/* Shoes */}
        <ellipse cx="8.5" cy="45" rx="3" ry="1.5" fill={color} opacity="0.6" />
        <ellipse cx="19.5" cy="45" rx="3" ry="1.5" fill={color} opacity="0.6" />
      </svg>
    );
  }

  // Male figure
  return (
    <svg width={28 * scale} height={52 * scale} viewBox="0 0 28 52" fill="none">
      {/* Head */}
      <circle cx="14" cy="7" r="5.5" fill={color} />
      {/* Short hair */}
      <path d="M9 5C9 2.5 11 1 14 1C17 1 19 2.5 19 5C19 5 18.5 3.5 14 3.5C9.5 3.5 9 5 9 5Z" fill={color} opacity="0.7" />
      {/* Neck */}
      <rect x="12" y="12" width="4" height="3" rx="1" fill={color} opacity="0.9" />
      {/* Torso — suit jacket */}
      <path d="M7 15H21L20 30H8L7 15Z" fill={color} opacity="0.85" />
      {/* Lapels / tie detail */}
      <path d="M13 15L14 22L15 15" stroke={color} strokeWidth="0.5" opacity="0.5" />
      {/* Arms */}
      <path d="M7 16L3 27L5 28L8 19" fill={color} opacity="0.75" />
      <path d="M21 16L25 27L23 28L20 19" fill={color} opacity="0.75" />
      {/* Legs — trousers */}
      <path d="M8 30L7 44H12L13 32H15L16 44H21L20 30H8Z" fill={color} opacity="0.7" />
      {/* Shoes */}
      <ellipse cx="9.5" cy="45" rx="3" ry="1.5" fill={color} opacity="0.6" />
      <ellipse cx="18.5" cy="45" rx="3" ry="1.5" fill={color} opacity="0.6" />
    </svg>
  );
}

// Infer gender from common first names
function inferGender(name: string): 'male' | 'female' {
  const first = name.split(' ')[0].replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.)?\s*/i, '');
  const cleanFirst = name.includes('.') ? name.split('.').pop()?.trim().split(' ')[0] || first : first;
  const femaleNames = ['sarah', 'linda', 'patricia', 'karen', 'jennifer', 'lisa', 'nancy', 'betty',
    'margaret', 'sandra', 'ashley', 'dorothy', 'kimberly', 'emily', 'donna', 'michelle', 'carol',
    'amanda', 'melissa', 'deborah', 'stephanie', 'rebecca', 'sharon', 'laura', 'cynthia', 'kathleen',
    'amy', 'angela', 'shirley', 'anna', 'brenda', 'pamela', 'emma', 'nicole', 'helen', 'samantha',
    'katherine', 'christine', 'debra', 'rachel', 'carolyn', 'janet', 'catherine', 'maria', 'heather',
    'diane', 'ruth', 'julie', 'olivia', 'joyce', 'virginia', 'victoria', 'kelly', 'lauren', 'christina',
    'joan', 'evelyn', 'judith', 'megan', 'andrea', 'cheryl', 'hannah', 'jacqueline', 'martha', 'gloria',
    'teresa', 'ann', 'sara', 'madison', 'frances', 'kathryn', 'janice', 'jean', 'abigail', 'alice',
    'judy', 'sophia', 'grace', 'denise', 'amber', 'doris', 'marilyn', 'danielle', 'beverly', 'isabella',
    'theresa', 'diana', 'natalie', 'brittany', 'charlotte', 'marie', 'kayla', 'alexis', 'lori'];
  return femaleNames.includes(cleanFirst.toLowerCase()) ? 'female' : 'male';
}

// Position map for each role
const SEAT_POSITIONS: Record<string, { x: number; y: number }> = {
  moderator: { x: 50, y: 8 },
  'council-member': { x: 74, y: 14 },
  petitioner: { x: 26, y: 55 },
  'resident-1': { x: 55, y: 76 },
  'resident-2': { x: 74, y: 72 },
  'resident-3': { x: 36, y: 76 },
};

const PODIUM_POSITION = { x: 50, y: 40 };

export default function ChamberScene({ personas, currentSpeakerId, currentPhase }: Props) {
  if (personas.length === 0) return null;

  const currentSpeaker = personas.find(p => p.id === currentSpeakerId);

  return (
    <motion.div
      className="relative w-full h-[240px] sm:h-[280px] glass-card rounded-2xl overflow-hidden mb-4"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#080e1e] via-[#0c1a35] to-[#0a1225]" />

      {/* Ambient spotlight from above */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[180px] bg-accent-blue/4 rounded-full blur-[60px]" />

      {/* Podium spotlight */}
      <AnimatePresence>
        {currentSpeakerId && (
          <motion.div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ top: '30%' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-[100px] h-[120px] bg-white/[0.02] rounded-full blur-[30px]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* SVG Council Chamber elements */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 280" fill="none" preserveAspectRatio="xMidYMid meet">
        {/* Dais arc — raised platform for council */}
        <path
          d="M200 55 Q400 15 600 55"
          stroke="rgba(99,102,241,0.12)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M210 58 Q400 20 590 58 L585 65 Q400 28 215 65 Z"
          fill="rgba(99,102,241,0.03)"
        />

        {/* Podium structure */}
        <g opacity="0.9">
          <rect x="372" y="105" width="56" height="40" rx="3" fill="rgba(59,130,246,0.05)" stroke="rgba(59,130,246,0.12)" strokeWidth="1" />
          <rect x="368" y="101" width="64" height="5" rx="2" fill="rgba(59,130,246,0.08)" />
          {/* Microphone */}
          <line x1="400" y1="101" x2="400" y2="90" stroke="rgba(148,163,184,0.25)" strokeWidth="1" />
          <circle cx="400" cy="88" r="2.5" fill="rgba(148,163,184,0.15)" stroke="rgba(148,163,184,0.25)" strokeWidth="0.8" />
        </g>

        {/* Audience seating rows */}
        <path d="M160 195 Q400 182 640 195" stroke="rgba(148,163,184,0.04)" strokeWidth="0.8" fill="none" />
        <path d="M130 220 Q400 205 670 220" stroke="rgba(148,163,184,0.04)" strokeWidth="0.8" fill="none" />
        <path d="M110 245 Q400 228 690 245" stroke="rgba(148,163,184,0.04)" strokeWidth="0.8" fill="none" />

        {/* "COUNCIL CHAMBER" text */}
        <text x="400" y="275" textAnchor="middle" fill="rgba(148,163,184,0.06)" fontSize="10" fontFamily="monospace" letterSpacing="6">
          COUNCIL CHAMBER
        </text>
      </svg>

      {/* Phase label overlay */}
      {currentPhase && (
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-10">
          <div className="text-[8px] font-bold uppercase tracking-[0.3em] text-accent-blue/30 bg-chamber-bg/40 px-3 py-1 rounded-full backdrop-blur-sm">
            {currentPhase.replace('_', ' ')}
          </div>
        </div>
      )}

      {/* Persona figures at their positions */}
      {personas.map(persona => {
        const isSpeaking = persona.id === currentSpeakerId;
        const seat = SEAT_POSITIONS[persona.id] || SEAT_POSITIONS['resident-1'];
        const gender = inferGender(persona.name);
        const targetX = isSpeaking ? PODIUM_POSITION.x : seat.x;
        const targetY = isSpeaking ? PODIUM_POSITION.y : seat.y;

        return (
          <motion.div
            key={persona.id}
            className="absolute z-10"
            style={{ originX: 0.5, originY: 1 }}
            animate={{
              left: `${targetX}%`,
              top: `${targetY}%`,
              scale: isSpeaking ? 1.1 : 0.7,
              opacity: isSpeaking ? 1 : 0.5,
            }}
            transition={{ type: 'spring', stiffness: 120, damping: 20, mass: 0.8 }}
          >
            <div className="relative -translate-x-1/2 -translate-y-1/2">
              {/* Speaking glow */}
              <AnimatePresence>
                {isSpeaking && (
                  <motion.div
                    className="absolute -inset-3 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${persona.color}15 0%, transparent 70%)`,
                    }}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  />
                )}
              </AnimatePresence>

              {/* Human figure */}
              <PersonFigure
                gender={gender}
                color={persona.color || '#6366f1'}
                scale={isSpeaking ? 1.0 : 0.85}
              />

              {/* Speaking pulse dots */}
              {isSpeaking && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-[3px]">
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <motion.div
                      key={i}
                      className="w-[3px] h-[3px] rounded-full"
                      style={{ backgroundColor: persona.color }}
                      animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                      transition={{ repeat: Infinity, duration: 1, delay }}
                    />
                  ))}
                </div>
              )}

              {/* Name tag */}
              <div className={`mt-0.5 text-center whitespace-nowrap ${
                isSpeaking ? 'text-[10px] font-semibold text-white' : 'text-[8px] text-chamber-muted/40'
              }`}>
                {persona.name.split(' ').slice(-1)[0]}
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Current speaker name plate at bottom of podium */}
      <AnimatePresence>
        {currentSpeaker && (
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 z-20"
            style={{ bottom: '12%' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
          >
            <div className="glass-card px-4 py-1.5 rounded-lg text-center">
              <div className="text-xs font-semibold text-white">{currentSpeaker.name}</div>
              <div className="text-[9px] text-chamber-muted/60 uppercase tracking-wider">
                {currentSpeaker.role === 'council_member' ? 'Council Member' : currentSpeaker.role}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
