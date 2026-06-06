# Documentation Upgrade — working draft

Goal: produce `docs/GLOSSARY.md` (Landsraad-specific agent terms) and
`docs/TAGS.md` (the `<<…>>` agent block protocol).

Status: **v2 — both files SHIPPED to disk (shaddam, turn 2).** The drafts below
have been split into two real files, completed (the previously-truncated TAGS
section is now whole), voice-edited for a first-time reader, provenance tags
stripped, and cross-linked. Remaining work is verification, not authoring.

- `docs/GLOSSARY.md` — written. Sections: The frame · Doing work · Memory ·
  Meetings · Oeuvres · Packaging. ~50 terms, canonical-vs-synonym called out,
  "turn" gotcha boxed, frame-four flagged as read-first.
- `docs/TAGS.md` — written. Parsing rules (whitespace-tolerant, unknown-ignored,
  fail-safe) · scan-site table · full per-tag reference for
  `<<MEMORY>>` / `<<JOB>>` / `<<NEXT>>` / `<<SCRATCHPAD>>` / `<<VOTE>>`, each with
  a real example and attribute list. `<<SCHEDULE>>` explicitly marked not-implemented.

All content grounded in `SPECIFICATION.md`, `docs/architecture.md`,
`docs/data-model.md`, `docs/embeddings.md`, `docs/HOUSE_RULES_ADD.md`, and
`docs/superpowers/specs/2026-06-05-oeuvre-design.md` (the canonical source for the
oeuvre tag semantics — invalid-pick re-ask-then-pause, version-bump invalidates
finish votes, missing-vote-defaults-to-continue).

## What's left before this oeuvre should conclude
1. **Technical accuracy pass (→ fenring).** Verify the GLOSSARY/TAGS claims against
   actual code, not just specs: adapter list (`cli:*` tools), the chunk-kind enum
   (`embeddings.md`), `<<NEXT>>`/`<<SCRATCHPAD>>`/`<<VOTE>>` parser behavior in
   `oeuvre-blocks.ts`, and the `?model=` tier names (`lite`/`medium`/`heavy`).
2. **Gap / mislead audit (→ vladimir).** Anything a newcomer would still be
   confused by? Any term defined here that contradicts product UI copy? Any
   load-bearing term missing (e.g. council root vs `.landsraad/` "machine vs
   product" framing — currently implied in the Index entry, not its own term)?
3. **README/INDEX wiring (→ shaddam, next turn).** Link both new files from
   `README.md` and/or `docs/` so they're discoverable. Decide whether `gzip_density`
   and the planned `AGENTS.md` council-guide deserve "(planned)" stubs.

## Decisions locked this turn (carry into any edits)
- Audience: someone landing mid-system who needs word → mental-model fast.
- Canonical terms bold; retired synonyms named inline ("older docs may say…").
- We say **councillor** not "agent", **director** not "user/operator",
  **job** not "task", **turn** only ever means a structured meeting/oeuvre turn.
- TAGS.md leads with parsing guarantees so emitters trust fail-safe behavior.
