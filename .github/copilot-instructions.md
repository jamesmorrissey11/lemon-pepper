# Copilot Instructions for lemon-pepper

## Project Context

`lemon-pepper` uses the Agentic-Agile workflow for structured human-agent collaboration. Read `AGENTS.md` before starting work; it is the canonical project entry point and defines the repository workflow, scope expectations, and onboarding state.

The product purpose and implementation stack are not yet documented. Do not invent language, framework, architecture, build, or test conventions. Ask the human to define missing project-specific decisions before implementation depends on them.

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

GitHub Actions is selected, but no workflow should be added until the project language, dependency manager, and required build, lint, and test commands are documented.
