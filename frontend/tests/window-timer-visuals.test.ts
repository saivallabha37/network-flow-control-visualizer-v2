import { describe, it, expect } from 'vitest';
import {
  calculateTimerProgress,
  getDualSequenceDisplay,
  classifySenderSlot,
  deriveReceiverBufferedSeqs,
  deriveAckedSeqs,
} from '../src/utils/window-visuals';
import { SimulationEvent } from '@agent';

describe('Sliding Window & Timer Visualizations', () => {
  describe('1. Slot State Classification (ACKED, OUTSTANDING, READY, OUT_OF_WINDOW)', () => {
    it('classifies Go-Back-N slots correctly without wraparound', () => {
      // Base Sf = 0, Next Sn = 2, Window N = 4, Space M = 8
      const base = 0;
      const nextSeq = 2;
      const windowSize = 4;
      const seqSpace = 8;

      // Dispatched frames awaiting ACK
      expect(classifySenderSlot(0, base, nextSeq, windowSize, seqSpace)).toBe('OUTSTANDING');
      expect(classifySenderSlot(1, base, nextSeq, windowSize, seqSpace)).toBe('OUTSTANDING');

      // Slots in window ready to be transmitted
      expect(classifySenderSlot(2, base, nextSeq, windowSize, seqSpace)).toBe('READY');
      expect(classifySenderSlot(3, base, nextSeq, windowSize, seqSpace)).toBe('READY');

      // Slots outside window
      expect(classifySenderSlot(4, base, nextSeq, windowSize, seqSpace)).toBe('OUT_OF_WINDOW');
      expect(classifySenderSlot(5, base, nextSeq, windowSize, seqSpace)).toBe('OUT_OF_WINDOW');
      expect(classifySenderSlot(6, base, nextSeq, windowSize, seqSpace)).toBe('OUT_OF_WINDOW');
      expect(classifySenderSlot(7, base, nextSeq, windowSize, seqSpace)).toBe('OUT_OF_WINDOW');
    });

    it('classifies Go-Back-N slots correctly during circular modulo wraparound', () => {
      // Base Sf = 6, Next Sn = 0 (wrapped around 8), Window N = 4, Space M = 8
      // Window covers [6, 7, 0, 1]
      const base = 6;
      const nextSeq = 0; // 6 and 7 were sent, next to send is 0
      const windowSize = 4;
      const seqSpace = 8;

      expect(classifySenderSlot(6, base, nextSeq, windowSize, seqSpace)).toBe('OUTSTANDING');
      expect(classifySenderSlot(7, base, nextSeq, windowSize, seqSpace)).toBe('OUTSTANDING');
      expect(classifySenderSlot(0, base, nextSeq, windowSize, seqSpace)).toBe('READY');
      expect(classifySenderSlot(1, base, nextSeq, windowSize, seqSpace)).toBe('READY');

      // Outside window
      expect(classifySenderSlot(2, base, nextSeq, windowSize, seqSpace)).toBe('OUT_OF_WINDOW');
      expect(classifySenderSlot(3, base, nextSeq, windowSize, seqSpace)).toBe('OUT_OF_WINDOW');
      expect(classifySenderSlot(4, base, nextSeq, windowSize, seqSpace)).toBe('OUT_OF_WINDOW');
      expect(classifySenderSlot(5, base, nextSeq, windowSize, seqSpace)).toBe('OUT_OF_WINDOW');
    });

    it('classifies individually acknowledged slots as ACKED in Selective Repeat', () => {
      const base = 0;
      const nextSeq = 3;
      const windowSize = 4;
      const seqSpace = 8;
      const ackedSeqs = new Set<number>([1]); // Frame 1 received individual ACK

      expect(classifySenderSlot(0, base, nextSeq, windowSize, seqSpace, ackedSeqs)).toBe('OUTSTANDING');
      expect(classifySenderSlot(1, base, nextSeq, windowSize, seqSpace, ackedSeqs)).toBe('ACKED');
      expect(classifySenderSlot(2, base, nextSeq, windowSize, seqSpace, ackedSeqs)).toBe('OUTSTANDING');
      expect(classifySenderSlot(3, base, nextSeq, windowSize, seqSpace, ackedSeqs)).toBe('READY');
    });

    it('classifies Stop-and-Wait single-slot states accurately (N=1, M=2)', () => {
      const windowSize = 1;
      const seqSpace = 2;

      // When ready to send frame 0
      expect(classifySenderSlot(0, 0, 0, windowSize, seqSpace)).toBe('READY');
      expect(classifySenderSlot(1, 0, 0, windowSize, seqSpace)).toBe('OUT_OF_WINDOW');

      // When frame 0 is outstanding awaiting ACK
      expect(classifySenderSlot(0, 0, 1, windowSize, seqSpace)).toBe('OUTSTANDING');
      expect(classifySenderSlot(1, 0, 1, windowSize, seqSpace)).toBe('OUT_OF_WINDOW');
    });
  });

  describe('2. Timer Calculation Logic & Threshold Warnings', () => {
    const timeoutMs = 400;

    it('calculates regular timer progress under normal conditions', () => {
      const result = calculateTimerProgress(100, timeoutMs);
      expect(result.progress).toBe(0.25);
      expect(result.percentage).toBe(25);
      expect(result.isWarning).toBe(false);
      expect(result.isExpired).toBe(false);
    });

    it('triggers warning threshold at or above 80% of timeout', () => {
      // 320ms / 400ms = 80%
      const result80 = calculateTimerProgress(320, timeoutMs);
      expect(result80.progress).toBe(0.8);
      expect(result80.percentage).toBe(80);
      expect(result80.isWarning).toBe(true);
      expect(result80.isExpired).toBe(false);

      // 360ms / 400ms = 90%
      const result90 = calculateTimerProgress(360, timeoutMs);
      expect(result90.percentage).toBe(90);
      expect(result90.isWarning).toBe(true);
      expect(result90.isExpired).toBe(false);
    });

    it('triggers expired status at or above 100% of timeout', () => {
      // Exactly 100%
      const result100 = calculateTimerProgress(400, timeoutMs);
      expect(result100.progress).toBe(1);
      expect(result100.percentage).toBe(100);
      expect(result100.isWarning).toBe(false);
      expect(result100.isExpired).toBe(true);

      // Past timeout (e.g. 520ms)
      const resultOver = calculateTimerProgress(520, timeoutMs);
      expect(resultOver.progress).toBe(1);
      expect(resultOver.percentage).toBe(100);
      expect(resultOver.isWarning).toBe(false);
      expect(resultOver.isExpired).toBe(true);
    });

    it('safely handles non-positive timeout limits', () => {
      const result = calculateTimerProgress(100, 0);
      expect(result.progress).toBe(0);
      expect(result.percentage).toBe(0);
      expect(result.isWarning).toBe(false);
      expect(result.isExpired).toBe(false);
    });
  });

  describe('3. Dual Sequence Indexing (Modulo vs Absolute Frame Tracking)', () => {
    const seqSpace = 8;

    it('formats initial cycle sequence numbers without wraparound tag', () => {
      const display0 = getDualSequenceDisplay(0, 0, seqSpace);
      expect(display0.moduloLabel).toBe('S0');
      expect(display0.absoluteIndex).toBe(0);
      expect(display0.displayTag).toBe('S0');
      expect(display0.hasWrapped).toBe(false);

      const display5 = getDualSequenceDisplay(5, 0, seqSpace);
      expect(display5.moduloLabel).toBe('S5');
      expect(display5.absoluteIndex).toBe(5);
      expect(display5.displayTag).toBe('S5');
      expect(display5.hasWrapped).toBe(false);
    });

    it('formats wrapped sequence numbers with clear absolute index', () => {
      // Second cycle: base has advanced to 8 (which is S0 in second cycle)
      const displayWrap0 = getDualSequenceDisplay(0, 8, seqSpace);
      expect(displayWrap0.moduloLabel).toBe('S0');
      expect(displayWrap0.absoluteIndex).toBe(8);
      expect(displayWrap0.displayTag).toBe('S0 (#8)');
      expect(displayWrap0.hasWrapped).toBe(true);

      const displayWrap3 = getDualSequenceDisplay(3, 8, seqSpace);
      expect(displayWrap3.moduloLabel).toBe('S3');
      expect(displayWrap3.absoluteIndex).toBe(11);
      expect(displayWrap3.displayTag).toBe('S3 (#11)');
      expect(displayWrap3.hasWrapped).toBe(true);
    });
  });

  describe('4. Selective Repeat Receiver Buffering & ACK derivation', () => {
    it('accurately derives receiver buffered frames from event history', () => {
      const events: SimulationEvent[] = [
        {
          id: 'evt-1',
          type: 'FRAME_BUFFERED',
          virtualTimestamp: 100,
          details: { seqNum: 2 },
        },
        {
          id: 'evt-2',
          type: 'FRAME_BUFFERED',
          virtualTimestamp: 150,
          details: { seqNum: 3 },
        },
      ];

      const buffered1 = deriveReceiverBufferedSeqs(events);
      expect(buffered1.has(2)).toBe(true);
      expect(buffered1.has(3)).toBe(true);
      expect(buffered1.size).toBe(2);

      // Missing frame 1 arrives and cascades delivery of frame 2
      const updatedEvents: SimulationEvent[] = [
        ...events,
        {
          id: 'evt-3',
          type: 'PAYLOAD_DELIVERED',
          virtualTimestamp: 200,
          details: { seqNum: 1 },
        },
        {
          id: 'evt-4',
          type: 'PAYLOAD_DELIVERED',
          virtualTimestamp: 200,
          details: { seqNum: 2 },
        },
      ];

      const buffered2 = deriveReceiverBufferedSeqs(updatedEvents);
      expect(buffered2.has(2)).toBe(false);
      expect(buffered2.has(3)).toBe(true);
      expect(buffered2.size).toBe(1);
    });

    it('derives ACKed sequences for Selective Repeat sender', () => {
      const events: SimulationEvent[] = [
        {
          id: 'evt-ack-1',
          type: 'ACK_DELIVERED',
          virtualTimestamp: 120,
          details: { ackNum: 1 },
        },
      ];

      const ackedSeqs = deriveAckedSeqs('selective-repeat', events, 0, 4, 8);
      expect(ackedSeqs.has(1)).toBe(true);
      expect(ackedSeqs.has(0)).toBe(false);
    });
  });
});

