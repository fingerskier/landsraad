Implemented the rename from `factcheck` / `Fact-Checker` to `skeptic` / `Skeptic`.

Changed:
- [example/writing-team.template.json](example/writing-team.template.json:38): renamed slug/name and rewrote the persona/routing hints around adversarial refutation.
- [src/lib/server/templates.writing-team.test.ts](src/lib/server/templates.writing-team.test.ts:28): updated roster assertions and added checks for Skeptic name/persona/routing language.

Verified:
- Targeted test failed first as expected, then passed.
- `npm test` passes: 47 files, 299 tests.

Note: Ceres MCP tools were not exposed in this session, so I could not claim/complete the task or write Ceres memory. The working tree also shows existing `package-lock.json` changes that I did not edit for this task.
