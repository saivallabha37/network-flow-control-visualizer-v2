import { describe, it, expect } from 'vitest';
import { createDefaultManualConfig } from '../src/hooks/useManualLab';
import { SimulationEngine } from '@agent';

describe('Manual Interactive Lab - Engine & Protocol Invariants', () => {
  it('creates correct manual configurations for all ARQ protocols', () => {
    const swConfig = createDefaultManualConfig('stop-and-wait');
    expect(swConfig.mode).toBe('MANUAL');
    expect(swConfig.protocol).toBe('stop-and-wait');
    expect(swConfig.windowSize).toBe(1);
    expect(swConfig.seqNumberSpace).toBe(2);
    expect(swConfig.frameLossRate).toBe(0);
    expect(swConfig.ackLossRate).toBe(0);

    const gbnConfig = createDefaultManualConfig('go-back-n');
    expect(gbnConfig.mode).toBe('MANUAL');
    expect(gbnConfig.protocol).toBe('go-back-n');
    expect(gbnConfig.windowSize).toBe(4);
    expect(gbnConfig.seqNumberSpace).toBe(8);

    const srConfig = createDefaultManualConfig('selective-repeat');
    expect(srConfig.mode).toBe('MANUAL');
    expect(srConfig.protocol).toBe('selective-repeat');
    expect(srConfig.windowSize).toBe(4);
    expect(srConfig.seqNumberSpace).toBe(8);
  });

  it('allows single-frame manual transmission and state inspection', () => {
    const config = createDefaultManualConfig('go-back-n');
    const engine = new SimulationEngine(config);

    expect(engine.getStatus()).toBe('READY');
    expect(engine.getInFlightPackets()).toHaveLength(0);

    // Send first frame manually
    const sent = engine.manualSendNextPayload();
    expect(sent).toBe(true);
    expect(engine.getStatus()).toBe('RUNNING');

    const inFlight = engine.getInFlightPackets();
    expect(inFlight).toHaveLength(1);
    expect(inFlight[0].type).toBe('DATA');
    expect(inFlight[0].status).toBe('IN_FLIGHT');
    expect(inFlight[0].source).toBe('SENDER');
    expect((inFlight[0].frame as any).seqNum).toBe(0);

    // Sender state updated: Sf = 0, Sn = 1
    const state = engine.getState();
    expect(state.senderWindow.base).toBe(0);
    expect(state.senderWindow.nextSeqNum).toBe(1);
    expect(state.senderWindow.bufferSize).toBe(1);
  });

  it('supports manual delay, delivery, and ACK generation', () => {
    const config = createDefaultManualConfig('go-back-n');
    const engine = new SimulationEngine(config);

    engine.manualSendNextPayload();
    const dataPkt = engine.getInFlightPackets()[0];
    const originalDeliveryTime = dataPkt.scheduledDeliveryTimeMs;

    // Delay packet by 250ms
    const delayed = engine.manualDelay(dataPkt.id, 250);
    expect(delayed).toBe(true);
    expect(dataPkt.scheduledDeliveryTimeMs).toBe(originalDeliveryTime + 250);

    // Deliver DATA packet to receiver
    const delivered = engine.manualDeliver(dataPkt.id);
    expect(delivered).toBe(true);

    // Receiver should have accepted frame 0 and generated an ACK 0
    const postDeliveryInFlight = engine.getInFlightPackets();
    expect(postDeliveryInFlight).toHaveLength(1);
    expect(postDeliveryInFlight[0].type).toBe('ACK');
    expect(postDeliveryInFlight[0].source).toBe('RECEIVER');
    expect((postDeliveryInFlight[0].frame as any).ackNum).toBe(0);

    // Deliver ACK to sender
    const ackPkt = postDeliveryInFlight[0];
    const ackDelivered = engine.manualDeliver(ackPkt.id);
    expect(ackDelivered).toBe(true);

    // Sender window should advance: Sf = 1
    const finalState = engine.getState();
    expect(finalState.senderWindow.base).toBe(1);
    expect(finalState.senderWindow.bufferSize).toBe(0);
    expect(engine.getInFlightPackets()).toHaveLength(0);
  });

  it('supports manual packet drop and manual timeout retransmission in Go-Back-N', () => {
    const config = createDefaultManualConfig('go-back-n');
    const engine = new SimulationEngine(config);

    engine.manualSendNextPayload(); // Frame 0
    const frame0 = engine.getInFlightPackets()[0];

    // Deliberately drop frame 0
    const dropped = engine.manualDrop(frame0.id);
    expect(dropped).toBe(true);
    expect(engine.getInFlightPackets()).toHaveLength(0);

    // Verify dropped event was recorded
    const dropEvent = engine.getEvents().find((e) => e.type === 'PACKET_DROPPED');
    expect(dropEvent).toBeDefined();

    // Trigger manual timeout
    const timeoutHandled = engine.manualTriggerTimeout();
    expect(timeoutHandled).toBe(true);

    // Frame 0 should be retransmitted and back in flight
    const inFlightAfterTimeout = engine.getInFlightPackets();
    expect(inFlightAfterTimeout).toHaveLength(1);
    expect(inFlightAfterTimeout[0].type).toBe('DATA');
    expect((inFlightAfterTimeout[0].frame as any).seqNum).toBe(0);
  });

  it('supports manual packet drop and selective retransmission in Selective Repeat', () => {
    const config = createDefaultManualConfig('selective-repeat');
    const engine = new SimulationEngine(config);

    // Send Frame 0 and Frame 1
    engine.manualSendNextPayload();
    engine.manualSendNextPayload();
    expect(engine.getInFlightPackets()).toHaveLength(2);

    const [f0, f1] = engine.getInFlightPackets();

    // Drop Frame 0, deliver Frame 1
    engine.manualDrop(f0.id);
    engine.manualDeliver(f1.id);

    // Receiver should buffer Frame 1 out-of-order and send ACK
    const inFlight = engine.getInFlightPackets();
    expect(inFlight).toHaveLength(1);
    expect(inFlight[0].type).toBe('ACK');

    // Trigger timeout specifically for lost Frame 0
    const timeoutHandled = engine.manualTriggerTimeout(0);
    expect(timeoutHandled).toBe(true);

    // Verify Frame 0 retransmitted into channel
    const retransmitted = engine.getInFlightPackets().find(
      (p) => p.type === 'DATA' && (p.frame as any).seqNum === 0
    );
    expect(retransmitted).toBeDefined();
  });

  it('enforces sender window capacity limits in Stop-and-Wait', () => {
    const config = createDefaultManualConfig('stop-and-wait');
    const engine = new SimulationEngine(config);

    // Send first frame (window capacity = 1)
    const sent1 = engine.manualSendNextPayload();
    expect(sent1).toBe(true);

    // Attempting to send a second frame before ACK should fail cleanly without mutating state
    const sent2 = engine.manualSendNextPayload();
    expect(sent2).toBe(false);

    expect(engine.getInFlightPackets()).toHaveLength(1);
    expect(engine.getState().senderWindow.bufferSize).toBe(1);
  });
});
