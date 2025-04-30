"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Loader2 } from "lucide-react"

interface ChatMetricsProps {
  instanceName: string
}

export function ChatMetrics({ instanceName }: ChatMetricsProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true)
        setError(null)

        const apiEndpoint = typeof window !== 'undefined' 
          ? `${window.location.origin}/api/evolution/database/messages/stats?instance=${instanceName}`
          : `http://localhost:3000/api/evolution/database/messages/stats?instance=${instanceName}`;
          
        const response = await fetch(apiEndpoint)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch message statistics")
        }

        const data = await response.json()
        setStats(data.data)
      } catch (error) {
        console.error("Error fetching message statistics:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch message statistics")
      } finally {
        setLoading(false)
      }
    }

    if (instanceName) {
      fetchStats()
    }
  }, [instanceName])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chat Metrics</CardTitle>
          <CardDescription>Loading message statistics...</CardDescription>
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
          <CardTitle>Chat Metrics</CardTitle>
          <CardDescription>Error loading message statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chat Metrics</CardTitle>
          <CardDescription>No message statistics available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No message statistics were found for this instance.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chat Metrics</CardTitle>
        <CardDescription>Message statistics for {instanceName}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Total Messages</h3>
            <p className="mt-2 text-2xl font-bold">{stats.messageCount}</p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Total Chats</h3>
            <p className="mt-2 text-2xl font-bold">{stats.chatCount}</p>
          </div>
        </div>

        <Tabs defaultValue="daily" className="mt-6">
          <TabsList>
            <TabsTrigger value="daily">Daily Messages</TabsTrigger>
            <TabsTrigger value="chats">Top Chats</TabsTrigger>
          </TabsList>
          <TabsContent value="daily" className="pt-4">
            <div className="h-[300px]">
              {stats.messagesPerDay && stats.messagesPerDay.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.messagesPerDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Messages" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No daily message data available</p>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="chats" className="pt-4">
            <div className="space-y-4">
              {stats.topChats && stats.topChats.length > 0 ? (
                stats.topChats.map((chat: any, index: number) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">{chat.remote_jid.split("@")[0]}</p>
                      <p className="text-sm text-muted-foreground">{chat.remote_jid}</p>
                    </div>
                    <div className="text-lg font-bold">{chat.message_count}</div>
                  </div>
                ))
              ) : (
                <div className="flex h-[300px] items-center justify-center">
                  <p className="text-muted-foreground">No chat data available</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
