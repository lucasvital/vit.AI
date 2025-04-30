import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getAllInstances, getConnectionState } from "@/lib/evolution-service"

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
      // First try to get the connection state of the specific instance
      try {
        const connectionState = await getConnectionState({
          apiUrl: config.api_url,
          apiKey: config.api_key,
          instanceName: config.instance_name,
        })

        // Registrar a resposta para debug
        console.log("Resposta da API para connectionState:", JSON.stringify(connectionState))

        // Format the connection state response - considerar resposta aninhada
        const formattedInstance = {
          instanceName: config.instance_name,
          // Verificar as diferentes possibilidades de onde o estado pode estar
          status: (connectionState.instance && connectionState.instance.state) || 
                 connectionState.state || 
                 "UNKNOWN",
          // Adicionar o objeto instance para acesso a detalhes
          instance: connectionState.instance || connectionState
        }

        // Return as an array with one instance
        return NextResponse.json([formattedInstance])
      } catch (connectionStateError) {
        console.log("Failed to get connection state, falling back to fetchInstances")
      }

      // If getting the connection state failed, fall back to fetching all instances
      const instances = await getAllInstances({
        apiUrl: config.api_url,
        apiKey: config.api_key,
        instanceName: config.instance_name,
      })

      // Log the instances for debugging
      console.log("Instâncias recuperadas:", JSON.stringify(instances))

      // Ensure we're returning an array
      const instancesArray = Array.isArray(instances) ? instances : [instances]

      // Format each instance to ensure consistent structure
      const formattedInstances = instancesArray.map((instance) => {
        if (typeof instance === "string") {
          return { instanceName: instance, status: "UNKNOWN" }
        }

        // Verificar se a instância tem estrutura aninhada e extrair dados
        const instanceData = instance.instance || instance
        const state = instanceData.state || instanceData.connectionStatus || "UNKNOWN"
        const name = instanceData.name || instanceData.instanceName || "Unknown"

        return {
          instanceName: name,
          status: state,
          // Manter o objeto original para acesso aos dados
          instance: instanceData
        }
      })

      return NextResponse.json(formattedInstances)
    } catch (error) {
      console.error("Error fetching instances from Evolution API:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch instances from Evolution API",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 502 },
      )
    }
  } catch (error) {
    console.error("Error in instances API route:", error)
    return NextResponse.json({ error: "Failed to fetch instances" }, { status: 500 })
  }
}
