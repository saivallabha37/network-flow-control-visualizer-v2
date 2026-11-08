# Network Flow Control Visualizer V2 — Phased Implementation Plan

**Date:** 03 November 2026  
**Status:** Ready for Review & Approval  
**Baseline Verified:** `V2-BASELINE.md` (123/123 tests passing, 0 type errors, clean build)  
**Author:** Antigravity (Advanced Agentic Coding)

---

## 1. Architectural Strategy & Design Decisions

### A. Core Architectural Tenet: Separation of Concerns
The fundamental requirement of V2 is that the **instructor controls the transmission channel and simulation clock, never the internal protocol state machine directly**.

```
+--------------------------------------------------------------------------+
|                            USER INTERFACE LAYER                          |
|  +-----------------+  +-----------------+  +--------------------------+  |
|  |  Manual Lab UI  |  |  Auto Sim UI    |  |  Live UDP Network UI     |  |
|  +--------+--------+  +--------+--------+  +------------+-------------+  |
+-----------|--------------------|------------------------|----------------+
            |                    |                        |
            v                    v                        v
+--------------------+  +--------------------+  +--------------------------+
|  useManualLab()    |  |  useSimulation()   |  |  useLiveAgent()          |
|  (Instructor CMDs) |  |  (Time & playback) |  |  (WebSocket telemetry)   |
+-----------|--------+  +--------+-----------+  +------------+-------------+
            |                    |                        |
            v                    v                        |
+--------------------------------------------+            |
|       SIMULATION & PROTOCOL LAYER          |            |
|  +--------------------------------------+  |            |
|  |       SimulationEngine (Core)        |  |            |
|  |   - Step / Clock / Event Dispatch    |  |            |
|  +-------------------+------------------+  |            |
|                      |                     |            |
|       +--------------+--------------+      |            |
|       |                             |      |            |
|       v                             v      |            |
|  +------------------------+  +-----------+ |            |
|  | VirtualChannel         |  | Protocol  | |            |
|  | (Auto PRNG or Manual   |  | Adapters  | |            |
|  |  Queue & Action Hook)  |  | (SAW, GBN,| |            |
|  +------------------------+  |  SR)      | |            |
|                              +-----+-----+ |            |
|                                    |       |            |
|       +----------------------------+       |            |
|       v                                    |            |
|  +---------------------------------------+ |            |
|  | Pure Protocol State Machines          | |            |
|  | (StopAndWait, GoBackN, SelectiveRepeat| |            |
|  |  + SlidingWindow + Retransmit Timers) | |            |
|  +---------------------------------------+ |            |
+--------------------------------------------+            |
                                                          |
+---------------------------------------------------------v----------------+
|                     OPERATING SYSTEM & NETWORK LAYER                     |
|  +--------------------------------------------------------------------+  |
|  | Node.js NetworkingAgent (dgram UDP Sockets + WebSocket Server)     |  |
|  +--------------------------------------------------------------------+  |
+--------------------------------------------------------------------------+
```

### B. Architectural Decisions
1. **Preserve Canonical Protocol Engines**:
   - `StopAndWaitSender`/`Receiver`, `GoBackNSender`/`Receiver`, `SelectiveRepeatSender`/`Receiver`, and `SlidingWindow` remain canonical. They are completely pure and verified by 98 tests.
   - Do **NOT** rewrite them.
2. **Channel Control Model for Manual Lab**:
   - Extend `VirtualChannel` / `SimulationEngine` with an explicit channel mode: `'AUTOMATIC' | 'MANUAL'`.
   - In manual mode:
     * When the sender transmits a DATA frame, it enters the channel as an `InFlightPacket` with status `'AWAITING_DECISION'` or `'IN_FLIGHT'`.
     * The engine provides typed instructor action methods:
       - `deliverPacket(packetId: string): void`
       - `dropPacket(packetId: string): void`
       - `delayPacket(packetId: string, additionalMs: number): void`
       - `triggerTimeout(targetSeqNum?: number): void`
       - `stepNextEvent(): void`
     * When `deliverPacket` is called on a DATA packet: the packet is dispatched to `adapter.onFrameReceived(packet.frame)` at the receiver, and any resulting ACK is generated naturally by the protocol and placed in the channel.
     * When `dropPacket` is called on a DATA packet: the packet is removed from the channel; a `FRAME_DROPPED` event is emitted; the receiver is never notified.
     * When `deliverPacket` is called on an ACK packet: the ACK is dispatched to `adapter.onAckReceived(packet.frame)` at the sender, advancing the window or triggering protocol actions.
     * When `dropPacket` is called on an ACK packet: an `ACK_DROPPED` event is emitted; sender window does not advance.
     * When `triggerTimeout` is called: the adapter executes `sender.handleTimeout(targetSeqNum)`.
