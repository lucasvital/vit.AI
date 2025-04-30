export interface EvolutionConfig {
  apiUrl: string
  apiKey: string
  instanceName: string
}

// Helper function to make requests through our proxy
async function makeProxyRequest(url: string, apiKey: string, method = "POST", body?: any) {
  try {
    // Use a URL absoluta para o endpoint de proxy
    const proxyEndpoint = typeof window !== 'undefined' 
      ? `${window.location.origin}/api/evolution/proxy` 
      : 'http://localhost:3000/api/evolution/proxy';

    const response = await fetch(proxyEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        method,
        headers: {
          apikey: apiKey,
        },
        body,
      }),
    })

    const result = await response.json()

    if (!result.success) {
      console.error("Proxy request failed:", result.error)
      console.error("Raw response:", result.rawResponse || result.details || "No details available")
      throw new Error(result.error || "Request failed")
    }

    return result.data
  } catch (error) {
    console.error("Error making proxy request:", error)
    throw error
  }
}

export async function testEvolutionConnection(config: EvolutionConfig) {
  try {
    // Make sure the URL doesn't have a trailing slash
    const baseUrl = config.apiUrl.endsWith("/") ? config.apiUrl.slice(0, -1) : config.apiUrl

    // Try different endpoint formats to see which one works
    // Formato: [url, método]
    const endpoints = [
      [`${baseUrl}/instance/connectionState/${config.instanceName}`, "GET"],
      [`${baseUrl}/instance/fetchInstances`, "GET"],
      [`${baseUrl}/chat/findContacts/${config.instanceName}`, "POST"],
      [`${baseUrl}/chat/findMessages/${config.instanceName}`, "POST"],
    ]

    console.log("Testing Evolution API endpoints:")

    // Try each endpoint until one works
    for (const [endpoint, method] of endpoints) {
      console.log(`Trying endpoint: ${endpoint} with method: ${method}`)

      try {
        const result = await makeProxyRequest(endpoint, config.apiKey, method as string)

        // Check if the response is valid (not an error)
        if (result && !result.error && result.status !== 404) {
          console.log("Endpoint successful:", endpoint)
          return {
            success: true,
            data: result,
            workingEndpoint: endpoint,
            method: method,
          }
        } else {
          console.log(`Endpoint returned error or 404:`, result)
          // Continue to the next endpoint
        }
      } catch (error) {
        console.log(`Endpoint failed: ${endpoint}`)
        // Continue to the next endpoint
      }
    }

    // If we get here, none of the endpoints worked
    throw new Error("Could not connect to Evolution API. Please check your API URL and credentials.")
  } catch (error) {
    console.error("Error testing Evolution connection:", error)
    throw error
  }
}

export async function getAllInstances(config: EvolutionConfig) {
  try {
    // Make sure the URL doesn't have a trailing slash
    const baseUrl = config.apiUrl.endsWith("/") ? config.apiUrl.slice(0, -1) : config.apiUrl

    // Buscar instances com GET 
    return await makeProxyRequest(`${baseUrl}/instance/fetchInstances`, config.apiKey, "GET")
  } catch (error) {
    console.error("Error fetching instances:", error)
    throw error
  }
}

// Function to get the connection state of an instance
export async function getConnectionState(config: EvolutionConfig) {
  try {
    // Make sure the URL doesn't have a trailing slash
    const baseUrl = config.apiUrl.endsWith("/") ? config.apiUrl.slice(0, -1) : config.apiUrl

    // Fetch connection state from the API - usar GET
    return await makeProxyRequest(`${baseUrl}/instance/connectionState/${config.instanceName}`, config.apiKey, "GET")
  } catch (error) {
    console.error("Error fetching connection state:", error)
    throw error
  }
}

// New function to fetch contacts from the Evolution API
export async function getContacts(config: EvolutionConfig) {
  try {
    // Make sure the URL doesn't have a trailing slash
    const baseUrl = config.apiUrl.endsWith("/") ? config.apiUrl.slice(0, -1) : config.apiUrl

    // Fetch contacts from the API - usar POST
    return await makeProxyRequest(`${baseUrl}/chat/findContacts/${config.instanceName}`, config.apiKey, "POST")
  } catch (error) {
    console.error("Error fetching contacts:", error)
    throw error
  }
}

// New function to fetch messages from the Evolution API
export async function getMessages(config: EvolutionConfig, page = 1, limit = 50) {
  try {
    // Make sure the URL doesn't have a trailing slash
    const baseUrl = config.apiUrl.endsWith("/") ? config.apiUrl.slice(0, -1) : config.apiUrl

    // Tentar o endpoint principal com POST e parâmetros na URL
    try {
      console.log(`Tentando buscar mensagens de: ${baseUrl}/chat/findMessages/${config.instanceName}?page=${page}&limit=${limit} com método POST`)
      const result = await makeProxyRequest(
        `${baseUrl}/chat/findMessages/${config.instanceName}?page=${page}&limit=${limit}`, 
        config.apiKey, 
        "POST"
      )
      
      if (result && !result.error) {
        console.log("Mensagens recuperadas com sucesso")
        return result
      }
    } catch (error) {
      console.log("Erro ao buscar mensagens com parâmetros na URL, tentando com body")
    }

    // Tentar novamente com os parâmetros no body
    try {
      console.log(`Tentando buscar mensagens de: ${baseUrl}/chat/findMessages/${config.instanceName} com parâmetros no body`)
      const result = await makeProxyRequest(
        `${baseUrl}/chat/findMessages/${config.instanceName}`,
        config.apiKey,
        "POST",
        { page, limit }
      )
      
      if (result && !result.error) {
        console.log("Mensagens recuperadas com sucesso usando body")
        return result
      }
    } catch (error) {
      console.log("Erro ao buscar mensagens com parâmetros no body")
      throw error
    }

    throw new Error("Não foi possível recuperar mensagens")
  } catch (error) {
    console.error("Error fetching messages:", error)
    throw error
  }
}
