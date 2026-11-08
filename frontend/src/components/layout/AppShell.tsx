import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ViewId } from '../../types/navigation';
import { ProtocolType, SimulationStatus } from '@agent';
import { Keyboard } from 'lucide-react';

interface AppShellProps {
  currentView: ViewId;
  onNavigate: (view: ViewId) => void;
  status: SimulationStatus;
  virtualTimeMs: number;
  currentProtocol: ProtocolType;
  onOpenShortcuts: () => void;
  onOpenComparison?: () => void;
  onNavigateToAutoSim?: () => void;
  onOpenDemoGuide?: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentView,
  onNavigate,
  status,
  virtualTimeMs,
  currentProtocol,
  onOpenShortcuts,
  onOpenComparison,
  onNavigateToAutoSim,
  onOpenDemoGuide,
  children,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // The Manual Lab view uses a full-screen canvas layout (no scroll, no padding, no footer).
  // All other views use the standard padded, scrollable content layout.
  const isCanvasView = currentView === 'manual-lab';

  return (
    <div
      className={`bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200 ${
        isCanvasView ? 'h-screen overflow-hidden flex' : 'min-h-screen flex flex-col lg:flex-row'
      }`}
    >
      {/* Persistent Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={onNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        simulationStatus={status}
        isSimRunning={status === 'RUNNING'}
      />

      {/* Main Content Area */}
      <div className={`flex-1 min-w-0 ${isCanvasView ? 'flex flex-col overflow-hidden' : 'flex flex-col'}`}>
        {/* Persistent Top Navigation Bar */}
        <TopBar
          currentView={currentView}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          status={status}
          virtualTimeMs={virtualTimeMs}
          currentProtocol={currentProtocol}
          onOpenShortcuts={onOpenShortcuts}
          onOpenComparison={onOpenComparison}
          onNavigateToAutoSim={onNavigateToAutoSim}
          onOpenDemoGuide={onOpenDemoGuide}
        />

        {isCanvasView ? (
          /* Canvas view: full-height, no padding, no footer */
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {children}
          </div>
        ) : (
          /* Standard views: padded scrollable content + footer */
          <>
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
              {children}
            </main>

            {/* Cohesive Footer */}
            <footer className="border-t border-slate-800/80 bg-slate-900/40 px-6 py-4 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4 mt-auto">
              <div className="flex items-center space-x-2 text-slate-400">
                <span>Network Flow Control Protocols Visualizer V2 &mdash; Computer Networks Educational Laboratory</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={onOpenShortcuts}
                  className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Keyboard Shortcuts</span>
                </button>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
};