3. **Derived UI State**:
   - The UI never computes synthetic protocol state. All markers ($S_f, S_n, R_n$), window slots, buffer contents, countdown timers, and event logs are derived directly from the engine's canonical state snapshots and event stream.
4. **Persistent Navigation Shell**:
   - Introduce a persistent modern dashboard shell inspired by the clean visual hierarchy of the routing simulator reference:
     * Sidebar navigation with icons, active state badges, and category groups.
     * Collapsible on small screens / mobile drawer.
     * Top utility bar displaying simulation clock, active protocol badge, quick-action shortcuts, and connection health.
   - 7 primary views:
     1. `Overview`
     2. `Automatic Simulation` (existing V1 experience preserved)
     3. `Manual Interactive Lab` (new flagship classroom demonstration experience)
     4. `Live UDP Network` (existing real UDP peer-to-peer mode)
     5. `Protocol Comparison` (expanded comparative analysis and benchmark)
     6. `Protocol Internals` (layered architecture and state transition diagrams)
     7. `Learning Centre` (educational lessons, sequence-number ambiguity lesson, glossary)

---

## 2. Proposed UI & Component Hierarchy

### A. Application Shell (`frontend/src/components/layout/`)
- `AppShell.tsx`: High-level layout coordinating sidebar, top navigation, and active view content.
- `Sidebar.tsx`: Navigation list with semantic icons (Overview, Auto Sim, Manual Lab, Live UDP, Comparison, Internals, Learning).
- `TopBar.tsx`: Compact header showing current view title, protocol indicator, virtual clock / agent status, keyboard shortcut trigger, and quick links.

### B. Manual Interactive Lab View (`frontend/src/components/manual-lab/`)
- `ManualLabView.tsx`: Main lab orchestrator.
- `ManualTopControlBar.tsx`: Protocol selection, scenario preset, manual stepping controls, virtual time display, reset.
- `SenderWindowPanel.tsx`:
  - Sequence-number strip $[0 \dots M-1]$.
  - $S_f$ (base) and $S_n$ (next) visual pointers.
  - Slot states: `Acknowledged`, `Outstanding (in-flight)`, `Available to send`, `Outside window`.
  - Timer dial/bar: Active countdown, elapsed time, and "Trigger Timeout" action button.
- `ChannelLanesPanel.tsx`:
  - Dual bidirectional lanes: **DATA Lane** (Left $\to$ Right) and **ACK Lane** (Right $\to$ Left).
  - In-flight packet cards with interactive action popovers:
    * `[Deliver Now]`
    * `[Drop (Lose)]`
    * `[Delay (+100ms / +500ms)]`
    * `[Inspect Packet]`
  - Distinct visual styling for in-flight, delayed, dropped, delivered, and retransmitted packets.
- `ReceiverWindowPanel.tsx`:
  - Receive window strip $[R_n \dots R_n + N - 1]$.
  - $R_n$ pointer (next expected in-order frame).
  - Out-of-order buffer slots (for Selective Repeat).
  - Discarded out-of-order counter (for Go-Back-N).
  - Delivered payload list (application layer).
- `ContextualActionArea.tsx`: Immediate actions for currently selected packet or next eligible step.
- `EventExplanationFeed.tsx`: Chronological events paired with clear educational explanations ("Why did this happen?").

