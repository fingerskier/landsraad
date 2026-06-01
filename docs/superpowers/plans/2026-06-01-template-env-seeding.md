# Template-seeded `.env` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let council templates carry an `env` block that seeds the council's `.env` on install (overwrite-under-confirmation), and let export pull selected env keys while refusing secret-named keys.

**Architecture:** Extend the existing template pipeline in `src/lib/server/templates.ts` — schema → `validateTemplate` → `planApply` → `applyTemplate` → `exportSelection`. Env read/write goes through the existing `src/lib/server/env-file.ts` (`readCouncilEnv` / `writeCouncilEnv`), which already enforces `.env` in `.gitignore`. The `/import` confirmation UI gains env add/overwrite lines. All six bundled templates get a meeting-defaults `env` block.

**Tech Stack:** TypeScript (strict, ESM), SvelteKit, Vitest.

---

## File structure

- `src/lib/server/templates.ts` — schema, validation, plan, apply, export (all changes here).
- `src/lib/server/templates.test.ts` — unit coverage for schema/plan/export.
- `src/lib/server/templates.bundled.test.ts` — assert bundled templates carry env and still parse.
- `src/routes/import/+page.svelte` — render env add/overwrite in the plan; include env in the safe/overwrite counts.
- `example/{c-suite,engineering,hedge-fund,landsraad,writing-team}.template.json` + `templates/dogfood.template.json` — add `env` block.
- `SPECIFICATION.md` (§ Council Template) and `docs/data-model.md` — document the `env` block + export denylist.

A reusable test fact: `applyTemplate` / `planApply` operate on the **current council root** (`LANDSRAAD_COUNCIL_ROOT`). Existing tests in `templates.test.ts` already set up a temp council root — follow the existing `beforeEach`/`afterEach` pattern in that file when writing apply/export tests (read the top of the file first).

---

## Task 1: Schema + validation for the `env` block

