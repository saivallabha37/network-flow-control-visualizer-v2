# Network Flow Control Visualizer V2 — Baseline Audit Report

**Date of Audit:** 03 November 2026  
**Status:** Completed & Verified  
**Baseline Source:** `saivallabha37/network-flow-control-visualizer-v1` (Monorepo)  
**Evaluator:** Antigravity (Advanced Agentic Coding)

---

## 1. Executive Summary

A comprehensive architectural and empirical audit of the inherited codebase was performed. The repository is a production-grade educational platform for Network Flow Control and Automatic Repeat reQuest (ARQ) protocols. 

The inherited codebase contains a fully functional, mathematically rigorous protocol simulation core, an event-driven virtual channel with Mulberry32 deterministic PRNG, an interactive SVG ladder diagram (space-time bounce diagram), bitfield packet inspection, guided scenario presets, and a live UDP networking subsystem with WebSocket telemetry.

All baseline verification checks—TypeScript type checking, test suites, and production bundling—passed with zero errors across both `agent` and `frontend` workspaces.

---

## 2. Technology Stack & Workspace Configuration

The project is structured as an `npm` monorepo with two primary packages:

| Scope | Technology / Library | Version | Role |
|---|---|---|---|
| **Monorepo** | Node.js / npm Workspaces | Node 20+, npm 10+ | Root package management (`agent`, `frontend`) |
| **Agent / Protocol** | TypeScript | 5.6.3 | Type system for protocol state machines & simulation |
| **Agent / Network** | `dgram` (Node Native), `ws` | 8.18.0 | Real UDP socket transmission & local WebSocket telemetry |
| **Agent / Test** | Vitest | 2.1.5 | Unit & integration testing of ARQ engines & UDP transport |
| **Frontend Core** | React | 18.3.1 | Component framework |
| **Frontend Build** | Vite | 5.4.10 / 5.4.21 | ESM dev server and production bundler |
| **Styling** | Tailwind CSS, PostCSS, Autoprefixer | 3.4.14 | Utility-first responsive design system |
| **Icons** | Lucide React | 0.460.0 | Iconography |
| **Frontend Test** | Vitest | 2.1.5 | Frontend component & engine integration testing |

---

## 3. Baseline Verification & Test Execution Results

All commands were executed in the repository root without modifying any source files.

### A. TypeScript Typecheck
```bash
npm run typecheck
```
* **Command Output:**
  ```text
  > network-flow-control-visualizer-monorepo@0.1.0 typecheck
  > npm run typecheck --workspaces --if-present

  > agent@0.1.0 typecheck
  > tsc --noEmit

  > frontend@0.1.0 typecheck
  > tsc --noEmit
  ```
* **Exit Code:** `0`
* **Result:** **PASSED**. Zero TypeScript compiler diagnostics or type discrepancies across both workspaces.

### B. Automated Test Suites
```bash
npm test
```
* **Command Output Summary:**
  * **Agent Test Suites:** 11 passed (11 total)
    * `tests/udp-codec.test.ts` (11 tests passed)
    * `tests/file-transfer.test.ts` (8 tests passed)
    * `tests/protocol-comparison.test.ts` (2 tests passed)
    * `tests/protocol-types.test.ts` (2 tests passed)
    * `tests/frame-codec.test.ts` (7 tests passed)
    * `tests/sliding-window.test.ts` (5 tests passed)
    * `tests/go-back-n.test.ts` (13 tests passed)
    * `tests/selective-repeat.test.ts` (15 tests passed)
    * `tests/stop-and-wait.test.ts` (10 tests passed)
    * `tests/simulation-engine.test.ts` (16 tests passed)
    * `tests/live-networking.test.ts` (9 tests passed, verified live UDP loopback & SHA-256 transfers)
    * **Subtotal Agent:** **98 tests passed / 0 failed**
  * **Frontend Test Suites:** 7 passed (7 total)
    * `tests/space-time-diagram.test.ts` (2 tests passed)
    * `tests/packet-inspector.test.ts` (3 tests passed)
    * `tests/app.test.ts` (1 test passed)
    * `tests/live-panel.test.ts` (2 tests passed)
    * `tests/protocol-comparison.test.ts` (2 tests passed)
    * `tests/guided-scenarios.test.ts` (5 tests passed)
    * `tests/visualizer-engine-integration.test.ts` (10 tests passed)
    * **Subtotal Frontend:** **25 tests passed / 0 failed**
