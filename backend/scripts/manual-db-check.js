
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
});

client.connect()
    .then(async () => {
        console.log('Connected to database');

        try {
            const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'up_users';
        `);
            console.log('Columns:', res.rows.map(r => r.column_name));

            const users = await client.query('SELECT * FROM up_users LIMIT 5');
            users.rows.forEach(row => {
                console.log(`ID: ${row.id}, DocumentID: ${row.document_id}`);
            });
        } catch (e) {
            console.error(e);
        } finally {
            await client.end();
        }
    })
    .catch(err => console.error('Connection error', err.stack));
