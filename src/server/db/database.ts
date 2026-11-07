import { SqliteClient } from "@effect/sql-sqlite-node";
import { DefaultServices, make } from "drizzle-orm/effect-sqlite-node";
import type { EffectSQLiteNodeDatabase } from "drizzle-orm/effect-sqlite-node";
import { migrate } from "drizzle-orm/effect-sqlite-node/migrator";
import { Config, Context, Effect, Layer } from "effect";

const MIGRATIONS_FOLDER = "./src/server/db/migrations";
const filename = Config.String("TODO_DB").pipe(Config.withDefault("todos.db"));
const sqliteLayer = SqliteClient.layerConfig({ filename });

const makeDatabase = Effect.gen(function* () {
  const db = yield* make();
  yield* migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return db;
});

export class Database extends Context.Service<Database, EffectSQLiteNodeDatabase>()(
  "todo/server/db/database",
) {
  public static readonly layer = Layer.effect(Database, makeDatabase).pipe(
    Layer.provide(DefaultServices),
    Layer.provide(sqliteLayer),
  );
}
