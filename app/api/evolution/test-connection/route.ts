import { NextResponse } from "next/server"
import { testEvolutionConnection } from "@/lib/evolution-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { apiUrl, apiKey, instanceName } = body

    // Validate required fields
    if (!apiUrl || !apiKey || !instanceName) {
      return NextResponse.json({ error: "API URL, API Key, and Instance Name are required" }, { status: 400 })
    }

    // Log the request for debugging
    console.log("Testing connection with:", {
      apiUrl,
      instanceName,
      apiKeyLength: apiKey ? apiKey.length : 0,
    })

    try {
      // Test the connection
      const result = await testEvolutionConnection({ apiUrl, apiKey, instanceName })

      return NextResponse.json({
        success: true,
        message: "Connection successful",
        data: result.data,
        workingEndpoint: result.workingEndpoint,
      })
    } catch (error) {
      console.error("Connection test failed:", error)

      // Return a more detailed error message
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Failed to connect to Evolution API",
          details: "The API returned an invalid response. Please check your API URL and credentials.",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error processing request:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process request",
      },
      { status: 500 },
    )
  }
}
