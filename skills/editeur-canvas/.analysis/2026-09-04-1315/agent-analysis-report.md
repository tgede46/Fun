# Analysis Report: agent-editeur-canvas

Generated: 2026-09-04T13:15:00Z · Schema: 2

**Grade: Good**

> Lean stateless agent with strong persona; critical eval gap and orphaned build artifact need attention.

Trace is a focused, well-characterized canvas editor with a clear persona and tight capability prompts. The primary weakness is an eval suite with only 2 cases (critical), and a prompt-quality-canon.md that inflates context without being routed. The persona is treated as investment and preserved.

| Severity | Count |
| --- | --- |
| Critical | 1 |
| High | 2 |
| Medium | 6 |
| Low | 11 |

## Themes

### 1. Over-documented wiring, under-documented contract

- Root cause: apply-instruction.md mixes LLM guidance with Rust pipeline plumbing and numbered process steps. validate-excalidraw.md describes validation as if the agent runs it, but Rust handles it. This confuses the model about its actual role.
- Fix: Reframe apply-instruction.md as goal + non-inferables only. Reframe validate-excalidraw.md as the Rust validation contract, not agent behavior.
- Findings:
  - `leanness-2` Approach prescribes process instead of stating outcome — `references/apply-instruction.md:14-19`
  - `determinism-1` Numbered steps in apply-instruction.md — `references/apply-instruction.md:16-20`
  - `determinism-2` Plumbing description in apply-instruction.md — `references/apply-instruction.md:23`
  - `enhancement-2` validate-excalidraw.md describes agent-side validation that never runs — `references/validate-excalidraw.md:29`

### 2. Build artifact pollution

- Root cause: prompt-quality-canon.md (1652 tokens, 2.7× SKILL.md) was auto-copied by the builder. It's a meta-document about prompt authoring, never routed, never loaded by the agent. It inflates context on every activation.
- Fix: Remove references/prompt-quality-canon.md from this skill. It belongs to the builder root.
- Findings:
  - `enhancement-3` prompt-quality-canon.md is meta-reference, not operational guidance — `references/prompt-quality-canon.md`
  - `cohesion-1` prompt-quality-canon.md is orphaned build artifact — `references/prompt-quality-canon.md`

### 3. Thin eval coverage

- Root cause: Only 2 eval cases for a skill that handles add/remove/relabel/recolor/reposition/connect. No edge-case, error, or hostile coverage.
- Fix: Add 6+ eval cases covering invalid JSON rejection, ambiguous instruction, delete of absent element, empty diagram, non-French input, and non-edit routing.
- Findings:
  - `enhancement-1` Eval suite has only 2 cases — `evals/cases.json`
  - `cohesion-3` Only two eval cases for multi-operation skill — `evals/cases.json`

### 4. Missing personalization and fallback

- Root cause: On-activation doesn't load user config ({user_name}, {communication_language}). No fallback for non-edit or non-French inputs.
- Fix: Add config loading to On Activation. Add catch-all routing for non-edit intents.
- Findings:
  - `cohesion-2` On-activation missing config loading — `SKILL.md:42-46`
  - `enhancement-5` No guidance for non-edit or non-French inputs — `SKILL.md:46`

## Strengths

- Strong, specific persona — 'artisan visuel précis' is memorable and functional
- Clean stateless topology — everything in SKILL.md + 3 focused references
- Tight non-inferables — JSON validity, canvas editability, Tauri persistence clearly stated
- Communication style table encodes non-obvious mappings (ambiguous instruction, invalid JSON)
- Integration-fun.md cleanly describes the wiring without bloating SKILL.md

## Recommendations

1. Remove references/prompt-quality-canon.md — orphaned build artifact inflating context by 2.7× (resolves: enhancement-3, cohesion-1)
2. Add 6+ eval cases to cases.json covering edge cases, errors, and hostile inputs (resolves: enhancement-1, cohesion-3)
3. Reframe apply-instruction.md: collapse numbered steps to outcome statement, remove Rust plumbing description (resolves: leanness-2, determinism-1, determinism-2)
4. Reframe validate-excalidraw.md as Rust-side validation contract, not agent behavior (resolves: enhancement-2)
5. Add config loading ({user_name}, {communication_language}) to On Activation and catch-all routing for non-edit intents (resolves: cohesion-2, enhancement-5)

## Agent Profile

- Name: Trace
- Title: Éditeur canvas
- Type: stateless
- Mission: Traduire une instruction utilisateur en modifications concrètes sur le canvas Excalidraw

## Capabilities

- **apply-instruction** (prompt) — Translate user instruction into Excalidraw canvas changes
- **validate-excalidraw** (prompt) — Validate Excalidraw JSON before save (Rust-side)
- **integration-fun** (prompt) — Wire Trace into Fun Chat and diagram pipeline

## Per-Lens Verdicts

- **leanness**: Lean overall — two redundancy findings in SKILL.md/apply-instruction.md, one canonical issue; validate-excalidraw.md and integration-fun.md are tight.
- **architecture**: Clean stateless skill — frontmatter, topology, progressive disclosure, and activation all pass; one low-severity finding on reference frontmatter divergence.
- **determinism**: Minor over-structure in apply-instruction.md; otherwise destination-focused.
- **customization**: Metadata-only customize.toml, no override surface — acceptable for stateless agent with focused scope.
- **enhancement**: Lean core with critical eval gap and one misallocated reference; no hostile-environment or headless guidance.
- **agent-cohesion**: Lean, well-carved skill; orphaned canon reference and missing on-activation config parity.

