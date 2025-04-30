import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { fetchEvolutionDatabaseInfo } from "@/lib/evolution-db-service"

export async function GET() {
  try {
    // Get the latest configuration
    const configResult = await sql`
      SELECT * FROM evolution_config 
      ORDER BY updated_at DESC 
      LIMIT 1
    `

    if (!configResult || configResult.length === 0) {
      return NextResponse.json({ error: "No configuration found" }, { status: 404 })
    }

    const config = configResult[0]

    try {
      // Fetch database info from Evolution API
      const dbInfo = await fetchEvolutionDatabaseInfo(config.api_url)

      return NextResponse.json({
        success: true,
        data: dbInfo,
      })
    } catch (error) {
      console.error("Error fetching database info:", error)
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in database info API route:", error)
    return NextResponse.json({ error: "Failed to fetch database info" }, { status: 500 })
  }
}
