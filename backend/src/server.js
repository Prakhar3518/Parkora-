const env = require('./config/env');
const app = require('./app');
const { sequelize } = require('./models');
const seedAdmin = require('./config/seedAdmin');

async function start() {
  await sequelize.authenticate();
  await sequelize.sync(env.db.sync === 'alter' ? { alter: true } : {});
  await seedAdmin();
  app.listen(env.port, () => console.log(`🅿️  Parkora API running on http://localhost:${env.port}`));
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
