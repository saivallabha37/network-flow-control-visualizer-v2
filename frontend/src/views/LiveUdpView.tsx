import React, { useState } from 'react';
import { LiveNetworkingPanel } from '../components/LiveNetworkingPanel';

export const LiveUdpView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyCmd = () => {
    navigator.clipboard.writeText('npm run agent:live -- --port 9001 --peer 9002');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full flex flex-col gap-space-lg pb-space-xl">
      {/* ── TOP LIVE CONNECTION BAR (Spatial Levitated Slab) ─────────────── */}
      <section className="w-full">
        <div className="rounded-xl bg-surface-container/60 backdrop-blur-2xl p-space-md shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_1.5px_rgba(255,255,255,0.25)] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-space-md border border-outline-variant/40">
          {/* WS Telemetry & Agent Pill */}
          <div className="flex flex-wrap items-center gap-space-sm">
            <div className="flex items-center gap-space-sm px-space-md py-space-xs rounded-full bg-surface-container-high/90 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary shadow-[0_0_10px_currentColor]" />
              </span>
              <span className="font-mono text-body-sm text-secondary font-semibold tracking-tight">ws://127.0.0.1:8080</span>
              <span className="px-space-xs py-0.5 rounded-full bg-secondary/15 text-secondary text-label-caps font-label-caps uppercase">
                OS Socket Bridge Active
              </span>
            </div>

            <div className="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container-lowest/80 text-on-surface shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] border border-outline-variant/30">
              <span className="material-symbols-outlined text-[16px] text-primary">terminal</span>
              <code className="font-mono text-body-sm text-primary-fixed select-all">
                npm run agent:live -- --port 9001 --peer 9002
              </code>
              <button
                type="button"
                onClick={handleCopyCmd}
                className="ml-space-xs px-space-sm py-0.5 rounded-full bg-primary-container text-on-primary-container font-label-caps text-label-caps uppercase hover:brightness-110 active:scale-95 transition-all shadow-[0_0_12px_rgba(160,120,255,0.4)] cursor-pointer"
              >
                {copied ? 'COPIED!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Socket Telemetry HUD Tokens */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-xs text-left">
            <div className="px-space-md py-space-xs rounded-full bg-surface-container-low/70 flex flex-col shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)] border border-outline-variant/30">
              <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Local Port</span>
              <span className="font-mono text-body-sm text-on-surface font-semibold">:9001 <span className="text-secondary text-[10px] font-normal">UDP/DGRAM</span></span>
            </div>
            <div className="px-space-md py-space-xs rounded-full bg-surface-container-low/70 flex flex-col shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)] border border-outline-variant/30">
              <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Peer Target</span>
              <span className="font-mono text-body-sm text-on-surface font-semibold">127.0.0.1:9002</span>
            </div>
            <div className="px-space-md py-space-xs rounded-full bg-surface-container-low/70 flex flex-col shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)] border border-outline-variant/30">
              <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Kernel State</span>
              <span className="font-headline-sm text-label-lg text-secondary flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_currentColor]" /> BOUND
              </span>
            </div>
            <div className="px-space-md py-space-xs rounded-full bg-surface-container-low/70 flex flex-col shadow-[inset_0_1px_0.5px_rgba(255,255,255,0.15)] border border-outline-variant/30">
              <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Effective MTU</span>
              <span className="font-mono text-body-sm text-tertiary font-semibold">1472 Bytes</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CENTRAL TWIN PEER MONOLITHS WITH REFRACTIVE DATA PIPE ──────── */}
      <section className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
          {/* Peer A (Local Host Monolith) */}
          <div className="lg:col-span-4 rounded-xl bg-surface-container/70 backdrop-blur-2xl p-space-lg shadow-[0_24px_64px_rgba(0,0,0,0.7),inset_0_1px_1.5px_rgba(255,255,255,0.3)] relative overflow-hidden border border-outline-variant/40">
            <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-primary-container/20 blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between mb-space-md relative z-10">
              <div className="flex items-center gap-space-sm">
                <div className="w-8 h-8 rounded-full bg-primary-container/30 flex items-center justify-center text-primary shadow-[0_0_16px_rgba(160,120,255,0.4)]">
                  <span className="material-symbols-outlined text-[18px]">dns</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Peer Alpha</h3>
                  <p className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Local Host • PID 48211</p>
                </div>
              </div>
              <span className="px-space-sm py-0.5 rounded-full bg-primary-container/20 text-primary text-label-caps font-label-caps font-bold">
                dgram TX/RX
              </span>
            </div>

            {/* Metric Gauges Inside Slab */}
            <div className="space-y-space-sm relative z-10 mb-space-md">
              <div className="p-space-sm rounded-lg bg-surface-container-lowest/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                <div className="flex justify-between items-center text-label-caps text-outline mb-1">
                  <span>TX BUFFER PRESSURE</span>
                  <span className="font-mono text-primary font-bold">128 KB / 2048 KB</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden p-0.5">
                  <div className="h-full rounded-full bg-primary shadow-[0_0_10px_rgba(208,188,255,0.7)] transition-all duration-300" style={{ width: '24%' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-space-xs font-mono text-body-sm">
                <div className="p-space-sm rounded-lg bg-surface-container-high/40">
                  <span className="font-label-caps text-label-caps text-outline block">OUTBOUND BYTES</span>
                  <span className="text-on-surface font-semibold text-headline-sm">1,024,452</span>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-high/40">
                  <span className="font-label-caps text-label-caps text-outline block">SOCK EVENT LOOP</span>
                  <span className="text-secondary font-semibold text-headline-sm">0.24ms</span>
                </div>
              </div>
            </div>

            <div className="p-space-sm rounded-lg bg-surface-container-lowest/80 font-mono text-body-sm text-outline-variant space-y-1">
              <div className="text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                <span>SENDTO(fd: 28, chunk_id: 1042, 1024B)</span>
              </div>
              <div className="text-on-surface-variant text-[11px] truncate">payload_sha: 4a2d89bf003e... -&gt; 127.0.0.1:9002</div>
            </div>
          </div>

          {/* Transmission Conduit & 3-Way Handshake HUD (Center) */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center px-space-xs py-space-md">
            {/* Live Handshake Tokens */}
            <div className="flex items-center gap-space-xs mb-space-md">
              <div className="px-space-md py-1 rounded-full bg-surface-container/80 text-secondary text-label-caps font-label-caps flex items-center gap-1 shadow-[0_0_12px_rgba(123,208,255,0.3)]">
                <span className="material-symbols-outlined text-[14px]">verified</span> SYN
              </div>
              <span className="material-symbols-outlined text-outline-variant text-[16px]">chevron_right</span>
              <div className="px-space-md py-1 rounded-full bg-surface-container/80 text-secondary text-label-caps font-label-caps flex items-center gap-1 shadow-[0_0_12px_rgba(123,208,255,0.3)]">
                <span className="material-symbols-outlined text-[14px]">verified</span> SYN-ACK
              </div>
              <span className="material-symbols-outlined text-outline-variant text-[16px]">chevron_right</span>
              <div className="px-space-md py-1 rounded-full bg-surface-container/80 text-secondary text-label-caps font-label-caps flex items-center gap-1 shadow-[0_0_12px_rgba(123,208,255,0.3)]">
                <span className="material-symbols-outlined text-[14px]">verified</span> ACK
              </div>
            </div>

            {/* Simulated Spatial Optical Pipe with Flying Pulses */}
            <div className="w-full relative h-20 flex items-center justify-center">
              <div className="w-full h-1.5 bg-surface-container-highest rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary animate-pulse opacity-75" />
              </div>
              {/* Flying Packet Orbs */}
              <div className="absolute w-4 h-4 rounded-full bg-secondary shadow-[0_0_16px_rgba(123,208,255,1)] left-1/4 animate-ping" />
              <div className="absolute w-3 h-3 rounded-full bg-primary shadow-[0_0_14px_rgba(208,188,255,1)] left-2/3" />
              {/* Central Jewel Stats Pill Floating Over Conduit */}
              <div className="absolute px-space-md py-space-xs rounded-full bg-surface-container-highest/90 backdrop-blur-xl shadow-[0_12px_32px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.3)] text-center border border-outline-variant/40">
                <div className="flex items-center gap-space-sm text-body-sm font-mono">
                  <span className="text-on-surface">TX: <strong className="text-secondary">412</strong> pkts</span>
                  <span className="w-1 h-1 rounded-full bg-outline" />
                  <span className="text-on-surface">RX: <strong className="text-primary">409</strong> pkts</span>
                  <span className="w-1 h-1 rounded-full bg-outline" />
                  <span className="text-tertiary">Drop: 0.72%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-space-sm mt-space-sm text-label-caps text-outline font-label-caps">
              <span className="material-symbols-outlined text-[14px] text-secondary">wifi_tethering</span>
              <span>ETHERNET LOOPBACK INTERFACE • 10Gbps VIRTUALIZED PHY</span>
            </div>
          </div>

          {/* Peer B (Remote Target Monolith) */}
          <div className="lg:col-span-4 rounded-xl bg-surface-container/70 backdrop-blur-2xl p-space-lg shadow-[0_24px_64px_rgba(0,0,0,0.7),inset_0_1px_1.5px_rgba(255,255,255,0.3)] relative overflow-hidden border border-outline-variant/40">
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between mb-space-md relative z-10">
              <div className="flex items-center gap-space-sm">
                <div className="w-8 h-8 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary shadow-[0_0_16px_rgba(0,166,224,0.4)]">
                  <span className="material-symbols-outlined text-[18px]">router</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">Peer Beta</h3>
                  <p className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Remote Process • PID 48219</p>
                </div>
              </div>
              <span className="px-space-sm py-0.5 rounded-full bg-secondary-container/20 text-secondary text-label-caps font-label-caps font-bold">
                dgram Listener
              </span>
            </div>

            {/* Metric Gauges Inside Slab */}
            <div className="space-y-space-sm relative z-10 mb-space-md">
              <div className="p-space-sm rounded-lg bg-surface-container-lowest/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                <div className="flex justify-between items-center text-label-caps text-outline mb-1">
                  <span>RX REASSEMBLY BUFFER</span>
                  <span className="font-mono text-secondary font-bold">64 KB / 1024 KB</span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden p-0.5">
                  <div className="h-full rounded-full bg-secondary shadow-[0_0_10px_rgba(123,208,255,0.7)] transition-all duration-300" style={{ width: '12%' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-space-xs font-mono text-body-sm">
                <div className="p-space-sm rounded-lg bg-surface-container-high/40">
                  <span className="font-label-caps text-label-caps text-outline block">INBOUND BYTES</span>
                  <span className="text-on-surface font-semibold text-headline-sm">1,024,452</span>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-high/40">
                  <span className="font-label-caps text-label-caps text-outline block">CRC-32 CHECKS</span>
                  <span className="text-primary font-semibold text-headline-sm">100% OK</span>
                </div>
              </div>
            </div>

            <div className="p-space-sm rounded-lg bg-surface-container-lowest/80 font-mono text-body-sm text-outline-variant space-y-1">
              <div className="text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                <span>RECVFROM(fd: 29, chunk_id: 1042, 1024B)</span>
              </div>
              <div className="text-on-surface-variant text-[11px] truncate">verified_sha: 4a2d89bf003e... from 127.0.0.1:9001</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── REAL OS LIVE NETWORKING INTERFACE PANEL ───────────────────── */}
      <section className="w-full">
        <LiveNetworkingPanel />
      </section>
    </div>
  );
};
