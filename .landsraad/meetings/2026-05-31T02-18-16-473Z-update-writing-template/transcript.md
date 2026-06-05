
## Turn 1 — director — 2026-05-31T02:18:56.042Z

Are the Researcher & Fact-Checker redundant?  Perhaps we replace Fact-Checker with another roler?

## Turn 2 — shaddam — 2026-05-31T02:19:30.483Z

Speaking as **Shaddam**.

From where I sit — the newcomer's seat — the question isn't "do Researcher and Fact-Checker do different things." They do. Researcher *gathers* (find sources, surface what's out there); Fact-Checker *verifies* (adversarially confirm claims against those sources). Those are genuinely distinct motions, the same way our own roster splits Fenring's *building* from Vladimir's *finding the holes*.

The problem is they don't *read* as distinct. To anyone who hasn't internalized the workflow, "Researcher" and "Fact-Checker" both file under one mental bucket: *the people who deal with facts*. That blur is a legibility cost, and it's the real thing the director is sensing as "redundant."

So I'd reframe the question two ways:

**1. If we keep both, sharpen the names so the seam is obvious.**
The verification motion is the valuable one; "Fact-Checker" undersells it. Quoting the template's current framing and proposing the swap:

- `Researcher` → keep, but scope it explicitly to *sourcing*: "finds and brings the raw material."
- `Fact-Checker` → `Verifier` or `Skeptic` — someone whose job is to *try to refute* each claim, not just tick it as seen. That's a different posture from "checking," and the name should carry it.

**2. If we genuinely want to replace Fact-Checker, replace it with the role the reader never gets.**
Right now a writing template likely has people who handle *truth* (Researcher, Fact-Checker) and people who handle *structure/voice*. The chronically missing seat is the **Reader's Advocate** — someone who reads the draft cold and asks "does this teach itself? would a first-timer follow it?" That's exactly the gap I'm chartered to close, and no amount of fact-checking fills it. A wrong-but-clear piece and a right-but-impenetrable piece both fail the reader.

My recommendation: **don't delete verification — rename it to a Skeptic posture, and add a Reader's Advocate.** If headcount is fixed and something must go, fold *sourcing* into the writer's own prep and spend the freed seat on the Reader's Advocate. Verification is the one role I'd never cut; unchecked claims are how we mislead, and Vladimir will tell you the same from the critic's chair.

`<<MEMORY scope="shared">>` In role-naming, prefer the *posture* over the *task*: "Skeptic/Verifier" (try to refute) reads clearer to newcomers than "Fact-Checker" (passively confirm). A role's name should tell an outsider what motion it performs.

`<<JOB councillor="vladimir">>` Pressure-test the proposed split — does "Researcher (sourcing) + Skeptic (refutation)" leave any verification gap that a single combined role currently covers? Enumerate what falls through if we drop one.

`<<JOB councillor="leto">>` Make the call on headcount: keep four roles (Researcher + Skeptic + Reader's Advocate + Writer) or hold the line at the current count and decide what yields. This is a roster-shape decision, not just a rename.

Deferring the final composition to **leto** — but my vote is clear: rename the verifier, don't remove it, and spend any freed seat on the reader.

## Turn 3 — leto — 2026-05-31T02:22:22.652Z

We will hold the line at the current five-seat roster, which already includes the Reader Advocate. The tradeoff here is between the perceived simplicity of a smaller council and the rigorous necessity of keeping sourcing distinct from verification. If we merge them, the adversarial motion of refuting claims will inevitably collapse into just finding them. We choose rigor. To resolve the legibility cost Shaddam flagged, we will sharpen the distinction by renaming Fact-Checker to Skeptic so the adversarial posture is obvious to newcomers.

`<<MEMORY scope="shared">>` The writing team template demands five distinct motions: Editor (spine), Amanuensis (drafting), Researcher (sourcing), Skeptic (refutation), and Reader Advocate (clarity). We prioritize clear role posture over minimizing headcount, preferring explicit, adversarial verification (Skeptic) over passive confirmation (Fact-Checker).

`<<JOB councillor="fenring">>` Rename `factcheck` to `skeptic` in `example/writing-team.template.json`. Update the councillor's name, persona text, and routing hints to fully reflect the "Skeptic" refutation posture. Update the corresponding assertions in `src/lib/server/templates.writing-team.test.ts`.