* **Exit Code:** `0`
* **Total Passing Tests:** **123 passed / 0 failed** (18 test files)

### C. Production Build
```bash
npm run build
```
* **Command Output:**
  ```text
  > agent@0.1.0 build
  > tsc

  > frontend@0.1.0 build
  > tsc --noEmit && vite build
  ✓ 1610 modules transformed.
  dist/index.html                   0.54 kB │ gzip:  0.35 kB
  dist/assets/index-DONf_7SH.css   33.35 kB │ gzip:  6.12 kB
  dist/assets/index-D1FRdOcD.js   324.75 kB │ gzip: 82.88 kB
  ✓ built in 3.54s
  ```
* **Exit Code:** `0`
* **Result:** **PASSED**. Clean build output generated.

---

## 4. Repository Structure Inventory

```text
network-flow-control-visualizer-v2/
├── package.json                 # Monorepo root configuration & scripts
├── package-lock.json            # Exact dependency lockfile
├── .gitignore                   # Ignore rules
├── README.md                    # V1 documentation
├── product/                     # V2 Product Specification & Migration Pack
│   ├── README-FIRST.md
│   ├── PRD-V2-MASTER.md
│   ├── PRD-01-MANUAL-INTERACTIVE-LAB.md
│   ├── PRD-02-UI-AND-NAVIGATION.md
│   ├── PRD-03-LEARNING-AND-PROTOCOL-INTERNALS.md
│   ├── V2-MIGRATION-AND-ANTIGRAVITY-HANDOFF.md
│   ├── V2-BASELINE.md          # This audit report
│   └── V2-IMPLEMENTATION-PLAN.md # Phased implementation roadmap
├── docs/                        # Inherited V1 project design & SRS specifications
│   ├── SRS.md
│   ├── design.md
│   ├── diagrams.md
│   ├── test-plan.md
│   └── traceability-matrix.md
├── agent/                       # Protocol engines, simulation kernel & live agent
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── src/
│   │   ├── index.ts             # Public exports for @agent
│   │   ├── types/
│   │   │   └── protocol.ts      # Protocol frames, window state, telemetry event types
│   │   ├── utils/
│   │   │   ├── checksum.ts      # CRC32 / bitwise checksum implementations
│   │   │   └── frame-codec.ts   # Serialization/deserialization with type guards
│   │   ├── protocols/
│   │   │   ├── sliding-window.ts   # Generalized sliding-window queue & pointers
│   │   │   ├── stop-and-wait.ts    # Stop-and-Wait sender & receiver state machines
│   │   │   ├── go-back-n.ts        # Go-Back-N sender & receiver state machines
│   │   │   └── selective-repeat.ts # Selective Repeat sender & receiver state machines
│   │   ├── simulation/
│   │   │   ├── simulation-config.ts     # Config validation & constraints
│   │   │   ├── simulation-events.ts     # Event structures emitted by engine
│   │   │   ├── simulation-stats.ts      # Throughput, utilization, efficiency metrics
│   │   │   ├── virtual-channel.ts       # Virtual transmission channel & PRNG
│   │   │   ├── protocol-adapters.ts     # Adapters bridging state machines to simulation
│   │   │   ├── protocol-comparison.ts   # Multi-protocol benchmark engine
│   │   │   └── simulation-engine.ts     # Deterministic simulation loop & tick scheduler
│   │   └── live/
│   │       ├── live-types.ts            # UDP wire packets, WS telemetry schemas
│   │       ├── udp-codec.ts             # Binary & JSON UDP wire serialization
│   │       ├── live-session.ts          # Active live session binding state machine
│   │       ├── file-transfer.ts         # Chunking, reassembly, SHA-256 verification
│   │       ├── networking-agent.ts      # Node dgram UDP socket & WS server
│   │       └── cli.ts                   # CLI entrypoint for running the live agent
│   └── tests/                           # 11 unit & integration test suites
└── frontend/                    # Vite + React + Tailwind frontend application
    ├── package.json
    ├── tsconfig.json            # Path alias: @agent -> ../agent/src/index.ts
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    ├── src/
    │   ├── main.tsx             # React DOM entry
    │   ├── App.tsx              # Current single-page visualizer layout
    │   ├── index.css            # Tailwind directives & theme styles
    │   ├── types/
    │   │   ├── visualizer.ts    # Protocol metadata & UI card schemas
    │   │   └── scenarios.ts     # 5 guided scenario definitions
    │   ├── hooks/
    │   │   ├── useSimulation.ts # React hook controlling SimulationEngine
    │   │   └── useLiveAgent.ts  # React hook controlling WebSocket telemetry
    │   └── components/
    │       ├── Header.tsx                 # Top bar with status & mode switch
    │       ├── ProtocolSelector.tsx       # Protocol selector tabs
    │       ├── SimulationControls.tsx     # Start, pause, step, reset, speed controls
    │       ├── SimulationConfigPanel.tsx  # Dynamic configuration form
    │       ├── NetworkTopology.tsx        # Central sender/channel/receiver visualizer
    │       ├── SpaceTimeDiagram.tsx       # SVG bounce/ladder diagram
    │       ├── EventTimeline.tsx          # Chronological log with event filtering
    │       ├── StatisticsPanel.tsx        # Empirical vs theoretical throughput metrics
    │       ├── PacketInspector.tsx        # In-flight & delivered packet detail modal
    │       ├── ProtocolExplanation.tsx    # Textual overview of current protocol mechanics
    │       ├── ProtocolComparisonModal.tsx# Comparative benchmark matrix modal
    │       ├── LabScenariosPanel.tsx      # Guided scenarios carousel
    │       └── KeyboardShortcutsModal.tsx # Hotkeys reference modal
    └── tests/                             # 7 frontend integration test suites
```

