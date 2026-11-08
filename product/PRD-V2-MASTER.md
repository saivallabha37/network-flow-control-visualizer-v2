# Product Requirements Document — Network Flow Control Visualizer V2

**Document version:** 1.0  
**Product release:** V2  
**Status:** Proposed baseline for implementation  
**Date:** 03 November 2026  
**Product owner:** Project team  
**Source baseline:** `saivallabha37/network-flow-control-visualizer-v1`

---

## 1. Product vision

Build a polished, interactive educational platform that helps students understand reliable data transmission and ARQ flow-control protocols by seeing every meaningful state transition. The platform must support both automatic demonstrations and teacher-directed, step-by-step classroom demonstrations.

V2 is an evolution of the existing V1 project, not a rewrite from scratch. It must preserve working protocol engines, deterministic simulation, event telemetry, tests and real UDP networking while improving the user experience and adding a dedicated manual teaching laboratory.

## 2. Problem statement

Students often find sliding-window and ARQ concepts difficult because the important behaviour is distributed across sender state, receiver state, sequence numbers, acknowledgements, timers, loss and retransmission. Static diagrams do not show how those values change over time.

During a classroom explanation, the instructor may want to pause at an arbitrary moment and decide whether a particular DATA frame or ACK is delivered, lost or delayed. A conventional automatic simulation does not provide sufficient instructional control.

The product must make the protocol state visible, explain why each transition occurs, and let the instructor control the channel without violating the protocol's actual rules.

## 3. Goals

- G1: Deliver a clear, professional, easy-to-navigate educational interface.
- G2: Provide a dedicated manual sender–receiver lab with teacher-controlled channel events.
- G3: Visualize sender and receiver windows, sequence numbers, outstanding frames, buffering, ACKs and timers accurately.
- G4: Explain frame loss, ACK loss, timeout, retransmission, duplicate detection and out-of-order delivery.
- G5: Retain automatic deterministic simulation and existing guided scenarios.
- G6: Retain and clearly separate live UDP networking from in-browser simulation.
- G7: Provide a learning centre, protocol comparison and protocol-internals view.
- G8: Make the product reliable enough for a live classroom demonstration.

## 4. Non-goals

- Replacing ARQ protocol logic with animations or UI-only mock state.
- Rebuilding the product using the routing-simulator's routing algorithms or architecture.
- Copying the reference repository's complete code or visual assets.
- Replacing UDP with TCP or introducing cloud infrastructure.
- Adding user accounts, classroom management, grading or a database in this release.
- Claiming the live UDP demo is a raw Ethernet/data-link implementation. The existing system sends application-level protocol frames inside UDP datagrams; UI terminology must remain accurate.
- Adding unrelated routing protocols such as RIP, OSPF or BGP.

## 5. Target users and primary jobs

### Instructor / demonstrator
Needs to select a protocol, configure a scenario, pause at any point, control the fate of a frame or ACK, trigger a timeout and explain the resulting state.

### Student / learner
Needs to observe transmission, understand sequence numbers and windows, inspect protocol events, compare protocols and learn why the protocol behaves as it does.

### Project evaluator
Needs to see a polished product, reproducible demonstrations, correct protocol behaviour, a clear architecture and a working live networking demonstration.

## 6. Product navigation

Recommended primary navigation:

1. **Overview** — product introduction, quick-start actions and mode status.
2. **Automatic Simulation** — existing deterministic simulation experience.
3. **Manual Interactive Lab** — new instructor-controlled experience.
4. **Live UDP Network** — existing peer-to-peer live demonstration.
5. **Protocol Comparison** — side-by-side behaviour and metrics.
6. **Protocol Internals** — sender/receiver and layered architecture view.
7. **Learning Centre** — concepts, glossary, examples and guided lessons.

Navigation labels may be refined during design, but the separation between Manual Lab, Automatic Simulation and Live UDP must remain clear.

## 7. Supported protocols and terminology

- Stop-and-Wait ARQ.
- Go-Back-N ARQ.
- Selective Repeat ARQ.
- Sliding Window is a general flow-control mechanism used by window-based protocols; do not present it as a fourth independent ARQ algorithm.

