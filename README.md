# Lemon Pepper Martini Finder

> [!CAUTION]
> Agentic-Agile methodology is an active area of investigation. Apply normal review and
> security safeguards to AI-generated work before using it in production.

A focused Next.js application for finding web results related to lemon pepper drop martinis in
Atlanta. It demonstrates the Agentic-Agile workflow through a small product with explicit story
boundaries, delivery waves, and quality gates.

Search results link to public source pages. They are leads to investigate, not confirmation that a
venue currently serves an item.

## Prerequisites

- Node.js 22
- npm
- A Serper API key for live manual searches

Automated tests and production builds mock external calls or defer configuration checks until a
search request. They do not need a real `SERPER_API_KEY`.

## Local Setup

1. Install dependencies:

   ```sh
   npm ci
   ```

2. Create the ignored local environment file from the committed example:

   ```sh
   cp .env.example .env.local
   ```

3. Set `SERPER_API_KEY` in `.env.local`. Keep the value local: never commit it, paste it into an
   issue or test output, expose it through a `NEXT_PUBLIC_` variable, or place it in a screenshot.

4. Start the development server:

   ```sh
   npm run dev
   ```

5. Open `http://localhost:3000`.

For a production-mode local run:

```sh
npm run build
npm start
```

## Validation

Run the same quality checks used by CI:

```sh
npm run lint
npm test
npm run build
```

Audit production dependencies separately:

```sh
npm audit --omit=dev
```

CI runs on pull requests and pushes to `main` with Node.js 22. It installs from the lockfile, lints,
runs the full Vitest suite, and creates a production build without provisioning a Serper key. CI
validates only; it does not deploy.

## Architecture

```text
Browser search page
        |
        | POST refinement to the local API
        v
Next.js server route
        |
        +-- validate and normalize input
        +-- compose the Atlanta-focused query
        +-- call Serper with the server-only API key
        +-- normalize and rank organic results
        v
Typed response -> accessible ranked cards -> public source links
```

- `src/app/` contains the App Router page and server API route.
- `src/components/` contains the search form and result presentation components.
- `src/lib/server/` contains environment access and the Serper client; browser code cannot import
  these modules.
- `src/lib/search/` contains deterministic normalization and ranking logic.
- `src/types/search.ts` defines the request, response, result, and safe error contracts shared
  across the boundary.

`SERPER_API_KEY` is read only when a server-side search is requested. It is sent to Serper in a
server-to-server header and must never appear in a browser bundle, application response, or log.

## Product Limitations

- Results come from the public web and may be stale, incomplete, duplicated, or inaccurate.
- A result or snippet does not verify current menu availability, price, quality, or venue status.
- Ranking is a small deterministic relevance heuristic, not a recommendation or endorsement.
- The product is intentionally limited to one cocktail concept and Atlanta refinements.
- Live search depends on Serper availability and a valid local API key.
- There is no database, account, query history, map, reservation, payment, analytics, or deployment
  pipeline in the MVP.

## Manual Smoke Checklist

Run this checklist locally after the Wave 3 search API and integrated page are present. Record only
pass/fail and any sanitized defect description. Do **not** record the key, response payloads, result
titles, URLs, snippets, or screenshots containing them.

- [ ] **Default search:** Leave the optional refinement blank, submit once, and confirm a loading
      state is followed by ranked result cards or the documented empty state.
- [ ] **Refined search:** Enter a benign Atlanta neighborhood or preference, submit, and confirm
      the request completes and the interface remains usable.
- [ ] **Source links:** Confirm result links are keyboard accessible, use the source URL supplied
      for that card, and open without the application claiming verified menu availability.
- [ ] **Missing-key error:** Stop the server, temporarily remove the value from `.env.local`,
      restart, and submit a search. Confirm the UI shows a safe configuration error without
      revealing environment values, provider details, or a stack trace.
- [ ] **Provider failure:** With a deliberately invalid local key, submit a search and confirm a
      generic safe error is shown. Restore the key afterward; do not copy the response or credential
      into notes.
- [ ] **Recovery:** Restore valid local configuration, restart if needed, and confirm a new search
      can be submitted without reloading stored results or query history.

## Agentic-Agile Project Context

Work is tracked in GitHub Issues with explicit scope, acceptance criteria, and file ownership.
Delivery uses three waves: foundation and contracts, independent search capabilities, then
integration and quality. See [`AGENTS.md`](AGENTS.md) for repository context,
[`MANIFESTO.md`](MANIFESTO.md) for the collaboration principles, and
[`docs/evaluation-framework.md`](docs/evaluation-framework.md) for the measurement model.

## License

This project is licensed under the MIT License. See [`LICENSE`](LICENSE).
