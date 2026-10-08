const mysql = require('mysql2/promise');
require('dotenv').config();

// Cloud MySQL providers (TiDB, PlanetScale, Aiven) require SSL.
// Set DB_SSL=true in your .env to enable it.
const sslConfig = process.env.DB_SSL === 'true'
  ? { rejectUnauthorized: true }
  : undefined;

// Create a connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: sslConfig,
});

// Test the database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { pool, testConnection };
