import React, { useState } from 'react';
import { ProtocolType } from '@agent';
import {
  Send,
  RotateCcw,
  XCircle,
  Clock,
  AlertTriangle,
  Zap,
  Play,
  Pause,
  StepForward,
  RefreshCw,
  ChevronRight,
  Wifi,
  Network,
  BookOpen,
  Sliders,
} from 'lucide-react';

export interface CanvasScenario {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'rose' | 'amber' | 'purple' | 'cyan';
}

const CANVAS_SCENARIOS: CanvasScenario[] = [
  {
    id: 'lost-frame',
    label: 'Lost Frame',
    description: 'Drop next outgoing DATA frame to trigger timeout & ARQ recovery',
    icon: XCircle,
    color: 'rose',
  },
  {
    id: 'lost-ack',
    label: 'Lost ACK',
    description: 'Drop next incoming ACK to demonstrate duplicate detection',
    icon: AlertTriangle,
    color: 'amber',
  },
  {
    id: 'out-of-order',
    label: 'Out-of-Order Burst',
    description: 'Send multiple frames and drop the first to demonstrate buffering',
    icon: Network,
    color: 'purple',
  },
  {
    id: 'window-full',
    label: 'M < 2N Ambiguity',
    description: 'Saturate window to show why Half-Space Rule M >= 2N is required',
    icon: Wifi,
    color: 'cyan',
  },
];

export interface ControlDeckProps {
  protocol: ProtocolType;
  canSend: boolean;
  canTimeout: boolean;
  remainingPayloadCount: number;
  virtualTimeMs: number;
  isAutoPlaying: boolean;
  autoPlaySpeed: number;
  channelDelayMs: number;
  dropNextFrame: boolean;
  dropNextAck: boolean;
  corruptNext: boolean;
  onSendNextFrame: () => void;
  onTriggerTimeout: () => void;
  onSetProtocol: (p: ProtocolType) => void;
  onReset: () => void;
  onStepTime: () => void;
  onToggleAutoPlay: () => void;
  onSetAutoPlaySpeed: (ms: number) => void;
  onSetChannelDelay: (ms: number) => void;
  onToggleDropNextFrame: () => void;
  onToggleDropNextAck: () => void;
  onToggleCorruptNext: () => void;
  onApplyScenario: (scenarioId: string) => void;
}

const PROTOCOLS: Array<{ id: ProtocolType; label: string; short: string }> = [
  { id: 'stop-and-wait', label: 'Stop-and-Wait', short: 'SAW' },
  { id: 'go-back-n', label: 'Go-Back-N', short: 'GBN' },
  { id: 'selective-repeat', label: 'Selective Repeat', short: 'SR' },
];

