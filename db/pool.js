const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Uncomment below if your provider requires SSL (e.g. Render, Railway, Supabase)
  // ssl: { rejectUnauthorized: false }
});

module.exports = pool;
