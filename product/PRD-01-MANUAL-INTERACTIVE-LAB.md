# Feature PRD 01 — Manual Interactive Sender–Receiver Lab

**Priority:** P0 / release-defining feature  
**Status:** Proposed  
**Parent:** PRD-V2-MASTER.md

## 1. Purpose

Give an instructor complete, understandable control over frame and acknowledgement delivery during a deterministic ARQ simulation. The instructor must be able to stop at a meaningful moment, choose what happens to an in-flight DATA frame or ACK, and show the protocol's real response.

## 2. User stories

- As an instructor, I can choose Stop-and-Wait, Go-Back-N or Selective Repeat so I can teach each protocol.
- As an instructor, I can send or advance frames and observe sender-window movement.
- As an instructor, I can deliver, lose or delay a selected DATA frame.
- As an instructor, I can deliver, lose or delay a selected ACK.
- As an instructor, I can pause and inspect sender/receiver state at any point.
- As an instructor, I can trigger a timeout when a timer is eligible.
- As a learner, I can see why a frame was accepted, discarded, buffered or retransmitted.
- As a learner, I can inspect a chronological explanation of every event.

## 3. Main screen layout

### A. Top control bar
- Protocol selector.
- Scenario selector / reset.
- Manual mode indicator.
- Start, pause, step, reset.
- Virtual time and playback speed where relevant.

### B. Sender panel — left
Show:
- sender window as a sequence-number strip;
- `Sf` / base marker;
- `Sn` / next-to-send marker;
- window size and sequence-number space;
- outstanding frames;
- sent / acknowledged / available states;
- timer display appropriate to selected protocol.

### C. Transmission channel — centre
Show two directional lanes:
- DATA: sender → receiver;
- ACK/NAK: receiver → sender.

Each packet representation should show packet kind, sequence or ACK number, status, and a clear selectable target. Packet statuses: queued, in transit, awaiting instructor decision, delivered, dropped, delayed, retransmitted.

### D. Receiver panel — right
Show:
- receive window;
- `Rn` / next expected in-order frame;
- accepted frames;
- out-of-order buffer (Selective Repeat);
- discarded out-of-order frames (Go-Back-N);
- delivered payload history.

### E. Event explanation / inspector
Show a chronological event feed and a selected-event inspector. Each event explains what happened and why, using protocol-specific wording.

### F. Instructor action area
Actions must be contextual to selected/eligible packets:
- Deliver selected DATA / ACK.
- Drop selected DATA / ACK.
- Delay selected DATA / ACK.
- Inspect packet.
- Advance virtual time / next event.
- Trigger timeout when eligible.

Do not show duplicate generic “Send frame” controls if the protocol engine has not made a frame eligible to send. The user should be able to request the next protocol step, while actual transmission eligibility remains governed by the engine.

## 4. Interaction requirements

### IR-01 — Select protocol
Changing protocol resets or explicitly confirms resetting the current run. Apply valid defaults for window and sequence space.

### IR-02 — Configure
Allow relevant parameters: payload/frame count, sender window size, sequence-number bits/space, one-way delay, timeout, and optional channel fault profile. Validate constraints before starting.

### IR-03 — DATA transmission
The engine creates a DATA packet only when the sender protocol permits transmission. It appears in the DATA lane. In manual mode, it waits for instructor disposition instead of being automatically delivered.

### IR-04 — DATA delivery
Delivering a DATA packet invokes the receiver protocol's normal receive handler. The receiver may accept, buffer, discard or identify a duplicate according to protocol rules. Any generated ACK is then represented as a new in-flight packet.

### IR-05 — DATA loss
Dropping a DATA packet records a loss event and removes it from the channel without notifying the receiver. Sender timers continue according to protocol rules.

### IR-06 — DATA delay
Delaying a packet changes its scheduled delivery time or holds it in a delayed queue. The UI must clearly indicate it is delayed. Delay must not silently alter packet contents or sequence number.

