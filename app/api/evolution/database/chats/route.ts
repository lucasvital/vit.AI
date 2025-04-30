import { NextResponse } from "next/server"
import { getChats } from "@/lib/evolution-db-service"
import { sql } from "@/lib/db"

export async function POST(request: Request) {
  try {
    // Get the URL parameters
    const url = new URL(request.url)
    const instanceName = url.searchParams.get("instance")
    //const limitParam = url.searchParams.get("limit")
    //const limit = limitParam ? Number.parseInt(limitParam, 10) : 100

    if (!instanceName) {
      return NextResponse.json({ error: "Instance name is required" }, { status: 400 })
    }

    // Get the latest configuration to verify the instance exists
    const configResult = await sql`
      SELECT * FROM evolution_config 
      WHERE instance_name = ${instanceName}
      ORDER BY updated_at DESC 
      LIMIT 1
    `

    if (!configResult || configResult.length === 0) {
      return NextResponse.json({ error: `No configuration found for instance: ${instanceName}` }, { status: 404 })
    }

    // Get chats
    const chats = await getChats(instanceName)

    return NextResponse.json({
      success: true,
      data: chats,
    })
  } catch (error) {
    console.error("Error fetching chats:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
