<<SCRATCHPAD>>
# Documentation Upgrade — working draft

Goal: produce `docs/GLOSSARY.md` (Landsraad-specific agent terms) and
`docs/TAGS.md` (the `<<…>>` agent block protocol).

Status: **v3 — technical accuracy pass applied (fenring, turn 3).** Both files
exist on disk and now match the current parser/registry behavior checked against
code, not only specs.

- `docs/GLOSSARY.md` — written and revised. Added explicit frame terms for
  **Council root**, **Council machine**, and **Product tree** so the
  `.landsraad/` machine vs product-tree split is first-class
  (`docs/GLOSSARY.md:22`, `docs/GLOSSARY.md:26`, `docs/GLOSSARY.md:31`).
- `docs/GLOSSARY.md` — adapter list corrected to include all shipped known CLI
  adapters from `src/lib/server/adapters/index.ts` / `cli.ts`: `cli:claude`,
  `cli:codex`, `cli:gemini`, `cli:grok`, `cli:qwen`, `cli:vibe`, `cli:aider`,
  `cli:warp` (`docs/GLOSSARY.md:41`).
- `docs/GLOSSARY.md` — chunk-kind enum corrected to include meeting and oeuvre
  kinds from `src/lib/server/embeddings.ts`: `meeting_topic`, `meeting_turn`,
  `meeting_summary`, `meeting_synthesis`, `oeuvre_scratchpad`
  (`docs/GLOSSARY.md:108`).
- `docs/TAGS.md` — `<<SCRATCHPAD>>` parser behavior corrected: ratification is
  based on absence or equivalence after surrounding whitespace trimming, not
  byte-identical comparison (`docs/TAGS.md:112`).
- `docs/TAGS.md` — `<<VOTE>>` reason behavior corrected: reason can be an
  attribute or paired block body, and the body wins when both are present
  (`docs/TAGS.md:126`).

Verified against:
- `src/lib/server/oeuvre-blocks.ts` — `parseNext`, `parseScratchpad`, `parseVote`
- `src/lib/server/oeuvre-runner.ts` — invalid leader picks fail, re-ask via
  leader failure policy, pause after consecutive failures, edit bumps
  `scratchpad_version`, current-version `finish` votes converge
- `src/lib/server/adapters/cli.ts` and `src/lib/server/adapters/index.ts` —
  known adapter registry and `lite` / `medium` / `heavy` tier handling
- `src/lib/server/embeddings.ts` and `src/lib/server/index-sources.ts` —
  authoritative `ChunkKind` union and source registry
- `SPECIFICATION.md` / `docs/data-model.md` — council-root and `.landsraad/`
  storage framing

## What's left before this oeuvre should conclude
1. **Gap / mislead audit (→ vladimir).** One final newcomer-oriented pass:
   anything still confusing, any UI-copy contradiction, any load-bearing term still
   missing.
2. **README/INDEX wiring (→ shaddam).** Link `docs/GLOSSARY.md` and
   `docs/TAGS.md` from `README.md` and/or a docs index so the new references are
   discoverable. Decide whether `gzip_density` and the planned `AGENTS.md`
   council-guide deserve "(planned)" stubs.

## Decisions locked
- Audience: someone landing mid-system who needs word → mental-model fast.
- Canonical terms bold; retired synonyms named inline ("older docs may say…").
- We say **councillor** not "agent", **director** not "user/operator",
  **job** not "task", **turn** only ever means a structured meeting/oeuvre turn.
- TAGS.md leads with parsing guarantees so emitters trust fail-safe behavior.
- The council is the **machine** under `.landsraad/`; the director's project files
  are the **product tree** at the council root.
<</SCRATCHPAD>>

<<VOTE value="continue" reason="technical mismatches are closed; shaddam still needs to wire README/docs discoverability">>
