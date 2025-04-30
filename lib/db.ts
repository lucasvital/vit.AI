import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

// TEMPORÁRIO: URL hardcoded para teste
// Substitua esta URL pela sua URL de conexão do Neon
// Depois, mude de volta para usar process.env.DATABASE_URL quando resolver o problema do .env.local
const DATABASE_URL = "postgres://neondb_owner:npg_46sBGjiepRIO@ep-flat-cherry-a5j1gd07-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

// Create a SQL client with the database URL from environment variables
export const sql = neon(DATABASE_URL)

// Create a Drizzle client
export const db = drizzle(sql)

// Helper function to execute raw SQL queries
export async function executeQuery(query: string, params: any[] = []) {
  try {
    // Converte a string para template string tag
    return await sql`${query}`
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}
