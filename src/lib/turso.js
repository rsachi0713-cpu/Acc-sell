import { createClient } from "@libsql/client";

const url = import.meta.env.VITE_TURSO_URL;
const authToken = import.meta.env.VITE_TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.warn("Turso configuration is missing. Please add VITE_TURSO_URL and VITE_TURSO_AUTH_TOKEN to your .env file.");
}

export const turso = createClient({
  url: url || "",
  authToken: authToken || "",
});
