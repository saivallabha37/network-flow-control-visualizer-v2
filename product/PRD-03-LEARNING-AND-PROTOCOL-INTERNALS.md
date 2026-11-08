# Feature PRD 03 — Learning Centre, Protocol Comparison and Internals

**Priority:** P1 after Manual Lab foundations  
**Status:** Proposed  
**Parent:** PRD-V2-MASTER.md

## 1. Purpose

Turn the visualizer into a reusable learning resource, not only a demonstration tool. Learners should be able to understand the concepts before, during and after a simulation.

## 2. Protocol Internals view

Create a dedicated page inspired by the user's third reference screenshot.

### Required content
- Sender-side application/network layer, data-link layer and physical transmission role.
- Receiver-side physical reception, data-link processing and delivery to upper layer.
- DATA frame path from sender to receiver.
- ACK/NAK path from receiver to sender.
- Sender and receiver algorithm flow.
- Timer/timeout event path.
- Event notification flow between protocol engine and visualization.

### Interaction
- Select a stage to see its responsibility.
- Highlight the corresponding event or packet when available.
- Toggle sender-side and receiver-side algorithm explanations.
- Provide a clear static fallback diagram; animation must not be required to understand the architecture.

### Accuracy
The diagram is a teaching abstraction. Label layers and responsibilities accurately. Do not imply that the browser's application-level frame is a raw Ethernet frame.

## 3. Protocol comparison

Compare:
- Stop-and-Wait ARQ.
- Go-Back-N ARQ.
- Selective Repeat ARQ.

Required dimensions:
- sender window size;
- receiver window size;
- ACK semantics;
- handling of out-of-order frames;
- receiver buffering;
- timer model;
- retransmission scope;
- duplicate handling;
- sequence-number space constraints;
- advantages and trade-offs;
- suitable scenarios.

### Comparison interaction
- Select two or three protocols.
- View a side-by-side comparison.
- Optionally run them against the same deterministic scenario/configuration.
- Show observed metrics with definitions and assumptions.

Do not compare metrics from runs with different payload counts, delay, loss, window settings or seeds without disclosing those differences.

## 4. Learning Centre topics

Minimum topic set:
1. What is flow control?
2. What is ARQ?
3. Stop-and-Wait ARQ.
4. Sliding Window mechanism.
5. Go-Back-N ARQ.
6. Selective Repeat ARQ.
7. Sequence numbers and modulo arithmetic.
8. Sender window and receiver window.
9. ACK and NAK.
10. Cumulative versus individual acknowledgements.
11. Frame loss versus ACK loss.
12. Timeout and retransmission.
13. Duplicate frames and duplicate ACKs.
14. Out-of-order reception and buffering.
15. Sequence-number ambiguity and half-space rule.
16. Throughput and channel utilization.

Each topic should contain:
- short definition;
- step-by-step explanation;
- relevant visual or example;
- common misconception;
- link to launch a relevant scenario where applicable.

## 5. Sequence-number ambiguity lesson

Provide an interactive explanation for sequence space `M = 2^m`.

For Selective Repeat, explain and enforce:
`N <= M/2`.

Allow learners to adjust sequence-number bits and window size. Show:
- sequence-number range;
- sender window;
- receiver window;
- whether configuration is valid;
- why overlapping old/new sequence interpretations can cause ambiguity.

For Go-Back-N, explain the sender-window limit `N <= M - 1` and receiver window size 1.

The lesson must handle modulo wraparound accurately and distinguish sequence numbers from absolute frame identities.

## 6. Learning scenario presets

Retain and review existing scenarios:
- Loss-Free Baseline.
- High-Latency Satellite Link.
- Go-Back-N Recovery.
- Selective Repeat Buffering.
- Lost Acknowledgement Recovery.

Add or improve scenarios only when they teach a distinct concept. Each preset should state:
- learning objective;
- protocol;
- configuration;
- expected key events;
- what the learner should observe;
- reset/replay instructions.

## 7. Acceptance criteria

- Protocol Internals shows both sender and receiver paths and the bidirectional DATA/ACK relationship.
- All three ARQ protocols have accurate comparison entries.
- Learning topics use consistent terminology and correct sequence-number constraints.
- Interactive sequence-space lesson validates invalid configurations.
- Each guided scenario has an explicit learning objective and expected outcome.
- Learning content links to relevant simulations where appropriate.
