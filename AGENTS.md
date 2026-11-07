# AGENTS.md

Todo app template: a web page, a JSON API and a CLI on one SQLite file. TanStack Start, Effect 4,
Drizzle on Effect SQL, React Aria. Design, layout and gates: `README.md`.

## Setup and commands

- Install: `npm ci`, then `git config core.hooksPath .githooks` so each commit runs `verify`.
- Web page and API: `TODO_DB=<scratch>.db npm run dev`, then <http://localhost:3000>.
- CLI: `TODO_DB=<scratch>.db node src/cli.ts add <title> | list | done <id>`.
- Use a scratch `TODO_DB` for every run; never touch `todos.db`.
- Check everything: `npm run verify`. It must exit 0 before a commit.
- After a change to `.oxlintrc.json`, `tsconfig.json` or a `*-table.ts`: commit, then run
  `./scripts/prove-gates.sh` and expect `gates not caught: 0`.
- After a change to a `*-table.ts`: `npx drizzle-kit generate`, and commit the migration with it.

## Testing

- `verify` proves types and structure, not behaviour. Prove a change by driving the app: the page
  in a browser, the API with `fetch`, the CLI in a shell.
- Cover the failure path: make requests to `/_serverFn/` reject in the page, check the alert,
  restore them, press Retry.

## Code style

`verify` enforces layers, types, Effect usage and format. To pass a gate, change the code; never
edit `.oxlintrc.json` or `tsconfig.json` to silence an error.

These are not checked. Follow them:

- A file opens with its main export. Helpers follow, in the order the main code calls them.
- Name for intent, in the domain's words: `refreshTodos`, not `invalidateLoader`.
- One word per concept in every file. `todos` is always a list of `Todo`; the table is
  `todoTable`; the repository service value is `repository`.
- Booleans start with `is`, `has` or `can`. Name a condition once (`canComplete`) instead of
  negating it twice in markup.
- One job per function. Extract a function only when its name says more than its body.
- Duplication is cheaper than a wrong abstraction. Share code only when both uses change for the
  same reason.
- Use a plain ternary for a two-way choice. Never nest one.
- Keep text and numbers inline (`Retry`, `{ status: 201 }`) unless they are reused.
- Client state lives in the feature's `*-model.ts` statechart: types, then the transition table in
  the order a user moves through it, then helpers. `stay` keeps the state; `to` moves it.
- Views read state and send events through hooks in `*-provider.tsx` (`useAdding`,
  `useCompletion`). A view holds no dispatch plumbing.
- Validate input once at the edge with a Schema: the API body, the CLI arguments, the server
  function validator.
- A failed request keeps its cause: a tagged error in a `*-error.ts` file, logged with
  `Effect.logError`, then the failure event the UI shows.
- No comments. Rename or restructure until the code needs none.

## Commits and pull requests

- Commit each finished slice after `verify` passes.
- Branch from `main`. The PR body states the purpose, the proof commands, and a before and after
  for a change a user can see.
