import pg from "pg";
import { config } from "./config.js";

const { Pool, types } = pg;
// numeric → string (money stays decimal), int8 → number
types.setTypeParser(1700, (v) => v);
types.setTypeParser(20, (v) => Number(v));

export type Queryable = Pick<pg.Pool, "query"> | pg.PoolClient;

export interface Db {
  pool: pg.Pool;
  query: pg.Pool["query"];
  /** Number of SQL statements executed since creation (used by the N+1 plant test). */
  readonly queryCount: number;
  withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export function createDb(connectionString: string = config.databaseUrl, max = 10): Db {
  const pool = new Pool({ connectionString, max });
  let queryCount = 0;
  pool.on("connect", (client) => {
    const original = client.query.bind(client);
    // Count statements per connection; pg's overloaded signature needs the cast.
    (client as { query: unknown }).query = (...args: unknown[]) => {
      queryCount += 1;
      return (original as (...a: unknown[]) => unknown)(...args);
    };
  });
  return {
    pool,
    query: pool.query.bind(pool),
    get queryCount() {
      return queryCount;
    },
    async withTransaction(fn) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const out = await fn(client);
        await client.query("COMMIT");
        return out;
      } catch (err) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw err;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}
