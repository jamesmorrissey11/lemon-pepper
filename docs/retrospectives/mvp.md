# MVP Retrospective

> Evidence cutoff: 2026-10-16, before the Wave 3 application stories (#12 and #14) merged.

This retrospective uses repository and GitHub history as evidence. Wave 1 and Wave 2 values are
observed; Wave 3 values remain pending rather than being inferred from work still under review.

## Wave Outcomes

| Wave | Observed outcome |
|------|------------------|
| 1 — Foundation | Story PRs #5 and #15 merged with project context, secret boundaries, the Next.js scaffold, shared contracts, and executable validation. |
| 2 — Capabilities | Story PRs #18, #19, and #20 merged independent ranking, accessible components, and the server-only Serper client. Their story-owned source files did not overlap. |
| 3 — Integration | Pending final review of the application PRs for #12 and #14 and this quality-gate story (#13). No final Wave 3 metric is reported yet. |

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
4. At the Wave 3 gate, run the README smoke checklist without retaining credentials or result data,
   then record sanitized pass/fail evidence only.
5. Recalculate first-pass acceptance after all Wave 3 PRs reach a terminal review state, and keep
   review findings distinct from automated test failures.

## Wave 3 — Pending Final Review

Update this table only after the application PRs for #12 and #14 merge and the #13 PR completes its
final review gate.

| Final Wave 3 metric | Status |
|---------------------|--------|
| First-pass acceptance | **Pending** — inspect final commit and review history for the three Wave 3 story PRs. |
| Rework | **Pending** — count corrective commits or requested changes before merge. |
| Review findings | **Pending** — record submitted findings and their fixed, accepted, or deferred disposition. |
| Merge conflicts | **Pending** — inspect the final merge records and overlapping files. |
| Manual smoke result | **Pending** — record pass/fail only; do not retain credentials or live result content. |

This section and table are the single location for the final Wave 3 figures. Do not replace
`Pending` values until the linked application work and review evidence exist.
