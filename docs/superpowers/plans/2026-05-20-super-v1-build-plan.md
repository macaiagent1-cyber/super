# Super — V1 Build Plan (Definitive)

> **Single authoritative plan for shipping the full v1 of Super.** Replaces the [2026-05-19 execution playbook](2026-05-19-super-execution-playbook.md), which had a deprecated 18-hour deadline. **No timeline pressure.** Milestone gates over calendar dates.

**Date:** 2026-05-20
**Status:** **Awaiting your green-light to start M1.Task01**
**Scope:** Full v1 per spec §16 — flight, combat, AI, audio, UI, save, all of it
**Predecessors:** Spec v0.2 ([`specs/2026-05-19-game-super-design.md`](../specs/2026-05-19-game-super-design.md)) · Strategic game plan ([`plans/2026-05-19-super-game-plan.md`](2026-05-19-super-game-plan.md)) · Codex M1 task list ([`plans/2026-05-19-super-m1.md`](2026-05-19-super-m1.md))
**Supersedes:** Sprint execution playbook ([`plans/2026-05-19-super-execution-playbook.md`](2026-05-19-super-execution-playbook.md)) — time-boxed; you've removed the time box

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [V1 done definition — the full game](#2-v1-done-definition)
3. [Current state snapshot](#3-current-state-snapshot)
4. [Approvals received](#4-approvals-received)
5. [Tech stack & install matrix](#5-tech-stack-and-install-matrix)
6. [External accounts & asset inventory](#6-external-accounts-and-assets)
7. [**Agent roster — every executor, with their skills, tools, repos**](#7-agent-roster)
8. [Skills inventory — what each skill does and when it fires](#8-skills-inventory)
9. [Tools & MCP servers inventory](#9-tools-and-mcp-inventory)
10. [Milestones M1 → M5 → v1 ship](#10-milestones)
11. [Per-milestone task detail](#11-per-milestone-detail)
12. [Quality gates between milestones](#12-quality-gates)
13. [Risk register](#13-risk-register)
14. [Run book](#14-run-book)
15. [Green-light protocol](#15-green-light-protocol)

---

## 1. Executive summary

We are building the complete **Super** — a 3D open-world flying superhero browser game per spec v0.2. **No time pressure**; ship each milestone when it feels right.

Five milestones deliver v1:

- **M1** — Vertical slice (engine + city + flight, both backends)
- **M2** — Hero polish (rigged GLB, Mixamo anims, cape, lighting, asset pipeline)
- **M3** — Combat (Rapier physics, punch, heat vision, grab+throw, dodge, destructibles)
- **M4** — Life (civilian AI, traffic AI, threat AI, audio system, music)
- **M5** — Ship polish (HUD, menus, save, pointer-lock UX, gamepad, deploy)

Each milestone has its own detailed task plan, executed via multi-agent orchestration. You gate each milestone with a playtest. The Codex-authored M1 task plan ([3,176 lines, 23 tasks](2026-05-19-super-m1.md)) is the only milestone with full task-level detail today — M2-M5 each get their own task plan when M1 lands.

The orchestrator is me (Claude Opus 4.7). The heavy lifters are **Codex `gpt-5.5`** (high reasoning + priority/fast tier), **Gemini 3 Flash Preview** (fact-check), **Opus subagents** spawned via the `Agent` tool (parallel work + code review), and **Ollama** local models (game-time NPC dialogue in v1.1). You are the gatekeeper and playtest judge.

---

## 2. V1 done definition

The complete game ships when you can do all of this (verbatim from spec §16, no compression):

- ✅ Open the URL (local dev server or deployed)
- ✅ See a 3×3 procedurally-arranged district at 60 FPS @ `high` preset
- ✅ Fly anywhere with banking, boost, hover, dive, superhero landing
- ✅ Punch a car and watch it launch with debris + sound
- ✅ Use heat vision on a wall and see a scorch decal + audio sizzle
- ✅ Grab a thrown prop and chuck it
- ✅ Take damage from threat AI, dodge, recover
- ✅ See cape flowing in wind (bone-driven vertex shader; webgpu-high tier may upgrade to compute Verlet)
- ✅ Toggle dev console with `~` for quality, seed, spawn, perf-capture commands
- ✅ Pause cleanly (pointer-lock-aware), resume cleanly
- ✅ Settings + progress persist across reload, gracefully recover from corruption
- ✅ Optionally play with a gamepad
- ✅ Both WebGPU and WebGL2 backends boot and render with appropriate quality tier
- ✅ Adaptive music (calm / exploration / combat)
- ✅ Procedural city has cars driving + civilians walking + threat AI showing up

What v1 does NOT need (per spec):
- Multiplayer
- Persistent saves beyond settings + progress
- Story missions with scripted cutscenes
- Mobile / touch input
- More than one district map (multi-district streaming = v1.1+)

---

## 3. Current state snapshot

`/Users/kdawg/Projects/super/` already contains:

```
├── .git/                          ✅ initialized + 3 commits
│   ├── 76f718b initial scaffold
│   ├── 37a7e3e final consolidated game plan
│   └── b3ebe94 sprint execution playbook (now superseded)
├── docs/superpowers/
│   ├── specs/2026-05-19-game-super-design.md       ✅ v0.2, treated as approved
│   └── plans/
│       ├── 2026-05-19-super-m1.md                  ✅ Codex's 23 TDD tasks
│       ├── 2026-05-19-super-game-plan.md           ✅ strategic
│       ├── 2026-05-19-super-execution-playbook.md  📦 superseded
│       └── 2026-05-20-super-v1-build-plan.md       ← this file
├── research/01-09-*.md                              ✅ 9 artifacts
├── package.json                                     ✅ three@^0.184.0, howler, meshoptimizer, vite, vitest
├── vite.config.js                                   ✅ port 5173, no auto-open
├── index.html                                       ✅ scaffolded
├── public/                                          (empty)
├── tests/                                           (empty — first tests land in M1.Task02)
├── node_modules/                                    ✅ 71 MB, three.js 0.184 verified
├── dist/                                            ✅ pre-built
└── src/
    ├── main.js                                      ✅ Codex bootstrap
    ├── game.js                                      ✅ Codex Game class
    └── engine/
        ├── core/                                    ✅ 8 modules
        ├── render/                                  ⚠️ 4 modules; render-system needs WebGL2 fallback (M1.Task07)
        ├── world/                                   ⚠️ 1 module (district-generator)
        └── hero/                                    ⚠️ 2 modules (hero-flight, hero-system)
```

**Running right now:**
- `super-dev` Vite server at http://127.0.0.1:5173 (serverId `a10571ab-f9b7-48a1-9ffd-a7a6e588cc82`)

**Known debts to clear in M1:**
- ⚠️ `npm install @vitest/ui playwright @playwright/test` errored on peer deps — M1.Task01 resolves
- ⚠️ Codex's pre-scaffolded `render-system.js` is WebGPU-only — M1.Task07 adds the WebGL2 fallback (spec BLOCKER #1)
- ⚠️ Zero tests exist — M1.Task02 onward is strict TDD: failing test first, then code

---

## 4. Approvals received

You answered §11 questions in your previous message. Recording for the build's reference:

| § | Question | Your answer | Locked? |
|---|---|---|---|
| 11.Q1 | Renderer commitment | **YES** to WebGPU primary + WebGL2 fallback day one | ✅ |
| 11.Q2 | Physics scope at S1B | (your "nope" = don't change my install matrix recommendation) Facade only in S1B; Rapier in M3 | ✅ |
| 11.Q3 | Combat scope | (your "nope" = don't change my recommendation) Full — punch + heat-vision + grab-throw + dodge | ✅ |
| 11.Q4 | City strategy | **Use my discretion** → deterministic kit-bash for v1; WFC = v1.1 spike | ✅ |
| 11.Q5 | Default visual preset | (your "nope" = don't change) **`high`** preset is default | ✅ |
| lower | Hero asset | CC0 Block Man for prototype; Meshy.ai later if art bothers you | ✅ |
| lower | Music license | Kevin MacLeod CC-BY (incompetech) — credit roll required | ✅ |
| lower | Game shape | Sandbox + ambient civilian-rescue events | ✅ |

**All approvals locked.** v1 plan executes against these.

---

## 5. Tech stack & install matrix

### Already installed (in `super/node_modules/`)

| Package | Version | Used by | Status |
|---|---|---|---|
| `three` | `^0.184.0` | All renderer code | ✅ |
| `howler` | `^2.2.4` | M4 audio system | ✅ |
| `meshoptimizer` | `^0.21.0` | M2 asset pipeline + runtime decoder | ✅ |
| `vite` | `^5.0.0` | Dev server + bundler (may bump to v6 in M1.Task01) | ✅ |
| `vitest` | `^2.1.0` | Unit-test runner | ✅ |

### To install during M1 (Codex's M1 plan covers each)

| Package | Why | Install command | Lands in |
|---|---|---|---|
| `@vitest/ui` | UI test runner | `npm i -D @vitest/ui@^2.1.0` (match vitest) | M1.Task01 |
| `@playwright/test` + chromium | Browser smoke tests | `npm i -D @playwright/test && npx playwright install chromium` | M1.Task14 |
| `seedrandom` (or hand-rolled SFC32) | Deterministic RNG | `npm i seedrandom` | M1.Task03 |

### To install during M2 (asset pipeline)

| Package | Why | Install command |
|---|---|---|
| `@gltf-transform/cli` | CLI for GLB optimization | `npm i -g @gltf-transform/cli` |
| `@gltf-transform/core` + `@gltf-transform/functions` | Programmatic API | `npm i -D @gltf-transform/core @gltf-transform/functions` |
| `@nytimes/vite-plugin-gltf` (or NYT bundler plugins) | Vite-time asset opt | `npm i -D rollup-plugin-gltf` |

### External CLIs (you'll install via Homebrew)

| Tool | Why | Install |
|---|---|---|
| `ktx` (KTX-Software / `toktx`) | KTX2/Basis texture compression | `brew install --formula ktx` |
| `basis_universal` (backup if `toktx` is finicky) | Basis Universal transcoder | `brew install basis_universal` |

### To install during M3 (combat)

| Package | Why |
|---|---|
| `@dimforge/rapier3d-simd-compat` | Physics (capsule sweeps, thrown cars, destructibles) |
| `@three.ez/instanced-mesh` | InstancedMesh2 with per-instance BVH+LOD+frustum cull |

### To install during M5 (polish)

| Package | Why |
|---|---|
| `lil-gui` | Dev-tools scene-inspector tweakables |
| `idb-keyval` (or hand-rolled localStorage) | Save persistence |

### Optional v1.1+

| Package | Why |
|---|---|
| `ollama` (npm) | NPC barks via local `qwen3:4b` |

### Already-present CLIs (verified)

| CLI | Version | How used |
|---|---|---|
| `node` | 24.15.0 | Runtime |
| `npm` | 11.12.1 | Package management |
| `git` | (Apple) | Source control |
| `python3` | 3.9.6 | One-off scripts (e.g. fps-game static server) |
| `codex` | 0.130.0 (aliased `--dangerously-bypass-approvals-and-sandbox`) | Multi-file task executor |
| `gemini` | 0.41.2 (aliased `--yolo`) | Fact-check + web grounding |
| `ollama` | 0.23.1 (daemon at `127.0.0.1:11434`) | Local LLM runtime (v1.1+) |

---

## 6. External accounts & assets

You'll need accounts/downloads at various milestones. None block M1.

| Source | What | Account | License | When |
|---|---|---|---|---|
| [Mixamo](https://www.mixamo.com/) | Hero anims (Flying Idle/Forward/Punching/Throw/Hard Landing/Dodge L/R + heat-vision pose) | Free Adobe ID | Free commercial; no raw redistribution | M2 |
| [Sketchfab CC0 Block Man](https://sketchfab.com/3d-models/cc0-block-man-auto-rigged-humanoid-55571b5d47614b4c9973e853fc6b6a72) | Hero placeholder (rigged, 25 bones) | Free Sketchfab | CC0 | M2 |
| [Meshy.ai](https://www.meshy.ai/) | Optional custom hero | Paid $20/mo | Paid = full ownership | M2 if you upgrade past Block Man |
| [Kenney City Kit (Commercial/Industrial/Suburban/Roads)](https://kenney.nl/assets/category:3D?query=city) | Building, road, prop kits | No | CC0 | M2 |
| [Kenney Car Kit](https://kenney.nl/assets/car-kit) | Vehicles | No | CC0 | M3 |
| [Kenney Urban Kit](https://kenney.nl/assets/urban-kit) | Lampposts, hydrants, signs, dumpsters | No | CC0 | M3 |
| [Quaternius Ultimate Buildings](https://quaternius.com/packs/ultimatetexturedbuildings.html) | Building variety | No | CC0 | M2 |
| [Quaternius Cars](https://quaternius.com/packs/cars.html) | Vehicle LOD2 | No | CC0 | M3 |
| [Quaternius Ultimate Modular Men](https://quaternius.com/packs/ultimatemodularcharacters.html) | Civilians | No | CC0 | M4 |
| [Kay Lousberg KayKit City Builder Bits](https://kaylousberg.itch.io/kaykit-city-builder-bits) | Vibrant stylized props | No | CC0 | M2 |
| [Poly Haven HDRIs](https://polyhaven.com/hdris) | `belfast_sunset_puresky` + `cloud_layers` for IBL | No | CC0 | M2 |
| [Sonniss GameAudioGDC](https://sonniss.com/gameaudiogdc/) | SFX bundles 2020-2024 | No | Royalty-free perpetual; 2026 update bans AI training (fine for us) | M4 |
| [incompetech.com](https://incompetech.com/) | 4 Kevin MacLeod tracks | No | CC-BY 4.0 (credit roll) | M4 |

---

## 7. Agent roster

This is the section you asked for: **every agent we use, with their skills, tools, repos, and how invoked.**

There are **6 distinct compute classes** of agents in this build. Each has a different role, a different invocation, a different cost profile.

---

### 7.1 Claude Opus 4.7 — the orchestrator (me)

| Attribute | Value |
|---|---|
| **What it is** | Anthropic's most capable model, running this conversation |
| **Role in build** | Orchestrator, single-file editor, decision arbiter, user-facing voice, multi-agent dispatcher |
| **Active throughout** | Every milestone, every task |
| **Invocation** | This conversation, every turn |
| **Cost profile** | Your Anthropic Claude Code plan |

**Skills available (full list):**

All skills listed in this session's available-skills system reminder. The active ones I'll actually fire during the build:

- Process skills: `superpowers:using-superpowers`, `superpowers:writing-plans`, `superpowers:executing-plans`, `superpowers:subagent-driven-development`, `superpowers:requesting-code-review`, `superpowers:receiving-code-review`, `superpowers:test-driven-development`, `superpowers:systematic-debugging`, `superpowers:verification-before-completion`, `superpowers:finishing-a-development-branch`, `superpowers:using-git-worktrees`
- Combined skills: `anthropic-skills:dev-quality`, `anthropic-skills:dev-workflow`, `anthropic-skills:agent-orchestration`, `anthropic-skills:superpowers-orchestrator`
- Optional polish skills: `anthropic-skills:impeccable-style` (anti-AI-slop UI critique, M5), `anthropic-skills:algorithmic-art` (if WFC v1.1 spike)
- Tooling skills: `commit-commands:commit`, `claude-md-management:revise-claude-md`

**Tools available:**

- File operations: `Read`, `Write`, `Edit` (with `replace_all`), `Glob`, `Grep`
- Shell: `Bash` (with `run_in_background`), `BashOutput`, `KillShell`, `Monitor`
- Task tracking: `TaskCreate`, `TaskUpdate`, `TaskList`, `TaskGet`, `TaskStop`, `TaskOutput`
- Web: `WebSearch`, `WebFetch`
- Skills & subagents: `Skill`, `Agent`, `ToolSearch`
- Scheduling: `ScheduleWakeup`, `CronCreate`, `CronList`, `CronDelete`
- MCP: dozens of tools — full list in §9
- Session management: `mcp__ccd_session__mark_chapter`, `mcp__ccd_session__spawn_task`
- Plan mode: `EnterPlanMode`, `ExitPlanMode`

**Repos touched:**
- `/Users/kdawg/Projects/super/` (read + write all)
- `/Users/kdawg/Projects/fps-game/` (read-only — architectural reference)
- `/Users/kdawg/.claude/projects/-Users-kdawg-Projects/memory/` (read + write — persistent memory)
- `/tmp/*` (scratch — prompts for Codex/Gemini)

**Best for:**
- Decisions that need full conversation context
- Synthesis across multiple agent outputs
- Single-file precision edits
- Talking with you
- Catching when a subagent went off the rails

**Worst for:**
- Multi-file scaffolding (Codex is faster + more focused)
- Long autonomous runs without checkpoints (background Codex is better)
- Fact-checking library versions (Gemini's grounding wins)

---

### 7.2 Codex `gpt-5.5` — the multi-file executor

| Attribute | Value |
|---|---|
| **What it is** | OpenAI's gpt-5.5 model via the Codex CLI; aliased `--dangerously-bypass-approvals-and-sandbox` |
| **Role in build** | Implements 80% of M1-M5 tasks (everything that's structured TDD) |
| **Reasoning levels** | `low` (fast/shallow) / `medium` (default) / `high` (deep) / `xhigh` (deepest) |
| **Service tiers** | default / `priority` ("/fast" — 1.5× speed, increased usage allowance) |
| **Invocation** | `codex exec -c model_service_tier=priority -c model_reasoning_effort=high - < /tmp/prompt.md` (typically background) |
| **Skill packs available** | Codex has its own skill packs in `~/.codex/skills/`: `claude-code-proper`, `gemini-cli-proper`, `mac-mini-screen-sharing`, `ollama-model-agents`, `ultrareview` |
| **Cost profile** | Your OpenAI plan + Codex priority tier quota |

**For Super, the right Codex settings:**
- For M1-M5 task implementation: `service_tier=priority` + `reasoning_effort=high` (depth + speed)
- For one-off quick tasks: `reasoning_effort=medium` (default)
- For deep refactors / architectural choices: `reasoning_effort=xhigh` (no service tier override)

**Tools Codex has access to (when running):**
- Full shell access in `super/` working directory
- Read/write any file in `super/`
- Run `npm`, `git`, `node`, `python3`, etc.
- No browser, no MCP servers — pure CLI environment
- Sandbox = `danger-full-access` per the alias (it can modify anything)

**Repos Codex touches:**
- `/Users/kdawg/Projects/super/` (read + write — primary)
- `/Users/kdawg/Projects/fps-game/` (read-only — referenced for patterns)
- `/tmp/*` (read its own prompt file)

**Best for:**
- Multi-file scaffolding (e.g. M1.Task07 spans 4 files)
- Refactors (e.g. rewriting render-system.js to add WebGL2 fallback)
- Writing test files alongside code (TDD discipline)
- Long task plans (it wrote the 3,176-line M1 plan)
- Autonomous task execution where the work is well-specified

**Worst for:**
- Tasks where the user needs to make a feel-judgement (flight tuning — you do this)
- Open-ended architecture decisions (defer to me with full context)
- Tasks under 5 lines of code (cheaper inline)

**Failure modes we've seen:**
- ⚠️ Scope creep — "write the plan" can become "scaffold the implementation" (happened during M1 plan generation). Mitigation: explicit prompt constraints like "DO NOT write code, ONLY produce the markdown."

---

### 7.3 Gemini 3 Flash Preview — the fact-checker

| Attribute | Value |
|---|---|
| **What it is** | Google's Gemini 3 Flash Preview via the gemini CLI; aliased `--yolo` |
| **Role in build** | Fact-check library claims, verify versions, web grounding when something feels wrong |
| **Invocation** | `gemini -m gemini-3-flash-preview -y -p "..."` (often background) |
| **Skill packs available** | `~/.gemini/skills/ultrareview` |
| **Cost profile** | Free tier (Google) or your Gemini plan |

**Tools Gemini has access to (when running):**
- Google Search grounding (real web access, current data)
- Read files in CWD (when invoked from `super/`, it can read project files — that's how it produced the unprompted summary earlier)
- No write access to your project (read-only effectively, even with YOLO — it's a research tool)

**Repos Gemini touches:**
- Reads `/Users/kdawg/Projects/super/` when invoked from there
- Writes to its own session log; doesn't modify your project

**Best for:**
- "Is library X still maintained?" / "What's the current version?"
- "Did the API change between v3 and v4 of this thing?"
- "What's the consensus on technique Y in 2026?"
- Adversarial fact-check (Gemini caught the SIMD-width-32-vs-64 bug in the spec review)
- Quick "is this URL still valid?" checks

**Worst for:**
- Code generation (Codex is far better)
- Tasks requiring deep context about Super specifically (it scans cwd but may hallucinate)
- Long autonomous code work (it'll capacity-cap mid-run, as it did on the 2.5-pro review)

**Failure modes we've seen:**
- ⚠️ Hallucinated `three-wfc` was 3D-ready when its README explicitly says 2D-only. Lesson: always cross-check Gemini's claims with a direct WebFetch of the source.

---

### 7.4 Opus subagents (via the `Agent` tool)

Eleven distinct subagent types are available, each tuned for a specific task. They run with their own fresh context (no memory of this conversation), Opus model, and a specific tool subset.

#### 7.4.1 `general-purpose`

| Attribute | Value |
|---|---|
| **Description** | Catch-all for multi-step research/code tasks |
| **Tools** | All tools |
| **Model** | Opus (configurable) |
| **Used in Super for** | The 5 parallel research agents that produced research/01-05 |

**Best for:** Anything that doesn't fit a more specific subagent.

#### 7.4.2 `Explore`

| Attribute | Value |
|---|---|
| **Description** | Fast read-only search agent for locating code |
| **Tools** | All except Agent, ExitPlanMode, Edit, Write, NotebookEdit |
| **Model** | Opus |
| **Used in Super for** | "Where is X defined?" lookups during M2-M5 when codebase grows |

**Best for:** Quick code-archaeology questions. M3+ when codebase has 50+ files.

#### 7.4.3 `Plan`

| Attribute | Value |
|---|---|
| **Description** | Software architect for designing implementation plans |
| **Tools** | All tools except Agent, ExitPlanMode, Edit, Write, NotebookEdit (read-only) |
| **Model** | Opus |
| **Used in Super for** | M2-M5 milestone task plans (alternative to Codex for plan writing) |

**Best for:** "Design the implementation of X" — produces step-by-step plans.

#### 7.4.4 `feature-dev:code-architect`

| Attribute | Value |
|---|---|
| **Description** | Designs feature architectures by analyzing existing patterns; produces blueprints with files, components, data flows |
| **Tools** | Glob, Grep, LS, Read, NotebookRead, WebFetch, TodoWrite, WebSearch, KillShell, BashOutput |
| **Model** | Opus |
| **Used in Super for** | Already used to produce `research/04-engine-architecture.md` |

**Best for:** "Design how feature X fits into the existing engine." Critical at M3 start (combat architecture) and M4 start (AI architecture).

#### 7.4.5 `feature-dev:code-explorer`

| Attribute | Value |
|---|---|
| **Description** | Deep codebase analysis — execution paths, architecture layers, patterns |
| **Tools** | Same as code-architect |
| **Model** | Opus |
| **Used in Super for** | Will use when refactoring at M3/M4 — "audit the current AI system before adding threat behavior" |

**Best for:** "Map how X currently works." M3+ when we're modifying existing systems.

#### 7.4.6 `feature-dev:code-reviewer`

| Attribute | Value |
|---|---|
| **Description** | Reviews code for bugs, security, quality, conventions — confidence-based filtering |
| **Tools** | Same as code-architect/explorer |
| **Model** | Opus |
| **Used in Super for** | One reviewer in the M2+ post-task review pool |

**Best for:** "Review this PR/diff/file for bugs." Per-task review.

#### 7.4.7 `superpowers:code-reviewer`

| Attribute | Value |
|---|---|
| **Description** | The reviewer dispatched by `superpowers:requesting-code-review` skill |
| **Tools** | All tools |
| **Model** | Opus |
| **Used in Super for** | **Default per-task reviewer** in M1-M5 subagent-driven-development mode |

**Best for:** Every commit. This is the most common reviewer call.

#### 7.4.8 `coderabbit:code-reviewer`

| Attribute | Value |
|---|---|
| **Description** | Specialized CodeRabbit-style review |
| **Tools** | All tools |
| **Model** | Opus |
| **Used in Super for** | Second-opinion review on tricky M3+ commits (combat, physics integration) |

**Best for:** Adversarial second-opinion review. Use when a feature-dev reviewer gives a thumbs-up but you want a second eye.

#### 7.4.9 `pr-review-toolkit:code-reviewer`

| Attribute | Value |
|---|---|
| **Description** | Reviews against project style guides (CLAUDE.md) and conventions |
| **Tools** | All tools |
| **Model** | Opus |
| **Used in Super for** | Triggered at M5 for the final style-consistency pass before deploy |

**Best for:** "Does this match our project conventions?" Last-mile review before tagging a milestone.

#### 7.4.10 `pr-review-toolkit:silent-failure-hunter`

| Attribute | Value |
|---|---|
| **Description** | Specifically hunts silent failures, swallowed errors, inappropriate fallbacks |
| **Tools** | All tools |
| **Model** | Opus |
| **Used in Super for** | M3+ when error handling matters (physics WASM init, asset load failures) |

**Best for:** Catching `catch (e) {}` swallowed errors and "this looks like it works but actually doesn't" patterns. Fires at M3 (asset pipeline) and M5 (save-corruption recovery).

#### 7.4.11 `pr-review-toolkit:type-design-analyzer`

| Attribute | Value |
|---|---|
| **Description** | Quantitative type-design review (we're vanilla JS so types are JSDoc-ish — limited applicability) |
| **Tools** | All tools |
| **Model** | Opus |
| **Used in Super for** | Skip; project is JS not TS |

**Best for:** TypeScript projects. Skip for Super.

#### 7.4.12 `pr-review-toolkit:pr-test-analyzer`

| Attribute | Value |
|---|---|
| **Description** | Reviews PR for test coverage quality and edge cases |
| **Tools** | All tools |
| **Model** | Opus |
| **Used in Super for** | M2+ when tests stabilize; M5 before ship gate |

**Best for:** "Did the tests really cover what they need to?" Use at milestone gates.

#### 7.4.13 `pr-review-toolkit:comment-analyzer`

| Attribute | Value |
|---|---|
| **Description** | Checks code comments for accuracy and long-term maintainability |
| **Tools** | All tools |
| **Model** | Opus |
| **Used in Super for** | Light use — Super doesn't lean on comments heavily |

**Best for:** Skip unless we've added heavy commenting. Personal-project comment quality matters less than for a team codebase.

#### 7.4.14 `pr-review-toolkit:code-simplifier`

| Attribute | Value |
|---|---|
| **Description** | Simplifies code for clarity and consistency while preserving function |
| **Tools** | All tools |
| **Model** | Opus |
| **Used in Super for** | M5 polish pass — reduce engine code complexity before ship |

**Best for:** "This works but it's ugly." End of milestone. Use sparingly.

#### 7.4.15 `code-simplifier:code-simplifier`

Same role as 7.4.14 but a different specialty agent. Use whichever returns better suggestions on a given diff.

#### 7.4.16 `vercel:performance-optimizer`

| Attribute | Value |
|---|---|
| **Description** | Optimizes performance — Core Web Vitals, rendering, caching, bundle size |
| **Tools** | All tools |
| **Model** | Opus |
| **Used in Super for** | M5 ship gate — pre-deploy perf audit |

**Best for:** "Why is the bundle 2 MB?" or "Why does the first frame take 6 seconds?" Use once at M5.

#### 7.4.17 `vercel:deployment-expert`

| Attribute | Value |
|---|---|
| **Description** | Vercel deployment strategies, CI/CD, env vars |
| **Tools** | All tools |
| **Model** | Opus |
| **Used in Super for** | M5 deploy task only IF we ship to Vercel (alternative: itch.io upload) |

**Best for:** "Deploy this to a public URL." Hot-swap with itch.io if you prefer.

---

### 7.5 Ollama models (local + cloud)

| Where | Model | Size | Role in build |
|---|---|---|---|
| Cloud | `kimi-k2.6:cloud` | (cloud) | Optional third-opinion code review at M5 |
| Cloud | `deepseek-v4-pro:cloud` | (cloud) | Optional second-opinion reasoner for stuck spots |
| Cloud | `qwen3.5:cloud` | (cloud) | General fallback if Codex+Gemini both unavailable |
| Cloud | `glm-5.1:cloud` | (cloud) | Idle |
| Cloud | `gemma4:31b-cloud` | (cloud) | Idle |
| Cloud | `gemini-3-flash-preview:latest` (Ollama proxy) | (cloud) | Same model the Gemini CLI uses — bypass option |
| Local | `qwen2.5-coder:7b` | 4.7 GB | Offline code completion if internet drops |
| Local | `deepseek-r1:8b` | 5.2 GB | Offline reasoning if internet drops |
| Local | **`qwen3:4b`** | **2.5 GB** | **NPC barks at game-time, v1.1** |
| Local | `qwen3.5:4b` | 3.4 GB | Alternative for NPC barks |
| Local | `gemma3:4b` | 3.3 GB | Idle |
| Local | `gemma4:e2b` | 7.2 GB | Idle |
| Local | `llama3.2:3b` | 2.0 GB | Smallest NPC-bark candidate |
| Local | `nomic-embed-text` | 274 MB | Embeddings (search/RAG, not needed yet) |

**Repos Ollama touches at game-time (v1.1):**
- Reads from browser via `ollama-js` calling `http://localhost:11434/api/chat` — does NOT touch your filesystem

**Best for v1.1+:**
- `qwen3:4b` for NPC barks ("Help! That guy is FLYING!") — sub-200ms, runs offline, costs $0

**Worst for v1:**
- Don't use Ollama in the v1 build — it's a v1.1 feature

---

### 7.6 You

| Attribute | Value |
|---|---|
| **What you are** | The product owner, gatekeeper, playtest judge |
| **Role in build** | Decide each milestone gate; download assets; live-tune flight feel; say what's fun and what's not |
| **Active when** | Milestone gates (end of M1, M2, M3, M4, M5) + asset downloads (M2/M3/M4) + flight tuning (M2/M3) |
| **Skills you bring** | Game taste; the feel of fun; final call on scope |
| **Tools you use** | Browser + dev console + this conversation + your time |

**Best for:** Playtest, tuning, gating, taste.
**Worst for:** Anything I can automate. Stay out of the weeds; the agents handle implementation.

---

### 7.7 Summary table — who owns what milestone

| Milestone | Primary executor | Code reviewer | Asset / playtest | When you appear |
|---|---|---|---|---|
| **M1** (vertical slice) | Codex (high+priority) for M1.Task01-22 | `superpowers:code-reviewer` per task | None for M1 | M1 gate: playtest |
| **M2** (hero polish + asset pipeline) | Codex for pipeline scripts; me for tuning | `superpowers:code-reviewer` + `silent-failure-hunter` | You download Mixamo + Block Man + Kenney + Poly Haven | M2 gate: playtest, judge hero feel |
| **M3** (combat) | Codex for physics integration; me for combat math + VFX | `superpowers:code-reviewer` + `coderabbit:code-reviewer` | You download Kenney Car Kit + Urban Kit | M3 gate: playtest combat loop |
| **M4** (AI + audio) | Codex for AI systems; me for audio wiring | `superpowers:code-reviewer` + `pr-review-toolkit:silent-failure-hunter` (error handling) | You download Sonniss SFX + MacLeod music | M4 gate: playtest a populated city |
| **M5** (UI + save + ship) | Codex for UI; me for save schema; `vercel:performance-optimizer` for perf | `superpowers:code-reviewer` + `pr-review-toolkit:code-reviewer` (style) + `pr-review-toolkit:pr-test-analyzer` (tests) | You judge final polish; pick deploy target | M5 ship gate: v1 done definition check |

---

## 8. Skills inventory — what each does, when it fires

Every skill I'll use in the build, with definition and trigger:

| Skill | Definition (plain English) | Fires at |
|---|---|---|
| `superpowers:using-superpowers` | The meta-rule: always check for relevant skills before responding. Establishes how all skills work. | Every turn |
| `superpowers:test-driven-development` | NO CODE WITHOUT A FAILING TEST FIRST. Failing test → verify fail → minimal code → verify pass → commit. | Every implementation task in M1-M5 |
| `superpowers:subagent-driven-development` | Execution mode: fresh subagent per task, no shared context. Code review between every task. | M1-M5 task execution (default mode) |
| `superpowers:executing-plans` | Alternative inline batch execution if subagent dispatching gets noisy. | M2-M5 optional |
| `superpowers:requesting-code-review` | Dispatches `superpowers:code-reviewer` subagent with precisely-crafted context (base SHA, head SHA, what was built, what it should do). | After every implementation task |
| `superpowers:receiving-code-review` | Verify-don't-comply. If a review claim is wrong, push back with technical reasoning. | When a reviewer flags an issue |
| `superpowers:writing-plans` | Bite-sized TDD tasks with exact paths, complete code, frequent commits. | Already fired for M1; fires again per M2/M3/M4/M5 |
| `superpowers:systematic-debugging` | Reproduce minimally → ONE hypothesis → test → eliminate or confirm. No "let me try a few things." | When a test fails 2+ times or a feature breaks |
| `superpowers:verification-before-completion` | Don't say "M1 done" without flying through the city for 30 seconds. Actually play the slice. | Every milestone gate |
| `superpowers:finishing-a-development-branch` | At each milestone end: choose merge / PR / keep. Run real tests. Tag the commit. | End of M1, M2, M3, M4, M5 |
| `superpowers:using-git-worktrees` | Isolated branches for experimental work (e.g. WFC v1.1 spike). | Optional v1.1+ |
| `anthropic-skills:dev-quality` | 3-in-1: TDD + systematic-debugging + harness setup. | Active background context |
| `anthropic-skills:dev-workflow` | Worktree setup + execute-plan + finish-branch as a workflow. | At each milestone transition |
| `anthropic-skills:agent-orchestration` | Meta-routing: decide Codex vs Gemini vs inline vs subagent per task. | Every dispatch decision |
| `anthropic-skills:superpowers-orchestrator` | Multi-skill task coordination. | When a task spans 3+ skill domains |
| `anthropic-skills:impeccable-style` | Anti-AI-slop critique — catches the 29 generic-Shopify-template tells. | M5 UI polish |
| `anthropic-skills:algorithmic-art` | Procgen mindset (Wave Function Collapse, L-systems, etc.). | v1.1 WFC spike (if you green-light) |
| `commit-commands:commit` | Wrapper for `git commit -m` with conventional messages. | Every task commit |
| `pr-review-toolkit:review-pr` | Top-level PR review combining multiple sub-reviewers. | M5 ship gate |

**Skills NOT used (and why):**
- `frontend-design`, `vercel:nextjs`, `vercel:chat-sdk`, `vercel:ai-sdk` — no React/Next/chat UI in Super
- `firebase:*`, `supabase:*` — no backend
- `sentry:*` — local-only error telemetry per spec §19
- `searchfit-seo:*` — not an SEO project
- `pinecone:*` — no vector DB needed
- `aws-serverless:*`, `deploy-on-aws:*` — deploying to itch.io or Vercel, not AWS
- `coderabbit:autofix`, `qodo-skills:*` — manual review is sufficient
- `huggingface-skills:huggingface-*-trainer` — not training models
- `astronomer-data:*` — no data engineering needed
- `stripe:*` — not commercial
- `slack-by-salesforce:*`, `common-room:*`, `apollo:*` — not B2B sales tools
- `legal:*`, `finance:*`, `hr:*`, etc. — wrong domain

---

## 9. Tools & MCP servers inventory

### Tools I have direct access to (from this conversation)

| Tool | What it does | Build usage |
|---|---|---|
| `Read` | Read any file | Every task |
| `Write` | Write/overwrite files | Code generation |
| `Edit` | Surgical inline edits | Refactors, fixes |
| `Glob` / `Grep` | Search filesystem | Codebase archaeology |
| `Bash` | Run shell commands | `npm`, `git`, `codex`, `gemini` invocations |
| `BashOutput` / `KillShell` / `Monitor` | Manage background processes | Codex/Gemini job lifecycle |
| `Agent` | Spawn subagents | Parallel work + code review |
| `Skill` | Load a skill | Triggering process skills |
| `ToolSearch` | Load deferred tool schemas | Pulling in MCP tools |
| `TaskCreate` / `TaskUpdate` / `TaskList` | Visible task tracking | User-facing progress |
| `WebSearch` / `WebFetch` | Web research | Library/asset/license checks |
| `ScheduleWakeup` | Schedule next-message timing | Long autonomous loops (not used in Super) |
| `CronCreate` / `CronList` | Recurring scheduled agents | Not used in Super |
| `mcp__ccd_session__mark_chapter` | Visible "new chapter" marker in transcript | Each milestone start |
| `mcp__ccd_session__spawn_task` | Flag out-of-scope ideas for separate session | Use when a side-quest emerges |

### MCP servers loaded in this session

| Server | Tools | Build usage |
|---|---|---|
| **Claude_Preview** | `preview_start`, `preview_list`, `preview_stop`, etc. | **Active.** Manages super-dev Vite server |
| **chrome-devtools-mcp** | screenshot, navigate, evaluate_script, lighthouse_audit, performance_start/stop_trace, network_request listings, console_messages, etc. | M5 perf audit + M3+ visual debugging |
| **playwright** (`plugin_playwright_playwright_*`) | browser_navigate/click/snapshot/screenshot/console_messages/etc. | M1.Task14, M1.Task22 smoke tests; M5 final ship audit |
| **Claude_in_Chrome** | similar to chrome-devtools but for an actual Chrome window | Optional alternative to chrome-devtools |
| **scheduled-tasks** | `create_scheduled_task`, `list_scheduled_tasks` | Not used in Super (no remote scheduling needed) |
| **context7** (Upstash) | `resolve-library-id`, `query-docs` | Fetch fresh three.js / Rapier / howler docs |
| **firecrawl** | scrape, crawl, search, map | Deep doc scrapes if context7 lacks coverage |
| **pdf-viewer** | open, fill-form, annotate, sign, view | Not used in Super (no PDFs) |
| **firebase**, **supabase**, **pinecone**, **awsiac**, **awspricing**, **aws-serverless-mcp** | Various backend operations | Not used in Super (no backend) |
| **microsoft-learn** | Microsoft docs search | Not used in Super (not Microsoft stack) |
| **sonatype-guide** | Sonatype dependency checks | Optional security audit at M5 |
| **mcp-registry** | List/search MCP registry | Discovery only |
| **stripe** | Payment processing | Not used (personal project) |
| **slack-by-salesforce**, **common-room**, **apollo**, **notion**, **gmail**, **calendar**, **drive**, **wix**, **base44**, **quickbooks**, **iMessage**, **kiwi (flights)** | Various productivity / business tools | Not used in Super |
| **deploy-on-aws** | AWS deployment tooling | Not used (deploying to itch.io or Vercel) |
| **fakechat**, **playground** | Misc | Not used |
| **computer-use** (`mcp__computer-use__*`) | Native desktop control — screenshot, click, type, scroll | Optional fallback if browser tools fail |

---

## 10. Milestones

```
M1 — Vertical slice (engine + city + flight, both backends)
   ▾ DONE = playtest passes: flying capsule over 3×3 city at 60 FPS, both backends green
   Estimated effort: ~9 hours of agent work

M2 — Hero polish + asset pipeline
   ▾ DONE = rigged Block Man (or Meshy hero) flying with idle + flight animations,
            cape flowing, sun shadow + HDRI IBL lighting visible, asset pipeline scripts working
   Estimated effort: ~16-24 hours of agent work + your asset downloads

M3 — Combat (Rapier physics in)
   ▾ DONE = full combat loop: punch, heat-vision (with decals), grab+throw, dodge,
            destructibles, hero capsule physics
   Estimated effort: ~24-32 hours of agent work

M4 — Life (AI + audio)
   ▾ DONE = civilian + traffic + threat AI populating city, full audio system with adaptive music,
            spatial mixing, weather effects
   Estimated effort: ~24-32 hours of agent work

M5 — Polish + ship
   ▾ DONE = HUD, menus, save system, pointer-lock UX, gamepad, deploy to itch.io or Vercel
   Estimated effort: ~16-24 hours of agent work

v1.1+ — Stretch upgrades (optional)
   ▾ WFC procgen, GPU compute Verlet cape, raymarched volumetric clouds,
     GTAO + half-res SSR + TAA + motion blur (ultra preset), NPC barks via Ollama qwen3:4b
```

Each milestone gets its own task plan when its predecessor lands. M1 already has Codex's 23-task plan. M2-M5 will each get one when reached.

---

## 11. Per-milestone detail

### 11.1 M1 — Vertical slice

**Full task plan:** [`docs/superpowers/plans/2026-05-19-super-m1.md`](2026-05-19-super-m1.md) (3,176 lines, 23 tasks)

**Summary of tasks 01-23:**

| # | Task | Files |
|---|---|---|
| 01 | Scaffold Vite + tests + folders | `package.json`, `vite.config.js`, `vitest.config.js`, `tests/setup.js` |
| 02 | Constants | `src/engine/core/constants.js` + test |
| 03 | Deterministic RNG | `src/engine/core/rng.js` + test |
| 04 | Master clock | `src/engine/core/clock.js` + test |
| 05 | Double-buffered input | `src/engine/core/input-router.js` + test |
| 06 | Engine loop | `src/engine/core/engine-loop.js` + test |
| 07 | **Render backend selection (WebGPU + WebGL2)** | `src/engine/render/render-system.js`, `webgpu-backend.js`, `webgl2-backend.js` + test |
| 08 | Camera rig | `src/engine/render/camera-rig.js` + test |
| 09 | Flight math (pure functions, unit-tested) | `src/engine/hero/hero-flight.js` + test |
| 10 | Hero system facade | `src/engine/hero/hero-system.js` + test |
| 11 | Perf HUD | `src/engine/dev-tools/perf-hud.js` |
| 12 | Dev console | `src/engine/dev-tools/dev-console.js` |
| 13 | S1A Vite entry (20 placeholder boxes) | `src/entry/s1a.js`, `index.html` |
| 14 | S1A Playwright smoke (both backends) | `tests/smoke/s1a.spec.js` |
| 15 | Tile grid | `src/engine/world/tile-grid.js` + test |
| 16 | Building kit | `src/engine/world/building-kit.js` |
| 17 | District generator (3×3) | `src/engine/world/district-generator.js` |
| 18 | Instancing system (BatchedMesh, ≤ 5 draws) | `src/engine/render/instancing-system.js` |
| 19 | Collision facade (static AABB) | `src/engine/world/collision-world.js` + test |
| 20 | Hero capsule collision | `src/engine/hero/hero-collision.js` + test |
| 21 | S1B dev entry (`npm run dev:slice`) | `src/entry/s1b.js`, `package.json` |
| 22 | S1B Playwright FPS gates | `tests/smoke/s1b.spec.js` |
| 23 | M1 verification + git tag | n/a — tag `M1-vertical-slice` |

**Agents assigned to M1:**
- Codex `gpt-5.5` @ `priority`+`high` → Tasks 01-22 (all the implementation)
- `superpowers:code-reviewer` subagent → after each task
- Me → orchestration, decision arbitration, Task 23 verification

**Quality gate at end of M1:**
- All Vitest unit tests pass
- Playwright smoke passes on `?forceWebGPU=1` AND `?forceWebGL2=1`
- You play S1B in browser for 5 minutes; tell me what feels off
- I tag `M1-vertical-slice` once you give thumbs-up

---

### 11.2 M2 — Hero polish + asset pipeline

**Detailed task plan: written after M1 lands.** Sketch:

```
T01-T05  Asset pipeline scripts:
   tools/asset-import.js      FBX→GLB, Mixamo rig fix, cape socket detection
   tools/asset-optimize.js    gltf-transform meshopt + prune + dedup
   tools/asset-ktx2.js        toktx UASTC normals + ETC1S color
   tools/asset-manifest.js    JSON registry with stable IDs + license metadata
   tools/asset-validate.js    bone count, anim names, texture format, decoder presence
   npm scripts:  assets:import / optimize / ktx2 / manifest / validate / bench-gpu

T06      You download Block Man (Sketchfab CC0) → run pipeline → verify GLB loads

T07-T09  GLB hero swap-in:
   src/engine/render/material-library.js (new) — KTX2 + Draco decoder setup
   src/engine/hero/hero-model.js (new) — load GLB, attach to hero-system
   replace capsule with Block Man visual

T10-T12  Mixamo animation retarget:
   download Flying Idle, Flying Forward, Hard Landing → convert to GLB
   src/engine/hero/hero-animation.js — clip blend tree (idle / fly / land)
   integrate with hero-system

T13-T15  Cape (bone-driven vertex shader):
   src/engine/hero/cape-sim.js — SkinnedMesh with 24-bone cape chain
   vertex shader: wind vector + hero velocity coupling
   distance LOD: freeze beyond 60 m

T16-T17  Lighting:
   src/engine/render/lighting-system.js — 3-cascade CSM @ 1024² per cascade
   src/engine/render/sky-system.js — Sky addon + atmospheric fog
   you download Poly Haven HDRI (belfast_sunset_puresky)
   src/engine/render/ibl.js — PMREMGenerator prefilter

T18-T20  Postprocess polish:
   src/engine/render/post-fx-stack.js — AgX tone + bloom + IBL composition
   color management checklist: HDRI → bloom → tone → grade

T21      M2 verification:
   you fly the city with the rigged hero + cape, dynamic lighting
   tag M2-hero-polish
```

**Agents for M2:**
- Codex → pipeline scripts (multi-file, Codex's strength) + lighting integration
- Me → cape shader (single-file, my strength) + Mixamo rig debugging
- `superpowers:code-reviewer` → per task
- `pr-review-toolkit:silent-failure-hunter` → for asset pipeline (catches swallowed asset-load errors)
- You → Mixamo + Block Man + Kenney + Poly Haven downloads

**Quality gate at end of M2:**
- Hero model loads, animates, cape flows
- 60 FPS sustained with full lighting
- `assets:validate` passes for hero + at least 5 building kit pieces
- You play for 5 min; "it looks like a superhero game now"

---

### 11.3 M3 — Combat

**Detailed task plan: written after M2 lands.** Sketch:

```
T01      Install @dimforge/rapier3d-simd-compat
T02      src/engine/world/physics-world.js — Rapier init, WASM load (both backends)
T03-T04  Replace static AABB facade with Rapier:
   src/engine/world/collision-world.js — wraps Rapier raycast/sweep
   src/engine/hero/hero-collision.js — hero capsule as Rapier rigid body
T05-T07  Camera collision (camera-rig pulls in on wall contact)
T08-T11  Punch:
   src/engine/combat/punch-system.js — sphere-cast in front of fist
   src/engine/combat/damage-model.js — knockback math (pure, tested)
   src/engine/combat/impulse-resolver.js — applies impulse to hit targets
   src/engine/vfx/impact-fx.js — particle ring, sparks, decal
T12-T15  Heat vision:
   src/engine/combat/heat-vision-system.js — continuous ray, hold-button charging
   src/engine/vfx/beam-system.js — beam mesh + glow + distortion
   src/engine/vfx/decal-system.js — scorch decals pooled
   src/engine/render/post-fx-stack.js — heat shimmer hook
T16-T18  Grab + throw:
   src/engine/combat/grab-throw-system.js — target → kinematic attach to pose socket
   throw arc preview (lil-gui debug)
   release: launch impulse via impulse-resolver
T19-T20  Dodge:
   src/engine/combat/dodge-system.js — short reposition with i-frames
   src/engine/vfx/trail-system.js — dodge streak trail
T21-T23  Destructibles:
   src/engine/combat/destructible-system.js — Kenney props with damage states
   debris pooling (mesh-pool reuse)
   you download Kenney Car Kit + Urban Kit
T24      M3 verification:
   full combat loop in 3×3 city, hero feels powerful
   tag M3-combat
```

**Agents for M3:**
- Codex → Rapier integration + combat systems (multi-file)
- Me → combat math (damage curves, knockback) + VFX
- `superpowers:code-reviewer` → per task
- `coderabbit:code-reviewer` → second opinion on Rapier integration (it's tricky)
- `pr-review-toolkit:silent-failure-hunter` → on physics WASM error handling
- You → Kenney Car Kit + Urban Kit downloads; combat feel judgement

---

### 11.4 M4 — Life (AI + audio)

**Detailed task plan: written after M3 lands.** Sketch:

```
T01-T03  Navigation:
   src/engine/ai/nav-graph.js — sidewalk + rooftop graph from tile-grid
   A* pathfinding (pure, tested)
T04-T06  AI director:
   src/engine/ai/ai-director.js — density manager (civilians, traffic, threats per district)
   src/engine/ai/behavior-budget.js — time-sliced AI updates by distance
T07-T08  Civilian AI:
   src/engine/ai/civilian-ai.js — wander, panic on threat, look-at-hero, flee
   src/engine/world/population-spawner.js — per-district pool
T09-T10  Traffic:
   src/engine/ai/traffic-ai.js — lane follow, intersection logic, panic brake
   src/engine/world/road-network.js — derive lane graph from district
   src/engine/world/traffic-spawner.js — per-district car pool
T11-T13  Threat AI:
   src/engine/ai/perception-system.js — sight cones, hearing radius
   src/engine/ai/threat-ai.js — goons/drones with pursuit + attack windows
   src/engine/ai/steering.js — seek/flee/avoid (pure, tested)
T14-T16  Audio system:
   src/engine/audio/audio-bus.js — howler.js channel mixer
   src/engine/audio/spatial-audio.js — 3D pan + distance attenuation
   24-voice pool with voice-stealing
T17-T18  Music director:
   src/engine/audio/music-director.js — calm/exploration/combat layers
   crossfade on state change
T19      Ambience:
   src/engine/audio/ambience-system.js — city bed, altitude wind, weather hooks
T20-T22  Audio sprite production:
   you download Sonniss GDC bundles
   audiosprite CLI: bundle 80 SFX → 2-3 Opus sprite files
   you download Kevin MacLeod tracks
T23      M4 verification:
   alive city with civilians + traffic + threats reacting to hero
   full audio mix on combat + flight
   tag M4-life
```

**Agents for M4:**
- Codex → AI systems (lots of code, modular)
- Me → music director state machine (single-file)
- `superpowers:code-reviewer` → per task
- `pr-review-toolkit:silent-failure-hunter` → on AI error handling
- You → Sonniss SFX bundles + MacLeod music downloads

---

### 11.5 M5 — Polish + ship

**Detailed task plan: written after M4 lands.** Sketch:

```
T01-T03  HUD:
   src/engine/ui/hud.js — health, energy, minimap, reticle
   src/engine/ui/ui-system.js — coordinator
T04-T06  Menu system:
   src/engine/ui/menu-router.js — DOM overlay state machine
   src/engine/ui/pause-menu.js — settings (graphics/audio/input/accessibility)
   src/engine/ui/title-screen.js
T07-T08  Title screen + onboarding flow
T09-T10  Save system:
   src/engine/save/save-schema.js — versioned + checksummed
   src/engine/save/save-system.js — load, migration, corruption recovery
   src/engine/save/progress-store.js — district visits, missions completed
   src/engine/save/settings-store.js — graphics/audio/input prefs
T11      Pointer-lock UX (spec §17):
   click-to-lock → ESC unlocks → re-click re-locks
   pause on unlock; Safari quirk handling
T12      Audio autoplay handling (spec §18):
   gate audio context behind first user gesture
   "Click to play" splash
T13      Error telemetry + perf-capture export (spec §19):
   src/engine/dev-tools/perf-capture.js — local JSON export
   no analytics service
T14      Gamepad support (spec §21):
   left stick = pitch/yaw, right stick = roll+look, triggers = boost/heat
T15-T16  Dev console hardening + production gates
T17      `vercel:performance-optimizer` agent does final perf pass
T18      `pr-review-toolkit:pr-test-analyzer` final test coverage audit
T19      `pr-review-toolkit:code-reviewer` final style audit
T20      Deploy:
   option A: itch.io upload (faster, simpler)
   option B: vercel:deploy (custom domain capable)
T21      M5 verification — full v1 done definition check
   tag v1.0.0
   you have a public URL to share (or local-only if preferred)
```

**Agents for M5:**
- Codex → UI components (multi-file)
- Me → save schema + corruption recovery + telemetry export
- `superpowers:code-reviewer` → per task
- `vercel:performance-optimizer` → final perf audit
- `pr-review-toolkit:pr-test-analyzer` → test coverage gate
- `pr-review-toolkit:code-reviewer` → style consistency gate
- `vercel:deployment-expert` → if we use Vercel
- You → final playthrough; deploy decision

---

## 12. Quality gates between milestones

Between each milestone, **you and I do a gate together**. You play the latest build for 5-10 minutes, tell me what's off, I record any issues, we decide: ship next milestone, or polish current one first.

**Quality gate checklist (every milestone):**

- [ ] All Vitest unit tests pass (`npm test`)
- [ ] Playwright smoke passes on both backends (`npx playwright test`)
- [ ] No console errors in browser when loading
- [ ] FPS sustained at target preset (you measure via `perf-hud`)
- [ ] Asset pipeline (if applicable) validates (`npm run assets:validate`)
- [ ] You played for 5+ min and have feedback recorded
- [ ] Git tag created (`Mn-feature-name`)
- [ ] You said the words "good to move on" (or you indicated continuation)

**If a gate fails:** we pause, fix the failure in a hotfix sub-task, re-gate. We do NOT proceed to the next milestone with broken gates.

---

## 13. Risk register

Major risks for the full v1 build (compiled from spec + execution-playbook + real failures we've already seen):

| # | Risk | Likelihood | Severity | Mitigation |
|---|---|---|---|---|
| 1 | **Flight feel** is correct-but-unfun | Medium | High | Live-tuning sliders from M1; iterate per playtest |
| 2 | **WebGPU/WebGL2 divergence** in compute / render-bundle / some node effects | Medium | High | M1.Task07 splits backends into explicit tiers; `?forceWebGL2` test from day one |
| 3 | **Codex stalls or hallucinates scope** (we've seen this twice now) | Medium | Medium | Tight prompts ("ONLY write X, DO NOT touch Y"); kill+redispatch after 10 min stale |
| 4 | **npm peer-dep conflicts** (already hit on @vitest/ui) | High | Low | Pin versions explicitly in M1.Task01 |
| 5 | **Cape sim spikes CPU** | Medium | Medium | Cap 24 bones; distance LOD freeze; quality toggle |
| 6 | **Postprocess drops to 30 FPS in combat** | Medium | High | Tiered presets; SSR/motion-blur behind `ultra` only |
| 7 | **Asset pipeline glue breaks Mixamo rigs** | Medium | High | M2 gate: one full hero GLB through pipeline before M3 starts |
| 8 | **Naive culling draws 5000 hidden windows** | Low | Medium | InstancedMesh2 BVH + AABB cull per tile |
| 9 | **Rapier WASM init fails on WebGL2 tier** | Medium | High | Verify `@dimforge/rapier3d-simd-compat` on both backends in M3.Task01 |
| 10 | **You burn out** because the project is bigger than expected | Real | High | **Milestone gates are real** — you can ship at any milestone and walk away with a complete-feeling product |
| 11 | **Gemini hallucinates library capability** (we saw `three-wfc` fact-check error) | Medium | Low | Cross-check Gemini's claims with WebFetch of source repos |
| 12 | **Save schema migration breaks at v1.2** | Future | Low | Schema versioning + corruption recovery designed in M5 |
| 13 | **Asset license terms change** | Low | High | Manifest stores license metadata; pinning + caching CC0 packs |

---

## 14. Run book

Commands you'll actually run during the build:

### Dev server lifecycle (already running)
```bash
# Already running: super-dev on http://127.0.0.1:5173
# Managed by the harness. To restart:
#   - Stop:  preview_stop(serverId)
#   - Start: preview_start("super-dev")

# Manual fallback:
cd /Users/kdawg/Projects/super
npm run dev            # main, port 5173
npm run dev:slice      # vertical slice S1B, port 5174 (after Task 21)
```

### Testing
```bash
cd /Users/kdawg/Projects/super
npm test                       # vitest run, all unit tests
npm run test:ui                # vitest UI on port 51204 (after @vitest/ui installs)
npx playwright test            # Playwright smoke (after M1.Task14)
npx playwright test --headed   # See it run in real browser
npx playwright test --grep "fps"
```

### Force a render backend (test WebGL2 fallback)
```
http://127.0.0.1:5173/?forceWebGL2=1
http://127.0.0.1:5173/?forceWebGPU=1
http://127.0.0.1:5174/?slice=s1b&seed=42  # after M1.Task21
```

### Dev console (in-browser, after M1.Task12)
```
~                              toggle console
quality low|medium|high|ultra
seed 42                        regenerate world deterministically
render backend webgpu|webgl2   force backend at runtime
perf capture start|stop|save   record perf bundle
weather rain|clear|storm|fog   (M4+)
spawn car|civilian|drone|prop  (M4+)
hero energy full               (M3+)
teleport district 0 0          (after streaming exists, v1.1)
```

### Git workflow
```bash
git log --oneline                       # see history
git tag M1-vertical-slice               # at end of M1
git tag M2-hero-polish                  # at end of M2
git tag M3-combat                       # at end of M3
git tag M4-life                         # at end of M4
git tag M5-shippable                    # at end of M5
git tag v1.0.0                          # final ship
```

### Asset pipeline (after M2.Task01-05)
```bash
npm run assets:import           # FBX/GLB intake + Mixamo rig fix
npm run assets:optimize         # gltf-transform meshopt + prune + dedup
npm run assets:ktx2             # texture compression
npm run assets:manifest         # rebuild registry
npm run assets:validate         # sanity check
npm run assets:bench            # load timing per asset
```

### Codex direct invocation (if you want to drive one yourself)
```bash
codex exec -c model_service_tier=priority -c model_reasoning_effort=high "Refactor X to do Y"
codex exec -c model_reasoning_effort=xhigh "Deep architectural question"
```

### Gemini direct invocation
```bash
gemini -m gemini-3-flash-preview -y -p "Is library X still the recommended pick in 2026?"
gemini -m gemini-3.1-pro-preview -y -p "Deep research on Z"
```

### Ollama (v1.1 game-time only)
```bash
# Verify daemon
curl http://localhost:11434/api/version
ollama list
ollama ps

# Quick query (game-time, called from browser via ollama-js)
ollama run qwen3:4b "You are an NPC in a superhero game. Reply with ONE short sentence."
```

### When you want to override / pause / change scope
- Just tell me. I pause whatever's running, fix or revise, then continue.
- If a milestone gate fails, say "fix X first" — I pause the next milestone and address X.

---

## 15. Green-light protocol

When you say "**green-light**" (or "go" or anything clearly affirmative), here's what happens IN MY NEXT MESSAGE:

1. I invoke `superpowers:subagent-driven-development` (the execution mode)
2. I mark a new chapter in the transcript: "M1 Execution"
3. I write a Codex prompt for M1.Task01 (scaffold cleanup) to `/tmp/codex-m1-t01-prompt.md`
4. I dispatch `codex exec -c model_service_tier=priority -c model_reasoning_effort=high - < /tmp/codex-m1-t01-prompt.md` in the background
5. I post a brief status: "Codex executing M1.Task01 — should be ~20 min. Will update when done."
6. I PARALLEL-prepare M1.Task02 prompt while Codex works

After Codex returns each task:
7. I read the diff Codex produced
8. I run tests locally (`cd super && npm test`)
9. If tests green: I dispatch the `superpowers:code-reviewer` subagent with the diff + task spec
10. If tests red: I invoke `superpowers:systematic-debugging` — hypothesize, fix, retry
11. After reviewer returns: I apply fixes inline (or push back if review is wrong)
12. I commit (per the M1 plan's commit step)
13. I update the task list (TaskUpdate)
14. I post a brief user status every 2-3 tasks ("just finished render backend; webgpu + webgl2 both boot; on to camera rig")
15. Cycle repeats through M1.Task23

At M1 gate (after Task 23):
16. I pause, summarize what was built
17. I ask you to playtest http://127.0.0.1:5174/?slice=s1b for 5-10 minutes
18. You give feedback ("flight feels too slippery" or "looks good, ship M2")
19. If passes: tag `M1-vertical-slice`, write M2 task plan, repeat
20. If needs work: hotfix sub-tasks before M2

**This pattern continues through M2, M3, M4, M5 → v1.0.0.**

---

## Appendix A — What you actually do during the build

| Phase | Your involvement | Time investment |
|---|---|---|
| Green-light | Read this plan, say "go" | 0-30 min |
| M1 execution | Optional: glance at git log, watch tests pass | ~0 (mostly autonomous) |
| **M1 gate** | **Play S1B for 5-10 min, tell me what feels off** | **15-30 min** |
| M2 execution | Download Mixamo + Block Man + Kenney + Poly Haven (3-4 trips to websites) | 30-60 min total |
| **M2 gate** | **Play with rigged hero, judge cape + lighting** | **15-30 min** |
| M3 execution | Download Kenney Car Kit + Urban Kit | 15-30 min |
| **M3 gate** | **Play with combat, judge feel** | **30 min — most important gate** |
| M4 execution | Download Sonniss SFX + MacLeod music | 30-60 min |
| **M4 gate** | **Play populated city, judge soundscape** | **30 min** |
| M5 execution | Pick deploy target | 5 min |
| **M5 ship gate** | **Final v1 done-definition check** | **30 min** |
| **v1.0.0 release** | **Play your game.** | **∞** |

Total of YOUR active time: ~4-6 hours spread across the project. Most of the build is autonomous agent work.

---

## Appendix B — Cost summary

| Resource | Approximate cost |
|---|---|
| Anthropic Claude Code | Your plan |
| OpenAI Codex (gpt-5.5 priority tier) | Your OpenAI plan; priority tier consumes quota faster but is 1.5× speed |
| Google Gemini CLI | Free tier (or your plan) |
| Ollama (cloud models) | Your existing paid Ollama plan |
| Ollama (local) | $0 |
| External assets (Mixamo, Kenney, Quaternius, Poly Haven, Sonniss, MacLeod) | $0 (CC0/free commercial) |
| Meshy.ai (optional hero upgrade) | $20/mo Hobbyist tier (optional) |
| itch.io hosting (if you ship there) | $0 |
| Vercel hosting (if you ship there) | $0 (Hobby tier free) |
| **Total cash cost for v1** | **$0 minimum, $20/mo optional** |

---

## Final word

This is the definitive plan. No compression, no time pressure, full v1 ship per spec §16.

**Say "green-light"** and M1.Task01 starts in my next message.

If you want anything changed — agent assignments, milestone scope, asset sources, deferred-features list, anything — tell me now and I revise.
