import { describe, it, expect } from 'vitest';
import { compareProtocols, SimulationConfig } from '@agent';

describe('Multi-Protocol Comparative Benchmark Tests', () => {
  const baseConfig: SimulationConfig = {
    protocol: 'go-back-n',
    mode: 'AUTOMATIC',
    payloads: ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9'],
    windowSize: 4,
    seqNumberSpace: 8,
    seed: 42,
    oneWayDelayMs: 40,
    frameLossRate: 0.1,
    ackLossRate: 0.05,
    timeoutMs: 300,
    maxRetries: 5,
    tickStepMs: 15,
  };

  it('runs head-to-head benchmark across all three ARQ protocols', () => {
    const report = compareProtocols(baseConfig);

    expect(report.results).toHaveLength(3);
    const protocols = report.results.map((r) => r.protocol);
    expect(protocols).toContain('stop-and-wait');
    expect(protocols).toContain('go-back-n');
    expect(protocols).toContain('selective-repeat');

    // All should complete delivering all 10 payloads
    for (const item of report.results) {
      expect(item.status).toBe('COMPLETED');
      expect(item.payloadsDelivered).toBe(10);
      expect(item.throughputPayloadsPerSec).toBeGreaterThan(0);
      expect(item.empiricalEfficiencyPercent).toBeGreaterThan(0);
      expect(item.durationMs).toBeGreaterThan(0);
    }
  });

  it('guarantees deterministic PRNG reproducibility with identical seeds', () => {
    const report1 = compareProtocols(baseConfig);
    const report2 = compareProtocols(baseConfig);

    for (let i = 0; i < 3; i++) {
      expect(report1.results[i].durationMs).toBe(report2.results[i].durationMs);
      expect(report1.results[i].originalFramesSent).toBe(report2.results[i].originalFramesSent);
      expect(report1.results[i].retransmissions).toBe(report2.results[i].retransmissions);
      expect(report1.results[i].empiricalEfficiencyPercent).toBe(report2.results[i].empiricalEfficiencyPercent);
    }
  });

  it('proves pipelined window speedup over Stop-and-Wait on high-latency links', () => {
    const highDelayConfig: SimulationConfig = {
      ...baseConfig,
      oneWayDelayMs: 80, // 160ms RTT
      frameLossRate: 0,
      ackLossRate: 0,
    };

    const report = compareProtocols(highDelayConfig);
    const saw = report.results.find((r) => r.protocol === 'stop-and-wait')!;
    const gbn = report.results.find((r) => r.protocol === 'go-back-n')!;
    const sr = report.results.find((r) => r.protocol === 'selective-repeat')!;

    // Pipelining window N=4 delivers frames in significantly less virtual time than N=1
    expect(gbn.durationMs).toBeLessThan(saw.durationMs);
    expect(sr.durationMs).toBeLessThan(saw.durationMs);
    expect(gbn.throughputPayloadsPerSec).toBeGreaterThan(saw.throughputPayloadsPerSec);
  });

  it('demonstrates Selective Repeat efficiency advantage under packet loss', () => {
    const lossyConfig: SimulationConfig = {
      ...baseConfig,
      payloads: Array.from({ length: 20 }, (_, i) => `Msg-${i}`),
      frameLossRate: 0.2, // 20% loss
      ackLossRate: 0,
    };

    const report = compareProtocols(lossyConfig);
    const gbn = report.results.find((r) => r.protocol === 'go-back-n')!;
    const sr = report.results.find((r) => r.protocol === 'selective-repeat')!;

    // GBN bulk rewind retransmits more or equal frames than selective repeat
    expect(gbn.retransmissions).toBeGreaterThanOrEqual(sr.retransmissions);
    expect(report.keyInsights.length).toBeGreaterThan(0);
  });
});

