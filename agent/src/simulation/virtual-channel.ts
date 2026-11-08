import { Frame } from '../types/protocol.js';

export type SimulationMode = 'AUTOMATIC' | 'MANUAL';
export type PacketDisposition = 'IN_FLIGHT' | 'DELIVERED' | 'DROPPED' | 'DELAYED';

/**
 * 32-bit deterministic Mulberry32 Pseudo-Random Number Generator.
 * Produces an identical sequence of floats in [0, 1) given the same integer seed.
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

export interface InFlightPacket {
  id: string;
  type: 'DATA' | 'ACK';
  frame: Frame;
  status: PacketDisposition;
  dispatchTimeMs: number;
  scheduledDeliveryTimeMs: number;
  departureTime: number; // backward compatibility
  scheduledDeliveryTime: number; // backward compatibility
  source: 'SENDER' | 'RECEIVER';
  isDropped: boolean;
  isCorrupted: boolean;
}

export class VirtualChannel {
  private inFlight: InFlightPacket[] = [];
  private packetCounter: number = 0;
  private mode: SimulationMode = 'AUTOMATIC';
  private readonly oneWayDelayMs: number;
  private readonly frameLossRate: number;
  private readonly ackLossRate: number;
  private readonly corruptionRate: number;
  private readonly prng: SeededRandom;
  private deliveryHandler?: (packet: InFlightPacket) => void;

  constructor(options: {
    oneWayDelayMs: number;
    frameLossRate: number;
    ackLossRate: number;
    corruptionRate?: number;
    seed: number;
    mode?: SimulationMode;
  }) {
    this.oneWayDelayMs = options.oneWayDelayMs;
    this.frameLossRate = options.frameLossRate;
    this.ackLossRate = options.ackLossRate;
    this.corruptionRate = options.corruptionRate ?? 0;
    this.prng = new SeededRandom(options.seed);
    this.mode = options.mode ?? 'AUTOMATIC';
  }

  public getMode(): SimulationMode {
    return this.mode;
  }

  public setMode(mode: SimulationMode): void {
    this.mode = mode;
  }

  public setDeliveryHandler(handler?: (packet: InFlightPacket) => void): void {
    this.deliveryHandler = handler;
  }

  /**
   * Transmits a DATA frame through the virtual channel.
   * Clones the frame to prevent mutable reference sharing across endpoints.
   */
  public transmitData(frame: Frame, departureTime: number): InFlightPacket {
    this.packetCounter += 1;
    const isManual = this.mode === 'MANUAL';
    // In manual mode, packets do NOT automatically get dropped or corrupted by PRNG unless explicitly configured
    const isDropped = !isManual && this.prng.next() < this.frameLossRate;
    const isCorrupted = !isManual && !isDropped && this.prng.next() < this.corruptionRate;

    // Deep clone to ensure memory isolation between virtual sender and receiver
    const clonedFrame: Frame = { ...frame };
    if (isCorrupted) {
      // Invert checksum bits to simulate transmission corruption
      clonedFrame.checksum = (clonedFrame.checksum ^ 0xffffffff) >>> 0;
    }

    const scheduledTime = departureTime + this.oneWayDelayMs;
    const packetId = `pkt-data-${frame.seqNum}-ts${departureTime}-${this.packetCounter}`;

    const packet: InFlightPacket = {
      id: packetId,
      type: 'DATA',
      frame: clonedFrame,
      status: isDropped ? 'DROPPED' : 'IN_FLIGHT',
      dispatchTimeMs: departureTime,
      scheduledDeliveryTimeMs: scheduledTime,
      departureTime,
      scheduledDeliveryTime: scheduledTime,
      source: 'SENDER',
      isDropped,
      isCorrupted,
    };

    this.insertSorted(packet);
    return packet;
  }

  /**
   * Transmits an ACK frame through the virtual channel.
   */
  public transmitAck(ackFrame: Frame, departureTime: number): InFlightPacket {
    this.packetCounter += 1;
    const isManual = this.mode === 'MANUAL';
    const isDropped = !isManual && this.prng.next() < this.ackLossRate;
    const isCorrupted = !isManual && !isDropped && this.prng.next() < this.corruptionRate;

    const clonedFrame: Frame = { ...ackFrame };
    if (isCorrupted) {
      clonedFrame.checksum = (clonedFrame.checksum ^ 0xffffffff) >>> 0;
    }

    const scheduledTime = departureTime + this.oneWayDelayMs;
    const packetId = `pkt-ack-${ackFrame.ackNum ?? 0}-ts${departureTime}-${this.packetCounter}`;

    const packet: InFlightPacket = {
      id: packetId,
      type: 'ACK',
      frame: clonedFrame,
      status: isDropped ? 'DROPPED' : 'IN_FLIGHT',
      dispatchTimeMs: departureTime,
      scheduledDeliveryTimeMs: scheduledTime,
      departureTime,
      scheduledDeliveryTime: scheduledTime,
      source: 'RECEIVER',
      isDropped,
      isCorrupted,
    };

    this.insertSorted(packet);
    return packet;
  }

  /**
   * Retrieves and removes all packets whose scheduled delivery time has arrived.
   * In AUTOMATIC mode: returns all packets whose scheduledDeliveryTime <= currentTime.
   * In MANUAL mode: held packets remain in the channel waiting for manual action unless delivered.
   */
  public getDeliverablePackets(currentTime: number): InFlightPacket[] {
    if (this.mode === 'MANUAL') {
      return [];
    }
    const deliverable: InFlightPacket[] = [];
    while (this.inFlight.length > 0 && this.inFlight[0].scheduledDeliveryTime <= currentTime) {
      deliverable.push(this.inFlight.shift()!);
    }
    return deliverable;
  }

  public peekNextDeliveryTime(): number | null {
    return this.inFlight.length > 0 ? this.inFlight[0].scheduledDeliveryTime : null;
  }

  public getInFlightCount(): number {
    return this.inFlight.length;
  }

  public getInFlightPackets(): ReadonlyArray<InFlightPacket> {
    return [...this.inFlight];
  }

  public getPacket(packetId: string): InFlightPacket | undefined {
    return this.inFlight.find((p) => p.id === packetId);
  }

  /**
   * Forces the immediate delivery of the packet to the recipient's adapter/engine.
   */
  public deliverPacket(packetId: string): boolean {
    const index = this.inFlight.findIndex((p) => p.id === packetId);
    if (index === -1) {
      return false;
    }
    const [packet] = this.inFlight.splice(index, 1);
    packet.status = 'DELIVERED';
    if (this.deliveryHandler) {
      this.deliveryHandler(packet);
    }
    return true;
  }

  /**
   * Marks packet as dropped, removing it from delivery queues.
   */
  public dropPacket(packetId: string): boolean {
    const index = this.inFlight.findIndex((p) => p.id === packetId);
    if (index === -1) {
      return false;
    }
    const [packet] = this.inFlight.splice(index, 1);
    packet.status = 'DROPPED';
    packet.isDropped = true;
    return true;
  }

  /**
   * Extends the packet's scheduledDeliveryTimeMs by additionalMs.
   */
  public delayPacket(packetId: string, additionalMs: number): boolean {
    if (typeof additionalMs !== 'number' || additionalMs <= 0 || !Number.isFinite(additionalMs)) {
      return false;
    }
    const packet = this.inFlight.find((p) => p.id === packetId);
    if (!packet) {
      return false;
    }
    packet.scheduledDeliveryTimeMs += additionalMs;
    packet.scheduledDeliveryTime += additionalMs;
    packet.status = 'DELAYED';
    // Stable sort by scheduledDeliveryTime
    this.inFlight.sort((a, b) => a.scheduledDeliveryTime - b.scheduledDeliveryTime);
    return true;
  }

  public clear(): void {
    this.inFlight = [];
    this.packetCounter = 0;
  }

  private insertSorted(packet: InFlightPacket): void {
    // Binary or linear insertion maintaining stable sort by scheduledDeliveryTime
    let i = this.inFlight.length - 1;
    while (i >= 0 && this.inFlight[i].scheduledDeliveryTime > packet.scheduledDeliveryTime) {
      i--;
    }
    this.inFlight.splice(i + 1, 0, packet);
  }
}
