# Template-seeded `.env` — design

**Date:** 2026-06-01
**Status:** approved, pre-implementation

## Problem

A council's `.env` (per-council config: `LANDSRAAD_MEETING_TURN_NUDGE`,
`LANDSRAAD_MEETING_MODEL`, etc.) is only ever created by hand or via the
`/council` settings env editor. Installing a template scaffolds the council,
councillors, memory, and sample jobs — but never the `.env`. So a freshly
installed council starts with no brevity nudge, no model override, and no
discoverable knobs. The motivating case: meeting responses ran long because
`LANDSRAAD_MEETING_TURN_NUDGE` defaulted to empty and nothing seeded it.

Make `.env` defaults part of the template install flow.

## Decisions

1. **Source:** per-template `env` block in `template.json`. Each template ships
   its own knobs; bundled and remote templates both support it.
2. **Apply behavior:** overwrite under confirmation. Template env keys that
   collide with existing `.env` keys surface in the `ApplyPlan` and require
   `confirmedOverwrite` — the same gate councillors and memory already use.
   Non-colliding keys are added without confirmation.
3. **Export:** `exportSelection` may include selected env keys *with values*,
   but any selected key matching a secret-name pattern is rejected with a named
   error (explicit, never silently dropped).
4. **Comments (YAGNI trim):** `comment` is template-only metadata. It is **not**
   written into `.env`. `env-file.ts` is pair-only and `readCouncilEnv` drops
   `#` lines, so a written comment would vanish on round-trip. The schema keeps
   the field for template readability and export fidelity; `.env` stays clean.

## Schema (`src/lib/server/templates.ts`)

```ts
export interface CouncilTemplate {
  // …existing fields…
  env?: TemplateEnvPair[];
}

export interface TemplateEnvPair {
  key: string;
  value: string;
  comment?: string;
}
```

Validation (`validateEnvPair`, called from `validateTemplate` when `raw.env`
is present):

- `raw.env` must be an array when provided.
- `key` — required non-empty string matching `^[A-Za-z_][A-Za-z0-9_]*$`
  (reuse the `KEY_RE` shape from `env-file.ts`; import or re-declare).
- `value` — required string; must not contain `\r` or `\n`.
- `comment` — optional string.
- Duplicate `key` across the array → `TemplateValidationError`.

## Apply flow

### `ApplyPlan`

```ts
export interface ApplyPlan {
  // …existing fields…
  env: { add: string[]; overwrite: string[] };
}
```

### `planApply`

- Read current env once via `readCouncilEnv()` (returns `[]` when the file is
  missing — safe for fresh councils).
- Partition template env keys: key already present → `overwrite`, else `add`.
- Preserve template order within each list.

### `applyTemplate`

- `needsConfirm` becomes:
  `plan.council.willOverwrite || councillors.overwrite.length ||
   memory.overwrite.length || env.overwrite.length`.
- New step (after sample jobs): merge env.
  - Start from `readCouncilEnv()` pairs (existing order preserved).
  - For each template pair: if the key exists, replace its value in place;
    else append `{ key, value }`.
  - Write the merged list via `writeCouncilEnv(pairs)` — which already
    enforces `.env` in `.gitignore` and validates keys/values.
  - `comment` is not written (see decision 4).
- Skip the step entirely when `t.env` is absent/empty.

## Export flow

### `ExportSelection`

```ts
export interface ExportSelection {
  // …existing fields…
  env_keys: string[];
}
```

### Secret denylist

```ts
const SECRET_KEY_RE = /(?:key|api|token|secret|password|passwd|credential|auth|private)/i;
```

### `exportSelection`

- For each selected key:
  - If it matches `SECRET_KEY_RE` → throw `TemplateValidationError` naming the
    key (e.g. `Refusing to export env key "ANTHROPIC_API_KEY": matches a
    secret-name pattern.`).
- Read `readCouncilEnv()`, include `{ key, value }` for each selected,
  non-denied key that exists in the file. Unknown selected keys are skipped.
- Set `env` on the output template only when the resulting list is non-empty.
- `comment` is unavailable from `.env` (not stored there), so it is omitted on
  export.

## Bundled template seed

Add an `env` block to the relevant bundled template(s) so a fresh install lands
sensible meeting defaults:

```json
"env": [
  {
    "key": "LANDSRAAD_MEETING_TURN_NUDGE",
    "value": "Be terse. 1-3 sentences. Lead with your call, then one reason.",
    "comment": "Keeps meeting turns short."
  },
  {
    "key": "LANDSRAAD_MEETING_MODEL",
    "value": "lite",
    "comment": "Cheaper model for meeting turns."
  }
]
```

(Exact template files chosen during implementation — at minimum the
hedge-fund/council template that runs meetings.)

## Testing (red/green TDD)

- **Schema:** valid env parses; non-array rejected; bad key rejected; newline
  value rejected; duplicate key rejected; missing `env` is fine.
- **planApply:** fresh council → all keys in `add`; existing colliding key →
  `overwrite`; mix partitions correctly.
- **applyTemplate:** seeds `.env` on fresh council; collision without
  `confirmedOverwrite` throws `TemplateNeedsConfirmation`; with confirmation,
  value is replaced in place and non-colliding user keys are preserved; absent
  `env` is a no-op; resulting `.env` round-trips through `readCouncilEnv`.
- **exportSelection:** denylisted key throws named error; allowed keys export
  with values; unknown key skipped; empty result omits `env`.
- **Bundled:** every bundled template still parses (extend
  `templates.bundled.test.ts`).

## Out of scope

- Writing `comment` into `.env` (decision 4). Revisit only if env-file gains
  comment-aware round-tripping.
- A `.env` UI in the template install confirmation screen beyond surfacing the
  `env.add` / `env.overwrite` plan lists the existing confirmation flow already
  renders.

## Touched files

- `src/lib/server/templates.ts` — schema, validation, plan, apply, export.
- `src/lib/server/templates.test.ts` (+ bundled test) — coverage.
- Route/UI that renders `ApplyPlan` — show the new `env` add/overwrite lists.
- Bundled template JSON — seed env.
- `SPECIFICATION.md`, template-format doc, `README.md` — document the `env`
  block and the export denylist.
