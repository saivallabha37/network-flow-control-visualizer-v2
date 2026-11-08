import React from 'react';
import { Clock, AlertTriangle, Flame } from 'lucide-react';
import { TimerProgressInfo } from '../../utils/window-visuals';

export interface TimerIndicatorProps {
  model?: 'ring' | 'bar' | 'mini-dial';
  elapsedMs: number;
  timeoutMs: number;
  timerInfo: TimerProgressInfo;
  isRunning?: boolean;
  label?: string;
  sublabel?: string;
  onClick?: () => void;
  interactive?: boolean;
  className?: string;
}

export const TimerIndicator: React.FC<TimerIndicatorProps> = ({
  model = 'bar',
  elapsedMs,
  timeoutMs,
  timerInfo,
  isRunning = true,
  label,
  sublabel,
  onClick,
  interactive = false,
  className = '',
}) => {
  const { progress, percentage, isWarning, isExpired } = timerInfo;

  // Visual state styling
  let statusColor = 'text-cyan-400 border-cyan-500/40 bg-cyan-950/20';
  let barFillColor = 'bg-cyan-500';
  let ringStrokeColor = '#06b6d4'; // cyan-500

  if (!isRunning || elapsedMs === 0) {
    statusColor = 'text-slate-500 border-slate-800 bg-slate-900/40';
    barFillColor = 'bg-slate-700';
    ringStrokeColor = '#475569';
  } else if (isExpired) {
    statusColor = 'text-rose-400 border-rose-500/60 bg-rose-950/40 animate-pulse ring-2 ring-rose-500/50';
    barFillColor = 'bg-rose-500';
    ringStrokeColor = '#f43f5e'; // rose-500
  } else if (isWarning) {
    statusColor = 'text-amber-400 border-amber-500/60 bg-amber-950/30 animate-pulse';
    barFillColor = 'bg-amber-500';
    ringStrokeColor = '#f59e0b'; // amber-500
  }

  // Mini Dial for inside individual slot cards (Selective Repeat)
  if (model === 'mini-dial') {
    const radius = 10;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - progress * circumference;

    return (
      <div
        onClick={interactive ? onClick : undefined}
        title={
          interactive
            ? `Frame Timer: ${elapsedMs}ms / ${timeoutMs}ms (${percentage}%). Click to trigger manual timeout.`
            : `Frame Timer: ${elapsedMs}ms / ${timeoutMs}ms (${percentage}%)`
        }
        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-mono transition-all select-none ${
          interactive ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
        } ${statusColor} ${className}`}
      >
        <svg className="w-4 h-4 -rotate-90 shrink-0" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r={radius}
            className="stroke-slate-800"
            strokeWidth="3"
            fill="none"
          />
          <circle
            cx="12"
            cy="12"
            r={radius}
            stroke={ringStrokeColor}
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            className="transition-all duration-300"
          />
        </svg>
        <span className="font-semibold">{elapsedMs}ms</span>
        {isExpired && <Flame className="w-3 h-3 text-rose-400 animate-bounce" />}
      </div>
    );
  }

  // Circular Progress Ring Model
  if (model === 'ring') {
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - progress * circumference;

    return (
      <div
        onClick={interactive ? onClick : undefined}
        className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
          interactive ? 'cursor-pointer hover:bg-slate-800/80 active:scale-98' : ''
        } ${statusColor} ${className}`}
      >
        <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 52 52">
            <circle
              cx="26"
              cy="26"
              r={radius}
              className="stroke-slate-800"
              strokeWidth="4"
              fill="none"
            />
            <circle
              cx="26"
              cy="26"
              r={radius}
              stroke={ringStrokeColor}
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
            {isExpired ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
            ) : (
              <span className="text-[10px] font-bold">{percentage}%</span>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200 truncate">{label || 'Retransmission Timer'}</span>
            <span className="font-mono text-[11px] text-slate-400">{elapsedMs} / {timeoutMs}ms</span>
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            {sublabel || (isExpired ? 'TIMEOUT EXPIRED — Retransmit' : isWarning ? 'Approaching Timeout (>80%)' : 'Timer Running')}
          </div>
        </div>
      </div>
    );
  }

  // Default: Animated Progress Bar Model
  return (
    <div
      onClick={interactive ? onClick : undefined}
      className={`p-2.5 rounded-xl border transition-all ${
        interactive ? 'cursor-pointer hover:bg-slate-800/80 active:scale-98' : ''
      } ${statusColor} ${className}`}
    >
      <div className="flex items-center justify-between text-xs mb-1.5">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider">
            {label || 'Sender ARQ Timer (Sf)'}
          </span>
          {isExpired && (
            <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 animate-pulse">
              EXPIRED
            </span>
          )}
          {isWarning && !isExpired && (
            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
              NEAR TIMEOUT
            </span>
          )}
        </div>
        <span className="font-mono text-[11px] text-slate-300">
          {isRunning ? `${elapsedMs}ms` : 'STOPPED'} / {timeoutMs}ms
        </span>
      </div>

      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
        <div
          className={`h-full transition-all duration-300 rounded-full ${barFillColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {sublabel && (
        <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
          <span>{sublabel}</span>
          <span className="font-mono text-slate-500">{percentage}% elapsed</span>
        </div>
      )}
    </div>
  );
};

