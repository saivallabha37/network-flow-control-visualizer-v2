import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useManualLab } from '../hooks/useManualLab';
import { ProtocolType } from '@agent';
import { ViewId } from '../types/navigation';
import { ControlDeck } from '../components/canvas/ControlDeck';
import { SimulationStage } from '../components/canvas/SimulationStage';
import { CompactTelemetry } from '../components/canvas/CompactTelemetry';

interface ManualLabViewProps {
  onNavigate: (view: ViewId) => void;
}

export const ManualLabView: React.FC<ManualLabViewProps> = () => {
  const lab = useManualLab('go-back-n');

  // ---- Auto-play support (tick-clock) ----
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(150);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- Fault injection state (applied to next sendNextFrame call) ----
  const [dropNextFrame, setDropNextFrame] = useState(false);
  const [dropNextAck, setDropNextAck] = useState(false);
  const [corruptNext, setCorruptNext] = useState(false);
  const [channelDelayMs, setChannelDelayMs] = useState(lab.config.oneWayDelayMs);

  // ---- Start/stop auto-play interval ----
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = setInterval(() => {
        lab.stepTime(autoPlaySpeed);
      }, autoPlaySpeed);
    } else {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    }
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoPlaying, autoPlaySpeed]);

  // ---- Stop auto-play when sim completes / fails ----
  useEffect(() => {
    if (lab.status === 'COMPLETED' || lab.status === 'FAILED' || lab.status === 'STOPPED') {
      setIsAutoPlaying(false);
    }
  }, [lab.status]);

  const handleSendNextFrame = useCallback(() => {
    // Apply fault injection flags to in-flight packets after send
    const sent = lab.sendNextFrame();
    if (sent) {
      // If dropNextFrame is active, drop the DATA packet that just arrived in channel
      if (dropNextFrame) {
        // Brief delay to allow engine to register the frame
        setTimeout(() => {
          const pkts = lab.inFlightPackets.filter((p) => p.type === 'DATA' && p.status === 'IN_FLIGHT');
          if (pkts.length > 0) {
            lab.dropPacket(pkts[pkts.length - 1].id);
          }
          setDropNextFrame(false);
        }, 0);
      }
    }
  }, [lab, dropNextFrame]);

  const handleDeliverPacket = useCallback((id: string) => {
    // If dropNextAck is on and this is a DATA packet being delivered (which will emit ACK),
    // we deliver first, then drop the resulting ACK
    lab.deliverPacket(id);
    if (dropNextAck) {
      setTimeout(() => {
        const ackPkts = lab.inFlightPackets.filter((p) => p.type === 'ACK' && p.status === 'IN_FLIGHT');
        if (ackPkts.length > 0) {
          lab.dropPacket(ackPkts[ackPkts.length - 1].id);
        }
        setDropNextAck(false);
      }, 0);
    }
  }, [lab, dropNextAck]);

  const handleDropPacket = useCallback((id: string) => {
    lab.dropPacket(id);
  }, [lab]);

  const handleSetProtocol = useCallback((p: ProtocolType) => {
    setIsAutoPlaying(false);
    lab.setProtocol(p);
  }, [lab]);

  const handleReset = useCallback(() => {
    setIsAutoPlaying(false);
    setDropNextFrame(false);
    setDropNextAck(false);
    setCorruptNext(false);
    lab.resetLab();
  }, [lab]);

  const handleStepTime = useCallback(() => {
    lab.stepTime(15);
  }, [lab]);

  const handleApplyScenario = useCallback((scenarioId: string) => {
    setIsAutoPlaying(false);
    lab.resetLab();

    switch (scenarioId) {
      case 'lost-frame':
        setDropNextFrame(true);
        break;
      case 'lost-ack':
        setDropNextAck(true);
        break;
      case 'out-of-order':
        // Send 2 frames, drop the first
        lab.sendNextFrame();
        setDropNextFrame(true);
        break;
      case 'window-full':
        // Send frames to fill window without delivering ACKs
        for (let i = 0; i < (lab.config.windowSize ?? 4); i++) {
          lab.sendNextFrame();
        }
        break;
    }
  }, [lab]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Control Deck */}
      <ControlDeck
        protocol={lab.protocol}
        canSend={lab.canSend}
        canTimeout={lab.canTimeout}
        remainingPayloadCount={lab.remainingPayloadCount}
        virtualTimeMs={lab.virtualTimeMs}
        isAutoPlaying={isAutoPlaying}
        autoPlaySpeed={autoPlaySpeed}
        channelDelayMs={channelDelayMs}
        dropNextFrame={dropNextFrame}
        dropNextAck={dropNextAck}
        corruptNext={corruptNext}
        onSendNextFrame={handleSendNextFrame}
        onTriggerTimeout={() => lab.triggerTimeout()}
        onSetProtocol={handleSetProtocol}
        onReset={handleReset}
        onStepTime={handleStepTime}
        onToggleAutoPlay={() => setIsAutoPlaying((v) => !v)}
        onSetAutoPlaySpeed={setAutoPlaySpeed}
        onSetChannelDelay={(ms) => setChannelDelayMs(ms)}
        onToggleDropNextFrame={() => setDropNextFrame((v) => !v)}
        onToggleDropNextAck={() => setDropNextAck((v) => !v)}
        onToggleCorruptNext={() => setCorruptNext((v) => !v)}
        onApplyScenario={handleApplyScenario}
      />

      {/* Center + Bottom: Stage + Telemetry */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <SimulationStage
          protocol={lab.protocol}
          engineState={lab.engineState}
          inFlightPackets={lab.inFlightPackets}
          events={lab.events}
          virtualTimeMs={lab.virtualTimeMs}
          timeoutMs={lab.config.timeoutMs}
          onDeliverPacket={handleDeliverPacket}
          onDropPacket={handleDropPacket}
        />
        <CompactTelemetry events={lab.events} virtualTimeMs={lab.virtualTimeMs} />
      </div>
    </div>
  );
};
