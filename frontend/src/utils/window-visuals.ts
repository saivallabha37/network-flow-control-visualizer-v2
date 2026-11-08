import { ProtocolType, SimulationEvent, SimulationState } from '@agent';

export type SlotState = 'ACKED' | 'OUTSTANDING' | 'READY' | 'OUT_OF_WINDOW';

export interface TimerProgressInfo {
  progress: number; // 0.0 to 1.0
  percentage: number; // 0 to 100
  isWarning: boolean; // >= 80% and < 100%
  isExpired: boolean; // >= 100%
}

export interface SlotVisualInfo {
  seq: number;
  label: string; // e.g. "S0"
  absoluteIndex: number; // e.g. 0, 8 (if wrapped)
  displayTag: string; // e.g. "S0" or "S0 (#8)"
  state: SlotState;
  isBase: boolean;
  isNext: boolean;
  isExpectedRn: boolean;
  isBuffered: boolean;
  inWindow: boolean;
  timer?: TimerProgressInfo;
}

/**
 * Calculates timer progress metrics based on elapsed virtual time and timeout limit.
 */
export function calculateTimerProgress(elapsedMs: number, timeoutMs: number): TimerProgressInfo {
  if (timeoutMs <= 0) {
    return { progress: 0, percentage: 0, isWarning: false, isExpired: false };
  }
  const ratio = Math.max(0, elapsedMs / timeoutMs);
  const progress = Math.min(1, ratio);
  const percentage = Math.min(100, Math.round(progress * 100));
  const isExpired = ratio >= 1.0;
  const isWarning = ratio >= 0.8 && !isExpired;

  return {
    progress,
    percentage,
    isWarning,
    isExpired,
  };
}

/**
 * Produces dual sequence display for modulo sequence number vs absolute frame index.
 * Example: seq = 0, base = 8, seqSpace = 8 => Modulo "S0", Absolute "#8", Tag "S0 (#8)"
 */
export function getDualSequenceDisplay(
  seq: number,
  base: number,
  seqSpace: number
): { moduloLabel: string; absoluteIndex: number; displayTag: string; hasWrapped: boolean } {
  // Determine absolute cycle
  const cycle = Math.floor(base / seqSpace);
  const baseModulo = ((base % seqSpace) + seqSpace) % seqSpace;
  
  // If seq is before baseModulo in circular sense, it belongs to next cycle if within window,
  // or current cycle.
  let absoluteIndex = cycle * seqSpace + seq;
  if (seq < baseModulo && cycle >= 0) {
    // If within forward window that wraps around
    absoluteIndex = (cycle + 1) * seqSpace + seq;
  }

  const hasWrapped = absoluteIndex >= seqSpace;
  const moduloLabel = `S${seq}`;
  const displayTag = hasWrapped ? `${moduloLabel} (#${absoluteIndex})` : moduloLabel;

  return {
    moduloLabel,
    absoluteIndex,
    displayTag,
    hasWrapped,
  };
}

/**
 * Classifies sender slot state into ACKED, OUTSTANDING, READY, or OUT_OF_WINDOW.
 */
export function classifySenderSlot(
  seq: number,
  base: number,
  nextSeq: number,
  windowSize: number,
  seqSpace: number,
  ackedSeqs?: Set<number>
): SlotState {
  if (ackedSeqs && ackedSeqs.has(seq)) {
    return 'ACKED';
  }

  // Distance from base modulo M
  const distFromBase = ((seq - base) % seqSpace + seqSpace) % seqSpace;

  // Check if within window [base .. base + windowSize - 1]
  if (distFromBase < windowSize) {
    const distNextFromBase = ((nextSeq - base) % seqSpace + seqSpace) % seqSpace;

    // Slots between base and nextSeq have been dispatched and await ACK
    if (distFromBase < distNextFromBase) {
      return 'OUTSTANDING';
    }
    // Slots between nextSeq and window boundary are available to transmit
    return 'READY';
  }

  // Outside window
  return 'OUT_OF_WINDOW';
}

