import React, { useState } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
} from 'lucide-react';

export interface QuizQuestion {
  id: number;
  question: string;
  category: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    category: 'Bandwidth-Delay Product',
    question:
      'Why must the optimal sender sliding window size N be proportional to the Round-Trip Time (RTT) and link bandwidth?',
    options: [
      'To prevent the receiver from requiring large sequence numbers.',
      'To fill the pipe (2 * Tp * B) so the sender does not sit idle waiting for acknowledgements.',
      'Because physical copper cables can only hold N bits simultaneously.',
      'To ensure all frames have identical propagation velocities.',
    ],
    correctIndex: 1,
    explanation:
      'Correct! In pipelined protocols, optimal window capacity N must match or exceed the Bandwidth-Delay Product (2 * Tp * B / FrameSize) to keep the channel 100% utilized without idle waiting.',
  },
  {
    id: 2,
    category: 'Buffer Trade-offs',
    question:
      'Why does Go-Back-N require only 1 frame buffer at the receiver, while Selective Repeat requires N buffers?',
    options: [
      'Go-Back-N uses faster CRC-32 hardware than Selective Repeat.',
      'Go-Back-N strictly discards any out-of-order frame without buffering, while Selective Repeat holds out-of-order frames in memory.',
      'Selective Repeat cannot use cumulative ACKs.',
      'Go-Back-N frames are smaller in byte size.',
    ],
    correctIndex: 1,
    explanation:
      'Correct! Go-Back-N enforces strict in-order arrival (Rn): any frame with seq != Rn is discarded immediately. Selective Repeat buffers out-of-order frames within [Rn .. Rn + N - 1], requiring N receiver buffer slots.',
  },
  {
    id: 3,
    category: 'Signaling & Cumulative ACKs',
    question:
      'What is the major vulnerability of pure Go-Back-N cumulative acknowledgements when an isolated frame is dropped?',
    options: [
      'The receiver buffer overflows immediately.',
      'All subsequent successfully transmitted frames after the dropped frame are discarded and must be retransmitted.',
      'The sender window base Sf advances prematurely.',
      'The physical channel becomes desynchronized.',
    ],
    correctIndex: 1,
    explanation:
      'Correct! Because Go-Back-N receiver cannot buffer out-of-order packets, dropping a single frame causes the receiver to discard all subsequent frames in the window, triggering a bulk retransmission of up to N frames.',
  },
  {
    id: 4,
    category: 'Timer Allocation Models',
    question:
      'Why does Go-Back-N only require a single retransmission timer, whereas Selective Repeat requires independent timers per frame?',
    options: [
      'Go-Back-N only retransmits when all frames fail simultaneously.',
      'In Go-Back-N, the timer always protects the oldest unacknowledged frame (Sf); in Selective Repeat, each frame can be independently lost or acknowledged.',
      'Selective Repeat has no timeout recovery mechanism.',
      'Operating systems cannot support single timers.',
    ],
    correctIndex: 1,
    explanation:
      'Correct! In Go-Back-N, timing out on the oldest unacknowledged frame (Sf) triggers retransmission of the entire window. In Selective Repeat, each frame has an independent delivery fate, requiring its own timer or priority queue.',
  },
  {
    id: 5,
    category: 'Sequence Bits & Modulo Space',
    question:
      'If sequence numbers are allocated m = 3 bits in the frame header (M = 2^3 = 8), what is the maximum permissible window size N for Selective Repeat?',
    options: [
      'N = 7',
      'N = 8',
      'N = 4 (because M >= 2N)',
      'N = 2',
    ],
    correctIndex: 2,
    explanation:
      'Correct! For Selective Repeat, the half-space rule mandates M >= 2N, meaning N <= M/2. With m = 3 bits, M = 8, so N_max = 8 / 2 = 4.',
  },
];

export const VivaQuizSection: React.FC = () => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});

  const handleSelect = (questionId: number, optionIndex: number) => {
    if (submitted[questionId]) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitQuestion = (questionId: number) => {
    if (selectedAnswers[questionId] === undefined) return;
    setSubmitted((prev) => ({ ...prev, [questionId]: true }));
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted({});
  };

  const totalAnswered = Object.keys(submitted).length;
  const correctCount = Object.entries(submitted).filter(([qId, isSub]) => {
    if (!isSub) return false;
    const q = QUESTIONS.find((item) => item.id === Number(qId));
    return q && selectedAnswers[Number(qId)] === q.correctIndex;
  }).length;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" />
            <span>Interactive Viva Voce Knowledge Check</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-0.5">
            Computer Networks Exam &amp; Interview Self-Assessment
          </h3>
          <p className="text-xs text-slate-400">
            Test your understanding of flow control mathematics, buffer constraints, and protocol edge cases.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right font-mono text-xs">
            <span className="text-slate-500 text-[10px] block uppercase">Score</span>
            <span className="text-indigo-300 font-bold">
              {correctCount} / {QUESTIONS.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleReset}
            title="Reset Quiz"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-5">
        {QUESTIONS.map((q) => {
          const userChoice = selectedAnswers[q.id];
          const isSubmitted = submitted[q.id];
          const isCorrect = userChoice === q.correctIndex;

          return (
            <div
              key={q.id}
              className={`p-5 rounded-2xl border transition-all space-y-3 ${
                isSubmitted
                  ? isCorrect
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-rose-950/20 border-rose-500/40'
                  : 'bg-slate-950/70 border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-indigo-400 font-bold">Question {q.id} of {QUESTIONS.length}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                  {q.category}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-white leading-snug">{q.question}</h4>

              {/* Options */}
              <div className="grid grid-cols-1 gap-2 pt-1">
                {q.options.map((option, optIdx) => {
                  const isSelected = userChoice === optIdx;
                  let optStyle = 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700';

                  if (isSubmitted) {
                    if (optIdx === q.correctIndex) {
                      optStyle = 'border-emerald-500 bg-emerald-600/20 text-emerald-200 font-semibold ring-1 ring-emerald-500/40';
                    } else if (isSelected && !isCorrect) {
                      optStyle = 'border-rose-500 bg-rose-600/20 text-rose-200 line-through';
                    } else {
                      optStyle = 'border-slate-900 bg-slate-950 text-slate-600 opacity-60';
                    }
                  } else if (isSelected) {
                    optStyle = 'border-indigo-500 bg-indigo-600/20 text-indigo-200 ring-1 ring-indigo-500/40';
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={isSubmitted}
                      onClick={() => handleSelect(q.id, optIdx)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 cursor-pointer ${optStyle}`}
                    >
                      <span className="font-mono text-[11px] font-bold opacity-60 shrink-0 mt-0.5">
                        {String.fromCharCode(65 + optIdx)}.
                      </span>
                      <span className="leading-relaxed">{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Submit Button or Explanation */}
              {!isSubmitted ? (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={userChoice === undefined}
                    onClick={() => handleSubmitQuestion(q.id)}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                  >
                    Check Answer
                  </button>
                </div>
              ) : (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    isCorrect
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Correct!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span>Incorrect.</span>
                      </>
                    )}
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion Summary Banner */}
      {totalAnswered === QUESTIONS.length && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950 via-purple-950 to-indigo-950 border border-indigo-500/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-indigo-400" />
            <div>
              <span className="font-bold text-white block">Assessment Complete!</span>
              <span className="text-indigo-300 text-[11px]">
                You scored {correctCount} out of {QUESTIONS.length} ({Math.round((correctCount / QUESTIONS.length) * 100)}%).
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all cursor-pointer shadow-sm"
          >
            Retake Quiz
          </button>
        </div>
      )}
    </div>
  );
};