Use consistent terminology:
- `Sf` / `base`: first unacknowledged sender sequence position.
- `Sn` / `nextSeq`: next sequence number to send.
- `Rn` / `rcvBase`: next in-order sequence number expected by receiver.
- `N`: configured window size.
- `M`: sequence-number space, where `M = 2^m` for `m` sequence bits.
- ACK semantics must be explicitly documented as either cumulative or individual, with the exact ACK-number convention shown in the UI.

Protocol constraints:
- Stop-and-Wait uses sender and receiver window size 1.
- Go-Back-N receiver window size is 1; out-of-order frames are discarded; ACKs are cumulative. The sender retransmits outstanding frames from the base on timeout.
- Selective Repeat buffers valid out-of-order frames and retransmits only the affected timed-out frame. Sender and receiver windows must obey the half-sequence-space constraint: `N <= M/2`.
- Sequence-number wraparound must be handled correctly. UI labels must distinguish absolute frame identity from the modulo sequence number when needed.

## 8. Functional requirements

### FR-01 — V2 application shell
The application shall provide persistent navigation and a consistent visual hierarchy across all primary sections.

### FR-02 — Automatic simulation preservation
The application shall retain existing deterministic simulation capabilities, including protocol selection, configuration, play/pause, stepping, reset, run-to-completion, event history, packet inspection, metrics and guided scenarios, subject to baseline verification.

### FR-03 — Manual interactive lab
The application shall provide a separate lab in which the instructor controls channel outcomes for DATA frames and ACKs.

### FR-04 — Sender visualization
The lab shall show sender window boundaries, `Sf`, `Sn`, outstanding frames, available send capacity, transmitted frames and acknowledgement progress.

### FR-05 — Receiver visualization
The lab shall show receiver window boundaries, `Rn`, accepted frames, discarded frames, buffered out-of-order frames and payloads delivered to the upper layer.

### FR-06 — Channel visualization
The lab shall show DATA and ACK packets travelling in opposite directions, with distinct visual states for queued, in-transit, delivered, dropped, delayed and retransmitted packets.

### FR-07 — Teacher-controlled channel actions
For each eligible in-flight packet, the instructor shall be able to:
- deliver it successfully,
- drop it,
- delay it,
- inspect its metadata.

The instructor shall also be able to advance the simulation and trigger an eligible timeout. Actions must be constrained by the current state; invalid actions must be disabled or explained.

### FR-08 — Timer visualization
The lab shall show the relevant timer state and remaining time. Stop-and-Wait shall show its outstanding-frame timer; Go-Back-N shall show the timer associated with the oldest unacknowledged frame; Selective Repeat shall show individual outstanding-frame timers.

### FR-09 — Event explanation
Each meaningful action shall create a chronological event entry with timestamp/virtual time, event type, affected sequence/ACK number and a concise explanation of the resulting protocol behaviour.

### FR-10 — State inspector
Users shall be able to inspect sender state, receiver state, channel queue, frame details, ACK details, retry counts and timer state.

### FR-11 — Protocol Internals
A separate view shall explain the application/network, data-link and physical-layer roles in the educational model, and show sender and receiver processing flows.

### FR-12 — Protocol comparison
Users shall be able to compare Stop-and-Wait, Go-Back-N and Selective Repeat by window sizes, ACK strategy, out-of-order handling, buffering, timeout model, retransmission scope, sequence-number constraints and observed simulation metrics.

### FR-13 — Learning Centre
The product shall include clear explanations of sequence numbers, wraparound, sender/receiver windows, ACK/NAK, frame loss, ACK loss, timeout, retransmission, duplicate detection, buffering and protocol trade-offs.

### FR-14 — Live UDP preservation
The existing live UDP networking mode shall remain available and visually distinct from simulation modes. Existing handshake, peer communication, message/file transfer, fault injection and telemetry must be regression-tested.

### FR-15 — Accessibility and usability
The interface shall support keyboard operation for core controls, visible focus states, readable contrast, reduced-motion preferences and responsive layouts.

## 9. Manual lab interaction model

The manual lab must not directly set arbitrary sender or receiver state from UI controls. The instructor controls the channel and simulation clock; the existing protocol state machines determine the resulting state.

