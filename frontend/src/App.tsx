import { useState, useMemo, useEffect, useCallback } from 'react';
import { ProtocolType, SimulationConfig, InFlightPacket } from '@agent';
import { useSimulation } from './hooks/useSimulation';
import { AppShell } from './components/layout/AppShell';
import { ViewId } from './types/navigation';

import { OverviewView } from './views/OverviewView';
import { AutoSimView } from './views/AutoSimView';
import { LiveUdpView } from './views/LiveUdpView';
import { ManualLabView } from './views/ManualLabView';
import { ProtocolComparisonView } from './views/ProtocolComparisonView';
import { ProtocolInternalsView } from './views/ProtocolInternalsView';
import { LearningCentreView } from './views/LearningCentreView';

import { ProtocolComparisonModal } from './components/ProtocolComparisonModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { FacultyDemoModal, DemoScenarioPreset } from './components/layout/FacultyDemoModal';
import { PacketInspectorTarget } from './components/PacketInspector';
import { GuidedScenario } from './types/scenarios';

const DEFAULT_CONFIG: SimulationConfig = {
  protocol: 'go-back-n',
  payloads: ['Packet #0', 'Packet #1', 'Packet #2', 'Packet #3', 'Packet #4', 'Packet #5'],
  windowSize: 4,
  seqNumberSpace: 8,
  seed: 42,
  oneWayDelayMs: 60,
  frameLossRate: 0.2,
  ackLossRate: 0.1,
  corruptionRate: 0,
  timeoutMs: 250,
  maxRetries: 4,
  tickStepMs: 15,
};

const VALID_VIEWS: ViewId[] = [
  'overview',
  'auto-sim',
  'manual-lab',
  'live-udp',
  'comparison',
  'internals',
  'learning',
];

function getInitialView(): ViewId {
  if (typeof window !== 'undefined' && window.location.hash) {
    const raw = window.location.hash.replace('#', '').replace('/', '') as ViewId;
    if (VALID_VIEWS.includes(raw)) {
      return raw;
    }
  }
  return 'overview';
}

