import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getMessages } from "@/lib/evolution-service"

export async function GET(request: Request) {
  try {
    // Get the URL parameters
    const url = new URL(request.url)
    const pageParam = url.searchParams.get("page")
    const limitParam = url.searchParams.get("limit")

    const page = pageParam ? Number.parseInt(pageParam, 10) : 1
    const limit = limitParam ? Number.parseInt(limitParam, 10) : 50

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
      // Fetch messages using the configuration
      const messages = await getMessages(
        {
          apiUrl: config.api_url,
          apiKey: config.api_key,
          instanceName: config.instance_name,
        },
        page,
        limit,
      )

      return NextResponse.json({
        success: true,
        data: messages,
      })
    } catch (error) {
      console.error("Error fetching messages from Evolution API:", error)

      // Return a more user-friendly response with mock data structure
      return NextResponse.json({
        success: true,
        data: {
          messages: {
            records: [],
            total: 0,
            pages: 1,
            currentPage: page,
          },
        },
        warning:
          "Could not fetch messages from Evolution API. The API endpoint may not be available or the format may be different.",
      })
    }
  } catch (error) {
    console.error("Error in messages API route:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}
