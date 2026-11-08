import React, { useState, useMemo } from 'react';
import {
  Binary,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  Frame,
  FrameType,
  calculateCRC32,
  getFrameCanonicalString,
  createDataFrame,
  createAckFrame,
} from '@agent';

export interface FieldBreakdown {
  name: string;
  sizeBytes: number;
  offset: number;
  value: string;
  hexBytes: string;
  description: string;
  color: string;
}

export const FrameDissector: React.FC = () => {
  const [frameType, setFrameType] = useState<FrameType>('DATA');
  const [seqNum, setSeqNum] = useState<number>(0);
  const [ackNum, setAckNum] = useState<number>(0);
  const [payload, setPayload] = useState<string>('Telemetry Packet #42');
  const [isCorrupted, setIsCorrupted] = useState<boolean>(false);
  const [corruptBitIndex, setCorruptBitIndex] = useState<number>(0);

  // Pristine frame generated from authoritative factory
  const pristineFrame: Frame = useMemo(() => {
    if (frameType === 'DATA') {
      return createDataFrame({
        seqNum,
        payload,
        sessionId: 'sim-internals',
      });
    } else {
      return createAckFrame({
        ackNum,
        seqNum,
        sessionId: 'sim-internals',
      });
    }
  }, [frameType, seqNum, ackNum, payload]);

  // If corrupted, introduce a bit flip in the payload
  const activePayload = useMemo(() => {
    if (!isCorrupted || payload.length === 0) {
      return pristineFrame.payload;
    }
    // Flip bit at corruptBitIndex in the first char
    const charCode = pristineFrame.payload.charCodeAt(0);
    const flippedChar = String.fromCharCode(charCode ^ (1 << (corruptBitIndex % 8)));
    return flippedChar + pristineFrame.payload.slice(1);
  }, [isCorrupted, corruptBitIndex, payload, pristineFrame.payload]);

  // Wire frame (holds original expected checksum, but payload might be corrupted)
  const wireFrame: Frame = useMemo(() => {
    return {
      ...pristineFrame,
      payload: activePayload,
    };
  }, [pristineFrame, activePayload]);

  // Canonical string across received frame
  const receivedCanonical = useMemo(() => {
    return getFrameCanonicalString(wireFrame);
  }, [wireFrame]);

  // Recalculated CRC32 at receiver using authoritative engine function
  const recalculatedCrc32 = useMemo(() => {
    return calculateCRC32(receivedCanonical);
  }, [receivedCanonical]);

  const isCrcValid = wireFrame.checksum === recalculatedCrc32;

  // Build field dissector table
  const fields: FieldBreakdown[] = useMemo(() => {
    const toHex32 = (n: number) => `0x${(n >>> 0).toString(16).padStart(8, '0').toUpperCase()}`;
    const toHex16 = (n: number) => `0x${(n >>> 0).toString(16).padStart(4, '0').toUpperCase()}`;
    const toHex8 = (n: number) => `0x${(n >>> 0).toString(16).padStart(2, '0').toUpperCase()}`;

    const typeCode = wireFrame.frameType === 'DATA' ? 0x01 : 0x02;

    const payloadBytes = Array.from(wireFrame.payload)
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase())
      .join(' ');

    return [
      {
        name: 'Frame Type',
        sizeBytes: 1,
        offset: 0,
        value: wireFrame.frameType,
        hexBytes: toHex8(typeCode),
        description: 'Identifies message format (0x01 = DATA payload, 0x02 = Cumulative / Selective ACK)',
        color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      },
      {
        name: 'Sequence Number (SeqNum)',
        sizeBytes: 4,
        offset: 1,
        value: String(wireFrame.seqNum),
        hexBytes: toHex32(wireFrame.seqNum),
        description: '32-bit sequence pointer. Modulo mapped into sliding window slots.',
        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      },
      {
        name: 'Acknowledgement Number (AckNum)',
        sizeBytes: 4,
        offset: 5,
        value: wireFrame.ackNum !== undefined ? String(wireFrame.ackNum) : 'None (DATA)',
        hexBytes: wireFrame.ackNum !== undefined ? toHex32(wireFrame.ackNum) : '0x00000000',
        description: 'Cumulative or selective acknowledgement identifier returned to sender.',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      },
      {
        name: 'Payload Length',
        sizeBytes: 2,
        offset: 9,
        value: `${wireFrame.payload.length} bytes`,
        hexBytes: toHex16(wireFrame.payload.length),
        description: 'Number of application message bytes encapsulated in this frame.',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      },
      {
        name: 'Application Payload',
        sizeBytes: wireFrame.payload.length,
        offset: 11,
        value: `"${wireFrame.payload}"`,
        hexBytes: payloadBytes.length > 32 ? `${payloadBytes.slice(0, 32)}...` : payloadBytes || '0x00',
        description: 'Raw user data stream. Subject to channel bit-flip errors in noisy transmission.',
        color: isCorrupted
          ? 'text-rose-400 bg-rose-500/10 border-rose-500/40 ring-1 ring-rose-500/40'
          : 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      },
      {
        name: 'Checksum (CRC-32 IEEE 802.3)',
        sizeBytes: 4,
        offset: 11 + wireFrame.payload.length,
        value: `0x${wireFrame.checksum.toString(16).toUpperCase()}`,
        hexBytes: toHex32(wireFrame.checksum),
        description: 'Cyclic redundancy check polynomial 0xEDB88320 protecting frame against bit corruption.',
        color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      },
    ];
  }, [wireFrame, isCorrupted]);

  const totalFrameSize = 11 + wireFrame.payload.length + 4;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            <Binary className="w-4 h-4" />
            <span>Interactive Wire Frame Dissector</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-0.5">
            Bit-Level Frame Anatomy &amp; CRC-32 Validation
          </h3>
          <p className="text-xs text-slate-400">
            Inspect the exact wire fields, binary offsets, and simulate physical channel bit-flip corruption.
          </p>
        </div>

        {/* Frame Type Selector */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFrameType('DATA');
              setIsCorrupted(false);
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              frameType === 'DATA'
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-950/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            DATA Frame
          </button>
          <button
            type="button"
            onClick={() => {
              setFrameType('ACK');
              setIsCorrupted(false);
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              frameType === 'ACK'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            ACK Frame
          </button>
        </div>
      </div>

      {/* Frame Parameter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
        <div>
          <label className="text-slate-400 font-medium block mb-1">Sequence Number (SeqNum)</label>
          <input
            type="number"
            min={0}
            max={15}
            value={seqNum}
            onChange={(e) => setSeqNum(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
          />
        </div>

        {frameType === 'ACK' ? (
          <div>
            <label className="text-slate-400 font-medium block mb-1">ACK Number (AckNum)</label>
            <input
              type="number"
              min={0}
              max={15}
              value={ackNum}
              onChange={(e) => setAckNum(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
            />
          </div>
        ) : (
          <div>
            <label className="text-slate-400 font-medium block mb-1">Payload Content</label>
            <input
              type="text"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
            />
          </div>
        )}

        {/* Bit-Flip Toggle Experiment */}
        <div className="flex flex-col justify-end">
          <button
            type="button"
            onClick={() => setIsCorrupted(!isCorrupted)}
            className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
              isCorrupted
                ? 'bg-rose-600/20 text-rose-300 border-rose-500/60 hover:bg-rose-600/30 ring-1 ring-rose-500/40'
                : 'bg-amber-600/20 text-amber-300 border-amber-500/50 hover:bg-amber-600/30'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isCorrupted ? 'text-rose-400' : 'text-amber-400'}`} />
            <span>{isCorrupted ? 'Bit Inverted (Corrupt)' : 'Inject 1-Bit Inversion'}</span>
          </button>
        </div>
      </div>

      {/* Integrity Verdict Banner */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
          isCrcValid
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
            : 'bg-rose-950/40 border-rose-500/60 text-rose-200 ring-2 ring-rose-500/40 animate-pulse'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg border ${
              isCrcValid
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
            }`}
          >
            {isCrcValid ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <div className="font-bold text-sm flex items-center gap-2">
              <span>{isCrcValid ? 'CRC-32 Integrity Verified: PASS' : 'CRC-32 Mismatch: CORRUPTED FRAME DISCARDED'}</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                  isCrcValid
                    ? 'bg-emerald-900/80 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-900/80 text-rose-300 border-rose-500/40'
                }`}
              >
                {isCrcValid ? 'Pristine' : 'Bit-Flip Detected'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isCrcValid
                ? 'Header checksum matches recalculation across received canonical representation. Safe to accept.'
                : 'Physical bit flip altered canonical string. Data-Link layer discards frame before state machine processing.'}
            </p>
          </div>
        </div>

        {/* Checksum Comparison Telemetry */}
        <div className="text-right font-mono text-xs shrink-0">
          <div>
            <span className="text-slate-400 text-[10px] block">Header Checksum:</span>
            <span className="text-white font-bold">0x{wireFrame.checksum.toString(16).toUpperCase()}</span>
          </div>
          <div className="mt-1">
            <span className="text-slate-400 text-[10px] block">Recalculated CRC:</span>
            <span className={isCrcValid ? 'text-emerald-300 font-bold' : 'text-rose-400 font-bold'}>
              0x{recalculatedCrc32.toString(16).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Field Anatomy Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 uppercase tracking-wider">
            Raw Wire Field Dissector ({totalFrameSize} Total Bytes)
          </span>
          <span className="text-[10px] font-mono text-slate-400">IEEE 802.3 Standard Encoding</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
                <th className="py-2.5 px-3">Offset</th>
                <th className="py-2.5 px-3">Field Name</th>
                <th className="py-2.5 px-3">Size</th>
                <th className="py-2.5 px-3">Raw Bytes (Hex)</th>
                <th className="py-2.5 px-3">Decoded Value</th>
                <th className="py-2.5 px-3">Protocol Function</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-slate-300">
              {fields.map((f, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 text-slate-500 font-bold">+{f.offset}B</td>
                  <td className="py-2.5 px-3 font-semibold text-white">{f.name}</td>
                  <td className="py-2.5 px-3 text-slate-400">{f.sizeBytes} B</td>
                  <td className="py-2.5 px-3 text-purple-300">{f.hexBytes}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded border text-[11px] ${f.color}`}>
                      {f.value}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px] max-w-xs">
                    {f.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bit-Flip Selection Tooltip */}
      {isCorrupted && (
        <div className="p-3 rounded-lg bg-slate-950/90 border border-rose-500/30 flex items-center justify-between text-xs font-mono text-rose-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Active Bit Inversion: Payload byte 0, bit {corruptBitIndex} toggled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400">Change Bit:</span>
            {[0, 1, 2, 3].map((bit) => (
              <button
                key={bit}
                type="button"
                onClick={() => setCorruptBitIndex(bit)}
                className={`px-2 py-0.5 rounded text-[10px] border cursor-pointer ${
                  corruptBitIndex === bit
                    ? 'bg-rose-600 text-white border-rose-500 font-bold'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                b{bit}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
