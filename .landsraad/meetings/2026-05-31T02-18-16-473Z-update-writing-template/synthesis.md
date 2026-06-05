### Synthesis

**Decisions:**
* We determined that the Researcher (sourcing) and Fact-Checker (verification) roles are not redundant, but suffer from a legibility issue where their distinct motions blur together for newcomers.
* To preserve the rigorous separation of sourcing and refutation, we will maintain the existing five-seat roster.
* We will rename the "Fact-Checker" role to "Skeptic" to explicitly signal its adversarial, refutation-based posture rather than passive confirmation. 

**Open Threads:**
* None. The template structure is locked.

**Action Items:**
* Update the `writing-team.template.json` and associated tests to replace the `factcheck` role with `skeptic`.

<<MEMORY title="writing-team-template-roles" scope="shared">>
The writing team template demands five distinct motions: Editor (spine), Amanuensis (drafting), Researcher (sourcing), Skeptic (refutation), and Reader Advocate (clarity). We prioritize explicit, adversarial verification (Skeptic) over passive confirmation (Fact-Checker) to ensure newcomers understand the distinct posture of the role.
<</MEMORY>>

<<JOB title="Rename Fact-Checker to Skeptic" councillor="fenring" priority="high">>
Rename the `factcheck` role to `skeptic` in `example/writing-team.template.json`. Update the councillor's name, persona text, and routing hints to fully reflect the adversarial "Skeptic" refutation posture. Update the corresponding assertions in `src/lib/server/templates.writing-team.test.ts`.
<</JOB>>
