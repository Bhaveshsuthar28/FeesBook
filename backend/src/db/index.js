import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { env } from "../config/env.js";

const client = createClient({
  url: env.turso.url,
  authToken: env.turso.authToken || undefined
});

export const db = drizzle(client);
