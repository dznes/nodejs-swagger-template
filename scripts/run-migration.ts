import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  idleTimeoutMillis: 30000,
});

async function runMigration() {
  try {
    // Run users table migration
    const usersSqlPath = path.join(__dirname, 'create-user-table.sql');
    const usersSql = fs.readFileSync(usersSqlPath, 'utf-8');
    await pool.query(usersSql);
    console.log('✅ Users table created successfully.');

    // Run companies table migration
    const companiesSqlPath = path.join(__dirname, 'create-companies-table.sql');
    const companiesSql = fs.readFileSync(companiesSqlPath, 'utf-8');
    await pool.query(companiesSql);
    console.log('✅ Companies table created successfully.');
  } catch (err) {
    console.error('❌ Error running migrations:', err);
  } finally {
    await pool.end();
  }
}

runMigration();
