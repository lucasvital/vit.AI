import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { extractDatabaseConfigFromUrl, fetchChatMetrics } from "@/lib/evolution-db-service"

export async function GET(request: Request) {
  try {
    // Get the URL parameters
    const url = new URL(request.url)
    const instanceName = url.searchParams.get("instance")

    if (!instanceName) {
      return NextResponse.json({ error: "Instance name is required" }, { status: 400 })
    }

    // Get the latest configuration
    const configResult = await sql`
      SELECT * FROM evolution_config 
      ORDER BY updated_at DESC 
      LIMIT 1
    `

    if (!configResult || configResult.length === 0) {
      return NextResponse.json({ error: "No configuration found" }, { status: 404 })
    }

    // Get database URL from the configuration
    // In a real scenario, you would get this from the Evolution API or configuration
    const databaseUrl = "postgresql://postgres:f9ff13189aca4ca6faea09dd77ba21de@postgres:5432/evolution"

    // Extract database config from URL
    const dbConfig = await extractDatabaseConfigFromUrl(databaseUrl)

    if (!dbConfig) {
      return NextResponse.json({ error: "Invalid database URL format" }, { status: 400 })
    }

    // Fetch chat metrics
    const metrics = await fetchChatMetrics(dbConfig, instanceName)

    return NextResponse.json({
      success: true,
      data: metrics,
    })
  } catch (error) {
    console.error("Error fetching chat metrics:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