## Experience

- **Canvas edit** — User opens diagram → asks Trace to modify → Trace produces Excalidraw JSON → Rust validates and saves → canvas updates
- **Review redirect** — User asks for review → Trace redirects to relecteur-diagramme
- Headless: No headless invocation contract defined.

## Findings

### Critical (1)

#### enhancement-1 — Eval suite has only 2 cases

- Location: `evals/cases.json`
- Evidence: Only trigger-edit and baseline-separation. No edge-case, error, or hostile coverage.
- Recommendation: Add 6+ cases covering invalid JSON, ambiguous instruction, delete-missing, empty canvas, non-French input, non-edit routing.

### High (2)

#### enhancement-2 — validate-excalidraw.md describes agent-side validation that never runs

- Location: `references/validate-excalidraw.md:29`
- Evidence: Non-Inferables says validation runs in Rust, but Approach reads as if the agent performs it.
- Recommendation: Reframe as Rust validation contract. Remove agent-side checklist.

#### enhancement-3 — prompt-quality-canon.md is meta-reference, not operational guidance

- Location: `references/prompt-quality-canon.md`
- Evidence: 1652 tokens, never routed, never loaded. Inflates context on every activation.
- Recommendation: Remove from this skill. Belongs to builder root.

### Medium (6)

#### leanness-2 — Approach prescribes process instead of stating outcome

- Location: `references/apply-instruction.md:14-19`
- Evidence: Four numbered steps script the route. A model that knows the outcome and non-inferables already knows to parse intent and confirm.
- Recommendation: Collapse to outcome statement. Cut numbered steps and confirm step.

#### determinism-1 — Numbered steps in apply-instruction.md

- Location: `references/apply-instruction.md:16-20`
- Evidence: Four numbered steps form a scripted sequence.
- Recommendation: Replace with goal statement.

#### enhancement-4 — SKILL.md activation duplicates identity and communication style

- Location: `SKILL.md:14-28`
- Evidence: Identity, Communication Style, and On Activation carry overlapping info.
- Recommendation: Collapse into one block.

#### enhancement-5 — No guidance for non-edit or non-French inputs

- Location: `SKILL.md:46`
- Evidence: Routing table lists French edit verbs only.
- Recommendation: Add catch-all routing for non-edit intents.

#### customization-1 — No override surface in customize.toml

- Location: `skills/editeur-canvas/customize.toml:1-10`
- Evidence: Metadata only, no override hooks.
- Recommendation: Acceptable for focused stateless agent. Document if needed.

#### cohesion-1 — prompt-quality-canon.md is orphaned build artifact

- Location: `references/prompt-quality-canon.md`
- Evidence: 1652 tokens, never routed, dead weight.
- Recommendation: Remove from skill.

### Low (11)

#### leanness-1 — Overview restates name+description

- Location: `SKILL.md:10-12`
- Evidence: The overview sentence restates what the YAML name+description already convey.
- Recommendation: Replace overview with the outcome-only mission line and cut the restated role description.

#### leanness-3 — Minimal diff principle restated across files

- Location: `SKILL.md:35, references/apply-instruction.md:21`
- Evidence: Same rule in two files.
- Recommendation: Keep in SKILL.md, remove restatement from apply-instruction.md.

#### architecture-1 — Reference frontmatter uses non-standard fields

- Location: `references/apply-instruction.md:4-5`
- Evidence: code and type fields in reference frontmatter are inert.
- Recommendation: Remove or document purpose.

#### determinism-2 — Plumbing description in apply-instruction.md

- Location: `references/apply-instruction.md:23`
- Evidence: Describes Rust pipeline flow not needed for LLM decision-making.
- Recommendation: Move to integration-fun.md or remove.

#### determinism-3 — Missing consumer in apply-instruction.md

- Location: `references/apply-instruction.md`
- Evidence: No explicit consumer specified.
- Recommendation: Add consumer line.

#### enhancement-6 — .memlog.md mixes languages

- Location: `.memlog.md:6`
- Evidence: Chinese text in an English/French context.
- Recommendation: Normalize to English.

#### enhancement-7 — No headless invocation contract

- Location: `SKILL.md`
- Evidence: No input schema for headless callers.
- Recommendation: Add headless invocation section.

#### customization-2 — Hardcoded persona and routing in SKILL.md

- Location: `skills/editeur-canvas/SKILL.md:6-46`
- Evidence: Name, emoji, language, routing verbs hardcoded.
- Recommendation: Acceptable — persona is the deliverable.

#### customization-3 — Hardcoded error strings in references

- Location: `skills/editeur-canvas/references/validate-excalidraw.md:23`
- Evidence: Error message hardcoded inline.
- Recommendation: Acceptable for focused agent.

#### cohesion-2 — On-activation missing config loading

- Location: `SKILL.md:42-46`
- Evidence: Doesn't load {user_name}, {communication_language} like sibling skill.
- Recommendation: Add config loading.

#### cohesion-3 — Only two eval cases for multi-operation skill

- Location: `evals/cases.json`
- Evidence: Handles 6 operations, tests 2.
- Recommendation: Add 2-3 more cases.
