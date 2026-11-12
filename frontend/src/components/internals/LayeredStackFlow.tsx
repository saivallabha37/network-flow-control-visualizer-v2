import React, { useState } from 'react';
import {
  Layers,
  ArrowRight,
  ArrowDown,
  RotateCcw,
  CheckCircle2,
  Radio,
  Play,
  Pause,
} from 'lucide-react';
import { createDataFrame } from '@agent';

export interface EncapsulationStep {
  stepIndex: number;
  title: string;
  senderLayer: 'APPLICATION' | 'DATA_LINK' | 'PHYSICAL' | 'IDLE';
  receiverLayer: 'APPLICATION' | 'DATA_LINK' | 'PHYSICAL' | 'IDLE';
  channelState: 'IDLE' | 'IN_TRANSIT';
  description: string;
  dataSnippet: string;
}

export const LayeredStackFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [payloadText] = useState<string>('Sensor-Reading-T34');

  // Compute live sample frame using authoritative engine factory
  const sampleFrame = React.useMemo(() => {
    return createDataFrame({
      seqNum: 0,
      payload: payloadText,
      sessionId: 'sess-v2-demo',
    });
  }, [payloadText]);

  const steps: EncapsulationStep[] = [
    {
      stepIndex: 0,
      title: '1. Application Payload Generation',
      senderLayer: 'APPLICATION',
      receiverLayer: 'IDLE',
      channelState: 'IDLE',
      description:
        'The sender application (Host A) generates raw application data. At this highest layer, there are no frame boundaries, sequence numbers, or transport headers.',
      dataSnippet: `Payload: "${sampleFrame.payload}" (${sampleFrame.payload.length} bytes)`,
    },
    {
      stepIndex: 1,
      title: '2. Data-Link Header Attachment & CRC32 Computation',
      senderLayer: 'DATA_LINK',
      receiverLayer: 'IDLE',
      channelState: 'IDLE',
      description:
        'The Data-Link layer encapsulates the payload with a protocol header (Type: DATA, SeqNum: 0) and computes a 32-bit CRC checksum across the canonical frame representation.',
      dataSnippet: `Header: [Type=DATA, Seq=${sampleFrame.seqNum}, Ack=None] + CRC32: 0x${sampleFrame.checksum.toString(16).toUpperCase()}`,
    },
    {
      stepIndex: 2,
      title: '3. Physical Layer Serialization & Wire Dispatch',
      senderLayer: 'PHYSICAL',
      receiverLayer: 'IDLE',
      channelState: 'IDLE',
      description:
        'The Physical layer converts the structured frame into a serialized stream of bytes and transmits signal pulses across the medium (or UDP datagrams).',
      dataSnippet: `Bitstream: ${JSON.stringify(sampleFrame).slice(0, 52)}...`,
    },
    {
      stepIndex: 3,
      title: '4. Physical Channel Propagation',
      senderLayer: 'IDLE',
      receiverLayer: 'IDLE',
      channelState: 'IN_TRANSIT',
      description:
        'Signals transit the transmission medium. The frame is subject to physical propagation delay, channel noise, and potential packet loss.',
      dataSnippet: `In Transit: Physical latency = 60ms, Status = In Flight`,
    },
    {
      stepIndex: 4,
      title: '5. Receiver Physical Reception',
      senderLayer: 'IDLE',
      receiverLayer: 'PHYSICAL',
      channelState: 'IDLE',
      description:
        'The receiver NIC (Host B) detects incoming signals, reconstructs raw byte buffers from the wire, and hands the framed buffer up to the Data-Link layer.',
      dataSnippet: `NIC Ingest: Received ${JSON.stringify(sampleFrame).length} bytes over wire interface`,
    },
    {
      stepIndex: 5,
      title: '6. Receiver CRC32 Validation & Sequence Check',
      senderLayer: 'IDLE',
      receiverLayer: 'DATA_LINK',
      channelState: 'IDLE',
      description:
        'Data-Link layer recalculates CRC32. If pristine, it validates SeqNum against expected Rn (0). Once accepted, it generates an ACK frame back to Host A.',
      dataSnippet: `Integrity: CRC 0x${sampleFrame.checksum.toString(16).toUpperCase()} MATCHES | Seq ${sampleFrame.seqNum} == Rn (0) -> ACCEPTED`,
    },
    {
      stepIndex: 6,
      title: '7. Upper-Layer Payload Decapsulation & Delivery',
      senderLayer: 'IDLE',
      receiverLayer: 'APPLICATION',
      channelState: 'IDLE',
      description:
        'The Data-Link header and checksum trailer are stripped away. The pristine payload is delivered into the receiver application inbox.',
      dataSnippet: `Delivered to Application: "${sampleFrame.payload}" (Verified in-order)`,
    },
  ];

  // Auto-play interval effect
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : 0));
      }, 2000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, steps.length]);

  const active = steps[currentStep];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Layered Protocol Flow Simulator</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-0.5">
            Encapsulation, Channel Transit &amp; Decapsulation
          </h3>
          <p className="text-xs text-slate-400">
            Observe step-by-step how user data is wrapped in flow-control headers and unwrapped at the destination.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-600/20 text-amber-300 border-amber-500/40 hover:bg-amber-600/30'
                : 'bg-purple-600 text-white border-purple-500 hover:bg-purple-500 shadow-md shadow-purple-950/50'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Auto Play'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : 0));
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <span>Step</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setCurrentStep(0);
            }}
            title="Reset to Step 1"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Step Selector Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
        {steps.map((s, idx) => {
          const isCurrent = idx === currentStep;
          const isPassed = idx < currentStep;
          return (
            <button
              key={s.stepIndex}
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep(idx);
              }}
              className={`p-2 rounded-lg border text-left transition-all cursor-pointer text-xs ${
                isCurrent
                  ? 'bg-purple-600/20 border-purple-500 text-white font-bold ring-1 ring-purple-500/40'
                  : isPassed
                  ? 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  : 'bg-slate-950/40 border-slate-900 text-slate-600 hover:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                <span>Step {idx + 1}</span>
                {isPassed && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              </div>
              <div className="text-[11px] truncate leading-tight">
                {s.title.split('. ')[1]}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3-Tier Layer Representation (Sender Stack ➔ Channel ➔ Receiver Stack) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Sender Stack */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between pb-1 border-b border-slate-800">
            <span>Sender Stack (Host A)</span>
            <span className="text-[10px] font-mono text-purple-400">Encapsulation &darr;</span>
          </div>

          {/* Sender Application Layer */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              active.senderLayer === 'APPLICATION'
                ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-950/50 ring-2 ring-indigo-500/30'
                : 'bg-slate-950/60 border-slate-800/80 opacity-70'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-indigo-300">Application Layer</span>
              <span className="text-[10px] font-mono text-slate-400">Layer 3</span>
            </div>
            <p className="text-[11px] text-slate-400">
              User Message: <code className="text-indigo-200">"{sampleFrame.payload}"</code>
            </p>
          </div>

          <div className="flex justify-center text-slate-600">
            <ArrowDown className="w-4 h-4 animate-bounce" />
          </div>

          {/* Sender Data-Link Layer */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              active.senderLayer === 'DATA_LINK'
                ? 'bg-amber-500/25 border-amber-400 shadow-lg shadow-amber-950/50 ring-2 ring-amber-400/40 text-amber-200'
                : 'bg-slate-950/60 border-slate-800/80 opacity-70'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-amber-300">Data-Link Layer</span>
              <span className="text-[10px] font-mono text-amber-400/80">Layer 2 (ARQ)</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Prepends Header <code className="text-amber-300 font-bold">[Seq: 0]</code> + Appends CRC32{' '}
              <code className="text-amber-300 font-bold">0x{sampleFrame.checksum.toString(16).toUpperCase()}</code>
            </p>
          </div>

          <div className="flex justify-center text-slate-600">
            <ArrowDown className="w-4 h-4 animate-bounce" />
          </div>

          {/* Sender Physical Layer */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              active.senderLayer === 'PHYSICAL'
                ? 'bg-cyan-600/20 border-cyan-500 shadow-lg shadow-cyan-950/50 ring-2 ring-cyan-500/30'
                : 'bg-slate-950/60 border-slate-800/80 opacity-70'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-cyan-300">Physical Layer</span>
              <span className="text-[10px] font-mono text-slate-400">Layer 1</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Serializes frame into wire bitstream / UDP datagram.
            </p>
          </div>
        </div>

        {/* Center Transmission Medium */}
        <div className="flex flex-col justify-center items-center p-5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-4 text-center">
          <div className="p-3 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
            <Radio
              className={`w-6 h-6 ${
                active.channelState === 'IN_TRANSIT'
                  ? 'text-purple-400 animate-pulse'
                  : 'text-slate-600'
              }`}
            />
          </div>

          <div>
            <span className="text-xs font-bold text-slate-300 block">
              Physical Medium / Virtual Channel
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Propagation Latency + Channel Noise
            </span>
          </div>

          <div
            className={`w-full p-3 rounded-lg border text-xs font-mono transition-all ${
              active.channelState === 'IN_TRANSIT'
                ? 'border-purple-500/50 bg-purple-950/30 text-purple-200 animate-pulse'
                : 'border-slate-800 bg-slate-900 text-slate-500'
            }`}
          >
            {active.channelState === 'IN_TRANSIT' ? (
              <div className="flex items-center justify-center gap-2">
                <span>&rarr; Frame in Transit &rarr;</span>
              </div>
            ) : (
              <span>Channel Idle</span>
            )}
          </div>

          <div className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
            Flow control prevents overwhelming receiver buffers, while CRC32 protects against channel bit errors.
          </div>
        </div>

        {/* Receiver Stack */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between pb-1 border-b border-slate-800">
            <span>Receiver Stack (Host B)</span>
            <span className="text-[10px] font-mono text-emerald-400">Decapsulation &uarr;</span>
          </div>

          {/* Receiver Application Layer */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              active.receiverLayer === 'APPLICATION'
                ? 'bg-emerald-600/20 border-emerald-500 shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-500/30'
                : 'bg-slate-950/60 border-slate-800/80 opacity-70'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-emerald-300">Application Layer</span>
              <span className="text-[10px] font-mono text-slate-400">Layer 3</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Receives clean, verified payload: <code className="text-emerald-200">"{sampleFrame.payload}"</code>
            </p>
          </div>

          <div className="flex justify-center text-slate-600">
            <ArrowDown className="w-4 h-4 rotate-180 animate-bounce" />
          </div>

          {/* Receiver Data-Link Layer */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              active.receiverLayer === 'DATA_LINK'
                ? 'bg-amber-500/25 border-amber-400 shadow-lg shadow-amber-950/50 ring-2 ring-amber-400/40 text-amber-200'
                : 'bg-slate-950/60 border-slate-800/80 opacity-70'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-amber-300">Data-Link Layer</span>
              <span className="text-[10px] font-mono text-amber-400/80">Layer 2 (ARQ)</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Validates CRC32 &amp; sequence number. Emits cumulative or selective ACK.
            </p>
          </div>

          <div className="flex justify-center text-slate-600">
            <ArrowDown className="w-4 h-4 rotate-180 animate-bounce" />
          </div>

          {/* Receiver Physical Layer */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              active.receiverLayer === 'PHYSICAL'
                ? 'bg-cyan-600/20 border-cyan-500 shadow-lg shadow-cyan-950/50 ring-2 ring-cyan-500/30'
                : 'bg-slate-950/60 border-slate-800/80 opacity-70'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-cyan-300">Physical Layer</span>
              <span className="text-[10px] font-mono text-slate-400">Layer 1</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Demodulates wire signal and reconstructs frame byte buffer.
            </p>
          </div>
        </div>
      </div>

      {/* Active Step Details Bar */}
      <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-purple-300">{active.title}</span>
          <span className="text-[10px] font-mono text-purple-400">
            Step {active.stepIndex + 1} of {steps.length}
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{active.description}</p>
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200">
          <span className="text-slate-500 select-none mr-2">&gt;</span>
          <span>{active.dataSnippet}</span>
        </div>
      </div>
    </div>
  );
};
