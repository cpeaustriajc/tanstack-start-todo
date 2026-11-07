import { ManagedRuntime } from "effect";

import { Database } from "#/server/db/database.ts";

export const runtime = ManagedRuntime.make(Database.layer);
