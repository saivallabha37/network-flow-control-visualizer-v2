import React from 'react';
import { LiveNetworkingPanel } from '../components/LiveNetworkingPanel';
import { Radio } from 'lucide-react';

export const LiveUdpView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Real UDP Mode Architecture Banner */}
      <div className="rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0 mt-0.5">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Live Peer-to-Peer UDP Socket Transport
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  REAL OS SOCKETS
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Unlike the in-browser deterministic simulation, this mode communicates over real
                operating system UDP sockets via the Node.js networking agent. It performs genuine
                3-way handshakes, streaming telemetry via WebSockets, and verifies file transfers with SHA-256 digests.
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono shrink-0">
            <div className="text-slate-500 text-[10px] uppercase font-semibold">Start Agent CLI:</div>
            <code className="text-emerald-400 font-bold">npm run agent:live</code>
          </div>
        </div>
      </div>

      {/* Embedded Live Networking Panel */}
      <LiveNetworkingPanel />
    </div>
  );
};
