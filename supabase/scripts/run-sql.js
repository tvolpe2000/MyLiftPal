#!/usr/bin/env node

/**
 * Run SQL scripts against Supabase database
 *
 * Usage:
 *   node supabase/scripts/run-sql.js <script-name>
 *   node supabase/scripts/run-sql.js update_roadmap
 *
 * Requires DATABASE_URL in .env file (from Supabase Dashboard > Settings > Database)
 */

import pg from 'pg';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env manually to avoid dotenv noise
const __filename = fileURLToPath(import.meta.url);
const rootDir = resolve(dirname(__filename), '../..');
const envPath = resolve(rootDir, '.env');

if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1].trim()]) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

const __dirname = dirname(__filename);

async function runSQL(scriptName) {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in .env');
    console.error('   Get it from: Supabase Dashboard > Project Settings > Database > Connection string');
    process.exit(1);
  }

  // Add .sql extension if not provided
  if (!scriptName.endsWith('.sql')) {
    scriptName += '.sql';
  }

  const scriptPath = resolve(__dirname, scriptName);

  let sql;
  try {
    sql = readFileSync(scriptPath, 'utf-8');
  } catch (err) {
    console.error(`❌ Could not read script: ${scriptPath}`);
    console.error(`   Available scripts:`);

    // List available scripts
    const { readdirSync } = await import('fs');
    const scripts = readdirSync(__dirname).filter(f => f.endsWith('.sql'));
    scripts.forEach(s => console.error(`   - ${s}`));
    process.exit(1);
  }

  console.log(`📄 Running: ${scriptName}`);

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const result = await client.query(sql);

    // Handle multiple result sets (from multiple statements)
    if (Array.isArray(result)) {
      result.forEach((r, i) => {
        if (r.rows && r.rows.length > 0) {
          console.log(`\n📊 Result ${i + 1}:`);
          console.table(r.rows);
        } else if (r.rowCount !== null) {
          console.log(`✅ ${r.command}: ${r.rowCount} rows affected`);
        }
      });
    } else if (result.rows && result.rows.length > 0) {
      console.log('\n📊 Result:');
      console.table(result.rows);
    } else if (result.rowCount !== null) {
      console.log(`✅ ${result.command}: ${result.rowCount} rows affected`);
    }

    console.log('\n✅ Script completed successfully');

  } catch (err) {
    console.error('❌ Database error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Get script name from command line args
const scriptName = process.argv[2];

if (!scriptName) {
  console.log('Usage: node supabase/scripts/run-sql.js <script-name>');
  console.log('');
  console.log('Examples:');
  console.log('  node supabase/scripts/run-sql.js update_roadmap');
  console.log('  node supabase/scripts/run-sql.js update_roadmap.sql');
  process.exit(0);
}

runSQL(scriptName);
