import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url: process.env.VITE_TURSO_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function setup() {
  try {
    console.log("Creating orders table if not exists...");
    await client.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        buyer_id TEXT NOT NULL,
        seller_id TEXT NOT NULL,
        listing_id TEXT NOT NULL,
        amount REAL NOT NULL,
        slip_url TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Success!");
  } catch (err) {
    console.error("Error:", err);
  }
}

setup();
