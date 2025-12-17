const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const dbConfig = process.env.DATABASE_URL
    ? {
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false }
      }
    : {
          user: process.env.DB_USER || 'postgres',
          host: process.env.DB_HOST || 'localhost',
          password: process.env.DB_PASSWORD || 'asphalt6',
          port: process.env.DB_PORT || 5432,
      };

const targetDbName = process.env.DB_NAME || 'assignment_portal';

async function run() {
    console.log('Starting migration...');
    
    // Step 1: Create Database if not exists (Only for local dev/when not using connection string)
    if (!process.env.DATABASE_URL) {
        const client = new Client({ ...dbConfig, database: 'postgres' });
        try {
            await client.connect();
            const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${targetDbName}'`);
            if (res.rowCount === 0) {
                console.log(`Database ${targetDbName} not found. Creating...`);
                await client.query(`CREATE DATABASE "${targetDbName}"`);
                console.log(`Database ${targetDbName} created.`);
            } else {
                console.log(`Database ${targetDbName} already exists.`);
            }
        } catch (err) {
            console.error('Error checking/creating database:', err.message);
        } finally {
            await client.end();
        }
    }

    // Step 2: Run Schema
    // If DATABASE_URL is present, Client uses it directly (ignoring database param overrides usually, or we pass it correctly)
    const clientConfig = process.env.DATABASE_URL 
        ? dbConfig 
        : { ...dbConfig, database: targetDbName };
        
    const targetClient = new Client(clientConfig);
    try {
        await targetClient.connect();
        console.log(`Connected to ${targetDbName}. Running schema...`);
        
        const sqlPath = path.join(__dirname, 'init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await targetClient.query(sql);
        console.log('Schema applied.');

        // Step 3: Seed Admin
        const adminPassword = 'admin'; // Default password
        const hash = await bcrypt.hash(adminPassword, 10);
        
        // Check if admin exists (though init.sql drops tables, so it won't)
        const insertAdmin = `
            INSERT INTO admins (username, password_hash)
            VALUES ($1, $2)
            ON CONFLICT (username) DO NOTHING
            RETURNING id;
        `;
        const adminRes = await targetClient.query(insertAdmin, ['admin', hash]);
        if (adminRes.rows.length > 0) {
            console.log(`Default admin seeded. Username: 'admin', Password: '${adminPassword}'`);
        } else {
            console.log('Admin already exists.');
        }

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await targetClient.end();
    }
}

run();
