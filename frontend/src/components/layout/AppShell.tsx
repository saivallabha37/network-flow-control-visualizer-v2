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
      className="min-h-screen flex flex-col lg:flex-row text-slate-100 bg-surface"
      style={{ backgroundColor: '#0e1321' }}
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
      <div className="flex-1 min-w-0 flex flex-col">
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
          /* Canvas view: full-width, padded, scrollable workbench */
          <div className="flex-1 overflow-y-auto flex flex-col min-h-0 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
            {children}
          </div>
        ) : (
          /* Standard views: padded scrollable content + footer */
          <>
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
              {children}
            </main>

            {/* Cohesive Footer matching Stitch */}
            <footer
              className="border-t px-6 py-4 text-xs flex flex-wrap items-center justify-between gap-4 mt-auto text-on-surface-variant"
              style={{
                borderColor: 'rgba(255,255,255,0.08)',
                background: 'rgba(22,27,42,0.8)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <div className="flex items-center space-x-2">
                <span>FlowControl V3 • High-Precision Deterministic Network Telemetry</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  <span>Visor Sync Active • 90 FPS</span>
                </span>
                <button
                  type="button"
                  onClick={onOpenShortcuts}
                  className="text-on-surface hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Keyboard className="w-3.5 h-3.5 text-primary" />
                  <span>Keyboard Shortcuts (Alt+/)</span>
                </button>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
};

