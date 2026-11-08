import React from 'react';
import {
  SimulationConfig,
  SimulationStatus,
  SimulationState,
  SimulationEvent,
  SimulationStatistics,
  ProtocolType,
  InFlightPacket,
} from '@agent';
import { LabScenariosPanel } from '../components/LabScenariosPanel';
import { ProtocolSelector } from '../components/ProtocolSelector';
import { SimulationControls } from '../components/SimulationControls';
import { NetworkTopology } from '../components/NetworkTopology';
import { SpaceTimeDiagram } from '../components/SpaceTimeDiagram';
import { EventTimeline } from '../components/EventTimeline';
import { StatisticsPanel } from '../components/StatisticsPanel';
import { SimulationConfigPanel } from '../components/SimulationConfigPanel';
import { ProtocolExplanation } from '../components/ProtocolExplanation';
import { PacketInspector, PacketInspectorTarget } from '../components/PacketInspector';
import { GuidedScenario } from '../types/scenarios';

interface AutoSimViewProps {
  config: SimulationConfig;
  status: SimulationStatus;
  virtualTimeMs: number;
  engineState: SimulationState | null;
  events: ReadonlyArray<SimulationEvent>;
  statistics: SimulationStatistics | null;
  speedMs: number;
  error: string | null;
  selectedEventId: string | null;
  selectedInFlightPacket: InFlightPacket | null;
  inspectorTarget: PacketInspectorTarget | null;
  isSimActive: boolean;
  onSelectProtocol: (proto: ProtocolType) => void;
  onSelectScenario: (scenario: GuidedScenario) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStep: () => void;
  onReset: () => void;
  onRunToCompletion: () => void;
  onSetSpeed: (speedMs: number) => void;
  onUpdateConfig: (updater: (prev: SimulationConfig) => SimulationConfig) => void;
  onSelectEvent: (id: string | null) => void;
  onSelectInFlightPacket: (pkt: InFlightPacket) => void;
  onCloseInspector: () => void;
}

export const AutoSimView: React.FC<AutoSimViewProps> = ({
  config,
  status,
  virtualTimeMs,
  engineState,
  events,
  statistics,
  speedMs,
  error,
  selectedEventId,
  selectedInFlightPacket,
  inspectorTarget,
  isSimActive,
  onSelectProtocol,
  onSelectScenario,
  onStart,
  onPause,
  onResume,
  onStep,
  onReset,
  onRunToCompletion,
  onSetSpeed,
  onUpdateConfig,
  onSelectEvent,
  onSelectInFlightPacket,
  onCloseInspector,
}) => {
  return (
    <div className="space-y-6">
      {/* Guided Scenarios Presets Panel */}
      <LabScenariosPanel
        currentConfig={config}
        onSelectScenario={onSelectScenario}
        disabled={isSimActive}
      />

      {/* Protocol Selector */}
      <ProtocolSelector
        selectedProtocol={config.protocol}
        onSelectProtocol={onSelectProtocol}
        disabled={isSimActive}
      />

      {/* Controls Toolbar */}
      <SimulationControls
        status={status}
        speedMs={speedMs}
        onStart={onStart}
        onPause={onPause}
        onResume={onResume}
        onStep={onStep}
        onReset={onReset}
        onRunToCompletion={onRunToCompletion}
        onSetSpeed={onSetSpeed}
      />

      {/* Central Network Topology & Channel Animation */}
      <NetworkTopology
        protocol={config.protocol}
        engineState={engineState}
        latestEvent={events[events.length - 1]}
        virtualTimeMs={virtualTimeMs}
        selectedPacketId={selectedInFlightPacket?.id}
        onSelectInFlightPacket={onSelectInFlightPacket}
      />

      {/* Interactive Packet Inspector Modal/Panel */}
      {inspectorTarget && (
        <PacketInspector
          target={inspectorTarget}
          virtualTimeMs={virtualTimeMs}
          isPaused={status === 'PAUSED'}
          onPause={onPause}
          onResume={onResume}
          onClose={onCloseInspector}
        />
      )}

      {/* Space-Time Sequence Diagram (Ladder / Bounce Diagram) */}
      <SpaceTimeDiagram
        events={events}
        virtualTimeMs={virtualTimeMs}
        selectedEventId={selectedEventId}
        onSelectEvent={onSelectEvent}
        oneWayDelayMs={config.oneWayDelayMs}
      />

      {/* Two-Column Telemetry: Event Timeline & Performance Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <EventTimeline
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={onSelectEvent}
          />
        </div>

        <div className="lg:col-span-5">
          <StatisticsPanel
            statistics={statistics}
            virtualTimeMs={virtualTimeMs}
            protocol={config.protocol}
            windowSize={config.windowSize}
            oneWayDelayMs={config.oneWayDelayMs}
          />
        </div>
      </div>

      {/* Configuration Parameters Panel */}
      <SimulationConfigPanel
        config={config}
        onUpdateConfig={onUpdateConfig}
        error={error}
        disabled={isSimActive}
      />

      {/* Protocol Mechanics & Educational Reference */}
      <ProtocolExplanation protocol={config.protocol} />
    </div>
  );
};

