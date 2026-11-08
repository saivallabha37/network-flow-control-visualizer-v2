import { describe, it, expect } from 'vitest';

/**
 * Checks whether a protocol configuration satisfies the mathematical sequence space constraints.
 */
function validateSequenceSpace(
  protocol: 'go-back-n' | 'selective-repeat' | 'stop-and-wait',
  windowSize: number,
  seqNumberSpace: number
): { valid: boolean; reason: string } {
  if (protocol === 'stop-and-wait') {
    if (seqNumberSpace < 2) {
      return { valid: false, reason: 'Stop-and-Wait requires M >= 2 (alternating bit 0 and 1)' };
    }
    return { valid: true, reason: 'M >= 2 satisfied for Stop-and-Wait' };
  }

  if (protocol === 'go-back-n') {
    if (seqNumberSpace <= windowSize) {
      return {
        valid: false,
        reason: `Go-Back-N requires M >= N + 1 (received M=${seqNumberSpace}, N=${windowSize})`,
      };
    }
    return { valid: true, reason: 'M >= N + 1 satisfied for Go-Back-N' };
  }

  // Selective Repeat: Half-Space Rule 2N <= M
  if (seqNumberSpace < 2 * windowSize) {
    return {
      valid: false,
      reason: `Selective Repeat requires M >= 2N (received M=${seqNumberSpace}, 2N=${2 * windowSize}). Silent sequence ambiguity will occur under ACK loss.`,
    };
  }

  return { valid: true, reason: 'M >= 2N half-space rule satisfied for Selective Repeat' };
}

/**
 * Checks whether an unacknowledged retransmitted frame seqNum overlaps with the advanced receiver window.
 */
function detectSequenceAmbiguityOverlap(
  seqSpace: number,
  windowSize: number,
  retransmittedSeq: number,
  advancedReceiverBase: number
): boolean {
  for (let offset = 0; offset < windowSize; offset++) {
    const rxSlot = (advancedReceiverBase + offset) % seqSpace;
    if (rxSlot === retransmittedSeq) {
      return true; // Overlap detected! Catastrophic ambiguity
    }
  }
  return false;
}

describe('Learning Centre & Mathematical Ambiguity Invariant Tests', () => {
  describe('1. Half-Space Constraint Validation (2N <= M)', () => {
    it('flags Selective Repeat ambiguity violation when M < 2N', () => {
      // Violation case: M = 4, N = 3 (2N = 6 > 4)
      const res = validateSequenceSpace('selective-repeat', 3, 4);
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('Selective Repeat requires M >= 2N');

      // Violation case: M = 8, N = 5 (2N = 10 > 8)
      const res8 = validateSequenceSpace('selective-repeat', 5, 8);
      expect(res8.valid).toBe(false);
    });

    it('approves compliant Selective Repeat configurations where M >= 2N', () => {
      // Compliant case: M = 4, N = 2 (2N = 4 <= 4)
      const res4 = validateSequenceSpace('selective-repeat', 2, 4);
      expect(res4.valid).toBe(true);

      // Standard case: M = 8, N = 4 (2N = 8 <= 8)
      const res8 = validateSequenceSpace('selective-repeat', 4, 8);
      expect(res8.valid).toBe(true);
    });

    it('evaluates Go-Back-N constraint M >= N + 1 accurately', () => {
      // For Go-Back-N, M=4 and N=3 is compliant because receiver window is 1!
      const gbnValid = validateSequenceSpace('go-back-n', 3, 4);
      expect(gbnValid.valid).toBe(true);

      // GBN violation: M=4, N=4
      const gbnInvalid = validateSequenceSpace('go-back-n', 4, 4);
      expect(gbnInvalid.valid).toBe(false);
    });
  });

  describe('2. Receiver Window Overlap Detection under ACK Loss', () => {
    it('detects catastrophic overlap when M=4, N=3 after lost ACKs', () => {
      const seqSpace = 4;
      const windowSize = 3;
      // Receiver accepted 0, 1, 2 and advanced by 3 to base 3 -> window is [3, 0, 1]
      const advancedRxBase = 3;
      const retransmittedSeq = 0; // Old Frame 0 retransmitted by sender

      const hasOverlap = detectSequenceAmbiguityOverlap(
        seqSpace,
        windowSize,
        retransmittedSeq,
        advancedRxBase
      );

      // Frame 0 overlaps with advanced receiver window [3, 0, 1]!
      expect(hasOverlap).toBe(true);
    });

    it('proves zero overlap in compliant M=4, N=2 configuration', () => {
      const seqSpace = 4;
      const windowSize = 2;
      // Receiver accepted 0, 1 and advanced by 2 to base 2 -> window is [2, 3]
      const advancedRxBase = 2;
      const retransmittedSeq = 0; // Old Frame 0 retransmitted by sender

      const hasOverlap = detectSequenceAmbiguityOverlap(
        seqSpace,
        windowSize,
        retransmittedSeq,
        advancedRxBase
      );

      // Frame 0 is outside [2, 3] -> Disambiguation guaranteed!
      expect(hasOverlap).toBe(false);
    });
  });
});

