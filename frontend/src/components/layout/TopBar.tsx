import React from 'react';
import {
  Menu,
  Clock,
  Keyboard,
  FlaskConical,
  Scale,
  Sparkles,
} from 'lucide-react';
import { ViewId, NAV_ITEMS } from '../../types/navigation';
import { ProtocolType, SimulationStatus } from '@agent';

interface TopBarProps {
  currentView: ViewId;
  onOpenMobileSidebar: () => void;
  status: SimulationStatus;
  virtualTimeMs: number;
  currentProtocol: ProtocolType;
  onOpenShortcuts: () => void;
  onOpenComparison?: () => void;
  onNavigateToAutoSim?: () => void;
  onOpenDemoGuide?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onOpenMobileSidebar,
  status,
  virtualTimeMs,
  currentProtocol,
  onOpenShortcuts,
  onOpenComparison,
  onNavigateToAutoSim,
  onOpenDemoGuide,
}) => {
  const currentNav = NAV_ITEMS.find((item) => item.id === currentView);

  const getStatusBadge = () => {
    switch (status) {
      case 'RUNNING':
        return {
          label: 'Simulation Running',
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400 animate-pulse',
        };
      case 'PAUSED':
        return {
          label: 'Paused',
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400',
        };
      case 'COMPLETED':
        return {
          label: 'Completed',
          bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
          dot: 'bg-sky-400',
        };
      case 'FAILED':
        return {
          label: 'Retries Exhausted',
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          dot: 'bg-rose-400',
        };
      case 'STOPPED':
        return {
          label: 'Safety Stopped',
          bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
          dot: 'bg-orange-400',
        };
      case 'READY':
      default:
        return {
          label: 'Ready',
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
          dot: 'bg-slate-400',
        };
    }
  };

  const badge = getStatusBadge();

  const getProtocolLabel = (proto: ProtocolType) => {
    switch (proto) {
      case 'stop-and-wait':
        return 'Stop-and-Wait';
      case 'go-back-n':
        return 'Go-Back-N';
      case 'selective-repeat':
        return 'Selective Repeat';
    }
  };

  return (
    <header className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-30" style={{ background: 'rgba(10,15,29,0.85)', backdropFilter: 'blur(24px) saturate(1.4)', WebkitBackdropFilter: 'blur(24px) saturate(1.4)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Left: Mobile Toggle & View Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white tracking-tight truncate">
              {currentNav?.label || 'Flow Control Visualizer'}
            </h1>
            {currentNav?.badge && (
              <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                {currentNav.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 hidden sm:block truncate">
            {currentNav?.description}
          </p>
        </div>
      </div>

      {/* Right: Global Telemetry Badges & Quick Controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Active Protocol Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
          <span className="text-[11px] text-slate-500 font-medium">Protocol:</span>
          <span className="text-indigo-300 font-semibold font-mono">
            {getProtocolLabel(currentProtocol)}
          </span>
        </div>

        {/* Status Badge */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${badge.bg}`}
        >
          <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
          <span className="hidden sm:inline">{badge.label}</span>
        </div>

        {/* Virtual Clock Display */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>{virtualTimeMs} ms</span>
        </div>

        {/* Classroom Demo Guide Trigger */}
        {onOpenDemoGuide && (
          <button
            type="button"
            onClick={onOpenDemoGuide}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border border-amber-500/40 text-xs font-semibold transition-all cursor-pointer shadow-sm"
            title="Open Faculty Viva & Classroom Demonstration Guide"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Demo Guide</span>
          </button>
        )}

        {/* Quick Launch Auto-Sim if in another view */}
        {currentView !== 'auto-sim' && onNavigateToAutoSim && (
          <button
            type="button"
            onClick={onNavigateToAutoSim}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 text-xs font-medium transition-all cursor-pointer"
            title="Switch to Auto Simulation view"
          >
            <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
            <span>Open Simulator</span>
          </button>
        )}

        {/* Benchmark Button */}
        {onOpenComparison && (
          <button
            type="button"
            onClick={onOpenComparison}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 text-xs transition-colors cursor-pointer"
            title="Open Protocol Comparison Benchmark"
            aria-label="Open Protocol Comparison Benchmark"
          >
            <Scale className="w-4 h-4 text-indigo-400" />
          </button>
        )}

        {/* Keyboard Shortcuts Trigger */}
        <button
          type="button"
          onClick={onOpenShortcuts}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 text-xs transition-colors cursor-pointer"
          title="Keyboard Shortcuts (?)"
          aria-label="Keyboard Shortcuts"
        >
          <Keyboard className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
