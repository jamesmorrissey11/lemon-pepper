# Copilot Instructions for lemon-pepper

## Project Context

`lemon-pepper` is a toy Agentic-Agile project that helps users find relevant lemon pepper drop martini results in Atlanta. It uses the Next.js App Router, TypeScript, npm, and a server-side Serper integration.

Read `AGENTS.md` before starting work; it is the canonical project entry point and defines the architecture, scope boundaries, wave plan, and repository workflow.

## Implementation Conventions

- Keep `SERPER_API_KEY` server-only. Never use a `NEXT_PUBLIC_` variable for it or include it in output, logs, tests, or fixtures.
- Browser components call the local Next.js API route rather than Serper.
- Use shared TypeScript contracts for search requests, normalized results, and API errors.
- Use the platform `fetch` API instead of adding an HTTP client dependency.
- Validate and normalize user input at the API boundary.
- Keep result ranking deterministic and explainable; do not represent search snippets as verified menu data.
- Prefer small React components with accessible labels, semantic HTML, keyboard support, and explicit loading, empty, and error states.
- Keep the MVP free of persistence, authentication, accounts, maps, reservations, and payments.

## Validation

After the application scaffold establishes the scripts, run the smallest relevant check from:

- `npm run lint`
- `npm test`
- `npm run build`

## Working Agreements

- Track every implementation request in GitHub Issues using `.github/ISSUE_TEMPLATE/agentic-story.md`.
- Preserve the originating human prompt in the issue for retrospective evaluation.
- Work on a task-specific branch and keep changes within the issue's declared file ownership.
- Follow `STYLE.md` and the template contribution defaults in `CONTRIBUTING.md`.
- Use test-driven development when applicable and validate against the issue's acceptance criteria.
- Surface errors and unresolved decisions explicitly; do not silently guess or report success without evidence.
- Do not close, implement, or modify issues labeled `sample`; they are read-only onboarding references.

## Selected Integrations

- **Agent tool:** GitHub Copilot
- **Issue tracker:** GitHub Issues
- **CI/CD:** GitHub Actions
- **Contribution framework:** Template defaults

GitHub Actions will run lint, unit/component tests, and a production build after those scripts are established by the scaffold story.
