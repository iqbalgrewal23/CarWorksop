const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const setup = async () => {
    try {
        console.log('Connecting to MySQL...');
        console.log(`User: ${process.env.DB_USER}`);
        console.log(`Password length: ${process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0}`);

        // Connect without database to create it
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD // Should be empty string or undefined
        });

        console.log('Connected! Creating database if not exists...');
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
        console.log(`Database ${process.env.DB_NAME} created or exists.`);

        await connection.end();

        // Now connect to the database to run schema
        const db = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            multipleStatements: true
        });

        console.log('Running schema...');
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await db.query(schema);
        console.log('Schema applied successfully.');

        await db.end();
    } catch (err) {
        console.error('Setup failed:', err);
    }
};

setup();