### C. Protocol Internals View (`frontend/src/components/internals/`)
- `ProtocolInternalsView.tsx`: Main layout.
- `LayerArchitectureDiagram.tsx`: Visual representation of Application Layer $\leftrightarrow$ Data-Link Layer (Flow/Error Control) $\leftrightarrow$ Physical Channel.
- `StateTransitionDiagram.tsx`: State flowcharts for Stop-and-Wait, Go-Back-N, and Selective Repeat sender and receiver machines.
- `ProcessingFlowStepper.tsx`: Step-by-step walkthrough of packet encapsulation, checksum calculation, transmission, and ACK generation.

### D. Learning Centre View (`frontend/src/components/learning/`)
- `LearningCentreView.tsx`: Interactive topic browser and glossary.
- `SequenceAmbiguityLesson.tsx`: Interactive widget demonstrating the $N \le M/2$ rule for Selective Repeat and $N \le M - 1$ for Go-Back-N with adjustable sequence bits $m$ and window size $N$.
- `TopicViewer.tsx`: Rich illustrated guides for all 16 required curriculum topics.

### E. Protocol Comparison View (`frontend/src/components/comparison/`)
- `ProtocolComparisonView.tsx`: Full-page upgrade of `ProtocolComparisonModal`.
- `ComparisonMatrix.tsx`: Feature-by-feature comparison table (window sizes, ACK types, buffering, timeout scope, retransmission range, mathematical constraints).
- `BenchmarkRunner.tsx`: Simultaneous side-by-side run of Stop-and-Wait, Go-Back-N, and Selective Repeat under identical channel impairments with bar charts.

---

## 3. Inventory of Changes

### A. Existing Components to Reuse Without Breaking Changes
- `SpaceTimeDiagram.tsx` (Preserved in Automatic Simulation)
- `SimulationControls.tsx` (Reused across Auto Sim)
- `SimulationConfigPanel.tsx` (Reused across Auto Sim and Comparison)
- `PacketInspector.tsx` (Reused in both Auto Sim and Manual Lab)
- `StatisticsPanel.tsx` (Reused in Auto Sim and Comparison)
- `LiveNetworkingPanel.tsx` (Preserved in Live UDP Network page)
- `LabScenariosPanel.tsx` (Reused in Auto Sim and Learning Centre)
- `KeyboardShortcutsModal.tsx` (Reused globally)

### B. Core Backend / Engine Files to Enhance
- `agent/src/simulation/virtual-channel.ts`: Add manual control capabilities (`holdMode`, `dropPacket`, `deliverPacketNow`, `delayPacket`).
- `agent/src/simulation/simulation-engine.ts`: Expose manual stepping, packet-level intervention API, and instructor timeout trigger (`triggerTimeout`).
- `agent/src/simulation/protocol-adapters.ts`: Expose `handleTimeout(targetSeqNum?)` uniformly across all protocol adapters.
- `agent/src/simulation/simulation-events.ts`: Add pedagogical metadata to `SimulationEvent` (`explanation`, `stateBefore`, `stateAfter`).

### C. New Frontend Files to Create
- `frontend/src/components/layout/AppShell.tsx`
- `frontend/src/components/layout/Sidebar.tsx`
- `frontend/src/components/layout/TopBar.tsx`
- `frontend/src/components/overview/OverviewView.tsx`
- `frontend/src/components/manual-lab/ManualLabView.tsx`
- `frontend/src/components/manual-lab/SenderWindowTrack.tsx`
- `frontend/src/components/manual-lab/ReceiverWindowTrack.tsx`
- `frontend/src/components/manual-lab/ChannelLanes.tsx`
- `frontend/src/components/manual-lab/PacketActionMenu.tsx`
- `frontend/src/components/manual-lab/TimerIndicator.tsx`
- `frontend/src/components/manual-lab/EventExplanationInspector.tsx`
- `frontend/src/components/comparison/ProtocolComparisonView.tsx`
- `frontend/src/components/internals/ProtocolInternalsView.tsx`
- `frontend/src/components/learning/LearningCentreView.tsx`
- `frontend/src/components/learning/SequenceAmbiguityWidget.tsx`
- `frontend/src/hooks/useManualLab.ts`

---

## 4. Phase-by-Phase Implementation Roadmap