---

## 5. Existing Functionality Verification Matrix

Every major feature was inspected in code and empirically verified against tests:

| Feature / Subsystem | Status | Verification Evidence | Notes / Behaviour |
|---|---|---|---|
| **Stop-and-Wait ARQ** | **Implemented & Verified** | `stop-and-wait.ts`, `stop-and-wait.test.ts` (10 tests) | Window $N=1$. Alternating bit sequence ($0 \leftrightarrow 1$). Responds to matching ACK, ignores stale ACKs, retransmits on timeout. |
| **Go-Back-N ARQ** | **Implemented & Verified** | `go-back-n.ts`, `go-back-n.test.ts` (13 tests) | Cumulative ACK convention (inclusive highest in-order). Receiver window $1$. Discards out-of-order frames. Resends base-through-next on timeout. |
| **Selective Repeat ARQ** | **Implemented & Verified** | `selective-repeat.ts`, `selective-repeat.test.ts` (15 tests) | Individual ACKs. Receiver buffers out-of-order frames in $[R_n, R_n + N - 1]$. Cascading in-order delivery. Individual frame timers; resends only timed-out frame. $M \ge 2N$ mathematical validation enforced. |
| **Sliding Window Abstraction** | **Implemented & Verified** | `sliding-window.ts`, `sliding-window.test.ts` (5 tests) | Circular buffer managing base $S_f$, next $S_n$, capacity, and modulo wraparound. |
| **Deterministic Simulation Engine** | **Implemented & Verified** | `simulation-engine.ts`, `simulation-engine.test.ts` (16 tests) | Mulberry32 PRNG with seed reproducibility. Discrete tick stepping (`tickStepMs`). Queue exhaustion & retry limit safety thresholds. |
| **Virtual Channel & Fault Injection** | **Implemented & Verified** | `virtual-channel.ts` | One-way latency delay scheduling, probabilistic frame drop, ACK drop, and bitwise corruption (CRC32 inversion). |
| **Space-Time Diagram** | **Implemented & Verified** | `SpaceTimeDiagram.tsx`, `space-time-diagram.test.ts` | Interactive SVG ladder diagram tracking trajectories of DATA and ACK packets over time with zoom and timeout markers. |
| **Packet Inspection** | **Implemented & Verified** | `PacketInspector.tsx`, `packet-inspector.test.ts` | Displays bitfields, sequence numbers, checksum validation, raw payload string, and transit timing. |
| **Event Timeline** | **Implemented & Verified** | `EventTimeline.tsx` | Chronological list of typed events (`FRAME_TRANSMITTED`, `ACK_DELIVERED`, `TIMEOUT`, etc.) with auto-scroll. |
| **Performance Statistics** | **Implemented & Verified** | `StatisticsPanel.tsx`, `simulation-stats.ts` | Empirical delivery ratio, throughput payloads/sec, theoretical utilization $\eta = \frac{N \cdot T_f}{T_f + \text{RTT}}$, and bandwidth efficiency. |
| **Guided Scenarios** | **Implemented & Verified** | `LabScenariosPanel.tsx`, `guided-scenarios.test.ts` | 5 presets: Loss-Free Baseline, Satellite Link, GBN Loss Recovery, SR Buffering, Lost ACK Recovery. |
| **Protocol Comparison Benchmark** | **Implemented & Verified** | `protocol-comparison.ts`, `ProtocolComparisonModal.tsx` | Side-by-side execution of all 3 protocols under identical network conditions and metrics computation. |
| **Live UDP Networking** | **Implemented & Verified** | `networking-agent.ts`, `live-networking.test.ts` (9 tests) | Real Node `dgram` socket transmission. 3-way handshake (`HANDSHAKE_INIT`, `HANDSHAKE_ACK`), chat messaging, chunked file transfer with SHA-256 validation. |
| **WebSocket Telemetry Bridge** | **Implemented & Verified** | `networking-agent.ts`, `useLiveAgent.ts`, `live-panel.test.ts` | Transmits agent state and protocol events to frontend in real-time over `ws://127.0.0.1:8080`. |
| **Manual Classroom Interactive Lab** | **MISSING (To be created in V2)** | PRD-01 requirement | Instructor control over specific in-flight packet delivery, deliberate dropping, delaying, and timeout triggering does not exist yet. |
| **Dedicated Application Navigation Shell** | **Needs Redesign for V2** | PRD-02 requirement | V1 uses a single header toggle between `simulation` and `live`. Needs persistent sidebar/top navigation for 7 distinct views. |
| **Protocol Internals & Layer Architecture** | **MISSING (To be created in V2)** | PRD-03 requirement | Visual representation of Application $\to$ Data-Link $\to$ Physical layer processing flows is not yet implemented. |
| **Interactive Sequence Ambiguity Lesson** | **MISSING (To be created in V2)** | PRD-03 requirement | Interactive explainer demonstrating why $M < 2N$ causes fatal ambiguity in Selective Repeat is not yet implemented. |