export const ControlDeck: React.FC<ControlDeckProps> = ({
  protocol,
  canSend,
  canTimeout,
  remainingPayloadCount,
  virtualTimeMs,
  isAutoPlaying,
  autoPlaySpeed,
  channelDelayMs,
  dropNextFrame,
  dropNextAck,
  corruptNext,
  onSendNextFrame,
  onTriggerTimeout,
  onSetProtocol,
  onReset,
  onStepTime,
  onToggleAutoPlay,
  onSetAutoPlaySpeed,
  onSetChannelDelay,
  onToggleDropNextFrame,
  onToggleDropNextAck,
  onToggleCorruptNext,
  onApplyScenario,
}) => {
  const [scenariosExpanded, setScenariosExpanded] = useState(true);

  return (
    <aside className="w-[290px] shrink-0 bg-[#0d1424]/90 backdrop-blur-xl border-r border-white/10 flex flex-col h-full overflow-hidden select-none z-20 shadow-2xl">
      {/* Workbench Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-[#0a0f1d]/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/20 border border-sky-400/30 text-sky-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide uppercase">Control Deck</div>
            <div className="text-[10px] text-slate-400">Interactive Workbench</div>
          </div>
        </div>
        <div className="text-right">
          <span className="font-mono text-xs font-bold text-sky-400">{virtualTimeMs} ms</span>
          <div className="text-[9px] text-slate-500 font-mono">T(virt)</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-4">
        {/* Protocol Selector */}
        <section className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5 px-1">
            <BookOpen className="w-3 h-3 text-sky-400" />
            Active Protocol
          </div>
          <div className="grid grid-cols-3 gap-1 p-1 bg-black/40 rounded-xl border border-white/5">
            {PROTOCOLS.map((p) => {
              const isActive = protocol === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSetProtocol(p.id)}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer font-bold text-xs ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/40 ring-1 ring-sky-300'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {p.short}
                </button>
              );
            })}
          </div>
        </section>

        {/* Primary Action Buttons */}
        <section className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5 px-1">
            <Zap className="w-3 h-3 text-amber-400" />
            Frame Operations
          </div>
          <div className="flex flex-col gap-2">
            {/* Primary: Send Next Frame */}
            <button
              type="button"
              onClick={onSendNextFrame}
              disabled={!canSend}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-lg ${
                canSend
                  ? 'bg-gradient-to-r from-[#0284c7] to-[#38bdf8] text-white hover:brightness-110 active:scale-[0.98] shadow-sky-600/30 border border-sky-300/40'
                  : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                <span>Send Next Frame</span>
              </div>
              <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                canSend ? 'bg-black/30 text-sky-100 border border-sky-300/30' : 'bg-transparent text-slate-600'
              }`}>
                {remainingPayloadCount} left
              </span>
            </button>

            {/* Secondary: Trigger Timeout */}
            <button
              type="button"
              onClick={onTriggerTimeout}
              disabled={!canTimeout}
              title={canTimeout ? 'Force retransmission timeout for unACKed frames' : 'No unACKed frames in flight'}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl font-bold text-xs transition-all border cursor-pointer ${
                canTimeout
                  ? 'bg-gradient-to-r from-red-600/20 to-red-500/10 text-red-300 border-red-500/40 hover:bg-red-600/30 hover:border-red-400 active:scale-[0.98]'
                  : 'bg-white/5 text-slate-600 border-white/5 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                <span>Trigger Timeout</span>
              </div>
              <span className="text-[10px] font-mono text-red-400/80">ARQ Retry</span>
            </button>
          </div>
        </section>

        {/* Fault Injection Panel */}
        <section className="space-y-2 p-3 rounded-2xl bg-black/30 border border-white/5">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between px-0.5">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              Fault Injection
            </span>
            <span className="text-[9px] text-slate-500 font-mono">Next packet</span>
          </div>

          <div className="space-y-1.5">
            {/* Drop Next DATA */}
            <button
              type="button"
              onClick={onToggleDropNextFrame}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                dropNextFrame
                  ? 'bg-red-500/20 border-red-500 text-red-200 ring-1 ring-red-500/40 shadow-sm'
                  : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <XCircle className={`w-3.5 h-3.5 ${dropNextFrame ? 'text-red-400' : 'text-slate-400'}`} />
                <span>Drop Next DATA</span>
              </div>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                dropNextFrame ? 'bg-red-500 text-white' : 'bg-white/10 text-slate-400'
              }`}>
                {dropNextFrame ? 'ARMED' : 'OFF'}
              </span>
            </button>

            {/* Drop Next ACK */}
            <button
              type="button"
              onClick={onToggleDropNextAck}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                dropNextAck
                  ? 'bg-orange-500/20 border-orange-500 text-orange-200 ring-1 ring-orange-500/40 shadow-sm'
                  : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <XCircle className={`w-3.5 h-3.5 ${dropNextAck ? 'text-orange-400' : 'text-slate-400'}`} />
                <span>Drop Next ACK</span>
              </div>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                dropNextAck ? 'bg-orange-500 text-white' : 'bg-white/10 text-slate-400'
              }`}>
                {dropNextAck ? 'ARMED' : 'OFF'}
              </span>
            </button>

            {/* Corrupt Checksum */}
            <button
              type="button"
              onClick={onToggleCorruptNext}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                corruptNext
                  ? 'bg-purple-500/20 border-purple-500 text-purple-200 ring-1 ring-purple-500/40 shadow-sm'
                  : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className={`w-3.5 h-3.5 ${corruptNext ? 'text-purple-400' : 'text-slate-400'}`} />
                <span>Corrupt Checksum</span>
              </div>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                corruptNext ? 'bg-purple-500 text-white' : 'bg-white/10 text-slate-400'
              }`}>
                {corruptNext ? '1-BIT CRC' : 'OFF'}
              </span>
            </button>

            {/* Channel Delay Slider */}
            <div className="pt-2 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-sky-400" />
                  Channel Delay
                </span>
                <span className="font-mono text-sky-400 font-bold">{channelDelayMs} ms</span>
              </div>
              <input
                type="range"
                min={50}
                max={1000}
                step={50}
                value={channelDelayMs}
                onChange={(e) => onSetChannelDelay(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-sky-400"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>50ms (LAN)</span>
                <span>1000ms (Satellite)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Classroom Demo Presets */}
        <section className="space-y-1.5">
          <button
            type="button"
            onClick={() => setScenariosExpanded((v) => !v)}
            className="w-full flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400 font-bold px-1 hover:text-white transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3 h-3 text-emerald-400" />
              Classroom Presets
            </span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${scenariosExpanded ? 'rotate-90' : ''}`} />
          </button>

          {scenariosExpanded && (
            <div className="grid grid-cols-1 gap-1.5 pt-1">
              {CANVAS_SCENARIOS.map((sc) => {
                const Icon = sc.icon;
                const styleMap: Record<string, string> = {
                  rose: 'border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-200',
                  amber: 'border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-orange-200',
                  purple: 'border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-200',
                  cyan: 'border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-200',
                };
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => onApplyScenario(sc.id)}
                    className={`flex items-start gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${styleMap[sc.color]}`}
                  >
                    <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-xs leading-tight">{sc.label}</div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{sc.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Playback Clock Controls */}
        <section className="p-3 rounded-2xl bg-black/30 border border-white/5 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between px-0.5">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-emerald-400" />
              Simulation Clock
            </span>
            <span className="font-mono text-emerald-400 text-[10px]">{autoPlaySpeed}ms / step</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={onToggleAutoPlay}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isAutoPlaying
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/40 ring-1 ring-emerald-300'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isAutoPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              type="button"
              onClick={onStepTime}
              disabled={isAutoPlaying}
              className="flex items-center justify-center gap-1 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <StepForward className="w-3.5 h-3.5 text-sky-400" />
              <span>+15ms</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="flex items-center justify-center gap-1 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <div className="pt-1">
            <input
              type="range"
              min={50}
              max={800}
              step={50}
              value={autoPlaySpeed}
              onChange={(e) => onSetAutoPlaySpeed(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-0.5">
              <span>Fast (50ms)</span>
              <span>Slow (800ms)</span>
            </div>
          </div>
        </section>
      </div>

      {/* Semantic Color Legend Strip */}
      <div className="p-2.5 border-t border-white/10 bg-[#0a0f1d]/80 text-[10px] font-mono grid grid-cols-2 gap-1 text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] inline-block shadow-sm shadow-sky-500/50" />
          <span>DATA (A ➔ B)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c] inline-block shadow-sm shadow-orange-500/50" />
          <span>ACK (B ➔ A)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] inline-block shadow-sm shadow-emerald-500/50" />
          <span>Timer Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6] inline-block shadow-sm shadow-purple-500/50" />
          <span>Out-of-Order</span>
        </div>
      </div>
    </aside>
  );
};