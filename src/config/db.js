const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL;

const pool = connectionString
    ? new Pool({
          connectionString,
          ssl: isProduction ? { rejectUnauthorized: false } : false,
      })
    : new Pool({
          user: process.env.DB_USER || 'postgres',
          host: process.env.DB_HOST || 'localhost',
          database: process.env.DB_NAME || 'assignment_portal',
          password: process.env.DB_PASSWORD || 'asphalt6',
          port: process.env.DB_PORT || 5432,
      });

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};
