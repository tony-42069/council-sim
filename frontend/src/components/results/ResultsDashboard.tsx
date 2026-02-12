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
      <motion.div className="text-center mb-8" {...fadeIn} transition={{ delay: 0 }}>
        <h2 className="text-3xl font-bold mb-2">Simulation Results</h2>
        <p className="text-chamber-muted">Post-debate analysis and strategic recommendations</p>
      </motion.div>

      {/* Animated Approval Meter */}
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
          className="bg-chamber-surface rounded-xl border border-chamber-border p-6 mt-6"
          {...fadeIn}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold mb-4">Key Arguments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Opposition */}
            <div>
              <h4 className="text-sm font-semibold text-accent-red mb-3 uppercase tracking-wide">
                Opposition
              </h4>
              <div className="space-y-3">
                {analysis.key_arguments
                  .filter(a => a.side === 'opposition')
                  .map((arg, i) => (
                    <div key={i} className="p-3 rounded-lg bg-chamber-bg border border-chamber-border">
                      <p className="text-sm text-chamber-text">{arg.argument}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          arg.strength === 'strong' ? 'bg-accent-red/20 text-accent-red' :
                          arg.strength === 'moderate' ? 'bg-accent-amber/20 text-accent-amber' :
                          'bg-chamber-border text-chamber-muted'
                        }`}>{arg.strength}</span>
                        {arg.relevant_data && (
                          <span className="text-xs text-chamber-muted">{arg.relevant_data}</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Petitioner */}
            <div>
              <h4 className="text-sm font-semibold text-accent-green mb-3 uppercase tracking-wide">
                Petitioner
              </h4>
              <div className="space-y-3">
                {analysis.key_arguments
                  .filter(a => a.side === 'petitioner')
                  .map((arg, i) => (
                    <div key={i} className="p-3 rounded-lg bg-chamber-bg border border-chamber-border">
                      <p className="text-sm text-chamber-text">{arg.argument}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          arg.strength === 'strong' ? 'bg-accent-green/20 text-accent-green' :
                          arg.strength === 'moderate' ? 'bg-accent-amber/20 text-accent-amber' :
                          'bg-chamber-border text-chamber-muted'
                        }`}>{arg.strength}</span>
                        {arg.relevant_data && (
                          <span className="text-xs text-chamber-muted">{arg.relevant_data}</span>
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
          className="bg-chamber-surface rounded-xl border border-chamber-border p-6 mt-6"
          {...fadeIn}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold mb-2">Recommended Rebuttals</h3>
          <p className="text-sm text-chamber-muted mb-4">
            Use these responses in your real city council meeting
          </p>
          <div className="space-y-4">
            {analysis.recommended_rebuttals.map((reb, i) => (
              <motion.div
                key={i}
                className="p-4 rounded-lg bg-chamber-bg border border-chamber-border"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm font-semibold text-accent-red">{reb.concern}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                    reb.effectiveness === 'high' ? 'bg-accent-green/20 text-accent-green' :
                    reb.effectiveness === 'moderate' ? 'bg-accent-amber/20 text-accent-amber' :
                    'bg-chamber-border text-chamber-muted'
                  }`}>{reb.effectiveness}</span>
                </div>
                <p className="text-sm text-chamber-text mb-2">{reb.rebuttal}</p>
                {reb.supporting_data && (
                  <p className="text-xs text-accent-blue bg-accent-blue/5 p-2 rounded">
                    Data: {reb.supporting_data}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Overall Assessment */}
      <motion.div
        className="bg-chamber-surface rounded-xl border border-chamber-border p-6 mt-6"
        {...fadeIn}
        transition={{ delay: 0.7 }}
      >
        <h3 className="text-lg font-semibold mb-3">Strategic Assessment</h3>
        <p className="text-sm text-chamber-text leading-relaxed">{analysis.overall_assessment}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="p-3 rounded-lg bg-accent-red/5 border border-accent-red/20">
            <p className="text-xs font-semibold text-accent-red uppercase mb-1">Strongest Opposition Point</p>
            <p className="text-sm text-chamber-text">{analysis.strongest_opposition_point}</p>
          </div>
          <div className="p-3 rounded-lg bg-accent-green/5 border border-accent-green/20">
            <p className="text-xs font-semibold text-accent-green uppercase mb-1">Weakest Opposition Point</p>
            <p className="text-sm text-chamber-text">{analysis.weakest_opposition_point}</p>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        className="flex justify-center gap-4 mt-8"
        {...fadeIn}
        transition={{ delay: 0.9 }}
      >
        <button
          onClick={onNewSimulation}
          className="px-6 py-3 rounded-lg bg-accent-blue text-white font-medium hover:bg-accent-blue/90 transition-colors"
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