### PHASE 0 — Baseline & Architecture Audit (COMPLETED)
- **Goal:** Verify existing codebase, run tests/builds, map capabilities, document gaps.
- **Outputs Created:** `product/V2-BASELINE.md` and `product/V2-IMPLEMENTATION-PLAN.md`.
- **Exit Gate:** Verified baseline report and implementation roadmap approved.

---

### PHASE 1 — V2 Dashboard, Navigation & Design System
- **Goal:** Establish the V2 dashboard layout and navigation shell without altering simulation or live networking functionality.
- **Key Tasks:**
  1. Build `AppShell`, `Sidebar`, and `TopBar` components with responsive mobile support.
  2. Implement view routing state: `'overview'`, `'auto-simulation'`, `'manual-lab'`, `'live-udp'`, `'comparison'`, `'internals'`, `'learning'`.
  3. Relocate current V1 single-page simulation into the dedicated `Automatic Simulation` view.
  4. Relocate current V1 live networking panel into the dedicated `Live UDP Network` view.
  5. Create initial scaffold for `Overview`, `Protocol Comparison`, `Protocol Internals`, and `Learning Centre`.
  6. Ensure all 123 existing tests continue to pass and all keyboard shortcuts continue to work.
- **Files Touched:**
  - `frontend/src/App.tsx`
  - `frontend/src/components/layout/*`
  - `frontend/src/components/overview/OverviewView.tsx`
- **Exit Gate:** All 7 navigation items switch cleanly; existing Automatic Simulation and Live UDP work flawlessly without regression.

---

### PHASE 2 — Manual Simulation Engine & Controlled Channel Events
- **Goal:** Extend the simulation engine and virtual channel to support instructor-controlled delivery, dropping, and delaying of packets, and manual timeout triggering.
- **Key Tasks:**
  1. Extend `VirtualChannel` with manual delivery policy:
     - Allow queuing packets in an `AWAITING_MANUAL_DISPOSITION` state when `manualMode` is enabled.
     - Add `dropInFlightPacket(packetId)` method.
     - Add `deliverInFlightPacket(packetId)` method.
     - Add `delayInFlightPacket(packetId, extraMs)` method.
  2. Extend `IProtocolSimulationAdapter` and adapters (`StopAndWaitAdapter`, `GoBackNAdapter`, `SelectiveRepeatAdapter`) to expose `triggerTimeout(targetSeqNum?)`.
  3. Extend `SimulationEngine` with:
     - `enableManualMode(enabled: boolean)`
     - `manualDeliverPacket(packetId: string)`
     - `manualDropPacket(packetId: string)`
     - `manualDelayPacket(packetId: string, delayMs: number)`
     - `manualTriggerTimeout(targetSeqNum?: number)`
     - `manualSendNextPayload(): boolean`
  4. Write comprehensive unit tests in `agent/tests/manual-channel-control.test.ts` covering:
     - Manual delivery of DATA and ACK packets.
     - Manual drop of DATA (receiver not notified, timeout eligible).
     - Manual drop of ACK (sender window does not advance, timeout eligible).
     - Manual timeout execution across Stop-and-Wait, Go-Back-N, and Selective Repeat.
- **Files Touched:**
  - `agent/src/simulation/virtual-channel.ts`
  - `agent/src/simulation/protocol-adapters.ts`
  - `agent/src/simulation/simulation-engine.ts`
  - `agent/tests/manual-channel-control.test.ts` (New test file)
- **Exit Gate:** Unit tests prove manual channel operations trigger exact protocol state transitions without mutating internal state directly.

---