export default function App() {
  const [currentView, setCurrentView] = useState<ViewId>(getInitialView);
  const [selectedInFlightPacket, setSelectedInFlightPacket] = useState<InFlightPacket | null>(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isDemoGuideOpen, setIsDemoGuideOpen] = useState(false);

  const {
    config,
    status,
    virtualTimeMs,
    engineState,
    events,
    statistics,
    speedMs,
    error,
    selectedEventId,
    start,
    pause,
    resume,
    step,
    reset,
    runToCompletion,
    setSpeed,
    updateConfig,
    selectEvent,
  } = useSimulation(DEFAULT_CONFIG);

  const isSimActive = status === 'RUNNING';

  // Synchronize hash in URL for bookmarking and back/forward navigation
  const handleNavigate = useCallback((view: ViewId) => {
    setCurrentView(view);
    if (typeof window !== 'undefined') {
      window.location.hash = `#${view}`;
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const raw = window.location.hash.replace('#', '').replace('/', '') as ViewId;
      if (VALID_VIEWS.includes(raw)) {
        setCurrentView(raw);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectProtocol = (proto: ProtocolType) => {
    updateConfig((prev) => {
      let windowSize = prev.windowSize ?? 4;
      let seqNumberSpace = prev.seqNumberSpace ?? 8;

      if (proto === 'stop-and-wait') {
        windowSize = 1;
        seqNumberSpace = 2;
      } else if (proto === 'go-back-n') {
        windowSize = 4;
        seqNumberSpace = 8;
      } else if (proto === 'selective-repeat') {
        windowSize = 4;
        seqNumberSpace = 8; // 8 >= 2 * 4 satisfies M >= 2N
      }

      return {
        ...prev,
        protocol: proto,
        windowSize,
        seqNumberSpace,
      };
    });
  };

  // Keyboard accessibility shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Escape') {
        if (selectedInFlightPacket || selectedEventId) {
          setSelectedInFlightPacket(null);
          selectEvent(null);
        }
        if (isComparisonOpen) {
          setIsComparisonOpen(false);
        }
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
        }
        if (isDemoGuideOpen) {
          setIsDemoGuideOpen(false);
        }
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (status === 'RUNNING') {
          pause();
        } else if (status === 'PAUSED') {
          resume();
        } else if (status === 'READY') {
          start();
        }
      } else if (e.key === 's' || e.key === 'S') {
        if (status !== 'RUNNING') {
          step();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        reset();
      } else if (e.key === 'c' || e.key === 'C') {
        setIsComparisonOpen((prev) => !prev);
      } else if (e.key === '?') {
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === '1') {
        handleNavigate('overview');
      } else if (e.key === '2') {
        handleNavigate('auto-sim');
      } else if (e.key === '3') {
        handleNavigate('manual-lab');
      } else if (e.key === '4') {
        handleNavigate('live-udp');
      } else if (e.key === '5') {
        handleNavigate('comparison');
      } else if (e.key === '6') {
        handleNavigate('internals');
      } else if (e.key === '7') {
        handleNavigate('learning');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    status,
    selectedInFlightPacket,
    selectedEventId,
    isComparisonOpen,
    isShortcutsOpen,
    isDemoGuideOpen,
    start,
    pause,
    resume,
    step,
    reset,
    selectEvent,
    handleNavigate,
  ]);

  const handleSelectScenario = (scenario: GuidedScenario) => {
    updateConfig(() => scenario.config);
    reset();
  };

  // Correlate selected packet/event for Inspector
  const selectedEvent = useMemo(() => {
    return selectedEventId ? events.find((e) => e.id === selectedEventId) || null : null;
  }, [events, selectedEventId]);

  const inspectorTarget: PacketInspectorTarget | null = useMemo(() => {
    if (selectedInFlightPacket) {
      return { inFlightPacket: selectedInFlightPacket, event: null };
    }
    if (selectedEvent) {
      return { inFlightPacket: null, event: selectedEvent };
    }
    return null;
  }, [selectedInFlightPacket, selectedEvent]);

  const handleSelectInFlightPacket = (pkt: InFlightPacket) => {
    setSelectedInFlightPacket(pkt);
    // Pause playback so user can comfortably inspect
    if (status === 'RUNNING') {
      pause();
    }
  };

  const handleCloseInspector = () => {
    setSelectedInFlightPacket(null);
    selectEvent(null);
  };

  const handleLaunchPreset = (preset: DemoScenarioPreset) => {
    if (preset.configUpdates) {
      updateConfig((prev) => ({
        ...prev,
        ...preset.configUpdates,
      }));
    }
    handleNavigate(preset.targetView);
  };

  return (
    <AppShell
      currentView={currentView}
      onNavigate={handleNavigate}
      status={status}
      virtualTimeMs={virtualTimeMs}
      currentProtocol={config.protocol}
      onOpenShortcuts={() => setIsShortcutsOpen(true)}
      onOpenComparison={() => setIsComparisonOpen(true)}
      onNavigateToAutoSim={() => handleNavigate('auto-sim')}
      onOpenDemoGuide={() => setIsDemoGuideOpen(true)}
    >
      {/* 
        CRITICAL ARCHITECTURAL REQUIREMENT:
        Views that hold active state (AutoSimView with running simulation loop and
        LiveUdpView with WebSocket agent connection) MUST NOT be unmounted when navigating
        between tabs.
        Using persistent display toggling (block / hidden) ensures that state, timers,
        and WebSockets remain 100% alive across view switches.
      */}

      {/* 1. Overview View */}
      <div className={currentView === 'overview' ? 'block' : 'hidden'}>
        <OverviewView
          onNavigate={handleNavigate}
          onSelectProtocol={handleSelectProtocol}
        />
      </div>

      {/* 2. Automatic Simulation View (Preserved V1 Simulator) */}
      <div className={currentView === 'auto-sim' ? 'block' : 'hidden'}>
        <AutoSimView
          config={config}
          status={status}
          virtualTimeMs={virtualTimeMs}
          engineState={engineState}
          events={events}
          statistics={statistics}
          speedMs={speedMs}
          error={error}
          selectedEventId={selectedEventId}
          selectedInFlightPacket={selectedInFlightPacket}
          inspectorTarget={inspectorTarget}
          isSimActive={isSimActive}
          onSelectProtocol={handleSelectProtocol}
          onSelectScenario={handleSelectScenario}
          onStart={start}
          onPause={pause}
          onResume={resume}
          onStep={() => step()}
          onReset={reset}
          onRunToCompletion={runToCompletion}
          onSetSpeed={setSpeed}
          onUpdateConfig={updateConfig}
          onSelectEvent={(id) => {
            selectEvent(id);
            setSelectedInFlightPacket(null);
          }}
          onSelectInFlightPacket={handleSelectInFlightPacket}
          onCloseInspector={handleCloseInspector}
        />
      </div>

      {/* 3. Manual Interactive Lab (Phase 3 Preview) */}
      <div className={currentView === 'manual-lab' ? 'block' : 'hidden'}>
        <ManualLabView onNavigate={handleNavigate} />
      </div>

      {/* 4. Live UDP Network View (Preserved V1 Live Agent) */}
      <div className={currentView === 'live-udp' ? 'block' : 'hidden'}>
        <LiveUdpView />
      </div>

      {/* 5. Protocol Comparison View */}
      <div className={currentView === 'comparison' ? 'block' : 'hidden'}>
        <ProtocolComparisonView
          onOpenComparisonModal={() => setIsComparisonOpen(true)}
          onNavigate={handleNavigate}
        />
      </div>

      {/* 6. Protocol Internals View */}
      <div className={currentView === 'internals' ? 'block' : 'hidden'}>
        <ProtocolInternalsView onNavigate={handleNavigate} />
      </div>

      {/* 7. Learning Centre View */}
      <div className={currentView === 'learning' ? 'block' : 'hidden'}>
        <LearningCentreView onNavigate={handleNavigate} />
      </div>

      {/* Protocol Comparison Modal Benchmark */}
      <ProtocolComparisonModal
        config={config}
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        onSelectProtocol={handleSelectProtocol}
      />

      {/* Keyboard Shortcuts Reference Dialog */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Faculty Viva & Classroom Demo Guide Modal */}
      <FacultyDemoModal
        isOpen={isDemoGuideOpen}
        onClose={() => setIsDemoGuideOpen(false)}
        onLaunchPreset={handleLaunchPreset}
      />
    </AppShell>
  );
}