**Files:**
- Modify: `src/lib/server/templates.ts` (schema interfaces near top; `validateTemplate`)
- Test: `src/lib/server/templates.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to the `describe('parseTemplate', …)` block in `src/lib/server/templates.test.ts`:

```ts
it('parses an env block', () => {
  const good = {
    ...validTemplate,
    env: [
      { key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' },
      { key: 'LANDSRAAD_MEETING_TURN_NUDGE', value: 'Be terse — 1-3 sentences.', comment: 'shorter turns' }
    ]
  };
  const t = parseTemplate(JSON.stringify(good));
  expect(t.env).toHaveLength(2);
  expect(t.env?.[0]).toEqual({ key: 'LANDSRAAD_MEETING_MODEL', value: 'lite', comment: undefined });
});

it('rejects env that is not an array', () => {
  const bad = { ...validTemplate, env: { LANDSRAAD_MEETING_MODEL: 'lite' } };
  expect(() => parseTemplate(JSON.stringify(bad))).toThrow(/env must be an array/);
});

it('rejects an env key that is not a valid env identifier', () => {
  const bad = { ...validTemplate, env: [{ key: '1BAD-KEY', value: 'x' }] };
  expect(() => parseTemplate(JSON.stringify(bad))).toThrow(/env\[0\]\.key/);
});

it('rejects an env value containing a newline', () => {
  const bad = { ...validTemplate, env: [{ key: 'OK_KEY', value: 'a\nb' }] };
  expect(() => parseTemplate(JSON.stringify(bad))).toThrow(/env\[0\]\.value/);
});

it('rejects duplicate env keys', () => {
  const bad = {
    ...validTemplate,
    env: [{ key: 'DUP', value: 'a' }, { key: 'DUP', value: 'b' }]
  };
  expect(() => parseTemplate(JSON.stringify(bad))).toThrow(/duplicate env key "DUP"/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- templates.test.ts`
Expected: the five new tests FAIL (env undefined / no validation).

- [ ] **Step 3: Add schema + validator**

In `src/lib/server/templates.ts`, add to the `CouncilTemplate` interface (after `sample_jobs?`):

```ts
  env?: TemplateEnvPair[];
```

Add a new interface near `TemplateSampleJob`:

```ts
export interface TemplateEnvPair {
  key: string;
  value: string;
  comment?: string;
}
```

Add a key regex near the top-level validators (mirrors `env-file.ts`'s `KEY_RE`):

```ts
const ENV_KEY_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
```

Add the validator function (place beside `validateSampleJob`):

```ts
function validateEnvPair(raw: unknown, path: string): TemplateEnvPair {
  if (!isObject(raw)) throw new TemplateValidationError(`${path} must be an object.`);
  const key = requireString(raw, path, 'key');
  if (!ENV_KEY_RE.test(key)) {
    throw new TemplateValidationError(
      `${path}.key ${JSON.stringify(key)} must match [A-Za-z_][A-Za-z0-9_]*.`
    );
  }
  const value = requireString(raw, path, 'value');
  if (/[\r\n]/.test(value)) {
    throw new TemplateValidationError(`${path}.value must not contain a newline.`);
  }
  const comment = optionalString(raw, path, 'comment');
  return { key, value, comment };
}
```

In `validateTemplate`, after the `sample_jobs` block and before the final `return`, add:

```ts
  let env: TemplateEnvPair[] | undefined;
  if (raw.env !== undefined) {
    if (!Array.isArray(raw.env)) throw new TemplateValidationError('template.env must be an array.');
    env = raw.env.map((e, i) => validateEnvPair(e, `env[${i}]`));
    const seen = new Set<string>();
    for (const e of env) {
      if (seen.has(e.key)) {
        throw new TemplateValidationError(`duplicate env key ${JSON.stringify(e.key)} in template.env.`);
      }
      seen.add(e.key);
    }
  }
```

Add `env` to the returned object literal:

```ts
  return {
    format_version: 1,
    name,
    version,
    description,
    author,
    license,
    council,
    councillors,
    memory,
    sample_jobs,
    env
  };
```

> Note: `requireString` for `value` rejects empty/whitespace strings. That is acceptable — an env pair with an empty value carries no default. If a future template needs an explicit empty value, relax this then; YAGNI for now.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- templates.test.ts`
Expected: all parseTemplate tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/templates.ts src/lib/server/templates.test.ts
git commit -m "feat(templates): validate optional env block in template schema"
```

---

## Task 2: `ApplyPlan.env` + `planApply` partition

**Files:**
- Modify: `src/lib/server/templates.ts` (`ApplyPlan` interface; `planApply`)
- Test: `src/lib/server/templates.test.ts`

- [ ] **Step 1: Write the failing tests**

In `templates.test.ts`, inside the apply/plan describe block that already sets up a temp council root (find the existing `describe` that calls `planApply` / `applyTemplate`; reuse its setup), add:

```ts
it('plans env adds on a fresh council', async () => {
  const t = parseTemplate(JSON.stringify({
    ...validTemplate,
    env: [{ key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' }]
  }));
  const plan = await planApply(t);
  expect(plan.env).toEqual({ add: ['LANDSRAAD_MEETING_MODEL'], overwrite: [] });
});

it('plans env overwrite when the key already exists in .env', async () => {
  const { writeCouncilEnv } = await import('./env-file');
  await writeCouncilEnv([{ key: 'LANDSRAAD_MEETING_MODEL', value: 'pro' }]);
  const t = parseTemplate(JSON.stringify({
    ...validTemplate,
    env: [
      { key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' },
      { key: 'NEW_KEY', value: 'x' }
    ]
  }));
  const plan = await planApply(t);
  expect(plan.env.overwrite).toEqual(['LANDSRAAD_MEETING_MODEL']);
  expect(plan.env.add).toEqual(['NEW_KEY']);
});
```

> The first test must run on a council root with **no** `.env`. If the shared setup writes one, scope these to a nested `describe` with its own clean temp root following the file's existing helper. Read the setup before writing.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- templates.test.ts`
Expected: FAIL — `plan.env` is undefined.

- [ ] **Step 3: Implement**

In `src/lib/server/templates.ts`, add to the `ApplyPlan` interface:

```ts
  env: { add: string[]; overwrite: string[] };
```

Import the env reader near the other `./` imports at the bottom of the imports section:

```ts
import { readCouncilEnv, writeCouncilEnv } from './env-file';
```

In `planApply`, before the final `return`, add:

```ts
  const existingEnvKeys = new Set(exists ? readCouncilEnv().map((p) => p.key) : []);
  const envAdd: string[] = [];
  const envOver: string[] = [];
  for (const e of t.env ?? []) {
    (existingEnvKeys.has(e.key) ? envOver : envAdd).push(e.key);
  }
```

Add `env: { add: envAdd, overwrite: envOver }` to the returned `ApplyPlan` literal.

> `readCouncilEnv()` returns `[]` when the file is missing, so guarding on `exists` is belt-and-suspenders; keep it for parity with the other plan fields.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- templates.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/templates.ts src/lib/server/templates.test.ts
git commit -m "feat(templates): partition template env into plan add/overwrite"
```

---

## Task 3: `applyTemplate` env merge + confirmation gate

**Files:**
- Modify: `src/lib/server/templates.ts` (`applyTemplate`: `needsConfirm`, new merge step)
- Test: `src/lib/server/templates.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to the apply describe block:

```ts
it('seeds .env on a fresh council apply', async () => {
  const { readCouncilEnv } = await import('./env-file');
  const t = parseTemplate(JSON.stringify({
    ...validTemplate,
    env: [{ key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' }]
  }));
  await applyTemplate(t, { confirmedOverwrite: false });
  expect(readCouncilEnv()).toEqual([{ key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' }]);
});

it('requires confirmation when an env key would be overwritten', async () => {
  const { writeCouncilEnv } = await import('./env-file');
  await writeCouncilEnv([{ key: 'LANDSRAAD_MEETING_MODEL', value: 'pro' }]);
  const t = parseTemplate(JSON.stringify({
    ...validTemplate,
    env: [{ key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' }]
  }));
  await expect(applyTemplate(t, { confirmedOverwrite: false })).rejects.toBeInstanceOf(
    TemplateNeedsConfirmation
  );
});

it('overwrites in place and preserves unrelated user keys when confirmed', async () => {
  const { writeCouncilEnv, readCouncilEnv } = await import('./env-file');
  await writeCouncilEnv([
    { key: 'USER_SECRET', value: 'keep-me' },
    { key: 'LANDSRAAD_MEETING_MODEL', value: 'pro' }
  ]);
  const t = parseTemplate(JSON.stringify({
    ...validTemplate,
    env: [
      { key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' },
      { key: 'LANDSRAAD_MEETING_TURN_NUDGE', value: 'Be terse.' }
    ]
  }));
  await applyTemplate(t, { confirmedOverwrite: true });
  expect(readCouncilEnv()).toEqual([
    { key: 'USER_SECRET', value: 'keep-me' },
    { key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' },
    { key: 'LANDSRAAD_MEETING_TURN_NUDGE', value: 'Be terse.' }
  ]);
});
```

Ensure `TemplateNeedsConfirmation` is imported in the test file's import block (add it if missing).

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- templates.test.ts`
Expected: FAIL — env not written; no confirmation gate on env.

- [ ] **Step 3: Implement**

In `applyTemplate`, extend `needsConfirm`:

```ts
  const needsConfirm =
    plan.council.willOverwrite ||
    plan.councillors.overwrite.length > 0 ||
    plan.memory.overwrite.length > 0 ||
    plan.env.overwrite.length > 0;
```

After the sample-jobs block (step 4) and before `return plan;`, add:

```ts
  // 5. Env defaults: merge template pairs into <councilRoot>/.env. Existing
  //    keys are replaced in place (already confirmed via needsConfirm); new
  //    keys are appended. `comment` is intentionally not written.
  if (t.env && t.env.length > 0) {
    const pairs = readCouncilEnv();
    const index = new Map(pairs.map((p, i) => [p.key, i]));
    for (const e of t.env) {
      const at = index.get(e.key);
      if (at === undefined) {
        index.set(e.key, pairs.length);
        pairs.push({ key: e.key, value: e.value });
      } else {
        pairs[at] = { key: e.key, value: e.value };
      }
    }
    await writeCouncilEnv(pairs);
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- templates.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/templates.ts src/lib/server/templates.test.ts
git commit -m "feat(templates): seed council .env from template env on apply"
```

---

## Task 4: `exportSelection` env keys + secret denylist

**Files:**
- Modify: `src/lib/server/templates.ts` (`ExportSelection`; `exportSelection`; add `SECRET_KEY_RE`)
- Test: `src/lib/server/templates.test.ts`

- [ ] **Step 1: Write the failing tests**

In the export describe block (find the existing `describe` that exercises `exportSelection`; reuse its setup — it seeds a council to export from), add:

```ts
it('exports selected env keys with values', async () => {
  const { writeCouncilEnv } = await import('./env-file');
  await writeCouncilEnv([
    { key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' },
    { key: 'IGNORED', value: 'no' }
  ]);
  const out = await exportSelection({
    council: { name: 'X', version: '1.0.0' },
    councillor_slugs: [],
    memory_slugs: [],
    sample_job_ids: [],
    env_keys: ['LANDSRAAD_MEETING_MODEL']
  });
  expect(out.env).toEqual([{ key: 'LANDSRAAD_MEETING_MODEL', value: 'lite' }]);
});

it('omits env when no env keys are selected', async () => {
  const out = await exportSelection({
    council: { name: 'X', version: '1.0.0' },
    councillor_slugs: [],
    memory_slugs: [],
    sample_job_ids: [],
    env_keys: []
  });
  expect(out.env).toBeUndefined();
});

it('refuses to export a secret-named env key', async () => {
  const { writeCouncilEnv } = await import('./env-file');
  await writeCouncilEnv([{ key: 'ANTHROPIC_API_KEY', value: 'sk-xxx' }]);
  await expect(
    exportSelection({
      council: { name: 'X', version: '1.0.0' },
      councillor_slugs: [],
      memory_slugs: [],
      sample_job_ids: [],
      env_keys: ['ANTHROPIC_API_KEY']
    })
  ).rejects.toThrow(/ANTHROPIC_API_KEY/);
});

it('skips a selected env key that is not present in .env', async () => {
  const { writeCouncilEnv } = await import('./env-file');
  await writeCouncilEnv([{ key: 'PRESENT', value: 'yes' }]);
  const out = await exportSelection({
    council: { name: 'X', version: '1.0.0' },
    councillor_slugs: [],
    memory_slugs: [],
    sample_job_ids: [],
    env_keys: ['PRESENT', 'MISSING']
  });
  expect(out.env).toEqual([{ key: 'PRESENT', value: 'yes' }]);
});
```

Ensure `exportSelection` is imported in the test file.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- templates.test.ts`
Expected: FAIL — `env_keys` not on the type / `out.env` undefined / no denylist.

- [ ] **Step 3: Implement**

Add the denylist near the top-level constants in `templates.ts`:

```ts
const SECRET_KEY_RE = /key|api|token|secret|password|passwd|credential|auth|private/i;
```

Add `env_keys` to `ExportSelection`:

```ts
  env_keys: string[];
```

In `exportSelection`, after building `sample_jobs` and before the final `return`, add:

```ts
  const env: TemplateEnvPair[] = [];
  if (s.env_keys.length > 0) {
    const current = new Map(readCouncilEnv().map((p) => [p.key, p.value]));
    for (const key of s.env_keys) {
      if (SECRET_KEY_RE.test(key)) {
        throw new TemplateValidationError(
          `Refusing to export env key ${JSON.stringify(key)}: matches a secret-name pattern.`
        );
      }
      const value = current.get(key);
      if (value !== undefined) env.push({ key, value });
    }
  }
```

Add to the returned template literal:

```ts
    env: env.length ? env : undefined
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- templates.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/server/templates.ts src/lib/server/templates.test.ts
git commit -m "feat(templates): export selected env keys, reject secret-named keys"
```

---

## Task 5: Render env in the `/import` confirmation plan

**Files:**
- Modify: `src/routes/import/+page.svelte`

No server change: `planApply` already returns `plan.env`, and the `apply` action already passes `confirmedOverwrite: true`. This task only surfaces env in the preview so the user sees what they confirm.

- [ ] **Step 1: Add env to the counts**

In `src/routes/import/+page.svelte`, update `safeCount`:

```svelte
    {@const safeCount =
      (safeCouncil ? 1 : 0) +
      plan.councillors.add.length +
      plan.memory.add.length +
      plan.env.add.length +
      (!plan.sample_jobs.skipped_because_jobs_exist && plan.sample_jobs.add > 0 ? 1 : 0)}
```

and `overwriteCount`:

```svelte
    {@const overwriteCount =
      (plan.council.exists && plan.council.willOverwrite ? 1 : 0) +
      plan.councillors.overwrite.length +
      plan.memory.overwrite.length +
      plan.env.overwrite.length}
```

- [ ] **Step 2: Render env in the add list**

In the "Safe additions" `<ul class="plan add">`, after the memory-note `{#each}` and before the sample-jobs `{#if}`:

```svelte
            {#each plan.env.add as k}<li>env: {k}</li>{/each}
```

- [ ] **Step 3: Render env in the overwrite list**

In the "Overwrites" `<ul class="plan over">`, after the memory-note `{#each}`:

```svelte
            {#each plan.env.overwrite as k}<li>env (overwrite): {k}</li>{/each}
```

- [ ] **Step 4: Type-check**

Run: `npm run check`
Expected: no new errors. (`plan.env` is now on `ApplyPlan` from Task 2.)

- [ ] **Step 5: Smoke test**

Run: `npm run dev`, open `/import`, preview a bundled template (after Task 6), and confirm the env keys appear under "Safe additions". Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add src/routes/import/+page.svelte
git commit -m "feat(import): show template env adds/overwrites in install plan"
```

---

## Task 6: Seed all official templates with meeting defaults

**Files:**
- Modify: `example/c-suite.template.json`, `example/engineering.template.json`,
  `example/hedge-fund.template.json`, `example/landsraad.template.json`,
  `example/writing-team.template.json`, `templates/dogfood.template.json`
- Test: `src/lib/server/templates.bundled.test.ts`

> `example/*` is the bundled set served by `bundledTemplatesDir()` (`paths.ts`).
> `templates/dogfood.template.json` is the in-repo built-in that actually runs
> these meetings — seed it too so this repo's own councils get the defaults.

- [ ] **Step 1: Write the failing test**

Read `src/lib/server/templates.bundled.test.ts` first to match its iteration
style (it loops bundled templates and parses each). Add:

```ts
it('every bundled template seeds the meeting defaults', async () => {
  const { listBundledTemplates, loadTemplate } = await import('./templates');
  const bundled = await listBundledTemplates();
  expect(bundled.length).toBeGreaterThan(0);
  for (const b of bundled) {
    const t = await loadTemplate(b.source);
    const byKey = new Map((t.env ?? []).map((e) => [e.key, e.value]));
    expect(byKey.get('LANDSRAAD_MEETING_MODEL')).toBe('lite');
    expect(byKey.get('LANDSRAAD_MEETING_TURN_NUDGE')).toBe('Be terse — 1-3 sentences.');
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- templates.bundled.test.ts`
Expected: FAIL — templates have no `env`.

- [ ] **Step 3: Add the `env` block to each template file**

In each of the six files, add a top-level `"env"` array (sibling of
`"councillors"` / `"sample_jobs"`). Insert as the last top-level key before the
closing `}` (add a comma to the previous last key). Use exactly:

```json
  "env": [
    {
      "key": "LANDSRAAD_MEETING_MODEL",
      "value": "lite",
      "comment": "Use the cheaper model for meeting turns."
    },
    {
      "key": "LANDSRAAD_MEETING_TURN_NUDGE",
      "value": "Be terse — 1-3 sentences.",
      "comment": "Keep meeting responses short."
    }
  ]
```

> The dash in the nudge is a literal em dash `—` (U+2014), matching the value
> asserted in the test. Keep the files valid JSON (watch the trailing comma on
> the previous key).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- templates.bundled.test.ts`
Expected: PASS.

- [ ] **Step 5: Verify the whole suite is green**

Run: `npm test`
Expected: all tests PASS (catches any JSON parse regression in the bundled set).

- [ ] **Step 6: Commit**

```bash
git add example/*.template.json templates/dogfood.template.json src/lib/server/templates.bundled.test.ts
git commit -m "feat(templates): seed meeting brevity + lite-model defaults in all official templates"
```

---

## Task 7: Documentation

**Files:**
- Modify: `SPECIFICATION.md` (§ Council Template, lines ~138-145)
- Modify: `docs/data-model.md` (template section)

- [ ] **Step 1: Update SPECIFICATION.md**

In the `### Council Template` section, under the **Install** bullet, append a sentence:

```markdown
A template may carry an optional `env` array (`{ key, value, comment? }`); on install these seed the council's `.env` via `writeCouncilEnv` (existing keys are replaced only under the same overwrite confirmation as councillors/memory; `comment` is template-only and not written). All bundled templates seed `LANDSRAAD_MEETING_MODEL=lite` and `LANDSRAAD_MEETING_TURN_NUDGE` so meetings start terse and cheap.
```

Under the **Export** bullet, append:

```markdown
Env export is opt-in per key; any selected key whose name matches a secret pattern (`key`, `api`, `token`, `secret`, `password`, `credential`, `auth`, `private`) is refused with a named error so secrets never land in a shareable template.
```

- [ ] **Step 2: Update docs/data-model.md**

Find the template schema description (grep `sample_jobs` in `docs/data-model.md`) and add an `env` row/line in the same style as the existing fields:

```markdown
- `env?` — array of `{ key, value, comment? }`. Optional default environment
  variables seeded into the council `.env` on install. Keys must be valid env
  identifiers; values are single-line. `comment` documents the key in the
  template only (not written to `.env`). Export refuses secret-named keys.
```

- [ ] **Step 3: Commit**

```bash
git add SPECIFICATION.md docs/data-model.md
git commit -m "docs(templates): document env block seeding and export denylist"
```

---

## Final verification

- [ ] Run the full suite: `npm test` — all green.
- [ ] Type-check: `npm run check` — no new errors.
- [ ] Manual: `npm run dev` → `/import` → preview a bundled template → env keys
      shown under "Safe additions" → confirm install on a scratch council root
      (`LANDSRAAD_COUNCIL_ROOT=./scratch`) → `scratch/.env` contains both keys
      and `scratch/.gitignore` contains `.env`.