### IR-07 — ACK delivery
Delivering an ACK invokes the sender's normal acknowledgement handler. Cumulative ACK semantics for Go-Back-N and individual ACK semantics for Stop-and-Wait/Selective Repeat must be respected.

### IR-08 — ACK loss
Dropping an ACK records the loss and leaves sender state unchanged until another valid event occurs (for example, duplicate ACK or timeout). The receiver must not redeliver already-delivered payloads due to duplicate DATA.

### IR-09 — ACK delay
Delayed ACKs remain in the channel and may arrive after retransmission or after other ACKs. The engine must process them using normal protocol validation.

### IR-10 — Timeout
Timer expiration must be based on simulation time. A manual “trigger timeout” action is enabled only when a relevant timer is active and eligible, unless explicitly labelled as an instructor override. Go-Back-N retransmits the outstanding range from base; Selective Repeat retransmits only the affected frame; Stop-and-Wait retransmits its single outstanding frame.

### IR-11 — Step / pause / reset
Pause freezes virtual time and prevents automatic progression. Step advances one well-defined simulation unit/event according to documented semantics. Reset clears packets, timers, event history, counters, buffers and selection state.

### IR-12 — Event synchronization
Selecting an event highlights the corresponding frame/ACK and relevant window position. Selecting a packet highlights its originating event where possible.

## 5. Protocol-specific expected behaviour

| Behaviour | Stop-and-Wait | Go-Back-N | Selective Repeat |
|---|---|---|---|
| Sender outstanding capacity | 1 | Up to N | Up to N |
| Receiver window | 1 | 1 | Up to N |
| Out-of-order DATA | Not accepted as next payload | Discarded | Buffered if in receive window |
| ACK style | Individual | Cumulative | Individual |
| Timeout | Outstanding frame | Oldest outstanding frame | Per-frame timer |
| Retransmit | One frame | Base through outstanding end | Timed-out frame only |
| Duplicate DATA | ACK/recovery as defined; no duplicate delivery | Discard and cumulative ACK as appropriate | Re-ACK; do not redeliver |

Exact ACK number convention must match the existing engine and be displayed in the UI (e.g. “ACK 4 means next expected frame is 4” versus “ACK 3 acknowledges frame 3”). Do not mix conventions.

## 6. Visual state requirements

Use consistent semantic state styling:
- Ready / available.
- In flight.
- Delivered / acknowledged.
- Buffered.
- Dropped / lost.
- Delayed.
- Retransmitted.
- Timed out.
- Rejected / discarded.

Colour must not be the only indicator; include labels/icons and accessible contrast. Animations should have reduced-motion alternatives.

## 7. Acceptance criteria

1. Instructor can deliver or drop any eligible in-flight DATA packet.
2. Instructor can deliver or drop any eligible in-flight ACK.
3. Instructor can delay both DATA and ACK packets.
4. Receiver state changes only after DATA delivery, not on packet creation.
5. Sender state changes only after ACK delivery or another legitimate protocol event.
6. A dropped DATA frame never appears as received.
7. A dropped ACK does not falsely advance the sender window.
8. Go-Back-N discards out-of-order DATA and retransmits the required outstanding range on timeout.
9. Selective Repeat buffers valid out-of-order DATA and later delivers contiguous buffered data in order.
10. Selective Repeat retransmits only the timed-out frame.
11. Timers freeze when virtual time is paused and reset correctly.
12. Sequence-number wraparound works without confusing old and new frames.
13. Every action is reflected in event history and state visualization.
14. Reset returns the lab to a clean initial state.
15. Automated tests cover all of the above.

## 8. Implementation guidance

- Reuse the existing simulation engine, protocol adapters, event types and protocol state machines after auditing them.
- Prefer extending the virtual channel with a manual delivery policy or hold queue.
- Keep manual action orchestration separate from React components.
- Define typed commands/events for deliver, drop, delay and instructor-triggered timeout.
- Expose derived view models/selectors for sender, receiver, channel and timers.
- Do not create a second ARQ implementation for the manual UI.
- Add unit tests for channel controls and integration tests for each protocol scenario.
