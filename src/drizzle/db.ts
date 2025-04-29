// Make sure to install the 'pg' package 
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "./schema";

const dbUrl = Bun.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error("DATABASE_URL is not set");
}

// You can specify any property from the node-postgres connection options
const db = drizzle({
  connection: {
    connectionString: dbUrl,
    ssl: true
  },
  schema,
});

export default db;