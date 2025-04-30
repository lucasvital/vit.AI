"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function EvolutionInstances() {
  const [instances, setInstances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInstances() {
      try {
        // Use a URL absoluta para o endpoint
        const apiEndpoint = typeof window !== 'undefined' 
          ? `${window.location.origin}/api/evolution/instances` 
          : 'http://localhost:3000/api/evolution/instances';
          
        const response = await fetch(apiEndpoint)

        if (!response.ok) {
          if (response.status === 404) {
            setError("No configuration found. Please set up your Evolution API configuration first.")
          } else {
            const errorData = await response.json()
            throw new Error(errorData.error || "Failed to fetch instances")
          }
          return
        }

        const data = await response.json()
        console.log("Dados recebidos:", JSON.stringify(data))

        // Ensure instances is always an array
        const instancesArray = Array.isArray(data) ? data : [data]
        setInstances(instancesArray)
      } catch (error) {
        console.error("Error fetching instances:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch instances")
      } finally {
        setLoading(false)
      }
    }

    fetchInstances()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolution Instances</CardTitle>
          <CardDescription>Loading instance information...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolution Instances</CardTitle>
          <CardDescription>Error loading instances</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (instances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolution Instances</CardTitle>
          <CardDescription>No instances found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No Evolution instances were found. Please check your configuration.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolution Instances</CardTitle>
        <CardDescription>Your connected Evolution instances</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {instances.map((instance, index) => (
            <div key={index} className="rounded-lg border p-4">
              <h3 className="font-medium">
                {instance.instanceName || "Unknown Instance"}
              </h3>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  <span
                    className={
                      instance.status === "CONNECTED" || 
                      instance.status === "open" || 
                      (instance.instance && instance.instance.state === "open") ? 
                      "text-green-500" : "text-red-500"
                    }
                  >
                    {instance.status || "Unknown"}
                  </span>
                </div>
                {instance.instance && instance.instance.phone && (
                  <div>
                    <span className="font-medium">Phone:</span> {instance.instance.phone}
                  </div>
                )}
                {instance.instance && instance.instance.version && (
                  <div>
                    <span className="font-medium">Version:</span> {instance.instance.version}
                  </div>
                )}
                
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
