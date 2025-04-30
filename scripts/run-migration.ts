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
  const sqlPath = path.join(__dirname, 'create-user-table.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  try {
    await pool.query(sql);
    console.log('✅ User table created successfully.');
  } catch (err) {
    console.error('❌ Error creating user table:', err);
  } finally {
    await pool.end();
  }
}

runMigration();
