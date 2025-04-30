import { NextResponse } from "next/server"
import { testDatabaseConnection } from "@/lib/evolution-db-service"

export async function GET() {
  try {
    const result = await testDatabaseConnection()

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
