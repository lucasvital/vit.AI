"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface ConfigFormData {
  apiUrl: string
  apiKey: string
  instanceName: string
}

export default function ConfigPage() {
  const { toast } = useToast()
  const [formData, setFormData] = useState<ConfigFormData>({
    apiUrl: "",
    apiKey: "",
    instanceName: "",
  })
  const [loading, setLoading] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // Load existing configuration on page load
  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch("/api/config")
        if (response.ok) {
          const data = await response.json()
          setFormData({
            apiUrl: data.api_url || "",
            apiKey: data.api_key || "",
            instanceName: data.instance_name || "",
          })
        }
      } catch (error) {
        console.error("Error loading configuration:", error)
      } finally {
        setLoadingConfig(false)
      }
    }

    loadConfig()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id === "api-url" ? "apiUrl" : id === "api-key" ? "apiKey" : "instanceName"]: value,
    }))
    // Clear connection error when form is changed
    setConnectionError(null)
    setDebugInfo(null)
  }

  const handleReset = () => {
    setFormData({
      apiUrl: "",
      apiKey: "",
      instanceName: "",
    })
    setConnectionError(null)
    setDebugInfo(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setConnectionError(null)
    setDebugInfo(null)

    try {
      // First test the connection before saving
      const testResponse = await fetch("/api/evolution/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiUrl: formData.apiUrl,
          apiKey: formData.apiKey,
          instanceName: formData.instanceName,
        }),
      })

      // Read the response body once and store it
      let testResponseBody
      let testData

      try {
        // Try to parse as JSON first
        testResponseBody = await testResponse.text()
        try {
          testData = JSON.parse(testResponseBody)
        } catch (parseError) {
          console.error("Failed to parse test response as JSON:", testResponseBody)
          throw new Error(`Failed to connect to Evolution API: ${testResponseBody.substring(0, 100)}...`)
        }
      } catch (responseError) {
        console.error("Error reading test response:", responseError)
        throw new Error("Failed to read response from Evolution API")
      }

      if (!testResponse.ok || !testData.success) {
        setConnectionError(testData.error || "Failed to connect to Evolution API")
        setDebugInfo(testData)
        throw new Error(testData.error || "Failed to connect to Evolution API")
      }

      // If connection test is successful, save the configuration
      try {
        console.log("Saving configuration...")

        const saveResponse = await fetch("/api/config", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            apiUrl: formData.apiUrl,
            apiKey: formData.apiKey,
            instanceName: formData.instanceName,
          }),
        })

        if (!saveResponse.ok) {
          const errorText = await saveResponse.text()
          console.error("Error response from save:", errorText)

          try {
            const errorData = JSON.parse(errorText)
            throw new Error(errorData.error || errorData.details || "Failed to save configuration")
          } catch (parseError) {
            throw new Error(`Server error: ${errorText.substring(0, 100)}...`)
          }
        }

        // Try to parse the response as JSON
        const saveResponseText = await saveResponse.text()
        let saveData

        try {
          saveData = JSON.parse(saveResponseText)
          console.log("Save response:", saveData)
        } catch (parseError) {
          console.warn("Could not parse save response as JSON:", saveResponseText)
          // Continue anyway since the response was OK
        }

        toast({
          title: "Configuration saved",
          description: "Your Evolution API configuration has been saved successfully.",
        })
      } catch (saveError) {
        console.error("Error during save operation:", saveError)
        throw saveError
      }
    } catch (error) {
      console.error("Error saving configuration:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save configuration",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    setTestingConnection(true)
    setConnectionError(null)
    setDebugInfo(null)

    try {
      const response = await fetch("/api/evolution/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiUrl: formData.apiUrl,
          apiKey: formData.apiKey,
          instanceName: formData.instanceName,
        }),
      })

      // Read the response body once and store it
      let responseBody
      let data

      try {
        // Try to parse as JSON first
        responseBody = await response.text()
        try {
          data = JSON.parse(responseBody)
        } catch (parseError) {
          console.error("Failed to parse response as JSON:", responseBody)
          throw new Error(`Failed to connect to Evolution API: ${responseBody.substring(0, 100)}...`)
        }
      } catch (responseError) {
        console.error("Error reading response:", responseError)
        throw new Error("Failed to read response from Evolution API")
      }

      if (data.success) {
        toast({
          title: "Connection successful",
          description: `Successfully connected to the Evolution API using endpoint: ${data.workingEndpoint}`,
        })
        setDebugInfo(data)
      } else {
        setConnectionError(data.error || "Failed to connect to Evolution API")
        setDebugInfo(data)
        throw new Error(data.error || "Failed to connect to Evolution API")
      }
    } catch (error) {
      console.error("Error testing connection:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to connect to Evolution API"
      setConnectionError(errorMessage)
      toast({
        title: "Connection failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setTestingConnection(false)
    }
  }

  if (loadingConfig) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Evolution API Settings</CardTitle>
            <CardDescription>Configure your connection to the Evolution API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {connectionError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Connection Error</AlertTitle>
                <AlertDescription>{connectionError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="api-url">Evolution API URL</Label>
              <Input
                id="api-url"
                placeholder="https://api.evolution.com"
                value={formData.apiUrl}
                onChange={handleChange}
                required
              />
              <p className="text-sm text-muted-foreground">
                The base URL of your Evolution API instance (e.g., https://api.example.com)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">Evolution API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter your API key"
                value={formData.apiKey}
                onChange={handleChange}
                required
              />
              <p className="text-sm text-muted-foreground">Your authentication key for the Evolution API</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instance-name">Evolution Instance Name</Label>
              <Input
                id="instance-name"
                placeholder="Enter instance name"
                value={formData.instanceName}
                onChange={handleChange}
                required
              />
              <p className="text-sm text-muted-foreground">The name of your Evolution instance (e.g., instance1)</p>
            </div>

            {debugInfo && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="debug-info">
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Connection Details
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="rounded-md bg-muted p-4">
                      <pre className="text-xs overflow-auto whitespace-pre-wrap">
                        {JSON.stringify(debugInfo, null, 2)}
                      </pre>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleReset} disabled={loading || testingConnection}>
              Reset
            </Button>
            <Button type="button" variant="outline" onClick={testConnection} disabled={loading || testingConnection}>
              {testingConnection ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Connection"
              )}
            </Button>
            <Button type="submit" disabled={loading || testingConnection}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Configuration"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
