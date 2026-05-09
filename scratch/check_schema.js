import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const client = createClient({
  url: process.env.VITE_TURSO_URL,
  authToken: process.env.VITE_TURSO_AUTH_TOKEN,
});

async function check() {
  try {
    const res = await client.execute("PRAGMA table_info(orders);");
    console.log(JSON.stringify(res.rows, null, 2));
    
    // Also try to add the column just in case it's missing
    try {
      await client.execute("ALTER TABLE orders ADD COLUMN buyer_whatsapp TEXT;");
      console.log("Added buyer_whatsapp column successfully.");
    } catch (e) {
      console.log("Column might already exist or error adding it:", e.message);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

check();
