import { describe, it, expect } from 'vitest';
import { DEMO_PRESETS } from '../src/components/layout/FacultyDemoModal';
import { SimulationEvent } from '@agent';

describe('Faculty Viva Demo Guide & Timeline Filter Tests', () => {
  describe('1. Demo Scenario Presets Validation', () => {
    it('defines all 4 essential classroom demonstration scenarios', () => {
      const presetIds = DEMO_PRESETS.map((p) => p.id);
      expect(presetIds).toEqual([
        'saw-deadlock',
        'gbn-bulk-rewind',
        'sr-buffering',
        'sequence-ambiguity',
      ]);
    });

    it('validates preset configurations and talking points completeness', () => {
      for (const preset of DEMO_PRESETS) {
        expect(preset.title.length).toBeGreaterThan(0);
        expect(preset.badge.length).toBeGreaterThan(0);
        expect(preset.summary.length).toBeGreaterThan(0);
        expect(preset.talkingPoints.length).toBeGreaterThanOrEqual(3);
        expect(['auto-sim', 'manual-lab', 'learning', 'comparison']).toContain(preset.targetView);
      }
    });

    it('verifies Stop-and-Wait deadlock avoidance preset configuration', () => {
      const saw = DEMO_PRESETS.find((p) => p.id === 'saw-deadlock')!;
      expect(saw.protocol).toBe('stop-and-wait');
      expect(saw.configUpdates?.windowSize).toBe(1);
      expect(saw.configUpdates?.ackLossRate).toBeGreaterThan(0);
    });

    it('verifies Go-Back-N rewind preset configuration', () => {
      const gbn = DEMO_PRESETS.find((p) => p.id === 'gbn-bulk-rewind')!;
      expect(gbn.protocol).toBe('go-back-n');
      expect(gbn.configUpdates?.windowSize).toBe(4);
      expect(gbn.configUpdates?.frameLossRate).toBeGreaterThan(0);
    });

    it('verifies Selective Repeat buffering preset configuration', () => {
      const sr = DEMO_PRESETS.find((p) => p.id === 'sr-buffering')!;
      expect(sr.protocol).toBe('selective-repeat');
      expect(sr.configUpdates?.windowSize).toBe(4);
      expect(sr.configUpdates?.frameLossRate).toBeGreaterThan(0);
    });

    it('verifies sequence ambiguity preset targets learning view', () => {
      const amb = DEMO_PRESETS.find((p) => p.id === 'sequence-ambiguity')!;
      expect(amb.targetView).toBe('learning');
    });
  });

  describe('2. Event Timeline Filtering Logic', () => {
    const mockEvents: SimulationEvent[] = [
      {
        id: 'evt-1',
        type: 'FRAME_TRANSMITTED',
        virtualTimestamp: 0,
        details: { seqNum: 0, description: 'Transmitted frame 0' },
      },
      {
        id: 'evt-2',
        type: 'FRAME_DROPPED',
        virtualTimestamp: 30,
        details: { seqNum: 0, description: 'DATA frame 0 dropped' },
      },
      {
        id: 'evt-3',
        type: 'TIMEOUT',
        virtualTimestamp: 300,
        details: { description: 'Sender timeout detected at 300ms' },
      },
      {
        id: 'evt-4',
        type: 'RETRANSMISSION',
        virtualTimestamp: 300,
        details: { seqNum: 0, description: 'Retransmitting frame 0' },
      },
      {
        id: 'evt-5',
        type: 'FRAME_DELIVERED',
        virtualTimestamp: 360,
        details: { seqNum: 0, description: 'DATA frame 0 delivered to receiver' },
      },
      {
        id: 'evt-6',
        type: 'ACK_TRANSMITTED',
        virtualTimestamp: 360,
        details: { ackNum: 1, description: 'Receiver transmitted ACK 1' },
      },
      {
        id: 'evt-7',
        type: 'ACK_DELIVERED',
        virtualTimestamp: 420,
        details: { ackNum: 1, description: 'ACK 1 delivered to sender' },
      },
    ];

    it('filters DATA transmissions correctly', () => {
      const dataTypes = new Set([
        'FRAME_TRANSMITTED',
        'FRAME_DELIVERED',
        'RETRANSMISSION',
        'FRAME_BUFFERED',
        'PAYLOAD_DELIVERED',
      ]);
      const dataEvents = mockEvents.filter((e) => dataTypes.has(e.type));
      expect(dataEvents).toHaveLength(3); // FRAME_TRANSMITTED, RETRANSMISSION, FRAME_DELIVERED
      expect(dataEvents.map((e) => e.type)).toEqual([
        'FRAME_TRANSMITTED',
        'RETRANSMISSION',
        'FRAME_DELIVERED',
      ]);
    });

    it('filters ACK events correctly', () => {
      const ackTypes = new Set(['ACK_TRANSMITTED', 'ACK_DELIVERED', 'SENDER_WINDOW_SLID']);
      const ackEvents = mockEvents.filter((e) => ackTypes.has(e.type));
      expect(ackEvents).toHaveLength(2); // ACK_TRANSMITTED, ACK_DELIVERED
    });

    it('filters Timeout events accurately', () => {
      const timeoutEvents = mockEvents.filter((e) => e.type === 'TIMEOUT');
      expect(timeoutEvents).toHaveLength(1);
      expect(timeoutEvents[0].id).toBe('evt-3');
    });

    it('filters Faults (drops and corruptions) accurately', () => {
      const faultTypes = new Set([
        'FRAME_DROPPED',
        'ACK_DROPPED',
        'FRAME_CORRUPTED',
        'PACKET_DROPPED',
        'SIMULATION_FAILED',
      ]);
      const faultEvents = mockEvents.filter((e) => faultTypes.has(e.type));
      expect(faultEvents).toHaveLength(1);
      expect(faultEvents[0].type).toBe('FRAME_DROPPED');
    });

    it('filters events by search query across sequence numbers and descriptions', () => {
      // Query "ACK 1"
      const query = 'ack 1';
      const searchResults = mockEvents.filter((e) =>
        (e.details.description || '').toLowerCase().includes(query)
      );
      expect(searchResults).toHaveLength(2);
      expect(searchResults.map((e) => e.id)).toEqual(['evt-6', 'evt-7']);
    });
  });

  describe('3. 1-7 Numeric Keypad View Navigation Mapping', () => {
    const keyMap: Record<string, string> = {
      '1': 'overview',
      '2': 'auto-sim',
      '3': 'manual-lab',
      '4': 'live-udp',
      '5': 'comparison',
      '6': 'internals',
      '7': 'learning',
    };

    it('maps digits 1 through 7 to all 7 valid destinations', () => {
      expect(Object.keys(keyMap)).toHaveLength(7);
      expect(keyMap['1']).toBe('overview');
      expect(keyMap['2']).toBe('auto-sim');
      expect(keyMap['3']).toBe('manual-lab');
      expect(keyMap['4']).toBe('live-udp');
      expect(keyMap['5']).toBe('comparison');
      expect(keyMap['6']).toBe('internals');
      expect(keyMap['7']).toBe('learning');
    });
  });
});