Expected conceptual sequence:
1. User configures protocol and scenario.
2. User starts or steps the simulation.
3. Protocol engine creates DATA/ACK transmissions as dictated by its rules.
4. The channel exposes eligible in-flight packets to the instructor.
5. Instructor chooses deliver, drop or delay.
6. On delivery, the receiving protocol endpoint processes the packet normally.
7. The endpoint may generate an ACK or update its receive state.
8. The event log, window visualizations, timers and metrics update from actual engine events.

A manual timeout action is permitted only when a timer is eligible to expire, unless the product explicitly labels the action as a teaching override. If a forced timeout is provided, the UI must disclose that it is instructor-triggered rather than a naturally elapsed timeout.

The exact implementation should extend the simulation/channel abstraction through a controlled/manual delivery policy. Do not fork or duplicate the protocol state machines.

## 10. Non-functional requirements

- Correctness: visual state must be derived from canonical protocol state/events.
- Determinism: same configuration and manual action sequence must reproduce the same event sequence.
- Performance: normal classroom scenarios should animate smoothly on a typical student laptop; avoid unnecessary rendering of the entire application on every timer tick.
- Reliability: reset must clear all simulation state, queued packets, timers, logs and selections.
- Maintainability: UI components, state selectors, simulation logic and networking logic must remain separated.
- Compatibility: preserve current supported Node.js/browser requirements unless a justified change is documented.
- Resilience: a failed live agent must not prevent simulation and learning modes from working.
- Clarity: never show fabricated values; use “not applicable” or “unavailable” where appropriate.
- Safety: keep live agent control interfaces bound and protected according to the existing security model.

## 11. Visual design principles

Use the routing-simulator project strictly as visual inspiration:
- persistent sidebar/navigation,
- clear dashboard hierarchy,
- cohesive cards and inspector panels,
- readable event timeline,
- restrained colour system,
- purposeful motion and state transitions,
- clear separation of configuration, visualization and explanation.

Do not copy its cartography theme, routing-specific components, algorithms or complete source code. Create an original visual identity appropriate for ARQ and classroom learning.

Recommended design direction:
- professional, modern networking laboratory,
- neutral dark or light surfaces with a consistent theme,
- semantic colours: DATA, ACK, success, warning, loss/error and neutral state,
- strong typography and clear labels,
- animation should communicate protocol state, not decorate the screen.

## 12. Success metrics

- An instructor can demonstrate a frame loss and explain the resulting timeout/retransmission without leaving Manual Lab.
- An instructor can demonstrate ACK loss and duplicate handling.
- Go-Back-N visibly discards out-of-order frames and retransmits the correct outstanding range.
- Selective Repeat visibly buffers out-of-order frames and retransmits only the missing/timed-out frame.
- Window positions and timers always match engine state.
- Automatic simulation and live UDP pass regression tests.
- A first-time student can identify sender, receiver, channel, window positions and current event without external instructions.

## 13. Release acceptance criteria

V2 is ready for classroom review when:
- all primary navigation destinations work;
- no V1 capability has been silently removed;
- manual delivery/drop/delay actions work for DATA and ACK packets;
- timers and retransmission behaviour are correct for all three protocols;
- event log and visual state remain synchronized;
- protocol constraints and wraparound are validated;
- Protocol Internals and comparison views are complete;
- live UDP regression checks pass;
- typecheck, build and automated tests pass;
- the application has a reliable demo/reset path and no placeholder or misleading controls.

## 14. Risks and mitigations

| Risk | Mitigation |
|---|---|
| UI animation drifts from actual protocol state | Render from engine state and canonical events only |
| Manual controls create impossible protocol states | Control channel delivery and clock, not protocol internals |
| V2 breaks working V1 features | Create separate repository and baseline regression suite |
| Too many features delay the core lab | Prioritize manual lab, windows, timers and event explanations |
| Sequence wraparound confuses learners | Show absolute frame identity and modulo sequence number |
| Live UDP behaves differently from deterministic simulation | Keep modes distinct and explain physical network variability |
| Design reference is copied too literally | Use layout principles only; create original ARQ-specific components |
