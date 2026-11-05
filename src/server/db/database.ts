import { Config, Context, Effect, Layer } from "effect";
import { DefaultServices, make } from "drizzle-orm/effect-sqlite-node";
import type { EffectSQLiteNodeDatabase } from "drizzle-orm/effect-sqlite-node";
import { SqliteClient } from "@effect/sql-sqlite-node";
import { migrate } from "drizzle-orm/effect-sqlite-node/migrator";

const MIGRATIONS_FOLDER = "./src/server/db/migrations";
const filename = Config.String("TODO_DB").pipe(Config.withDefault("todos.db"));
const sqliteLayer = SqliteClient.layerConfig({ filename });

const makeDatabase = Effect.gen(function* makeDatabase() {
  const db = yield* make();
  yield* migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return db;
});

class Database extends Context.Service<Database, EffectSQLiteNodeDatabase>()(
  "todo/server/db/database",
) {
  public static readonly layer = Layer.effect(Database, makeDatabase).pipe(
    Layer.provide(DefaultServices),
    Layer.provide(sqliteLayer),
  );
}

export { Database };
