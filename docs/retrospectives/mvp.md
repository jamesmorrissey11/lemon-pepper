# MVP Retrospective

> Evidence cutoff: 2026-10-16, after the Wave 3 application stories (#12 and #14) merged and the
> final local smoke test completed.

This retrospective uses repository and GitHub history plus sanitized validation results as evidence.

## Wave Outcomes

| Wave | Observed outcome |
|------|------------------|
| 1 — Foundation | Story PRs #5 and #15 merged with project context, secret boundaries, the Next.js scaffold, shared contracts, and executable validation. |
| 2 — Capabilities | Story PRs #18, #19, and #20 merged independent ranking, accessible components, and the server-only Serper client. Their story-owned source files did not overlap. |
| 3 — Integration | Story PRs #24 and #25 merged the search API and integrated UI. PR #23 adds CI, the runbook, and this retrospective after the final review gate. |

## Observed Wave 1–2 Evidence

| Measure | Observation | Evidence and interpretation |
|---------|-------------|-----------------------------|
| First-pass acceptance | 4 of 5 story PRs (80%) merged from a single implementation commit. | PRs #5, #15, #18, and #19 each contain one implementation commit. PR #20 contains an implementation commit plus a corrective commit, so it is counted as rework. A later fix to scaffold output is disclosed separately below. |
| Rework | One pre-merge correction and two post-wave follow-ups. | PR #20 added `fix(search): use public server-only package` before merge. PR #17 removed an unavailable mandatory Copilot-review gate, and PR #22 corrected tracking of generated Next.js type references after the affected scaffold had merged. |
| Review findings | Zero formal review findings were submitted on story PRs #5, #15, #18, #19, and #20. | GitHub records no submitted reviews on those PRs. PR #15 explicitly records that the requested Copilot review never arrived; successful automated and manual checks were recorded instead. The zero is therefore a lack-of-record baseline, not proof that the work was defect-free. |
| Merge conflicts | Zero conflict-resolution files across the five story merge commits. | Combined merge diffs for PRs #5, #15, #18, #19, and #20 contain no merge-resolution changes. Wave 2 also maintained exclusive story source-file ownership. |

The post-merge PR #22 means the 80% first-pass figure should not be interpreted as an escaped-defect
rate. It measures whether each story PR required an in-branch implementation correction before
acceptance, while the rework row separately preserves later corrective evidence.

## What Worked

- Explicit file ownership let the three Wave 2 stories progress independently and merge cleanly.
- Server-only configuration and mocked external calls kept validation independent of a live secret.
- Small contracts allowed ranking, provider access, and UI components to be tested before
  integration.

## Improvement Actions

1. Make a human review decision explicit on every application PR; an absent review is not a passing
   review.
2. Add a pre-merge check for generated and ignored Next.js files so scaffold cleanup does not become
   a follow-up issue.
3. Verify dependency package names and public registry availability before the first implementation
   commit.
4. Keep manual smoke evidence sanitized: record counts and pass/fail outcomes, not credentials or
   live result content.
5. Recalculate first-pass acceptance after all Wave 3 PRs reach a terminal review state, and keep
   review findings distinct from automated test failures.

## Wave 3 Final Review

PRs #24 and #25 each passed direct diff review and merged from one implementation commit. PR #23
uses a planned follow-up commit to record final evidence after those application stories merged;
that evidence-only update is not corrective implementation rework.

| Final Wave 3 metric | Observation |
|---------------------|-------------|
| First-pass acceptance | 3 of 3 stories (100%) were accepted without corrective implementation changes. |
| Rework | Zero corrective implementation commits. PR #23's second commit is the planned final evidence capture. |
| Review findings | Zero blocking findings. Direct diff review, lint, tests, production builds, CodeQL, and action analysis passed. A test-discovery failure caused by mounted worktrees was classified as harness isolation, not a product defect. |
| Merge conflicts | Zero. The API, UI, and CI/runbook stories retained non-overlapping file ownership. |
| Manual smoke result | **Passed.** The page returned HTTP 200; default and refined live searches completed with ranked results; all seven links in the refined run used HTTP(S); and an interrupted request produced a safe network-failure message. No credential or result content was retained. |
