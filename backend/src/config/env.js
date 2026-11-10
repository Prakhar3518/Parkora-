require('dotenv').config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 8080,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  db: {
    dialect: process.env.DB_DIALECT || 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME || 'parkora_db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    storage: process.env.DB_STORAGE || ':memory:',
    sync: process.env.DB_SYNC || 'none',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  admin: {
    name: process.env.ADMIN_NAME || 'Parkora Admin',
    email: process.env.ADMIN_EMAIL || 'admin@parkora.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
  },
  paymentMode: process.env.PAYMENT_MODE || 'stub',
};

if (env.nodeEnv === 'production' && env.jwt.secret === 'dev-only-secret-change-me') {
  throw new Error('JWT_SECRET must be set in production');
}

module.exports = env;
