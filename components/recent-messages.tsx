"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

interface RecentMessagesProps {
  instanceName: string
  limit?: number
}

export function RecentMessages({ instanceName, limit = 10 }: RecentMessagesProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    async function fetchMessages() {
      try {
        setLoading(true)
        setError(null)

        // Use a URL absoluta para o endpoint
        const apiEndpoint = typeof window !== 'undefined' 
          ? `${window.location.origin}/api/evolution/database/messages/recent?instance=${instanceName}&limit=${limit}`
          : `http://localhost:3000/api/evolution/database/messages/recent?instance=${instanceName}&limit=${limit}`;
          
        const response = await fetch(apiEndpoint)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch recent messages")
        }

        const data = await response.json()
        setMessages(data.data || [])
      } catch (error) {
        console.error("Error fetching recent messages:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch recent messages")
      } finally {
        setLoading(false)
      }
    }

    if (instanceName) {
      fetchMessages()
    }
  }, [instanceName, limit])

  // Format phone number from JID
  const formatPhone = (jid: string) => {
    if (!jid) return "Unknown"
    const parts = jid.split("@")
    return parts[0] || "Unknown"
  }

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return ""
    const date = new Date(timestamp * 1000)
    return date.toLocaleString()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
          <CardDescription>Loading recent messages...</CardDescription>
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
          <CardTitle>Recent Messages</CardTitle>
          <CardDescription>Error loading messages</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (messages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
          <CardDescription>No recent messages</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No recent messages were found for this instance.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Messages</CardTitle>
        <CardDescription>Latest messages for {instanceName}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex items-start gap-4">
              <Avatar>
                <AvatarFallback>{formatPhone(message.remote_jid).charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{formatPhone(message.remote_jid)}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={message.from_me ? "outline" : "default"}>
                      {message.from_me ? "Sent" : "Received"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatTimestamp(message.message_timestamp)}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{message.message || "(Media or non-text message)"}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
