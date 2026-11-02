/**
 * BakeFlow – Initial Admin Account Setup Script
 * Run: node src/scripts/createAdmin.js
 *
 * Reads credentials from .env (ADMIN_* variables).
 * Creates the admin account if it doesn't already exist.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const bcrypt = require('bcrypt');
const db     = require('../config/db');

async function main() {
  const full_name = process.env.ADMIN_FULL_NAME || 'BakeFlow Administrator';
  const username  = process.env.ADMIN_USERNAME  || 'admin';
  const email     = process.env.ADMIN_EMAIL     || 'admin@bakeflow.local';
  const password  = process.env.ADMIN_PASSWORD  || 'Admin@1234';

  console.log(`\n🍞  BakeFlow – Admin Setup`);
  console.log(`   Username : ${username}`);
  console.log(`   Email    : ${email}\n`);

  const [existing] = await db.query('SELECT id FROM users WHERE username=? OR email=?', [username, email]);
  if (existing.length > 0) {
    console.log('⚠️   Admin user already exists. No changes made.');
    process.exit(0);
  }

  const hash = await bcrypt.hash(password, 12);
  await db.query(
    'INSERT INTO users (full_name, username, email, password, role, is_active) VALUES (?,?,?,?,?,1)',
    [full_name, username, email, hash, 'admin']
  );
  console.log('✅  Admin account created successfully.');
  console.log(`   Login with username: ${username}`);
  console.log(`   Password: ${password}\n`);
  console.log('⚠️   Change the default password after your first login!\n');
  process.exit(0);
}

main().catch(e => { console.error('❌  Error:', e.message); process.exit(1); });