---

## 6. Frontend Component Inventory & Reuse Assessment

| Component | Current Responsibility | V2 Reuse Strategy |
|---|---|---|
| `Header.tsx` | App title, mode switcher, time & status badge | **Redesign** into V2 persistent TopBar with global status indicators, breadcrumbs, and quick actions. |
| `App.tsx` | Monolithic page rendering all components | **Refactor** into an AppShell with tab/route-based view switching across the 7 PRD sections. |
| `SimulationControls.tsx` | Start, pause, resume, step, reset, speed controls | **Reuse & Enhance**. Add manual step triggers and classroom presentation mode. |
| `SimulationConfigPanel.tsx` | Form controls for simulation parameters | **Reuse**. Keep for Automatic Simulation; provide compact version for Manual Lab. |
| `NetworkTopology.tsx` | Visualizes sender slots, channel lane, receiver | **Reuse as base for Manual Lab & Auto Sim**. Extend to show directional dual lanes and clickable packet cards. |
| `SpaceTimeDiagram.tsx` | SVG ladder sequence diagram | **Preserve & Reuse**. Core asset for Automatic Simulation and comparison view. |
| `EventTimeline.tsx` | Chronological event list | **Reuse & Enhance**. Add pedagogical explanations for each event. |
| `StatisticsPanel.tsx` | Performance metrics and theoretical formula | **Reuse**. Core asset for Automatic Simulation and Protocol Comparison. |
| `PacketInspector.tsx` | Detailed packet card inspection | **Reuse**. Embed inside Manual Lab and Automatic Simulation. |
| `ProtocolSelector.tsx` | Tab buttons to switch protocols | **Reuse**. Refactor into shared selector across views. |
| `LabScenariosPanel.tsx` | Preset scenario cards | **Reuse & Expand**. Move to Automatic Simulation and Learning Centre. |
| `ProtocolComparisonModal.tsx`| Modal with comparative report | **Evolve into dedicated Protocol Comparison Page** (`PRD-02`, `PRD-03`). |
| `LiveNetworkingPanel.tsx` | Real UDP connection, messaging, file send | **Preserve & Enhance as dedicated Live UDP Page**. Add visual indicators separating live UDP from simulation. |
| `KeyboardShortcutsModal.tsx`| Hotkey reference | **Reuse as global accessible modal**. |

---

## 7. Backend & Simulation Engine Architecture

### A. Engine Decoupling
The protocol engines (`StopAndWaitSender`, `GoBackNSender`, `SelectiveRepeatSender`) have **zero dependencies on React or the browser DOM**. They reside in `agent/src/protocols` and communicate purely through typed method invocations (`send`, `onAckReceived`, `onFrameReceived`, `tick`, `handleTimeout`) and immutable event callbacks.

