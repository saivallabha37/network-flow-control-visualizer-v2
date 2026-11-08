import React from 'react';
import {
  LayoutDashboard,
  FlaskConical,
  Sliders,
  Radio,
  Scale,
  Layers,
  GraduationCap,
  Network,
  ChevronLeft,
  ChevronRight,
  X,
  Activity,
} from 'lucide-react';
import { ViewId, NAV_ITEMS } from '../../types/navigation';
import { SimulationStatus } from '@agent';

interface SidebarProps {
  currentView: ViewId;
  onNavigate: (view: ViewId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  simulationStatus?: SimulationStatus;
  isSimRunning?: boolean;
}

const VIEW_ICONS: Record<ViewId, React.ComponentType<{ className?: string }>> = {
  overview: LayoutDashboard,
  'auto-sim': FlaskConical,
  'manual-lab': Sliders,
  'live-udp': Radio,
  comparison: Scale,
  internals: Layers,
  learning: GraduationCap,
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  simulationStatus,
  isSimRunning,
}) => {
  const getBadgeClass = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'success':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'warning':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'info':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const handleItemClick = (id: ViewId) => {
    onNavigate(id);
    onCloseMobile();
  };

  const workspaceItems = NAV_ITEMS.filter((item) => item.category === 'workspace');
  const liveItems = NAV_ITEMS.filter((item) => item.category === 'live');
  const learningItems = NAV_ITEMS.filter((item) => item.category === 'learning');

  const renderNavGroup = (title: string, items: typeof NAV_ITEMS) => (
    <div className="space-y-1">
      {!isCollapsed && (
        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </div>
      )}
      {items.map((item) => {
        const Icon = VIEW_ICONS[item.id] || LayoutDashboard;
        const isActive = currentView === item.id;
        const isAutoSimActiveSim = item.id === 'auto-sim' && isSimRunning;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleItemClick(item.id)}
            title={isCollapsed ? `${item.label} — ${item.description}` : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative cursor-pointer ${
              isActive
                ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30 shadow-sm shadow-indigo-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
            } ${isCollapsed ? 'justify-center px-2' : ''}`}
          >
            <div className="relative shrink-0">
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive
                    ? 'text-indigo-400'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              {isAutoSimActiveSim && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </div>

            {!isCollapsed && (
              <div className="flex-1 flex items-center justify-between min-w-0 text-left">
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span
                    className={`ml-2 text-[9px] px-1.5 py-0.5 rounded border font-mono shrink-0 ${getBadgeClass(
                      item.badgeVariant
                    )}`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            )}

            {/* Collapsed Tooltip on Hover */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-slate-200 text-xs rounded-md shadow-xl border border-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                <div className="font-semibold flex items-center gap-1.5">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] px-1 py-0.2 bg-slate-800 text-indigo-300 rounded">
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400">{item.description}</div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-40 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 backdrop-blur-md ${
          isCollapsed ? 'w-16' : 'w-64'
        } ${
          isMobileOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
          <div
            onClick={() => handleItemClick('overview')}
            className={`flex items-center gap-2.5 cursor-pointer group ${
              isCollapsed ? 'justify-center w-full' : ''
            }`}
          >
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 text-indigo-400 group-hover:border-indigo-400 transition-colors shrink-0">
              <Network className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-sm tracking-tight truncate">
                    FlowControl
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    V2
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">ARQ Educational Lab</p>
              </div>
            )}
          </div>

          {/* Close button for mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
          {renderNavGroup('Simulation Workspace', workspaceItems)}
          {renderNavGroup('Live Networking', liveItems)}
          {renderNavGroup('Reference & Analysis', learningItems)}
        </div>

        {/* Sidebar Footer / System Badge */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          {!isCollapsed && (
            <div className="mb-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-indigo-400" />
                  Engine State
                </span>
                <span
                  className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                    isSimRunning
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {simulationStatus || 'READY'}
                </span>
              </div>
            </div>
          )}

          {/* Collapse Toggle Button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex w-full items-center justify-center gap-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 text-xs transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[11px]">Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
