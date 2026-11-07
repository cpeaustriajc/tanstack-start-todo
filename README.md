# todo

A todo list with three ways in: a web page, a JSON API and a CLI. All three use one SQLite file.

| Way in   | Entry                                              |
| -------- | -------------------------------------------------- |
| Web page | `npm run dev`, then <http://localhost:3000>        |
| JSON API | `GET` and `POST` `/api/todos` (`{"title": "..."}`) |
| CLI      | `node src/cli.ts add <title>`, `list`, `done <id>` |

`TODO_DB` sets the database file (default `todos.db`). The server applies the migrations in
`src/server/db/migrations` when it starts. A `todos.db` made before the migrations (0.3.0) fails
with `table todos already exists`; delete it.

## Stack

- TanStack Start: routes, server functions, server routes and SSR.
- Effect (stable modules, plus the two exceptions below): `Schema` is the one source of types;
  `Context.Service` and `Layer` hold the database and the repository.
- Drizzle ORM 1.0.0-rc.5 through `drizzle-orm/effect-sqlite-node` on `@effect/sql-sqlite-node`
  (Node's `node:sqlite`); rows are decoded with `drizzle-orm/effect-schema`. drizzle-kit writes
  the migrations. These run on Effect's SQL modules, tagged `@stability unstable`; they are the
  only unstable APIs allowed.
- React only for client state: one `useReducer` per feature, React Compiler for memoization.
- shadcn/ui on the React Aria base, in `src/components/ui`.
- commander for the CLI.

## Layout

| Path                                  | Holds                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/domain/`                         | shared schemas (`Todo`, `NewTodo`, `TodoRef`, `TodoId`); no state                    |
| `src/server/db/`                      | the `Database` service, the migrator and the migrations; the only database I/O       |
| `src/server/todo/`                    | the `todoTable`, the repository and the server functions                             |
| `src/features/todo/*-model.ts`        | client state as statechart regions; pure, no React                                   |
| `src/features/todo/todo-provider.tsx` | the feature's only `useReducer`, the command runner, `useAdding` and `useCompletion` |
| `src/features/todo/*.tsx`             | views: todos from loader props, request status from the context                      |

Server state lives on the server and reaches the page only through the route loader. Client state
is UI state only, never a copy of server data: "done" is derived from `todo.doneAt` at render, and
the draft title lives in `Editing`, so a reload of the list never clears it.

```mermaid
stateDiagram-v2
  state Adding {
    [*] --> Editing
    Editing --> Editing : Edit
    Editing --> Submitting : Submit [hasTitle] / SaveTodo
    Submitting --> Editing : Saved / RefreshTodos
    Submitting --> AddFailed : SaveFailed
    AddFailed --> Submitting : Retry / SaveTodo
  }
  --
  state Completion {
    [*] --> Idle
    Idle --> Completing : Complete / CompleteTodo
    Completing --> Idle : Completed / RefreshTodos
    Completing --> CompleteFailed : CompleteFailed
    CompleteFailed --> Completing : Retry / CompleteTodo
  }
```

`Completion` runs once per `TodoId`. Each region's `State`, `Event` and `Command` are
`Data.TaggedEnum`s, and its transition is an exhaustive `Match`. `todo-model.ts` hands each event
to its region and returns `[State, Option<Command>]`; the provider runs the command as an Effect.

## Gates

`npm run verify` runs them all, and `.githooks/pre-commit` runs `verify` before each commit
(`git config core.hooksPath .githooks`):

1. `tsr generate`
2. `migrations:check`: `drizzle-kit generate`, then fail on a migration that is not committed or
   staged; then `drizzle-kit check`.
3. `oxfmt --check`, which also sorts imports by module path
4. `effect-tsgo oxlint --type-aware`: every category except nursery at error, comments banned, and
   the layer gates below.
5. `effect-tsgo tsc`: TypeScript 7, every strict flag, every Effect diagnostic at error. The type
   test `src/server/todo/todo-table.test-d.ts` fails when the table's select type and
   `Todo.Encoded` disagree.
6. `effect-tsgo tsrs`
7. `vitest run`

Layer gates in `.oxlintrc.json` (`no-restricted-imports` per override, `no-restricted-properties`):

| Files                                      | Banned                                                                        |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| all except `src/features/*/*-provider.tsx` | `useState`, `useEffect`, `useReducer` from `react`                            |
| all                                        | `Match.orElse`                                                                |
| `src/features/*/*-model.ts`                | `react`, `#/server/**`, `Todo` and `TodoList`                                 |
| `src/features/**` except `*-provider.tsx`  | `#/server/**`                                                                 |
| `src/server/**`, `src/domain/**`           | `#/features/**`, `react`                                                      |
| all except `src/server/db/**`              | `drizzle-orm/effect-sqlite-node`, `@effect/sql-sqlite-node`, `better-sqlite3` |
| all except `src/server/*/*-table.ts`       | `drizzle-orm/sqlite-core`                                                     |
| `src/features/**`, `src/routes/**/*.tsx`   | `drizzle-orm` and its subpaths                                                |

An oxlint override replaces a rule's options instead of merging them, so each override in
`.oxlintrc.json` lists every ban that applies to its files.

## Settings below the strictest

Config files cannot hold comments here, so each relaxed setting has its reason below.

| Setting                                                                                                | Reason                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `skipLibCheck: true`                                                                                   | declaration errors inside react-aria-components, unplugin, drizzle-orm, `@rolldown/plugin-babel` and `@types/babel__core` fail the build and cannot be fixed in this repo |
| Effect `allowedUnstableApis`: `@effect/sql-sqlite-node`, `effect/sql/SqlError`                         | Drizzle's Effect driver runs on these unstable modules; they are the chosen exception to stable-only                                                                      |
| Effect `apiStabilityLeak` off in `src/server/db/database.ts`, `src/server/runtime.ts`                  | the database layer fails with `SqlError`, so these exports expose it                                                                                                      |
| `react-perf` plugin off                                                                                | React Compiler memoizes components and handlers; manual `useCallback` is removed                                                                                          |
| React Compiler through `@rolldown/plugin-babel` 0.3                                                    | `reactCompilerPreset()` from `@vitejs/plugin-react` 6 needs this Babel plugin, which is still 0.x                                                                         |
| `import/no-named-export`, `import/prefer-default-export` off                                           | they contradict `import/no-default-export`; named exports win                                                                                                             |
| `react/react-in-jsx-scope` off                                                                         | the JSX runtime is `react-jsx`                                                                                                                                            |
| `oxc/no-rest-spread-properties` off                                                                    | it guards old runtimes; the target is ESNext, and the ui wrappers pass rest props on                                                                                      |
| `eslint/new-cap` off                                                                                   | Effect's class factories are capitalized calls without `new`: `Schema.Class<…>()`, `Context.Service<…>()`                                                                 |
| `eslint/no-redeclare` off                                                                              | a Schema value and its type share a name (`NewTodo`), as do a tagged enum's type and constructors (`AddingState`)                                                         |
| `eslint/one-var` off                                                                                   | not recommended by ESLint or oxlint; `always` chains components with constants, and `never` fights more than it helps                                                     |
| `eslint/sort-vars` off                                                                                 | it reorders declarations that depend on each other                                                                                                                        |
| `typescript/promise-function-async` off                                                                | it contradicts `oxc/no-async-await`                                                                                                                                       |
| `unicorn/no-array-method-this-argument` off                                                            | it reads Effect's `Array.map(self, f)` as a `thisArg`; Effect's `preferEffectArray` already bans native `.map`                                                            |
| `no-comments` allows `/usr/bin/env node`                                                               | the CLI's hashbang is not a comment, but the plugin reads it as one                                                                                                       |
| `node/no-top-level-await` ignores bin files                                                            | the CLI awaits its runtime and parse at top level                                                                                                                         |
| `node/no-sync` ignores `runSync`                                                                       | TanStack serialization adapters are synchronous; `runSync` runs a pure Schema codec, not I/O                                                                              |
| readonly-parameter allow list: `ReactNode`, `SyntheticEvent`, Effect's `Effect`, `None`, `Some`, `Utc` | these types are immutable in use but not marked `readonly` in their declarations                                                                                          |
| `src/components/ui/**`: `forbid-component-props`, `jsx-props-no-spreading` off                         | a shadcn wrapper sets the class names and passes the rest to React Aria                                                                                                   |
| `src/routes/**`: `react/only-export-components` off                                                    | a route file exports `Route`                                                                                                                                              |
| `src/features/*/*-provider.tsx`: `react/only-export-components` off                                    | the provider file exports its context hooks next to the provider                                                                                                          |
| `src/features/*/*-model.ts`: `typescript/no-generated-empty-object-type` off                           | a `Data.TaggedEnum` variant without fields is an empty object type                                                                                                        |
| `vite.config.ts`, `drizzle.config.ts`: `import/no-default-export` off                                  | Vite and drizzle-kit read the default export                                                                                                                              |
| `eslint/sort-keys` off                                                                                 | keys follow reading order: a statechart in flow order, `try` before `catch`                                                                                               |
| `eslint/sort-imports` off                                                                              | it sorts by the first imported name; oxfmt sorts by module path instead                                                                                                   |
| `eslint/no-ternary` off                                                                                | it contradicts `unicorn/prefer-ternary`; `no-nested-ternary` still bans a ternary inside a ternary                                                                        |
| `react/jsx-no-literals` off                                                                            | there is no i18n; text stays in the markup it belongs to                                                                                                                  |
| `eslint/no-magic-numbers` off                                                                          | `{ status: 201 }` reads better than a constant named `created`                                                                                                            |
| `eslint/func-names` off                                                                                | `Effect.gen(function* () {…})` needs no name                                                                                                                              |
| `typescript/explicit-function-return-type`, `explicit-module-boundary-types` off                       | TypeScript infers the return types; annotations repeated them                                                                                                             |
| `import/exports-last`, `import/group-exports` off                                                      | each declaration says `export` where it starts, so a file opens with its main export                                                                                      |
| `eslint/no-use-before-define` with `variables: false`                                                  | a function body may name a helper defined below it; a top-level use before definition still fails                                                                         |

## Proof

### Gates

`scripts/prove-gates.sh` writes a bad change for each gate, expects that gate's rule to fail, and
removes the change. It refuses to run while the migrations or the table have uncommitted changes.

```sh
./scripts/prove-gates.sh
```

Output on 2026-11-05 (help text cut):

```text
FAILS AS IT MUST 1 hooks outside a provider
    src/features/todo/probe-view.tsx:1:10: error eslint(no-restricted-imports): 'useEffect' import from 'react' is restricted.
    src/features/todo/probe-view.tsx:1:21: error eslint(no-restricted-imports): 'useReducer' import from 'react' is restricted.
    src/features/todo/probe-view.tsx:1:33: error eslint(no-restricted-imports): 'useState' import from 'react' is restricted.
FAILS AS IT MUST 2 Match.orElse
    src/domain/probe.ts:2:18: error eslint(no-restricted-properties): 'Match.orElse' is restricted from being used.
FAILS AS IT MUST 3 model imports react, the server, Todo
    src/features/todo/probe-model.ts:1:1: error eslint(no-restricted-imports): 'react' import is restricted from being used.
    src/features/todo/probe-model.ts:2:15: error eslint(no-restricted-imports): 'Todo' import from '#/domain/todo.ts' is restricted.
    src/features/todo/probe-model.ts:2:21: error eslint(no-restricted-imports): 'TodoList' import from '#/domain/todo.ts' is restricted.
    src/features/todo/probe-model.ts:3:1: error eslint(no-restricted-imports): '#/server/todo/todo-functions.ts' import is restricted from being used by a pattern.
FAILS AS IT MUST 4 feature view imports the server
    src/features/todo/probe-view.tsx:1:1: error eslint(no-restricted-imports): '#/server/todo/todo-functions.ts' import is restricted from being used by a pattern.
FAILS AS IT MUST 5 server and domain import features or react
    src/server/todo/probe.ts:1:1: error eslint(no-restricted-imports): '#/features/todo/todo-model.ts' import is restricted from being used by a pattern.
    src/server/todo/probe.ts:2:1: error eslint(no-restricted-imports): 'react' import is restricted from being used.
FAILS AS IT MUST 5 server and domain import features or react
    src/domain/probe.ts:1:1: error eslint(no-restricted-imports): '#/features/todo/todo-model.ts' import is restricted from being used by a pattern.
FAILS AS IT MUST 6 database driver outside src/server/db
    src/server/todo/probe.ts:1:1: error eslint(no-restricted-imports): 'drizzle-orm/effect-sqlite-node' import is restricted from being used.
    src/server/todo/probe.ts:2:1: error eslint(no-restricted-imports): '@effect/sql-sqlite-node' import is restricted from being used.
    src/server/todo/probe.ts:3:1: error eslint(no-restricted-imports): 'better-sqlite3' import is restricted from being used.
FAILS AS IT MUST 7 sqlite-core outside a table file
    src/server/todo/probe.ts:1:1: error eslint(no-restricted-imports): 'drizzle-orm/sqlite-core' import is restricted from being used.
FAILS AS IT MUST 8 drizzle-orm in a feature view
    src/features/todo/probe-view.tsx:1:1: error eslint(no-restricted-imports): 'drizzle-orm' import is restricted from being used by a pattern.
FAILS AS IT MUST 8 drizzle-orm in a route view
    src/routes/probe.tsx:1:1: error eslint(no-restricted-imports): 'drizzle-orm' import is restricted from being used by a pattern.
FAILS AS IT MUST 9 schema change without a committed migration
    [✓] Your SQL migration ➜ src/server/db/migrations/20261105143257_daffy_iron_patriot/migration.sql 🚀
    src/server/db/migrations/20261105143257_daffy_iron_patriot/migration.sql
FAILS AS IT MUST table select type differs from Todo.Encoded
    src/server/todo/todo-table.test-d.ts(5,67): error TS2344: Type '{ readonly doneAt: string | null; readonly id: number; readonly title: string; }' does not satisfy the …
FAILS AS IT MUST 9 edited migration
    +-- edited
FAILS AS IT MUST 9 drizzle-kit check: two migrations from one parent
      │   └─ ⚠ create_table: todos in database
          └─ ⚠ create_table: todos in database
gates not caught: 0
```

The unbanned side holds too: `npm run verify` passes while the provider calls `useReducer`,
`src/server/db/database.ts` imports the driver and `todo-table.ts` imports `sqlite-core`.

### CLI

`TODO_DB` pointed at a new file:

```text
$ node src/cli.ts add "buy milk"
added #1
$ node src/cli.ts add ""
Expected a value with a length of at least 1
  at ["title"]                                   (exit 1)
$ node src/cli.ts list
[ ] #1 buy milk
$ node src/cli.ts done 1
$ node src/cli.ts done abc
Expected an integer
  at ["id"]                                      (exit 1)
$ node src/cli.ts done 0
Expected a value greater than or equal to 1
  at ["id"]                                      (exit 1)
$ node src/cli.ts list
[x] #1 buy milk
```

### API

Sent from the page with `fetch` against `npm run dev`:

```text
POST {"title":"from api"} -> 201 {"doneAt":null,"id":2,"title":"from api"}
POST {"title":""}         -> 400 {"error":"Expected a value with a length of at least 1\n  at [\"title\"]"}
POST {}                   -> 400 {"error":"Missing key\n  at [\"title\"]"}
POST not json             -> 400 {"error":"Expected a valid JSON string"}
GET                       -> 200 [{"doneAt":"2026-11-05T14:33:43.725Z","id":1,"title":"buy milk"},{"doneAt":null,"id":2,"title":"from api"}]
```

### Web page

Driven by hand in a browser on the same database. To fail a request, the page's `fetch` was
replaced in the console with one that rejects calls to `/_serverFn/`, then restored before Retry.

| Step                                                      | Result                                                                          |
| --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Add with an empty title                                   | nothing is saved, no request, no alert                                          |
| Add "water plants"                                        | the todo appears; the field clears                                              |
| Add "call mom" with requests failing                      | "Could not add the todo." and Retry; the field keeps "call mom" and is disabled |
| Retry with requests working                               | "call mom" appears; the alert goes; the field clears                            |
| Complete "water plants", failing                          | the box stays clear; "Could not complete the todo." and Retry                   |
| Retry with requests working                               | the box is checked; `GET /api/todos` shows `doneAt` set                         |
| Complete "from api"                                       | the box is checked; `GET /api/todos` shows `doneAt` set                         |
| Type "buy eggs", add a todo from the API, complete a todo | the field still holds "buy eggs" (2026-11-08)                                   |
