const bcrypt = require('bcryptjs');
const env = require('./env');
const { User } = require('../models');

/** Creates the default admin account if it does not exist yet. */
async function seedAdmin() {
  const email = env.admin.email.toLowerCase();
  const existing = await User.findOne({ where: { email } });
  if (existing) return existing;
  const admin = await User.create({
    name: env.admin.name,
    email,
    password: await bcrypt.hash(env.admin.password, 10),
    role: 'ADMIN',
  });
  console.log(`✔ Admin account created: ${email}`);
  return admin;
}

module.exports = seedAdmin;
