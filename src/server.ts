import { app } from "./app"
import { env } from "./config/env"
import pool from "@/config/database";


app
  .listen({
    host: '0.0.0.0',
    port: env.PORT,
  })
  .then(() => {
    console.log(`HTTP server running on port ${env.PORT}!`)
  })

process.on('SIGINT', async () => {
  console.log('Closing PG pool...');
  await pool.end();
  process.exit(0);
});