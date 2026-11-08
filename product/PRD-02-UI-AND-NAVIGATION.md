# Feature PRD 02 — V2 UI, Navigation and Visual Design

**Priority:** P0  
**Status:** Proposed  
**Parent:** PRD-V2-MASTER.md

## 1. Purpose

Redesign the V1 frontend into a cohesive, polished networking learning laboratory inspired by the clarity and information architecture of the routing-simulator reference, while creating an original ARQ-focused design.

## 2. Design reference boundaries

Reference: https://github.com/nani224/routing-simulator

Take inspiration from:
- persistent navigation;
- clear workspace hierarchy;
- consistent cards and panels;
- well-structured inspectors;
- timeline/event log presentation;
- clear status indicators;
- deliberate animations and visual feedback.

Do not copy:
- routing protocol features or algorithms;
- routing topology concepts that do not apply to ARQ;
- complete source files, branding, illustrations or assets;
- the reference's cartography theme as-is.

Create an original identity for a network flow-control and ARQ learning lab.

## 3. Navigation and page structure

Persistent primary navigation:
- Overview
- Automatic Simulation
- Manual Interactive Lab
- Live UDP Network
- Protocol Comparison
- Protocol Internals
- Learning Centre

The current V1 header-based mode selection may be reorganized, but all existing functionality must remain reachable.

## 4. Page requirements

### Overview
- concise product purpose;
- clear entry points to Manual Lab, Automatic Simulation and Live UDP;
- visible agent connection status where relevant;
- short explanation distinguishing simulation from live networking.

### Automatic Simulation
- preserve current controls and panels;
- improve layout and hierarchy;
- retain guided scenarios, space-time diagram, packet inspector, timeline and metrics.

### Manual Interactive Lab
- implement layout described in `PRD-01-MANUAL-INTERACTIVE-LAB.md`;
- sender left, channel centre, receiver right on desktop;
- stack responsively on smaller screens without hiding essential controls.

### Live UDP Network
- preserve current peer setup, connection status, chat/file transfer and telemetry;
- clearly indicate local agent connection and peer connection;
- visually distinguish real UDP activity from simulated packets.

### Protocol Comparison
- comparison matrix and side-by-side simulation result;
- definitions and assumptions for metrics;
- never declare a protocol “best” without explaining scenario/configuration context.

### Protocol Internals
- dedicated layered architecture view;
- sender and receiver processing flows;
- link each stage to relevant protocol events where possible.

### Learning Centre
- searchable or browsable topics;
- concise explanations, diagrams, examples and glossary.

## 5. Visual system

- Use consistent spacing, typography, border radius, elevation and iconography.
- Use semantic colours for DATA, ACK, success, warning, loss/error, buffered and neutral states.
- Ensure text labels accompany colour-coded state.
- Prefer clear information density over decorative effects.
- Use motion to show state transitions and packet movement.
- Respect `prefers-reduced-motion`.
- Keep visualizations readable on a projector and common laptop screen.
- Ensure responsive behaviour and keyboard focus visibility.
- Avoid excessive legends, duplicate labels, placeholder panels and unused empty space.

## 6. Shared component candidates

Audit existing components before creating new ones. Potential shared components:
- AppShell / Sidebar / TopBar.
- PageHeader / Breadcrumbs.
- StatusBadge.
- MetricCard.
- EventTimeline.
- PacketChip / PacketInspector.
- WindowStrip / SequenceNumberTrack.
- TimerIndicator.
- EmptyState / ErrorState.
- ConfirmResetDialog.
- EducationalCallout.

Do not create abstractions prematurely. Reuse existing components when they already meet the requirements.

## 7. Acceptance criteria

- Navigation is consistent and every item opens the correct page.
- No existing V1 functionality becomes inaccessible.
- Manual, automatic and live modes are unmistakably different.
- The main Manual Lab workspace is understandable at a glance.
- Window, timer and packet states use consistent visual language across pages.
- UI remains usable on laptop and projector-sized displays.
- Keyboard focus, contrast and reduced-motion behaviour are addressed.
- No broken routes, placeholder buttons or decorative controls without working actions.
