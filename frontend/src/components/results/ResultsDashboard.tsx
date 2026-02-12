import { motion } from 'framer-motion';
import type { AnalysisResult, TranscriptMessage, Persona } from '../../types';
import ApprovalMeter from './ApprovalMeter';
import TranscriptExport from './TranscriptExport';

interface Props {
  analysis: AnalysisResult;
  messages: TranscriptMessage[];
  personas: Persona[];
  onNewSimulation: () => void;
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function ResultsDashboard({ analysis, messages, personas, onNewSimulation }: Props) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div className="text-center mb-10" {...fadeIn} transition={{ delay: 0 }}>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-green/10 border border-accent-green/20 text-xs font-medium text-accent-green mb-5">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 6l3 3 5-5" />
          </svg>
          Simulation Complete
        </div>
        <h2 className="text-4xl sm:text-5xl font-normal mb-3 font-display">
          <span className="text-gradient">Analysis</span> & Strategy
        </h2>
        <p className="text-chamber-muted text-base max-w-lg mx-auto">
          AI-powered post-debate analysis with actionable recommendations
        </p>
      </motion.div>

      {/* Approval Meter */}
      <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
        <ApprovalMeter
          score={analysis.approval_score}
          label={analysis.approval_label}
          reasoning={analysis.approval_reasoning}
        />
      </motion.div>

      {/* Key Arguments */}
      {analysis.key_arguments.length > 0 && (
        <motion.div
          className="glass-card rounded-2xl p-6 sm:p-8 mt-6"
          {...fadeIn}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent-purple">
                <path d="M8 1v14M1 8h14" />
              </svg>
            </div>
            <h3 className="text-xl font-normal font-display">Key Arguments</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Opposition */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-red" />
                <h4 className="text-xs font-bold text-accent-red uppercase tracking-wider">
                  Opposition
                </h4>
              </div>
              <div className="space-y-3">
                {analysis.key_arguments
                  .filter(a => a.side === 'opposition')
                  .map((arg, i) => (
                    <div key={i} className="p-4 rounded-xl bg-chamber-bg/60 border border-chamber-border/50">
                      <p className="text-sm text-chamber-text leading-relaxed">{arg.argument}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                          arg.strength === 'strong' ? 'bg-accent-red/10 text-accent-red border-accent-red/20' :
                          arg.strength === 'moderate' ? 'bg-accent-amber/10 text-accent-amber border-accent-amber/20' :
                          'bg-chamber-border/30 text-chamber-muted border-chamber-border/50'
                        }`}>{arg.strength}</span>
                        {arg.relevant_data && (
                          <span className="text-[11px] text-chamber-muted/60 truncate">{arg.relevant_data}</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Petitioner */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                <h4 className="text-xs font-bold text-accent-green uppercase tracking-wider">
                  Petitioner
                </h4>
              </div>
              <div className="space-y-3">
                {analysis.key_arguments
                  .filter(a => a.side === 'petitioner')
                  .map((arg, i) => (
                    <div key={i} className="p-4 rounded-xl bg-chamber-bg/60 border border-chamber-border/50">
                      <p className="text-sm text-chamber-text leading-relaxed">{arg.argument}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                          arg.strength === 'strong' ? 'bg-accent-green/10 text-accent-green border-accent-green/20' :
                          arg.strength === 'moderate' ? 'bg-accent-amber/10 text-accent-amber border-accent-amber/20' :
                          'bg-chamber-border/30 text-chamber-muted border-chamber-border/50'
                        }`}>{arg.strength}</span>
                        {arg.relevant_data && (
                          <span className="text-[11px] text-chamber-muted/60 truncate">{arg.relevant_data}</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recommended Rebuttals */}
      {analysis.recommended_rebuttals.length > 0 && (
        <motion.div
          className="glass-card rounded-2xl p-6 sm:p-8 mt-6"
          {...fadeIn}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent-cyan">
                <path d="M14 4l-6 6-3-3" />
                <path d="M1 8a7 7 0 1114 0" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-normal font-display">Recommended Rebuttals</h3>
              <p className="text-xs text-chamber-muted">Use these responses in your real council meeting</p>
            </div>
          </div>

          <div className="space-y-4 mt-5">
            {analysis.recommended_rebuttals.map((reb, i) => (
              <motion.div
                key={i}
                className="p-5 rounded-xl bg-chamber-bg/40 border border-chamber-border/50 hover:border-chamber-border transition-colors"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-accent-red/10 flex items-center justify-center text-accent-red text-[10px] font-bold">
                      {i + 1}
                    </span>
                    <p className="text-sm font-semibold text-accent-red">{reb.concern}</p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-md font-medium border shrink-0 ${
                    reb.effectiveness === 'high' ? 'bg-accent-green/10 text-accent-green border-accent-green/20' :
                    reb.effectiveness === 'moderate' ? 'bg-accent-amber/10 text-accent-amber border-accent-amber/20' :
                    'bg-chamber-border/30 text-chamber-muted border-chamber-border/50'
                  }`}>{reb.effectiveness} effectiveness</span>
                </div>
                <p className="text-sm text-chamber-text leading-relaxed mb-3">{reb.rebuttal}</p>
                {reb.supporting_data && (
                  <div className="flex items-start gap-2 text-xs text-accent-blue bg-accent-blue/5 border border-accent-blue/10 p-3 rounded-lg">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 mt-0.5">
                      <circle cx="8" cy="8" r="6.5" />
                      <path d="M8 5v4M8 11h.01" />
                    </svg>
                    <span>{reb.supporting_data}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Strategic Assessment */}
      <motion.div
        className="glass-card rounded-2xl p-6 sm:p-8 mt-6"
        {...fadeIn}
        transition={{ delay: 0.7 }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-accent-amber/10 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent-amber">
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.5 1.5M11 11l1.5 1.5M3.5 12.5l1.5-1.5M11 5l1.5-1.5" />
              <circle cx="8" cy="8" r="3" />
            </svg>
          </div>
          <h3 className="text-xl font-normal font-display">Strategic Assessment</h3>
        </div>
        <p className="text-sm text-chamber-text/90 leading-relaxed">{analysis.overall_assessment}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-accent-red/5 border border-accent-red/15">
            <div className="flex items-center gap-2 mb-2">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-red">
                <path d="M8 3v5M8 10v1" />
              </svg>
              <p className="text-[10px] font-bold text-accent-red uppercase tracking-wider">Strongest Opposition</p>
            </div>
            <p className="text-sm text-chamber-text leading-relaxed">{analysis.strongest_opposition_point}</p>
          </div>
          <div className="p-4 rounded-xl bg-accent-green/5 border border-accent-green/15">
            <div className="flex items-center gap-2 mb-2">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-green">
                <path d="M12 4L6 10l-3-3" />
              </svg>
              <p className="text-[10px] font-bold text-accent-green uppercase tracking-wider">Weakest Opposition</p>
            </div>
            <p className="text-sm text-chamber-text leading-relaxed">{analysis.weakest_opposition_point}</p>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        className="flex flex-col sm:flex-row justify-center gap-3 mt-10 mb-8"
        {...fadeIn}
        transition={{ delay: 0.9 }}
      >
        <button
          onClick={onNewSimulation}
          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-accent-blue to-accent-cyan text-white font-semibold hover:shadow-lg hover:shadow-accent-blue/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          Run Another Simulation
        </button>
        <TranscriptExport
          messages={messages}
          personas={personas}
          analysis={analysis}
        />
      </motion.div>
    </div>
  );
}
