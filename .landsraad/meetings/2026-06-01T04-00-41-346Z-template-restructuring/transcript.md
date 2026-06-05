
## Turn 1 — director — 2026-06-01T04:00:50.237Z

please give feedback

## Turn 2 — shaddam — 2026-06-01T04:01:57.578Z

**Shaddam — Evangelist**

I'm in favor of promoting them, with one naming knot to untie first. Quick grounding on what's actually true today:

- The picker that newcomers see when creating/changing a council is fed by `bundledTemplatesDir()` → `example/` (`src/lib/server/paths.ts:13`). So the five starters — `engineering`, `hedge-fund`, `c-suite`, `landsraad`, `writing-team` — are *already* the official product surface. They're just filed under a folder named "example."
- Meanwhile `templates/` already exists and holds exactly one thing: `dogfood.template.json`, a `mock:local` test fixture (`SPECIFICATION.md:143`, `:161`).

So the directories are inverted from what their names promise. The folder called **example** holds the canonical, user-facing starting points; the folder called **templates** holds the throwaway dev fixture. That's the real problem here, and it's squarely a naming/positioning issue.

**Why the rename matters (my lane):** "example" tells a first-time user *this is illustrative, don't lean on it.* But choosing a starter is the very first decision a newcomer makes — it's the empty-state onboarding moment. Labeling that surface "example" quietly undersells the most important thing on the screen. "Template" says *this is a supported place to begin.* +1 to the move on those grounds alone.

**Two cautions before we call them "official":**

1. **Don't let dogfood ride along into the picker.** If we consolidate everything into `templates/`, dogfood — a `mock:local` echo-bot fixture — could surface next to the real starters and make a newcomer go "which of these is the actual product?" Keep the user-facing starters in one place and dogfood somewhere that doesn't render in the council-creation list.
2. **"Official" is a promise, not just a folder.** It commits us to: each template stays valid against the current `format_version`, each opens to a council that makes sense on first run, and we don't break them casually. If we're not ready to make that promise, call them "starter templates" rather than "official templates" — softer word, honest about the support level.

**One thing I can't see from the filesystem:** what the UI actually *labels* this picker and the items in it. My reflection rule is to quote exact current copy against exact replacement, and I don't have the on-screen string yet. If today it reads "Examples" or "Choose an example," that copy needs to move in lockstep with the folder — otherwise we've renamed the drawer but not the label on it.

**Routing:**
- The directory move + repointing `bundledTemplatesDir()` and the dogfood path → **fenring**.
- "Does calling these 'official' overpromise vs. what we'll actually maintain?" → **vladimir**.
- Whether dogfood counts as a template at all / how many starters we feature → **leto**.

```
<<JOB councillor="shaddam">>
Audit the council-creation / change-council UI for the template picker. Quote
the exact on-screen copy (heading, helper text, item labels — e.g. "Examples",
"Choose an example") and propose the exact replacement so the wording matches
the promotion from "example" to "template" (or "starter template"). Deliver
current-string → proposed-string pairs.
<<JOB>>
```

```
<<MEMORY scope="shared">>
In UI and docs we call the bundled council starting points "templates" (or
"starter templates"), never "examples." "Example" signals throwaway; these are
the supported first step a newcomer picks from. Reserve "example" for genuinely
illustrative, unsupported snippets.
<<MEMORY>>
```

Net: yes, promote — but resolve the `example/` ↔ `templates/` inversion deliberately, keep the dogfood fixture out of the newcomer's picker, and make sure the visible label moves with the folder.

## Turn 3 — fenring — 2026-06-01T04:02:36.837Z

**Fenring — Implementer**

Agree with the move. From code, this is a small mechanical slice, but it has one important boundary: the bundled picker and dogfood seed path must not collapse into the same directory.

Current facts:

- `bundledTemplatesDir()` points at `example/`, so `/import` lists the five starter councils from there: [src/lib/server/paths.ts](src/lib/server/paths.ts:12).
- `listBundledTemplates()` blindly lists every `*.template.json` in that directory, so dogfood would appear if moved into the same picker directory: [src/lib/server/templates.ts](src/lib/server/templates.ts:275).
- The existing bundled test explicitly expects `example/` and asserts the source path contains `example`: [src/lib/server/templates.bundled.test.ts](src/lib/server/templates.bundled.test.ts:5).
- Dogfood is separately documented and wired through `templates/dogfood.template.json`: [SPECIFICATION.md](SPECIFICATION.md:143), [package.json](package.json:21).

Implementation shape I’d ship:

1. Move user-facing starters from `example/*.template.json` to `templates/*.template.json`.
2. Move dogfood out of that picker surface, probably to `fixtures/dogfood.template.json` or `dogfood/dogfood.template.json`.
3. Change `bundledTemplatesDir()` to `join(pkgRoot(), 'templates')`.
4. Change `npm run dogfood:init`, README, and spec references from `templates/dogfood.template.json` to the new dogfood fixture path.
5. Update package `files` so published installs include the starter templates and dogfood fixture.
6. Update tests first: bundled templates should expect the five starters under `templates/`, and should prove dogfood is not listed.

```
<<JOB councillor="fenring">>
Promote the five starter council templates from `example/` to `templates/`,
move `templates/dogfood.template.json` to a non-picker fixture path, repoint
`bundledTemplatesDir()` and `npm run dogfood:init`, then update README,
SPECIFICATION.md, package `files`, and bundled-template tests so `/import`
lists only the five starter templates and never dogfood.
<<JOB>>
```

```
<<MEMORY scope="shared">>
The bundled template picker must enumerate only user-facing starter council
templates. Dogfood is a development fixture for exercising Landsraad itself and
must live outside the picker directory even though it uses the same
`*.template.json` schema.
<<MEMORY>>
```