### PHASE 3 — Manual Interactive Sender–Receiver Lab
- **Goal:** Deliver the complete interactive classroom lab UI where an instructor controls every frame and ACK event.
- **Key Tasks:**
  1. Create `useManualLab` hook wrapping `SimulationEngine`'s manual controls.
  2. Implement `SenderWindowTrack`:
     - Visual strip of sequence numbers with $S_f$ (base) and $S_n$ (next) markers.
     - Distinct badges for acknowledged, in-flight, available, and outside window.
  3. Implement `ReceiverWindowTrack`:
     - Visual strip with $R_n$ marker.
     - Out-of-order buffer display for Selective Repeat.
     - Out-of-order discard counter for Go-Back-N.
     - Delivered application payloads log.
  4. Implement `ChannelLanes`:
     - Top lane: DATA frames (Sender $\to$ Receiver).
     - Bottom lane: ACK frames (Receiver $\to$ Sender).
     - Visual state: In-flight, awaiting decision, delayed, dropped, retransmitted.
  5. Implement `PacketActionMenu`:
     - Contextual popover when clicking any in-flight packet with "Deliver", "Drop", "Delay (+200ms)", "Inspect".
  6. Implement `ContextualActionArea`:
     - "Send Next Frame" (enabled only when window capacity permits).
     - "Trigger Timeout" (enabled only when a frame timer is running).
     - "Step Virtual Clock" and "Reset Lab".
  7. Implement `EventExplanationFeed`:
     - Real-time pedagogical log explaining the exact rule applied for each action.
  8. Write frontend integration tests in `frontend/tests/manual-lab.test.ts`.
- **Files Touched:**
  - `frontend/src/hooks/useManualLab.ts`
  - `frontend/src/components/manual-lab/*`
  - `frontend/tests/manual-lab.test.ts` (New test file)
- **Exit Gate:** Instructor can step-by-step demonstrate frame loss, ACK loss, out-of-order buffering, and timeout retransmissions across all 3 protocols.

---

### PHASE 4 — Sliding Window & Timer Visualizations
- **Goal:** Polish window movement, timer animations, and sequence-number wraparound visualization.
- **Key Tasks:**
  1. Add timer dials / progress rings to outstanding frames showing elapsed vs timeout limit.
  2. In Selective Repeat: render independent timer rings for each individual slot.
  3. In Go-Back-N: render the single active timer for the base frame ($S_f$).
  4. In Stop-and-Wait: render the single active timer for the transmitted frame.
  5. Visual wraparound indicators:
     - Clearly show when sequence numbers wrap around modulo $M$ (e.g. frame index 8 $\to$ seqNum 0).
     - Display absolute frame counter alongside modulo sequence number to eliminate student confusion.
  6. Smooth CSS transitions for window sliding, packet dispatch, and buffer insertions (with `prefers-reduced-motion` compliance).
- **Files Touched:**
  - `frontend/src/components/manual-lab/SenderWindowTrack.tsx`
  - `frontend/src/components/manual-lab/TimerIndicator.tsx`
  - `frontend/src/components/NetworkTopology.tsx`
- **Exit Gate:** Window tracks and timers animate accurately in lockstep with virtual time and reset cleanly.

---

### PHASE 5 — Protocol Internals & Architecture Visualization
- **Goal:** Build the dedicated Protocol Internals page inspired by the reference design.
- **Key Tasks:**
  1. Build `LayerArchitectureDiagram`:
     - Sender stack: Application Layer (payload queue) $\to$ Data-Link Layer (sequence tagging, window framing, checksum calculation) $\to$ Physical Layer (channel transmission).
     - Receiver stack: Physical Layer (frame arrival) $\to$ Data-Link Layer (checksum verification, sequence check, ACK dispatch, buffering) $\to$ Application Layer (in-order delivery).
  2. Build `StateTransitionDiagram`:
     - Interactive state machines for Stop-and-Wait (`IDLE`, `AWAITING_ACK`, `TIMEOUT`), Go-Back-N, and Selective Repeat.
  3. Add clickable node inspector explaining each layer's role in flow control vs error control.
  4. Ensure accessible static diagrams if animations are disabled.
- **Files Touched:**
  - `frontend/src/components/internals/*`
- **Exit Gate:** Instructors can switch to Protocol Internals during class to explain how sliding window relates to the OSI model.

---

### PHASE 6 — Protocol Comparison & Learning Centre
- **Goal:** Build the comprehensive Protocol Comparison and Learning Centre pages.
- **Key Tasks:**
  1. Convert `ProtocolComparisonModal` into full-page `ProtocolComparisonView`:
     - Side-by-side comparison matrix of all 3 protocols.
     - Live benchmark runner executing Stop-and-Wait, Go-Back-N, and Selective Repeat under identical conditions.
     - Theoretical utilization vs empirical efficiency charts.
  2. Build `LearningCentreView`:
     - 16 modular learning guides with definitions, step-by-step walkthroughs, and common misconceptions.
     - Comprehensive Computer Networks glossary.
  3. Build `SequenceAmbiguityWidget`:
     - Interactive lesson on the $M \ge 2N$ rule in Selective Repeat and $M > N$ in Go-Back-N.
     - Interactive sliders for sequence bits $m$ ($M = 2^m$) and window size $N$.
     - Live visual demonstration showing how overlapping receiver windows cause sequence ambiguity when $M < 2N$.
