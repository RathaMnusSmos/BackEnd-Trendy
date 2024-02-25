const mysql = require('mysql');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST, // Use the environment variable for the host
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
});

module.exports = db;
