import { Pool } from "pg";
import { env } from "./env";

const connectionString = env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  idleTimeoutMillis: 30000,
});

if (env.NODE_ENV !== 'production') {
  pool.on('connect', () => {
    console.log('PostgreSQL pool connected');
  });

  pool.on('error', (err) => {
    console.error('Unexpected PG pool error', err);
    process.exit(-1);
  });
}

export default pool;
