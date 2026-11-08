import { describe, it, expect } from 'vitest';
import {
  SimulationEngine,
  SimulationConfig,
  VirtualChannel,
} from '../src/index.js';

describe('Manual Channel Control & Intervention Tests', () => {
  const baseManualConfig: SimulationConfig = {
    protocol: 'stop-and-wait',
    mode: 'MANUAL',
    payloads: ['Payload Alpha', 'Payload Beta', 'Payload Gamma'],
    windowSize: 1,
    seqNumberSpace: 2,
    seed: 42,
    oneWayDelayMs: 60,
    frameLossRate: 0,
    ackLossRate: 0,
    timeoutMs: 300,
    maxRetries: 3,
    tickStepMs: 15,
  };

  it('1. Switching between AUTOMATIC and MANUAL modes', () => {
    // Default mode is AUTOMATIC
    const autoEngine = new SimulationEngine({
      ...baseManualConfig,
      mode: undefined,
    });
    expect(autoEngine.getMode()).toBe('AUTOMATIC');

    // Configured MANUAL mode
    const manualEngine = new SimulationEngine(baseManualConfig);
    expect(manualEngine.getMode()).toBe('MANUAL');

    // Dynamically toggle mode
    manualEngine.setMode('AUTOMATIC');
    expect(manualEngine.getMode()).toBe('AUTOMATIC');
    manualEngine.setMode('MANUAL');
    expect(manualEngine.getMode()).toBe('MANUAL');

    // VirtualChannel standalone mode toggle
    const channel = new VirtualChannel({
      oneWayDelayMs: 50,
      frameLossRate: 0,
      ackLossRate: 0,
      seed: 123,
      mode: 'MANUAL',
    });
    expect(channel.getMode()).toBe('MANUAL');
    channel.setMode('AUTOMATIC');
    expect(channel.getMode()).toBe('AUTOMATIC');
  });

  it('2. In-flight packet tracking with stable deterministic IDs and properties', () => {
    const engine = new SimulationEngine(baseManualConfig);
    engine.start();

    const inFlight = engine.getInFlightPackets();
    expect(inFlight).toHaveLength(1);

    const pkt = inFlight[0];
    expect(pkt.id).toMatch(/^pkt-data-0-ts0-\d+$/);
    expect(pkt.type).toBe('DATA');
    expect(pkt.status).toBe('IN_FLIGHT');
    expect(pkt.source).toBe('SENDER');
    expect(pkt.dispatchTimeMs).toBe(0);
    expect(pkt.scheduledDeliveryTimeMs).toBe(60);
    expect(pkt.frame.seqNum).toBe(0);
    expect(pkt.frame.payload).toBe('Payload Alpha');
    expect(pkt.isDropped).toBe(false);
  });

  it('3. manualDeliver() delivering a DATA frame to the receiver, verifying state transitions and ACK emission', () => {
    const engine = new SimulationEngine(baseManualConfig);
    engine.start();

    const inFlightData = engine.getInFlightPackets();
    expect(inFlightData).toHaveLength(1);
    const dataPkt = inFlightData[0];

    // Receiver has not received it yet
    expect(engine.getDeliveredPayloads()).toHaveLength(0);

    // Manually deliver the DATA packet
    const delivered = engine.manualDeliver(dataPkt.id);
    expect(delivered).toBe(true);

    // Receiver state must update immediately
    const deliveredPayloads = engine.getDeliveredPayloads();
    expect(deliveredPayloads).toHaveLength(1);
    expect(deliveredPayloads[0]).toBe('Payload Alpha');

    // Receiver must have emitted an ACK frame into the channel
    const currentInFlight = engine.getInFlightPackets();
    expect(currentInFlight).toHaveLength(1);
    const ackPkt = currentInFlight[0];
    expect(ackPkt.type).toBe('ACK');
    expect(ackPkt.source).toBe('RECEIVER');
    expect(ackPkt.frame.ackNum).toBe(0);
    expect(ackPkt.id).toMatch(/^pkt-ack-0-ts0-\d+$/);

    // Verify canonical events recorded
    const events = engine.getEvents();
    expect(events.some((e) => e.type === 'FRAME_DELIVERED')).toBe(true);
    expect(events.some((e) => e.type === 'PACKET_DELIVERED')).toBe(true);
    expect(events.some((e) => e.type === 'ACK_TRANSMITTED')).toBe(true);
  });

  it('4. manualDrop() dropping a DATA frame, verifying that receiver never receives it and sender timer continues', () => {
    const engine = new SimulationEngine(baseManualConfig);
    engine.start();

    const inFlightData = engine.getInFlightPackets();
    expect(inFlightData).toHaveLength(1);
    const dataPkt = inFlightData[0];

    // Deliberately drop the DATA frame
    const dropped = engine.manualDrop(dataPkt.id);
    expect(dropped).toBe(true);

    // Channel must now be empty
    expect(engine.getInFlightPackets()).toHaveLength(0);

    // Advance virtual clock by 100ms
    engine.step(100);

    // Receiver must strictly NOT have received any payload
    expect(engine.getDeliveredPayloads()).toHaveLength(0);

    // Sender state must still be awaiting ACK for frame 0
    const state = engine.getState();
    expect(state.senderWindow.base).toBe(0);

    // Events must reflect the drop
    const events = engine.getEvents();
    expect(events.some((e) => e.type === 'FRAME_DROPPED')).toBe(true);
    expect(events.some((e) => e.type === 'PACKET_DROPPED')).toBe(true);
  });

  it('5. manualDrop() dropping an ACK frame, verifying receiver delivered it but sender remains unacknowledged', () => {
    const engine = new SimulationEngine(baseManualConfig);
    engine.start();

    // 1. Deliver DATA frame 0
    const dataPkt = engine.getInFlightPackets()[0];
    engine.manualDeliver(dataPkt.id);

    // Receiver accepted payload 0
    expect(engine.getDeliveredPayloads()).toEqual(['Payload Alpha']);

    // ACK is now in-flight
    const ackPkt = engine.getInFlightPackets().find((p) => p.type === 'ACK')!;
    expect(ackPkt).toBeDefined();

    // 2. Deliberately drop the ACK
    const dropped = engine.manualDrop(ackPkt.id);
    expect(dropped).toBe(true);
    expect(engine.getInFlightPackets()).toHaveLength(0);

    // Advance virtual clock
    engine.step(100);

    // Receiver still has the payload
    expect(engine.getDeliveredPayloads()).toEqual(['Payload Alpha']);

    // BUT sender window did NOT advance because ACK was lost
    const state = engine.getState();
    expect(state.senderWindow.base).toBe(0); // Still 0, awaiting ACK
    expect(state.remainingPayloads).toBe(2); // 'Payload Beta' not yet sent because Stop-and-Wait is blocked
  });

  it('6. manualDelay() postponing delivery time', () => {
    const engine = new SimulationEngine(baseManualConfig);
    engine.start();

    const dataPkt = engine.getInFlightPackets()[0];
    const originalDeliveryTime = dataPkt.scheduledDeliveryTimeMs;

    // Delay by 200ms
    const delayed = engine.manualDelay(dataPkt.id, 200);
    expect(delayed).toBe(true);

    const updatedPkt = engine.getInFlightPackets().find((p) => p.id === dataPkt.id)!;
    expect(updatedPkt.status).toBe('DELAYED');
    expect(updatedPkt.scheduledDeliveryTimeMs).toBe(originalDeliveryTime + 200);

    // Delaying with invalid values should fail
    expect(engine.manualDelay(dataPkt.id, 0)).toBe(false);
    expect(engine.manualDelay(dataPkt.id, -50)).toBe(false);
  });

  it('7. manualTriggerTimeout() properly triggers handleTimeout() across all three protocols', () => {
    // A. Stop-and-Wait
    const sawEngine = new SimulationEngine({
      ...baseManualConfig,
      protocol: 'stop-and-wait',
    });
    sawEngine.start();
    expect(sawEngine.getInFlightPackets()).toHaveLength(1);

    // Trigger timeout manually
    const sawTimeoutSuccess = sawEngine.manualTriggerTimeout();
    expect(sawTimeoutSuccess).toBe(true);

    // Retransmission must now be in flight
    const sawEvents = sawEngine.getEvents();
    expect(sawEvents.some((e) => e.type === 'TIMEOUT' && e.details.isManual === true)).toBe(true);
    expect(sawEvents.some((e) => e.type === 'RETRANSMISSION')).toBe(true);
    expect(sawEngine.getInFlightPackets().length).toBeGreaterThanOrEqual(1);

    // B. Go-Back-N (retransmits window from base)
    const gbnEngine = new SimulationEngine({
      ...baseManualConfig,
      protocol: 'go-back-n',
      windowSize: 3,
      seqNumberSpace: 8,
      payloads: ['P0', 'P1', 'P2', 'P3'],
    });
    gbnEngine.start();
    // 3 frames transmitted initially up to windowSize 3
    expect(gbnEngine.getInFlightPackets()).toHaveLength(3);

    const gbnTimeoutSuccess = gbnEngine.manualTriggerTimeout();
    expect(gbnTimeoutSuccess).toBe(true);

    const gbnEvents = gbnEngine.getEvents();
    expect(gbnEvents.some((e) => e.type === 'TIMEOUT' && e.details.isManual === true)).toBe(true);
    expect(gbnEvents.some((e) => e.type === 'RETRANSMISSION')).toBe(true);

    // C. Selective Repeat (targets specific sequence number or oldest)
    const srEngine = new SimulationEngine({
      ...baseManualConfig,
      protocol: 'selective-repeat',
      windowSize: 4,
      seqNumberSpace: 8,
      payloads: ['SR-0', 'SR-1', 'SR-2', 'SR-3'],
    });
    srEngine.start();
    expect(srEngine.getInFlightPackets()).toHaveLength(4);

    // Trigger timeout for specific sequence number 2
    const srTimeoutSuccess = srEngine.manualTriggerTimeout(2);
    expect(srTimeoutSuccess).toBe(true);

    const srEvents = srEngine.getEvents();
    const timeoutEvt = srEvents.find((e) => e.type === 'TIMEOUT' && e.details.isManual === true);
    expect(timeoutEvt).toBeDefined();
    expect(timeoutEvt?.details.targetSeqNum).toBe(2);

    const retransEvt = srEvents.find((e) => e.type === 'RETRANSMISSION' && e.details.seqNum === 2);
    expect(retransEvt).toBeDefined();
  });

  it('8. Edge cases: non-existent packet IDs and uneligible timeouts', () => {
    const engine = new SimulationEngine(baseManualConfig);

    // Delivering/dropping non-existent IDs before start
    expect(engine.manualDeliver('non-existent-id')).toBe(false);
    expect(engine.manualDrop('non-existent-id')).toBe(false);
    expect(engine.manualDelay('non-existent-id', 100)).toBe(false);

    // Triggering timeout before simulation started (no outstanding frames)
    expect(engine.manualTriggerTimeout()).toBe(false);

    // Start simulation
    engine.start();

    // Still fails on bogus ID
    expect(engine.manualDeliver('bogus-pkt-999')).toBe(false);
    expect(engine.manualDrop('bogus-pkt-999')).toBe(false);
    expect(engine.manualDelay('bogus-pkt-999', 50)).toBe(false);

    // For Selective Repeat: triggering timeout for sequence number that does NOT exist
    const srEngine = new SimulationEngine({
      ...baseManualConfig,
      protocol: 'selective-repeat',
      windowSize: 4,
      seqNumberSpace: 8,
      payloads: ['P0', 'P1'],
    });
    srEngine.start();
    // Frame 7 is not outstanding (only 0 and 1 were sent)
    expect(srEngine.manualTriggerTimeout(7)).toBe(false);
  });
});

