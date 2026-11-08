import React, { useState } from 'react';
import {
  GitCommit,
  RotateCcw,
  Send,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ProtocolType } from '@agent';

export interface StateNode {
  id: string;
  label: string;
  subtitle: string;
  description: string;
}

export interface TransitionAction {
  label: string;
  icon: React.ReactNode;
  triggerEvent: string;
  nextStateId: string;
  explanation: string;
}

export const StateMachineDiagram: React.FC = () => {
  const [protocol, setProtocol] = useState<ProtocolType>('stop-and-wait');
  const [activeStateId, setActiveStateId] = useState<string>('saw-idle');
  const [lastActionExplanation, setLastActionExplanation] = useState<string>(
    'Initial state: Sender is IDLE and ready to accept an application payload.'
  );
  const [transitionHistory, setTransitionHistory] = useState<string[]>([
    'Initialized in IDLE state',
  ]);

  // Protocol specific state nodes and transitions
  const stateConfigs = React.useMemo(() => {
    switch (protocol) {
      case 'stop-and-wait': {
        const nodes: StateNode[] = [
          {
            id: 'saw-idle',
            label: 'IDLE (Ready)',
            subtitle: 'Can Send (Buffer = 0/1)',
            description: 'Sender is waiting for the application layer to submit payload. Window is empty.',
          },
          {
            id: 'saw-waiting',
            label: 'WAIT_FOR_ACK',
            subtitle: 'Timer Running (Buffer = 1/1)',
            description: 'Frame in flight. Sender is blocked and waiting for matching ACK (0 or 1).',
          },
          {
            id: 'saw-timeout',
            label: 'TIMEOUT_RECOVERY',
            subtitle: 'Retransmission Triggered',
            description: 'Timer expired before ACK arrived. Sender retransmits frame and resets timer.',
          },
        ];

        const transitions: Record<string, TransitionAction[]> = {
          'saw-idle': [
            {
              label: 'Send Frame (Seq 0)',
              icon: <Send className="w-3.5 h-3.5 text-indigo-400" />,
              triggerEvent: 'send_payload()',
              nextStateId: 'saw-waiting',
              explanation: 'Dispatched Frame 0. Window is now full (N=1). Started retransmission timer.',
            },
          ],
          'saw-waiting': [
            {
              label: 'Receive Matching ACK',
              icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
              triggerEvent: 'onAckReceived(0)',
              nextStateId: 'saw-idle',
              explanation: 'Valid ACK received! Stopped retransmission timer. Toggled alternating bit for next frame.',
            },
            {
              label: 'Timer Expires (Timeout)',
              icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
              triggerEvent: 'timer_expired()',
              nextStateId: 'saw-timeout',
              explanation: 'Timer expired! Discarding waiting state to initiate timeout retransmission.',
            },
          ],
          'saw-timeout': [
            {
              label: 'Retransmit Frame 0',
              icon: <RotateCcw className="w-3.5 h-3.5 text-purple-400" />,
              triggerEvent: 'retransmit()',
              nextStateId: 'saw-waiting',
              explanation: 'Frame 0 retransmitted over channel. Retransmission counter incremented. Timer restarted.',
            },
          ],
        };

        return { nodes, transitions, defaultState: 'saw-idle' };
      }

      case 'go-back-n': {
        const nodes: StateNode[] = [
          {
            id: 'gbn-idle',
            label: 'IDLE (Empty)',
            subtitle: 'Sf = Sn (Buffer = 0/N)',
            description: 'Sliding window is empty. No timer running.',
          },
          {
            id: 'gbn-active',
            label: 'WINDOW_ACTIVE',
            subtitle: 'Capacity Available (0 < Buf < N)',
            description: 'Timer running for oldest unacknowledged frame (Sf). Sender can dispatch more frames.',
          },
          {
            id: 'gbn-full',
            label: 'WINDOW_FULL',
            subtitle: 'Blocked (Buffer = N/N)',
            description: 'Window capacity exhausted (N=4). Sender cannot transmit new payloads until Sf advances.',
          },
          {
            id: 'gbn-rewind',
            label: 'TIMEOUT_BULK_REWIND',
            subtitle: 'Rewind Sn to Sf',
            description: 'Oldest frame timed out. Go-Back-N rewinds sequence pointer and retransmits all N frames.',
          },
        ];

        const transitions: Record<string, TransitionAction[]> = {
          'gbn-idle': [
            {
              label: 'Send Frame (Sn = 0)',
              icon: <Send className="w-3.5 h-3.5 text-indigo-400" />,
              triggerEvent: 'send()',
              nextStateId: 'gbn-active',
              explanation: 'Dispatched Frame 0. Started base timer for Sf=0. Sn advanced to 1.',
            },
          ],
          'gbn-active': [
            {
              label: 'Send Next Frame (Sn+1)',
              icon: <Send className="w-3.5 h-3.5 text-cyan-400" />,
              triggerEvent: 'send()',
              nextStateId: 'gbn-full',
              explanation: 'Filled remaining window slots up to N=4. Window is now FULL.',
            },
            {
              label: 'Receive Cumulative ACK',
              icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
              triggerEvent: 'onAckReceived(cumulative)',
              nextStateId: 'gbn-idle',
              explanation: 'Cumulative ACK acknowledged all outstanding frames. Base Sf advanced to Sn. Timer stopped.',
            },
            {
              label: 'Timeout (Base Sf)',
              icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
              triggerEvent: 'timeout_base()',
              nextStateId: 'gbn-rewind',
              explanation: 'Timer expired for base frame! Go-Back-N must retransmit entire outstanding window.',
            },
          ],
          'gbn-full': [
            {
              label: 'Receive Cumulative ACK (Slide)',
              icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
              triggerEvent: 'onAckReceived()',
              nextStateId: 'gbn-active',
              explanation: 'ACK arrived! Base Sf advanced. Window slot freed up. Sender can transmit again.',
            },
            {
              label: 'Timeout (Base Sf)',
              icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,
              triggerEvent: 'timeout_base()',
              nextStateId: 'gbn-rewind',
              explanation: 'Window full and timer expired! Retransmitting all outstanding frames from Sf.',
            },
          ],
          'gbn-rewind': [
            {
              label: 'Finish Retransmitting All N Frames',
              icon: <RotateCcw className="w-3.5 h-3.5 text-purple-400" />,
              triggerEvent: 'bulk_retransmit_done()',
              nextStateId: 'gbn-full',
              explanation: 'Retransmitted all outstanding frames. Base timer restarted. Window remains full awaiting ACKs.',
            },
          ],
        };

        return { nodes, transitions, defaultState: 'gbn-idle' };
      }

      case 'selective-repeat':
      default: {
        const nodes: StateNode[] = [
          {
            id: 'sr-ready',
            label: 'PARTIAL_WINDOW',
            subtitle: 'Independent Timers Active',
            description: 'Frames in flight, each with independent timer. Window has available slots.',
          },
          {
            id: 'sr-full',
            label: 'WINDOW_FULL_BLOCKED',
            subtitle: 'Buffer Exhausted (N=4)',
            description: 'All N slots occupied. Sender awaits ACK for base Sf before advancing window.',
          },
          {
            id: 'sr-selective-timeout',
            label: 'SELECTIVE_TIMEOUT',
            subtitle: 'Single Frame Retransmission',
            description: 'One specific frame timed out. Selective Repeat retransmits ONLY that frame, NOT all frames!',
          },
          {
            id: 'sr-rx-buffer',
            label: 'RX_BUFFERING_OUT_OF_ORDER',
            subtitle: 'Receiver Window Holding Frames',
            description: 'Receiver holds out-of-order frames in buffer. Cascades delivery once missing gap arrives.',
          },
        ];

        const transitions: Record<string, TransitionAction[]> = {
          'sr-ready': [
            {
              label: 'Send Up to Window Limit',
              icon: <Send className="w-3.5 h-3.5 text-indigo-400" />,
              triggerEvent: 'send_bulk()',
              nextStateId: 'sr-full',
              explanation: 'Dispatched frames up to capacity N=4. Each frame has its own independent countdown timer.',
            },
            {
              label: 'Receive Out-of-Order Frame at Receiver',
              icon: <GitCommit className="w-3.5 h-3.5 text-purple-400" />,
              triggerEvent: 'rx_out_of_order()',
              nextStateId: 'sr-rx-buffer',
              explanation: 'Frame arrived out-of-order at receiver! Buffered in memory while waiting for missing base.',
            },
            {
              label: 'Specific Frame Timer Expires',
              icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
              triggerEvent: 'individual_timeout(k)',
              nextStateId: 'sr-selective-timeout',
              explanation: 'Timer expired specifically for Frame 1. Other frames continue running their timers.',
            },
          ],
          'sr-full': [
            {
              label: 'Receive ACK for Base (Sf)',
              icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
              triggerEvent: 'ack_base()',
              nextStateId: 'sr-ready',
              explanation: 'Base Sf acknowledged! Window slides forward over all contiguous ACKed frames.',
            },
            {
              label: 'Specific Frame Timeout',
              icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,
              triggerEvent: 'individual_timeout()',
              nextStateId: 'sr-selective-timeout',
              explanation: 'Specific lost frame timed out while window was full. Retransmitting only that frame.',
            },
          ],
          'sr-selective-timeout': [
            {
              label: 'Retransmit Single Lost Frame',
              icon: <RotateCcw className="w-3.5 h-3.5 text-purple-400" />,
              triggerEvent: 'selective_retransmit()',
              nextStateId: 'sr-ready',
              explanation: 'Retransmitted only the lost frame! No duplicate retransmission of already received frames.',
            },
          ],
          'sr-rx-buffer': [
            {
              label: 'Missing Gap Arrives (Cascade Delivery)',
              icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
              triggerEvent: 'missing_gap_filled()',
              nextStateId: 'sr-ready',
              explanation: 'Missing frame arrived! Receiver delivered it plus all held buffered frames in cascade.',
            },
          ],
        };

        return { nodes, transitions, defaultState: 'sr-ready' };
      }
    }
  }, [protocol]);

  // Handle protocol tab change
  const handleProtocolChange = (newProto: ProtocolType) => {
    setProtocol(newProto);
    let initial = 'saw-idle';
    if (newProto === 'go-back-n') initial = 'gbn-idle';
    else if (newProto === 'selective-repeat') initial = 'sr-ready';
    setActiveStateId(initial);
    setLastActionExplanation(`Switched to ${newProto}. State machine reset to initial state.`);
    setTransitionHistory([`Switched to ${newProto}`]);
  };

  const handleTriggerAction = (action: TransitionAction) => {
    setActiveStateId(action.nextStateId);
    setLastActionExplanation(action.explanation);
    setTransitionHistory((prev) => [
      `[${new Date().toLocaleTimeString()}] ${action.triggerEvent} ➔ ${action.nextStateId}`,
      ...prev.slice(0, 5),
    ]);
  };

  const availableActions = stateConfigs.transitions[activeStateId] || [];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
      {/* Header & Protocol Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <GitCommit className="w-4 h-4" />
            <span>Interactive Protocol State Machine</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-0.5">
            Formal State Transitions &amp; Event Dispatch
          </h3>
          <p className="text-xs text-slate-400">
            Click available transitions to walk through sender and receiver internal state evolutions.
          </p>
        </div>

        {/* Protocol Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
          {(['stop-and-wait', 'go-back-n', 'selective-repeat'] as ProtocolType[]).map((p) => {
            const isSelected = protocol === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => handleProtocolChange(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-950/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p === 'stop-and-wait' ? 'Stop-and-Wait' : p === 'go-back-n' ? 'Go-Back-N' : 'Selective Repeat'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual State Graph Nodes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stateConfigs.nodes.map((node) => {
          const isActive = node.id === activeStateId;
          return (
            <div
              key={node.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-purple-600/20 border-purple-500 shadow-xl shadow-purple-950/50 ring-2 ring-purple-500/40'
                  : 'bg-slate-950/70 border-slate-800/80 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span
                    className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded border uppercase ${
                      isActive
                        ? 'bg-purple-950 text-purple-300 border-purple-500/50 animate-pulse'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                  >
                    {isActive ? 'CURRENT STATE' : 'STATE'}
                  </span>
                  {isActive && <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                </div>
                <h4 className="text-sm font-bold text-white mt-2">{node.label}</h4>
                <div className="text-[11px] font-mono text-purple-300 mt-0.5">{node.subtitle}</div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{node.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Transition Actions Toolbar */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
            <span>Eligible Transitions from Active State</span>
          </span>
          <button
            type="button"
            onClick={() => handleProtocolChange(protocol)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Machine</span>
          </button>
        </div>

        {availableActions.length === 0 ? (
          <div className="text-xs text-slate-500 py-2">No outgoing transitions from this state.</div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {availableActions.map((action, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleTriggerAction(action)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-purple-500 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-98"
              >
                {action.icon}
                <span>{action.label}</span>
                <span className="text-[10px] font-mono text-purple-300 opacity-70">
                  (&rarr; {action.nextStateId.split('-')[1]})
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pedagogical Explanation Feed */}
      <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <span className="font-bold text-purple-300 block">State Transition Dynamics:</span>
          <p className="text-slate-300 leading-relaxed">{lastActionExplanation}</p>
        </div>

        {/* Mini Transition Log */}
        <div className="text-[10px] font-mono text-slate-400 shrink-0 text-right space-y-0.5">
          <span className="text-slate-500 uppercase block">Recent Transitions:</span>
          {transitionHistory.slice(0, 2).map((t, i) => (
            <div key={i} className="truncate max-w-xs">{t}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