- **Files Touched:**
  - `frontend/src/components/comparison/*`
  - `frontend/src/components/learning/*`
- **Exit Gate:** Complete curriculum resource available with verified sequence-space mathematical demonstrations.

---

### PHASE 7 — Testing, Optimization & Classroom Demo Readiness
- **Goal:** End-to-end regression testing, performance optimization, and classroom presentation readiness.
- **Key Tasks:**
  1. Full regression testing:
     - Automated unit tests across agent and frontend.
     - Verification of all 5 guided scenarios.
     - Live UDP loopback and peer connection test.
     - Manual Lab scenario verification (frame loss, ACK loss, timeout, delayed ACK).
  2. Performance tuning:
     - Memoize selectors and prevent unneeded re-renders during high-speed auto simulation.
     - Verify smooth 60fps animations on standard student laptops.
  3. Accessibility and responsiveness:
     - Verify keyboard navigation for all manual actions.
     - High-contrast text and ARIA labels on all interactive controls.
     - Projector-friendly responsive layout.
  4. Create classroom presentation guide and demonstration scripts in `docs/CLASSROOM-DEMO-GUIDE.md`.
- **Files Touched:**
  - `docs/CLASSROOM-DEMO-GUIDE.md`
  - Automated tests across both workspaces.
- **Exit Gate:** Zero console warnings, 100% passing tests, flawless presentation demo path.

---

## 5. Risk Analysis & Mitigation Strategies

| Risk | Impact | Likelihood | Mitigation Strategy |
|---|---|---|---|
| **Manual controls bypass protocol state** | Critical | Low | Restrict instructor actions strictly to channel packets (`deliver`, `drop`, `delay`) and timer triggers. Protocol state machines remain unchanged. |
| **Drift between UI animations and engine state** | High | Low | UI never predicts or animates state independently; all visuals are derived strictly from `SimulationEngine.getState()` and canonical event streams. |
| **Regression in working V1 features** | High | Low | Keep all 123 existing tests active in CI/npm scripts; run full regression test before and after every phase. |
| **Student confusion over sequence wraparound** | Medium | Medium | Render both absolute packet indices ($0, 1, 2, 3\dots$) and modulo sequence numbers ($0, 1, 2, 3 \pmod M$) in the window tracks and packet cards. |
| **Live UDP confused with simulation** | Medium | Low | Distinct visual themes: Simulation modes use Slate/Indigo/Cyan palettes with "SIMULATED" badges; Live UDP uses an Emerald/Amber "LIVE UDP SOCKET" banner with local IP:Port display. |

---

## 6. Phase Acceptance Summary

| Phase | Core Deliverable | Acceptance Criteria |
|---|---|---|
| **Phase 0** | Baseline & Plan | Audit completed, 123 tests passing, baseline documents generated. |
| **Phase 1** | Navigation & Shell | 7 views navigable; Auto Sim and Live UDP fully functional in new shell. |
| **Phase 2** | Channel Engine | `VirtualChannel` supports manual packet disposition; unit tests pass. |
| **Phase 3** | Manual Lab UI | Instructor can deliver, drop, delay DATA/ACK and trigger timeouts. |
| **Phase 4** | Windows & Timers | Sequence tracks ($S_f, S_n, R_n$) and timer rings animate in lockstep. |
| **Phase 5** | Protocol Internals | Layered architecture and state transition diagrams fully interactive. |
| **Phase 6** | Comparison & Learning| Benchmark comparison and interactive $M \ge 2N$ ambiguity lesson live. |
| **Phase 7** | Polish & Classroom Demo| 100% tests passing, zero errors, classroom demonstration guide ready. |

