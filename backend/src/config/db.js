const { Sequelize } = require('sequelize');
const env = require('./env');

const common = { logging: false, define: { underscored: false, timestamps: true } };

const sequelize =
  env.db.dialect === 'sqlite'
    ? new Sequelize({ dialect: 'sqlite', storage: env.db.storage, ...common })
    : new Sequelize(env.db.name, env.db.user, env.db.password, {
        host: env.db.host,
        port: env.db.port,
        dialect: 'mysql',
        ...common,
      });

module.exports = sequelize;
