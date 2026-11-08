import { describe, it, expect } from 'vitest';
import {
  calculateCRC32,
  computeFrameChecksum,
  createDataFrame,
  createAckFrame,
  getFrameCanonicalString,
  verifyChecksum,
} from '@agent';

describe('Protocol Internals & Layer Architecture Tests', () => {
  describe('1. Bitfield Byte Calculations & Frame Anatomy', () => {
    it('generates pristine DATA frames with correct field sizes and checksum', () => {
      const payload = 'Temperature-Sensor-42';
      const frame = createDataFrame({
        seqNum: 3,
        payload,
        sessionId: 'test-internals',
      });

      expect(frame.frameType).toBe('DATA');
      expect(frame.seqNum).toBe(3);
      expect(frame.payload).toBe(payload);
      expect(typeof frame.checksum).toBe('number');
      expect(frame.checksum).toBeGreaterThan(0);

      // Verify canonical serialization representation
      const canonical = getFrameCanonicalString(frame);
      expect(canonical).toBe(`DATA:3::${payload}:test-internals`);
    });

    it('generates pristine ACK frames with matching acknowledgement field', () => {
      const frame = createAckFrame({
        ackNum: 3,
        seqNum: 3,
        sessionId: 'test-internals',
      });

      expect(frame.frameType).toBe('ACK');
      expect(frame.ackNum).toBe(3);
      expect(frame.payload).toBe('');
      expect(typeof frame.checksum).toBe('number');

      const canonical = getFrameCanonicalString(frame);
      expect(canonical).toBe('ACK:3:3::test-internals');
    });

    it('verifies fixed and variable byte sizing of frame components', () => {
      const typeSize = 1;
      const seqSize = 4;
      const ackSize = 4;
      const lenSize = 2;
      const crcSize = 4;
      const fixedHeaderTrailerSize = typeSize + seqSize + ackSize + lenSize + crcSize;

      expect(fixedHeaderTrailerSize).toBe(15);

      const payload = 'Sample Stream';
      const totalWireBytes = fixedHeaderTrailerSize + payload.length;
      expect(totalWireBytes).toBe(15 + 13);
    });
  });

  describe('2. CRC-32 Verification & Physical Bit-Flip Detection', () => {
    it('verifies that pristine frame passes CRC-32 validation', () => {
      const frame = createDataFrame({
        seqNum: 0,
        payload: 'Mission Critical Data',
        sessionId: 'demo-session',
      });

      const canonical = getFrameCanonicalString(frame);
      const computed = calculateCRC32(canonical);

      expect(computed).toBe(frame.checksum);
      expect(verifyChecksum(canonical, frame.checksum)).toBe(true);
    });

    it('detects a single bit-flip corruption in the payload (avalanche effect)', () => {
      const pristineFrame = createDataFrame({
        seqNum: 0,
        payload: 'AlphaBravoCharlie',
        sessionId: 'demo-session',
      });

      const pristineCanonical = getFrameCanonicalString(pristineFrame);
      const originalChecksum = pristineFrame.checksum;

      // Invert 1 bit (bit 0) of the first character ('A' = 0x41 -> 0x40 = '@')
      const firstCharCode = pristineFrame.payload.charCodeAt(0);
      const flippedChar = String.fromCharCode(firstCharCode ^ 1);
      const corruptedPayload = flippedChar + pristineFrame.payload.slice(1);

      const corruptedFrame = {
        ...pristineFrame,
        payload: corruptedPayload,
      };

      const corruptedCanonical = getFrameCanonicalString(corruptedFrame);
      const recalculatedChecksum = calculateCRC32(corruptedCanonical);

      // Verify that checksum changed drastically and no longer matches header checksum
      expect(recalculatedChecksum).not.toBe(originalChecksum);
      expect(verifyChecksum(corruptedCanonical, originalChecksum)).toBe(false);
    });

    it('detects bit corruption across header fields (SeqNum manipulation)', () => {
      const pristineFrame = createDataFrame({
        seqNum: 5,
        payload: 'Payload Data',
      });

      // Tampered sequence number
      const tamperedFrame = {
        ...pristineFrame,
        seqNum: 4,
      };

      const canonical = getFrameCanonicalString(tamperedFrame);
      const recalculated = calculateCRC32(canonical);

      expect(recalculated).not.toBe(pristineFrame.checksum);
      expect(verifyChecksum(canonical, pristineFrame.checksum)).toBe(false);
    });
  });

  describe('3. Layer Encapsulation Flow Steps', () => {
    it('simulates complete encapsulation at sender and decapsulation at receiver', () => {
      // 1. Application Layer: User generates payload
      const appPayload = 'User-Message-Data';

      // 2. Data-Link Layer: Encapsulates into frame with sequence number and CRC32
      const seqNum = 1;
      const dataLinkFrame = createDataFrame({
        seqNum,
        payload: appPayload,
        sessionId: 'session-xyz',
      });

      expect(dataLinkFrame.checksum).toBe(computeFrameChecksum(dataLinkFrame));

      // 3. Physical Layer: Serializes for wire transmission
      const wireString = JSON.stringify(dataLinkFrame);
      expect(wireString.length).toBeGreaterThan(appPayload.length);

      // 4. Receiver Physical Layer: Ingests wire representation
      const receivedFrame = JSON.parse(wireString);

      // 5. Receiver Data-Link Layer: Recalculates CRC32 before state transitions
      const receivedCanonical = getFrameCanonicalString(receivedFrame);
      const isIntegrityValid = verifyChecksum(receivedCanonical, receivedFrame.checksum);
      expect(isIntegrityValid).toBe(true);

      // 6. Receiver Application Layer: Strips headers and delivers original payload
      const deliveredPayload = receivedFrame.payload;
      expect(deliveredPayload).toBe(appPayload);
    });
  });
});

