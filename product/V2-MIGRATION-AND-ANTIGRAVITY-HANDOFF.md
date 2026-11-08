# V2 Migration and Antigravity Handoff

**Purpose:** Safely create a separate V2 repository from the existing V1 project and guide Antigravity through implementation.

## 1. Repository strategy

Keep the current V1 repository unchanged:

`https://github.com/saivallabha37/network-flow-control-visualizer-v1`

Create a new repository, for example:

`network-flow-control-visualizer-v2`

V2 should begin as a complete copy of V1's current files and folders, then receive the V2 PRD pack and implementation changes.

Do not build V2 directly on the V1 main branch. Do not delete or overwrite V1.

## 2. Recommended creation process

1. Open the V1 repository on GitHub.
2. Use GitHub's **Use this template** option if the repository is configured as a template, or use GitHub's import/copy workflow, or clone and push to a new empty repository.
3. Create the new repository under the intended owner/account.
4. Preserve the complete project structure, including:
   - `agent/`
   - `frontend/`
   - `docs/`
   - `scripts/`
   - root `package.json`
   - lockfile
   - Windows batch scripts and agent helpers
   - tests, configs, certificates-generation scripts and documentation that are part of the project.
5. Do not copy generated dependencies/build outputs such as `node_modules`, `dist`, coverage output or temporary files if they are ignored/generated.
6. Add this PRD pack to a root folder such as `product/` or `docs/v2-prd/`.
7. Update repository name, README title, project metadata and badges where needed. Do not make broad dependency upgrades as part of the copy step.
8. Clone the new V2 repository locally.
9. Install dependencies and run the existing baseline commands before any redesign:
   - `npm install`
   - `npm run typecheck`
   - `npm test`
   - `npm run build`
10. Record actual results and current known failures in `V2-BASELINE.md`.

### Git-based alternative

If using Git locally:

```bash
git clone https://github.com/saivallabha37/network-flow-control-visualizer-v1.git
cd network-flow-control-visualizer-v1

# Remove the V1 remote and connect the copied working tree to the new V2 repository.
git remote remove origin
git remote add origin https://github.com/<OWNER>/network-flow-control-visualizer-v2.git

git push -u origin main
```

This transfers the existing Git history as well as the files. If you prefer a clean V2 history, create a new repository and copy the working tree without the `.git` directory, then initialize a new Git repository. Choose one strategy deliberately.

## 3. Before Antigravity edits code

Antigravity must:
- read all PRD files;
- inspect the complete repository;
- identify actual existing modules and test coverage;
- verify README claims against source code;
- map current components and simulation APIs to proposed pages;
- identify missing capabilities;
- produce a phased implementation plan with file-level changes;
- identify protocol correctness risks;
- preserve working behaviour.

It must not assume a feature is missing just because the PRD asks for a new view. For example, existing space-time diagram, event timeline, packet inspector, guided scenarios and simulation controls should be audited and reused.

## 4. Recommended V2 implementation phases

### Phase 0 — Baseline and architecture audit
- inventory frontend components, hooks, types and routes;
- inventory protocol engines, simulation adapters, channel, clocks and event types;
- inventory live UDP and WebSocket subsystems;
- run baseline tests/build/typecheck;
- create V1-to-V2 feature mapping.

**Exit gate:** verified baseline and gap analysis accepted.

### Phase 1 — App shell and design system
- introduce navigation and page shell;
- retain existing simulation and live panels;
- improve responsive layout and component hierarchy;
- ensure every existing feature remains accessible.

**Exit gate:** all V1 workflows remain usable through the new shell.

### Phase 2 — Manual channel control foundation
- audit virtual channel scheduling;
- implement a controlled delivery policy/hold queue;
- add typed deliver/drop/delay commands;
- preserve deterministic clock semantics;
- add unit/integration tests.

**Exit gate:** tests prove manual channel control does not bypass protocol state machines.

### Phase 3 — Manual Lab UI
- sender panel;
- receiver panel;
- bidirectional channel;
- contextual controls;
- event explanation and inspector.

**Exit gate:** instructor can control DATA and ACK outcomes for all three protocols.

### Phase 4 — Window and timer visualizations
- sender and receiver window tracks;
- Sf/Sn/Rn markers;
- outstanding/acknowledged/buffered states;
- timer views and timeout/retransmission animation;
- wraparound visual treatment.

**Exit gate:** visual state is derived from real protocol state and passes edge-case tests.

