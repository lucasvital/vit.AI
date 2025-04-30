import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getContacts } from "@/lib/evolution-service"

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
      // Fetch contacts using the configuration
      const contacts = await getContacts({
        apiUrl: config.api_url,
        apiKey: config.api_key,
        instanceName: config.instance_name,
      })

      return NextResponse.json({
        success: true,
        data: contacts,
      })
    } catch (error) {
      console.error("Error fetching contacts from Evolution API:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch contacts from Evolution API",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 502 },
      )
    }
  } catch (error) {
    console.error("Error in contacts API route:", error)
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 })
  }
}
