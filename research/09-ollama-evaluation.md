# Ollama Evaluation for "Super"

**Date:** 2026-05-19
**Ollama version installed:** 0.23.1 at `/usr/local/bin/ollama`
**Daemon:** running at `http://127.0.0.1:11434`

## Your current Ollama inventory

### Cloud models (Ollama Cloud / paid tier)
| Model | Strength | Best for |
|---|---|---|
| `kimi-k2.6:cloud` | **Current #1 open-source coding model.** 87/100 real-world benchmarks. MoE 42B-active / 1T-total. | Heavy code generation, refactors, agent loops |
| `deepseek-v4-pro:cloud` | Strongest open-source reasoner. Successor to DeepSeek-R1. | Architectural reasoning, complex debugging |
| `qwen3.5:cloud` | Qwen's latest, very strong general | Versatile — coding, reasoning, multilingual |
| `glm-5.1:cloud` | Zhipu's flagship | General reasoning |
| `gemma4:31b-cloud` | Google's 31B Gemma 4 | Multimodal, code-aware |
| `gemini-3-flash-preview:latest` | Same model the Gemini CLI used in our reviews | Fast Google grounding equivalent |

### Local models (run on your M5)
| Model | Size | Best for |
|---|---|---|
| `qwen2.5-coder:7b` | 4.7 GB | Local code generation, offline assistant |
| `deepseek-r1:8b` | 5.2 GB | Local reasoning, offline analysis |
| `qwen3:4b` | 2.5 GB | **Fast NPC dialogue / barks** — sub-200ms responses |
| `qwen3.5:4b` | 3.4 GB | Same niche as above, slightly stronger |
| `gemma3:4b` | 3.3 GB | General small-model |
| `gemma4:e2b` | 7.2 GB | Stronger small-model |
| `llama3.2:3b` | 2.0 GB | **Smallest viable for NPC barks** — fastest |
| `nomic-embed-text` | 274 MB | Embeddings (for retrieval, search) |

## Honest assessment — where Ollama fits in Super

### 🟢 Genuinely useful (worth implementing)

**1. NPC barks / contextual dialogue at runtime (v1.1 feature)**
The single most game-changing Ollama application for Super. Civilians and threats say context-aware lines based on hero state, location, recent events.

- **Model**: `qwen3:4b` (local, 2.5 GB) — sub-200ms responses, zero API cost, runs offline
- **Integration**: [`ollama-js`](https://github.com/ollama/ollama-js) calls `localhost:11434/api/chat`
- **Cost**: $0 forever (player's machine runs it)
- **Bonus**: works offline, no rate limits, full privacy
- **Effort**: ~2 hours to integrate as M4 audio polish

Example use: when hero lands near a civilian, send `{ heroState: 'landed', civilianRole: 'office-worker', recentEvent: 'thrown-car' }` → model returns `"Did you see that?! Oh god, are you—wait, you're SUPER!"` → TTS or text bubble.

**2. Build-time procgen text** (also v1.1)
Generate sign names, neighborhood names, news ticker headlines, billboard text at world-build time. Use any cloud model (kimi-k2.6 / deepseek-v4 / qwen3.5) since it's offline.

- Pre-generated JSON manifest committed to repo
- Hero never waits on LLM during play
- One-time generation pass

### 🟡 Marginal value (only if you want them)

**3. Dev-time third-opinion reviewer**
Add `kimi-k2.6:cloud` as a third reviewer alongside Codex + Gemini. Cheap incremental coverage — but Codex+Gemini have already proven sufficient (the v0.2 review surfaced everything material).

**4. Local code completion fallback**
`qwen2.5-coder:7b` could run as an offline assistant when you're without internet. But you have Codex + Claude — this is redundant.

### 🔴 Not useful for Super (don't bother)

- **LLM-driven combat AI**: latency too high (even 200ms is 12 frames at 60 FPS). Use behavior-tree FSMs.
- **Procedural content at game-time**: caching beats LLM for repeatable content. Pre-generate.
- **Asset generation**: Meshy.ai (already in §7) covers text→3D better.

## Recommendation

**v1**: skip Ollama. Game is shippable without it.
**v1.1 (after M5 ships)**: integrate NPC barks via `qwen3:4b` local + `ollama-js`. ~2 hour task. Adds a *huge* feel uplift for civilians.
**v1.2**: build-time procgen text manifest. Use `kimi-k2.6:cloud` once to generate a JSON file of city flavor text. Commit.

**For our development workflow** (not the game itself): the existing Codex + Gemini + Opus subagent pattern is sufficient. Adding kimi-k2.6 as a third reviewer is optional and low-value at this scale.

## How to verify the daemon is healthy

```bash
curl http://localhost:11434/api/version
ollama list
ollama ps  # currently loaded models in VRAM
```

## When you want to integrate (v1.1)

```bash
npm install ollama          # ollama-js client
```

```javascript
// engine/ai/npc-barks.js (lands in v1.1, M4 audio polish phase)
import { Ollama } from 'ollama';
const ai = new Ollama({ host: 'http://localhost:11434' });

export async function getBark(context) {
  const r = await ai.chat({
    model: 'qwen3:4b',
    messages: [{ role: 'system', content: 'You are an NPC in a superhero game. Reply with ONE short sentence.' },
               { role: 'user', content: JSON.stringify(context) }],
    options: { num_predict: 30, temperature: 0.9 }
  });
  return r.message.content;
}
```

## Sources

- [Best Ollama Models 2026 — Morph](https://www.morphllm.com/best-ollama-models)
- [Best Ollama Models for Coding 2026](https://www.aimadetools.com/blog/best-ollama-models-coding-2026/)
- [Ollama NPC dialogue tutorial (markaicode)](https://markaicode.com/ollama-npc-dialogue-story-generation-game-development/)
- [Ollama-js guide (BrightCoding)](https://www.blog.brightcoding.dev/2025/12/09/guide-to-ollama-js-revolutionizing-ai-integration-in-javascript-applications/)
- [Implementing Ollama in video games (Arsturn)](https://www.arsturn.com/blog/implementing-ollama-in-video-games)
