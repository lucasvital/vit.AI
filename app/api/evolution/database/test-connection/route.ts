import { NextResponse } from "next/server"
import { extractDatabaseConfigFromUrl, testDatabaseConnection } from "@/lib/evolution-db-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { databaseUrl } = body

    if (!databaseUrl) {
      return NextResponse.json({ error: "Database URL is required" }, { status: 400 })
    }

    // Extract database config from URL
    const dbConfig = await extractDatabaseConfigFromUrl(databaseUrl)

    if (!dbConfig) {
      return NextResponse.json({ error: "Invalid database URL format" }, { status: 400 })
    }

    // Test the database connection
    const result = await testDatabaseConnection(dbConfig)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Database connection successful",
        data: result.data,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to connect to database",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error testing database connection:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
