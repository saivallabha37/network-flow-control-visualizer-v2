# Network Flow Control Visualizer V2 — Product Documentation Pack

**Purpose:** This pack defines the product direction and implementation requirements for V2. It is intended to be copied into the root of the new V2 repository and supplied to Antigravity as the source of truth.

## Documents

1. `PRD-V2-MASTER.md` — overall product requirements, goals, scope, users, quality bar and release acceptance.
2. `PRD-01-MANUAL-INTERACTIVE-LAB.md` — teacher-controlled sender/receiver laboratory.
3. `PRD-02-UI-AND-NAVIGATION.md` — application shell, visual design system and navigation.
4. `PRD-03-LEARNING-AND-PROTOCOL-INTERNALS.md` — protocol explanations, layer architecture, comparison and learning resources.
5. `V2-MIGRATION-AND-ANTIGRAVITY-HANDOFF.md` — how to create the separate V2 repository, preserve V1, inspect the inherited code and instruct Antigravity.

## Important project context

- **V1 source repository:** https://github.com/saivallabha37/network-flow-control-visualizer-v1
- **UI inspiration only:** https://github.com/nani224/routing-simulator
- V2 is a separate repository created by the project owner by copying the complete V1 project.
- V1 must remain unchanged and available as a stable reference.
- The routing-simulator repository is a design reference, not a codebase to merge, fork or replace the ARQ project with.
- V2 must retain the existing React + TypeScript + Vite frontend, Node.js + TypeScript agent, simulation engine, protocol implementations, tests, and live UDP/WebSocket capability unless an audit proves a change is necessary.

## How Antigravity should use this pack

Read all documents before editing code. Then inspect the actual repository and produce:
1. a verified V1 baseline inventory,
2. a gap analysis against these PRDs,
3. an implementation plan with file-level changes,
4. a test plan,
5. only then begin implementation in small, verifiable phases.

Do not treat README claims as proof that every feature is fully implemented. Verify code and tests.
