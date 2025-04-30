import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Create a SQL client with the database URL from environment variables
const sql = neon(process.env.DATABASE_URL!)

// GET /api/config - Retrieve the current configuration
export async function GET() {
  try {
    console.log("Fetching configuration from database")

    const result = await sql`
      SELECT * FROM evolution_config 
      ORDER BY updated_at DESC 
      LIMIT 1
    `

    console.log("Query result:", result)

    if (!result || result.length === 0) {
      return NextResponse.json({ message: "No configuration found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error retrieving configuration:", error)
    return NextResponse.json({ error: "Failed to retrieve configuration" }, { status: 500 })
  }
}

// POST /api/config - Save a new configuration
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { apiUrl, apiKey, instanceName } = body

    console.log("Saving configuration:", { apiUrl, instanceName })

    // Validate required fields
    if (!apiUrl || !apiKey || !instanceName) {
      return NextResponse.json({ error: "API URL, API Key, and Instance Name are required" }, { status: 400 })
    }

    try {
      // Simple insert query without returning clause
      await sql`
        INSERT INTO evolution_config (api_url, api_key, instance_name, updated_at)
        VALUES (${apiUrl}, ${apiKey}, ${instanceName}, NOW())
      `

      console.log("Configuration saved successfully")

      return NextResponse.json({
        message: "Configuration saved successfully",
      })
    } catch (dbError) {
      console.error("Database error when saving configuration:", dbError)

      // Check if it's a constraint violation or other specific error
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError)

      return NextResponse.json(
        {
          error: "Database error when saving configuration",
          details: errorMessage,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json(
      {
        error: "Error processing request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