### Phase 5 — Internals, comparison and learning
- protocol layer architecture;
- sender/receiver algorithm flow;
- comparison workspace;
- learning centre and sequence-number lesson.

**Exit gate:** content and diagrams reviewed for protocol accuracy.

### Phase 6 — Regression, polish and classroom demo
- test all V1 capabilities;
- test manual scenarios;
- test live UDP on loopback and two laptops when available;
- accessibility and responsive checks;
- remove placeholder/unused UI;
- prepare a predictable demo script.

**Exit gate:** build, typecheck, automated tests and live demo checklist pass.

## 5. Antigravity master instruction

Paste the following into Antigravity after the new V2 repository is ready:

---

You are working on **Network Flow Control Visualizer V2**, an evolution of an existing React + TypeScript + Vite frontend and Node.js + TypeScript networking agent.

Before changing any code, read:
- `product/README-FIRST.md`
- `product/PRD-V2-MASTER.md`
- `product/PRD-01-MANUAL-INTERACTIVE-LAB.md`
- `product/PRD-02-UI-AND-NAVIGATION.md`
- `product/PRD-03-LEARNING-AND-PROTOCOL-INTERNALS.md`
- `product/V2-MIGRATION-AND-ANTIGRAVITY-HANDOFF.md`

The existing V1 project is the source of truth for current code and behaviour. The routing-simulator GitHub repository is a visual design reference only. Do not merge its code or routing algorithms into this project.

**First task: audit, do not implement yet.**

1. Inspect all folders and important files.
2. Verify the current protocol engines, deterministic simulation, channel, timers, event model, frontend components and live UDP subsystem.
3. Run existing typecheck, tests and build. Record the actual output.
4. Create `product/V2-BASELINE.md` containing:
   - repository structure;
   - existing capabilities verified in code;
   - existing capabilities that are only documented but not verified;
   - test/build status;
   - key modules to reuse;
   - gaps against each PRD;
   - risks and dependencies.
5. Create `product/V2-IMPLEMENTATION-PLAN.md` with phases, file-level changes, test strategy and acceptance gates.
6. Stop and present the audit and plan for review before broad implementation.

**Critical engineering rules:**
- Do not rewrite the ARQ protocol engines unless a verified defect requires it.
- Do not duplicate protocol logic in React components.
- The manual lab must control the simulation channel and virtual clock, not directly mutate sender/receiver protocol state.
- UI state must be derived from canonical engine state and typed events.
- Preserve deterministic simulation and existing event semantics.
- Preserve live UDP, WebSocket telemetry, handshake, message/file transfer and fault injection.
- Clearly distinguish simulated traffic from real UDP traffic.
- Respect protocol rules: Go-Back-N cumulative ACK and receiver window size 1; Selective Repeat individual ACKs, out-of-order buffering and `N <= M/2`; Stop-and-Wait single outstanding frame.
- Handle modulo sequence-number wraparound correctly.
- Never display invented state, packet values or metrics.
- Keep changes incremental. Run relevant tests after each phase.
- Do not remove a feature merely to simplify the redesign.
- Do not introduce new dependencies or upgrade the toolchain without documenting why.

**Design direction:**
Build an original ARQ educational laboratory UI. Take inspiration from the reference's clear navigation, panel organization, inspector, timeline, status indicators and purposeful animations. Do not copy its branding, theme or unrelated features.

Begin with the repository audit and implementation plan. Do not start a wholesale redesign before the baseline is understood.

---

## 6. Suggested V2 repository structure

Keep the existing source structure and add product documentation rather than reorganizing everything prematurely:

```text
network-flow-control-visualizer-v2/
├── agent/
├── frontend/
├── docs/
├── scripts/
├── product/
│   ├── README-FIRST.md
│   ├── PRD-V2-MASTER.md
│   ├── PRD-01-MANUAL-INTERACTIVE-LAB.md
│   ├── PRD-02-UI-AND-NAVIGATION.md
│   ├── PRD-03-LEARNING-AND-PROTOCOL-INTERNALS.md
│   ├── V2-MIGRATION-AND-ANTIGRAVITY-HANDOFF.md
│   ├── V2-BASELINE.md          # Antigravity creates during audit
│   └── V2-IMPLEMENTATION-PLAN.md # Antigravity creates during audit
├── package.json
└── README.md
```

Do not force this exact structure if the repository already has a better documentation convention. Keep the PRDs discoverable.