/**
 * Derives currently buffered sequence numbers at receiver for Selective Repeat from simulation events.
 */
export function deriveReceiverBufferedSeqs(
  events: ReadonlyArray<SimulationEvent>
): Set<number> {
  const buffered = new Set<number>();
  for (const evt of events) {
    if (evt.type === 'FRAME_BUFFERED' && typeof evt.details?.seqNum === 'number') {
      buffered.add(evt.details.seqNum);
    } else if (evt.type === 'PAYLOAD_DELIVERED' && typeof evt.details?.seqNum === 'number') {
      buffered.delete(evt.details.seqNum);
    }
  }
  return buffered;
}

/**
 * Derives ACKed slots within the current window (especially useful for Selective Repeat).
 */
export function deriveAckedSeqs(
  protocol: ProtocolType,
  events: ReadonlyArray<SimulationEvent>,
  base: number,
  windowSize: number,
  seqSpace: number
): Set<number> {
  const acked = new Set<number>();
  if (protocol !== 'selective-repeat') {
    return acked;
  }

  // In Selective Repeat, an ACK frame with ackNum acknowledges that specific frame
  for (const evt of events) {
    if (evt.type === 'ACK_DELIVERED' && typeof evt.details?.ackNum === 'number') {
      const ackNum = evt.details.ackNum;
      // If ackNum is within current sender window, mark as ACKED
      const dist = ((ackNum - base) % seqSpace + seqSpace) % seqSpace;
      if (dist < windowSize) {
        acked.add(ackNum);
      }
    }
  }
  return acked;
}

/**
 * Derives timer information from engine state and event history.
 */
export function deriveSenderTimers(
  _protocol: ProtocolType,
  engineState: SimulationState | null,
  events: ReadonlyArray<SimulationEvent>,
  timeoutMs: number,
  virtualTimeMs: number
): {
  sharedTimer: { elapsedMs: number; isRunning: boolean; timerInfo: TimerProgressInfo };
  individualTimers: Map<number, { elapsedMs: number; timerInfo: TimerProgressInfo }>;
} {
  if (!engineState || engineState.senderWindow.bufferSize === 0) {
    return {
      sharedTimer: {
        elapsedMs: 0,
        isRunning: false,
        timerInfo: calculateTimerProgress(0, timeoutMs),
      },
      individualTimers: new Map(),
    };
  }

  const base = engineState.senderWindow.base;
  const individualTimers = new Map<number, { elapsedMs: number; timerInfo: TimerProgressInfo }>();

  // Map to store latest dispatch virtual time for each seqNum
  const latestDispatchTimes = new Map<number, number>();

  for (const evt of events) {
    if (
      (evt.type === 'FRAME_TRANSMITTED' || evt.type === 'RETRANSMISSION') &&
      typeof evt.details?.seqNum === 'number'
    ) {
      latestDispatchTimes.set(evt.details.seqNum, evt.virtualTimestamp);
    }
  }

  // Calculate for individual frames (Selective Repeat)
  for (let offset = 0; offset < engineState.senderWindow.bufferSize; offset++) {
    const seq = (base + offset) % engineState.senderWindow.windowSize;
    const dispatchTime = latestDispatchTimes.get(seq) ?? virtualTimeMs;
    const elapsed = Math.max(0, virtualTimeMs - dispatchTime);
    individualTimers.set(seq, {
      elapsedMs: elapsed,
      timerInfo: calculateTimerProgress(elapsed, timeoutMs),
    });
  }

  // For shared timer (Stop-and-Wait and Go-Back-N)
  // Shared timer tracks the oldest unacknowledged frame (Sf / base)
  const baseDispatchTime = latestDispatchTimes.get(base) ?? virtualTimeMs;
  const sharedElapsed = Math.max(0, virtualTimeMs - baseDispatchTime);

  return {
    sharedTimer: {
      elapsedMs: sharedElapsed,
      isRunning: engineState.senderWindow.bufferSize > 0,
      timerInfo: calculateTimerProgress(sharedElapsed, timeoutMs),
    },
    individualTimers,
  };
}
