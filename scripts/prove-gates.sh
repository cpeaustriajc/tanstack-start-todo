#!/bin/sh
set -u
cd "$(dirname "$0")/.."

MIGRATIONS=src/server/db/migrations
TABLE=src/server/todo/todo-table.ts

if [ -n "$(git status --porcelain -- "$MIGRATIONS" "$TABLE")" ]; then
  echo "Commit or stash changes in $MIGRATIONS and $TABLE first."
  exit 2
fi

failures=0

expect_fail() {
  name=$1
  marker=$2
  shift 2
  output=$("$@" 2>&1)
  status=$?
  if [ "$status" -ne 0 ] && printf '%s\n' "$output" | grep -qF -- "$marker"; then
    echo "FAILS AS IT MUST $name"
  else
    echo "NOT CAUGHT       $name"
    failures=$((failures + 1))
  fi
  printf '%s\n' "$output" | grep -F -- "$marker" | awk '!seen[$0]++' | sed 's/^/    /'
}

lint() {
  npx effect-tsgo oxlint --type-aware "$1"
}

probe() {
  name=$1
  marker=$2
  file=$3
  content=$4
  printf '%s\n' "$content" > "$file"
  expect_fail "$name" "$marker" lint "$file"
  rm -f "$file"
}

probe "1 hooks outside a provider" "no-restricted-imports" src/features/todo/probe-view.tsx \
  'import { useEffect, useReducer, useState } from "react";
export { useEffect, useReducer, useState };'

probe "2 Match.orElse" "no-restricted-properties" src/domain/probe.ts \
  'import { Match } from "effect";
const fallback = Match.orElse;
export { fallback };'

probe "3 model imports react, the server, Todo" "no-restricted-imports" src/features/todo/probe-model.ts \
  'import type { ReactNode } from "react";
import type { Todo, TodoList } from "#/domain/todo.ts";
import type { addTodo } from "#/server/todo/todo-functions.ts";
export type { ReactNode, Todo, TodoList, addTodo };'

probe "4 feature view imports the server" "no-restricted-imports" src/features/todo/probe-view.tsx \
  'import { listTodos } from "#/server/todo/todo-functions.ts";
export { listTodos };'

probe "5 server and domain import features or react" "no-restricted-imports" src/server/todo/probe.ts \
  'import { TodoEvent } from "#/features/todo/todo-model.ts";
import { createElement } from "react";
export { TodoEvent, createElement };'

probe "5 server and domain import features or react" "no-restricted-imports" src/domain/probe.ts \
  'import { TodoEvent } from "#/features/todo/todo-model.ts";
export { TodoEvent };'

probe "6 database driver outside src/server/db" "no-restricted-imports" src/server/todo/probe.ts \
  'import { make } from "drizzle-orm/effect-sqlite-node";
import { SqliteClient } from "@effect/sql-sqlite-node";
import Database from "better-sqlite3";
export { Database, SqliteClient, make };'

probe "7 sqlite-core outside a table file" "no-restricted-imports" src/server/todo/probe.ts \
  'import { sqliteTable } from "drizzle-orm/sqlite-core";
export { sqliteTable };'

probe "8 drizzle-orm in a feature view" "no-restricted-imports" src/features/todo/probe-view.tsx \
  'import { eq } from "drizzle-orm";
export { eq };'

probe "8 drizzle-orm in a route view" "no-restricted-imports" src/routes/probe.tsx \
  'import { eq } from "drizzle-orm";
export { eq };'

cp "$TABLE" "$TABLE.bak"
sed -i.tmp 's/  title: text().notNull(),/  note: text(),\n  title: text().notNull(),/' "$TABLE" && rm -f "$TABLE.tmp"
expect_fail "9 schema change without a committed migration" "migration.sql" npm run --silent migrations:check
mv "$TABLE.bak" "$TABLE"
git clean -fdq -- "$MIGRATIONS"

cp "$TABLE" "$TABLE.bak"
sed -i.tmp 's/  title: text().notNull(),/  title: text(),/' "$TABLE" && rm -f "$TABLE.tmp"
expect_fail "table select type differs from Todo.Encoded" "todo-table.test-d.ts" npx effect-tsgo tsc -p tsconfig.json
mv "$TABLE.bak" "$TABLE"

first=$(ls -d "$MIGRATIONS"/*/ | head -1)
printf '%s\n' "-- edited" >> "${first}migration.sql"
expect_fail "9 edited migration" "+-- edited" npm run --silent migrations:check
git checkout -q -- "$MIGRATIONS"

copy="$MIGRATIONS/29991231000000_branch_copy"
cp -R "$first" "$copy"
sed -i.tmp 's/"id": "[^"]*"/"id": "00000000-0000-4000-8000-000000000001"/' "$copy/snapshot.json" && rm -f "$copy/snapshot.json.tmp"
expect_fail "9 drizzle-kit check: two migrations from one parent" "create_table" npx drizzle-kit check
rm -rf "$copy"

if [ -n "$(git status --porcelain -- "$MIGRATIONS" "$TABLE")" ]; then
  echo "Probe left changes behind:"
  git status --porcelain -- "$MIGRATIONS" "$TABLE"
  exit 1
fi

echo "gates not caught: $failures"
[ "$failures" -eq 0 ]
