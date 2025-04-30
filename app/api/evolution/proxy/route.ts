import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url, method = "GET", headers = {}, body: requestBody } = body

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    console.log(`Making proxy request to: ${url}`)
    console.log(`Method: ${method}`)
    console.log(`Headers: ${JSON.stringify(headers)}`)

    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      cache: "no-store",
    }

    if (requestBody && method !== "GET") {
      options.body = JSON.stringify(requestBody)
    }

    try {
      const response = await fetch(url, options)

      const contentType = response.headers.get("content-type") || ""
      console.log(`Response status: ${response.status}`)
      console.log(`Content-Type: ${contentType}`)

      // Get the response as text first
      const responseText = await response.text()

      // Log a preview of the response
      console.log(`Response preview: ${responseText.substring(0, 200)}...`)

      // If it's JSON, parse it and return as JSON
      if (contentType.includes("application/json")) {
        try {
          const jsonData = JSON.parse(responseText)

          // Check if the response is a 404 or other error
          if (response.status >= 400) {
            return NextResponse.json({
              success: false,
              error: `Server responded with status ${response.status}`,
              data: jsonData,
              status: response.status,
            })
          }

          return NextResponse.json({
            success: true,
            data: jsonData,
            status: response.status,
          })
        } catch (e) {
          console.error("Failed to parse JSON:", e)
          return NextResponse.json(
            {
              success: false,
              error: "Invalid JSON response",
              rawResponse: responseText.substring(0, 1000),
              status: response.status,
            },
            { status: 502 },
          )
        }
      }

      // If not JSON, try to parse it anyway (some APIs return JSON without proper content-type)
      try {
        const jsonData = JSON.parse(responseText)

        // Check if the response is a 404 or other error
        if (response.status >= 400) {
          return NextResponse.json({
            success: false,
            error: `Server responded with status ${response.status}`,
            data: jsonData,
            status: response.status,
          })
        }

        return NextResponse.json({
          success: true,
          data: jsonData,
          status: response.status,
        })
      } catch {
        // If it's not JSON, return the raw response
        return NextResponse.json(
          {
            success: false,
            error: "Response is not JSON",
            contentType,
            rawResponse: responseText.substring(0, 1000),
            status: response.status,
          },
          { status: 502 },
        )
      }
    } catch (fetchError) {
      console.error("Fetch error:", fetchError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch from the target URL",
          details: fetchError instanceof Error ? fetchError.message : "Unknown fetch error",
        },
        { status: 502 },
      )
    }
  } catch (error) {
    console.error("Proxy request error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
