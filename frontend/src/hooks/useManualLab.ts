import { useState, useRef, useCallback, useEffect } from 'react';
import {
  SimulationEngine,
  SimulationConfig,
  SimulationEvent,
  SimulationState,
  SimulationStatus,
  InFlightPacket,
  ProtocolType,
} from '@agent';

export interface UseManualLabReturn {
  protocol: ProtocolType;
  config: SimulationConfig;
  status: SimulationStatus;
  engineState: SimulationState | null;
  inFlightPackets: ReadonlyArray<InFlightPacket>;
  events: ReadonlyArray<SimulationEvent>;
  virtualTimeMs: number;
  canSend: boolean;
  hasOutstanding: boolean;
  canTimeout: boolean;
  remainingPayloadCount: number;
  sendNextFrame: () => boolean;
  deliverPacket: (packetId: string) => boolean;
  dropPacket: (packetId: string) => boolean;
  delayPacket: (packetId: string, additionalMs: number) => boolean;
  triggerTimeout: (targetSeq?: number) => boolean;
  stepTime: (deltaMs?: number) => void;
  setProtocol: (protocol: ProtocolType) => void;
  resetLab: () => void;
}

const DEFAULT_PAYLOADS = [
  'Data #0',
  'Data #1',
  'Data #2',
  'Data #3',
  'Data #4',
  'Data #5',
  'Data #6',
  'Data #7',
  'Data #8',
  'Data #9',
];

export function createDefaultManualConfig(protocol: ProtocolType): SimulationConfig {
  let windowSize = 4;
  let seqNumberSpace = 8;

  if (protocol === 'stop-and-wait') {
    windowSize = 1;
    seqNumberSpace = 2;
  } else if (protocol === 'go-back-n') {
    windowSize = 4;
    seqNumberSpace = 8;
  } else if (protocol === 'selective-repeat') {
    windowSize = 4;
    seqNumberSpace = 8;
  }

  return {
    protocol,
    mode: 'MANUAL',
    payloads: [...DEFAULT_PAYLOADS],
    windowSize,
    seqNumberSpace,
    seed: 42,
    oneWayDelayMs: 60,
    frameLossRate: 0,
    ackLossRate: 0,
    corruptionRate: 0,
    timeoutMs: 400,
    maxRetries: 4,
    tickStepMs: 15,
  };
}

export function useManualLab(initialProtocol: ProtocolType = 'go-back-n'): UseManualLabReturn {
  const [protocol, setProtocolState] = useState<ProtocolType>(initialProtocol);
  const [config, setConfig] = useState<SimulationConfig>(() => createDefaultManualConfig(initialProtocol));
  const [status, setStatus] = useState<SimulationStatus>('READY');
  const [virtualTimeMs, setVirtualTimeMs] = useState<number>(0);
  const [engineState, setEngineState] = useState<SimulationState | null>(null);
  const [inFlightPackets, setInFlightPackets] = useState<ReadonlyArray<InFlightPacket>>([]);
  const [events, setEvents] = useState<ReadonlyArray<SimulationEvent>>([]);
  const [canSend, setCanSend] = useState<boolean>(true);
  const [hasOutstanding, setHasOutstanding] = useState<boolean>(false);
  const [canTimeout, setCanTimeout] = useState<boolean>(false);
  const [remainingPayloadCount, setRemainingPayloadCount] = useState<number>(DEFAULT_PAYLOADS.length);

  const engineRef = useRef<SimulationEngine | null>(null);

  const syncFromEngine = useCallback((eng: SimulationEngine) => {
    const state = eng.getState();
    setStatus(eng.getStatus());
    setVirtualTimeMs(eng.getVirtualTime());
    setEvents(eng.getEvents());
    setEngineState(state);

    const pkts = eng.getInFlightPackets();
    setInFlightPackets(pkts);

    setRemainingPayloadCount(state.remainingPayloads);

    const isFailed = eng.getStatus() === 'FAILED' || eng.getStatus() === 'STOPPED';
    const isCompleted = eng.getStatus() === 'COMPLETED';

    // Sender has capacity to send next frame if remaining payloads > 0 and window capacity available
    const capacity = state.senderWindow.windowSize;
    const outstanding = state.senderWindow.bufferSize;
    const hasCapacity = outstanding < capacity;
    setCanSend(!isFailed && !isCompleted && state.remainingPayloads > 0 && hasCapacity);

    // Outstanding unacknowledged frames exist
    const hasUnacked = outstanding > 0 || pkts.length > 0;
    setHasOutstanding(hasUnacked);
    setCanTimeout(!isFailed && !isCompleted && outstanding > 0);
  }, []);

  const initEngine = useCallback((cfg: SimulationConfig) => {
    const newEngine = new SimulationEngine(cfg);
    engineRef.current = newEngine;
    syncFromEngine(newEngine);
    return newEngine;
  }, [syncFromEngine]);

  useEffect(() => {
    initEngine(config);
  }, [config, initEngine]);

  const sendNextFrame = useCallback((): boolean => {
    if (!engineRef.current) return false;
    const ok = engineRef.current.manualSendNextPayload();
    syncFromEngine(engineRef.current);
    return ok;
  }, [syncFromEngine]);

  const deliverPacket = useCallback((packetId: string): boolean => {
    if (!engineRef.current) return false;
    const ok = engineRef.current.manualDeliver(packetId);
    syncFromEngine(engineRef.current);
    return ok;
  }, [syncFromEngine]);

  const dropPacket = useCallback((packetId: string): boolean => {
    if (!engineRef.current) return false;
    const ok = engineRef.current.manualDrop(packetId);
    syncFromEngine(engineRef.current);
    return ok;
  }, [syncFromEngine]);

  const delayPacket = useCallback((packetId: string, additionalMs: number): boolean => {
    if (!engineRef.current) return false;
    const ok = engineRef.current.manualDelay(packetId, additionalMs);
    syncFromEngine(engineRef.current);
    return ok;
  }, [syncFromEngine]);

  const triggerTimeout = useCallback((targetSeq?: number): boolean => {
    if (!engineRef.current) return false;
    const ok = engineRef.current.manualTriggerTimeout(targetSeq);
    syncFromEngine(engineRef.current);
    return ok;
  }, [syncFromEngine]);

  const stepTime = useCallback((deltaMs?: number): void => {
    if (!engineRef.current) return;
    engineRef.current.step(deltaMs);
    syncFromEngine(engineRef.current);
  }, [syncFromEngine]);

  const setProtocol = useCallback((newProto: ProtocolType) => {
    setProtocolState(newProto);
    const newConfig = createDefaultManualConfig(newProto);
    setConfig(newConfig);
  }, []);

  const resetLab = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.reset();
    syncFromEngine(engineRef.current);
  }, [syncFromEngine]);

  return {
    protocol,
    config,
    status,
    engineState,
    inFlightPackets,
    events,
    virtualTimeMs,
    canSend,
    hasOutstanding,
    canTimeout,
    remainingPayloadCount,
    sendNextFrame,
    deliverPacket,
    dropPacket,
    delayPacket,
    triggerTimeout,
    stepTime,
    setProtocol,
    resetLab,
  };
}

