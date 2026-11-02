require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const bcrypt = require('bcrypt');
const db     = require('../config/db');

async function seed() {
  console.log('\n🍞  BakeFlow – Seeding Demo Users...');

  const users = [
    {
      full_name: process.env.ADMIN_FULL_NAME || 'BakeFlow Administrator',
      username: process.env.ADMIN_USERNAME || 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@bakeflow.local',
      password: process.env.ADMIN_PASSWORD || 'Admin@1234',
      role: 'admin',
      phone: '9876543210'
    },
    {
      full_name: 'Sarah Jenkins (Counter)',
      username: 'counter1',
      email: 'counter@bakeflow.local',
      password: 'Counter@1234',
      role: 'counter',
      phone: '9876543211'
    },
    {
      full_name: 'Marco Rossi (Head Baker)',
      username: 'baker1',
      email: 'production@bakeflow.local',
      password: 'Baker@1234',
      role: 'production',
      phone: '9876543212'
    }
  ];

  for (const u of users) {
    const [existing] = await db.query('SELECT id FROM users WHERE username=? OR email=?', [u.username, u.email]);
    if (existing.length === 0) {
      const hash = await bcrypt.hash(u.password, 12);
      await db.query(
        'INSERT INTO users (full_name, username, email, password, role, phone, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
        [u.full_name, u.username, u.email, hash, u.role, u.phone]
      );
      console.log(`✅  Created ${u.role} user: ${u.username} / ${u.password}`);
    } else {
      console.log(`ℹ️   User ${u.username} already exists.`);
    }
  }

  console.log('\n✨  Demo users ready for testing!\n');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