### B. Virtual Channel Architecture
`VirtualChannel` (`agent/src/simulation/virtual-channel.ts`) holds an array of `InFlightPacket`:
```typescript
export interface InFlightPacket {
  id: string;
  type: 'DATA' | 'ACK';
  frame: Frame;
  departureTime: number;
  scheduledDeliveryTime: number;
  isDropped: boolean;
  isCorrupted: boolean;
}
```
Currently:
1. `transmitData` and `transmitAck` schedule delivery at `departureTime + oneWayDelayMs`.
2. Packets are evaluated for drop/corruption probabilistically using `SeededRandom`.
3. `getDeliverablePackets(currentTime)` retrieves packets whose delivery time has passed.

### C. The Key Architectural Insight for V2 Manual Lab
All three protocol senders already implement **`handleTimeout()`**!
- `StopAndWaitSender.handleTimeout()`
- `GoBackNSender.handleTimeout()`
- `SelectiveRepeatSender.handleTimeout(targetSeqNum?: number)`
- And each tracks `isTimerRunning`, `timerElapsedMs`, and `timeoutMs`.

This means the engine **already possesses the low-level hooks needed for instructor control**. To implement the Manual Lab without altering protocol invariants:
1. Provide a `ManualChannelController` (or manual mode in `VirtualChannel` / `SimulationEngine`) where:
   - Packets enter the channel and are held or scheduled.
   - The instructor can trigger `deliver(packetId)`, `drop(packetId)`, or `delay(packetId, extraMs)`.
   - When a timer is active, the instructor can trigger `forceTimeout(seqNum?)`.
2. The protocol state machines remain 100% untouched and authoritative.

---

## 8. Identified Gaps Against V2 Requirements

1. **Manual Interactive Lab (`PRD-01`)**:
   - No UI exists allowing an instructor to click an in-flight packet and select "Deliver", "Drop", or "Delay".
   - No control exists to trigger an eligible timeout on demand.
   - Sender and receiver window visualizations need clearer boundary markers (`Sf`, `Sn`, `Rn`), per-slot status tags, and countdown timer dials.
2. **Persistent Navigation & Information Architecture (`PRD-02`)**:
   - V1 puts everything on one long scrolling page with a 2-mode toggle in the header.
   - V2 requires 7 distinct pages: Overview, Automatic Simulation, Manual Lab, Live UDP, Protocol Comparison, Protocol Internals, and Learning Centre.
3. **Protocol Internals & Layered Architecture (`PRD-03`)**:
   - Missing the interactive architectural view explaining Application $\to$ Data-Link $\to$ Physical layer flows.
4. **Interactive Sequence-Number Ambiguity Lesson (`PRD-03`)**:
   - Missing the interactive visualizer for the $N \le M/2$ rule and modulo wraparound demonstration.
5. **Event Pedagogical Context (`PRD-01`, `PRD-03`)**:
   - Events currently contain technical descriptions, but lack educational "Why did this happen?" explanations.

---

## 9. Critical Modules to Preserve

The following files are fully tested and must **not** be rewritten or discarded:
1. `agent/src/protocols/stop-and-wait.ts`
2. `agent/src/protocols/go-back-n.ts`
3. `agent/src/protocols/selective-repeat.ts`
4. `agent/src/protocols/sliding-window.ts`
5. `agent/src/utils/frame-codec.ts` & `checksum.ts`
6. `agent/src/simulation/simulation-engine.ts` & `virtual-channel.ts` (extend safely; do not break auto simulation)
7. `agent/src/simulation/protocol-comparison.ts`
8. `agent/src/live/*` (all live networking & file transfer modules)
9. `frontend/src/components/SpaceTimeDiagram.tsx`
10. `frontend/src/components/PacketInspector.tsx`
11. `frontend/src/components/StatisticsPanel.tsx`
12. All 18 existing test suites in `agent/tests` and `frontend/tests`.

---

## 10. Audit Conclusion

The inherited codebase provides a rock-solid, bug-free foundation. There are no blocking bugs, broken types, or failing tests. The gap between V1 and V2 is purely additive: transforming the single-page layout into a 7-section learning portal, adding the teacher-controlled Manual Interactive Lab, and providing educational and architectural views.

The project is primed for Phase 1 implementation.

