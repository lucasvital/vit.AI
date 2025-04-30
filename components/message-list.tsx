"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Message {
  id: string
  key?: {
    id: string
    fromMe: boolean
    remoteJid: string
  }
  pushName?: string
  messageType?: string
  message?: {
    conversation?: string
    [key: string]: any
  }
  messageTimestamp?: number
  instanceId?: string
  source?: string
  MessageUpdate?: Array<{ status: string }>
  // Fallback fields for different API formats
  remote_jid?: string
  from_me?: boolean
  message_timestamp?: number
}

interface MessageListProps {
  limit?: number
}

export function MessageList({ limit = 10 }: MessageListProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalMessages, setTotalMessages] = useState(0)

  useEffect(() => {
    fetchMessages(page)
  }, [page, limit])

  async function fetchMessages(pageNum: number) {
    try {
      setLoading(true)
      setError(null)
      setWarning(null)

      // Use a URL absoluta para o endpoint
      const apiEndpoint = typeof window !== 'undefined' 
        ? `${window.location.origin}/api/evolution/messages?page=${pageNum}&limit=${limit}`
        : `http://localhost:3000/api/evolution/messages?page=${pageNum}&limit=${limit}`;
          
      const response = await fetch(apiEndpoint)

      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.error || "Failed to fetch messages")
        } catch {
          throw new Error(`Failed to fetch messages: ${errorText.substring(0, 100)}...`)
        }
      }

      const data = await response.json()

      if (data.warning) {
        setWarning(data.warning)
      }

      // Handle different response formats
      if (data.data && data.data.messages) {
        // Format 1: { data: { messages: { records: [], total: 0, pages: 1 } } }
        setMessages(data.data.messages.records || [])
        setTotalPages(data.data.messages.pages || 1)
        setTotalMessages(data.data.messages.total || 0)
      } else if (data.data && Array.isArray(data.data)) {
        // Format 2: { data: [] }
        setMessages(data.data)
        setTotalPages(1)
        setTotalMessages(data.data.length)
      } else if (Array.isArray(data)) {
        // Format 3: []
        setMessages(data)
        setTotalPages(1)
        setTotalMessages(data.length)
      } else {
        // No recognizable format
        setMessages([])
        setTotalPages(1)
        setTotalMessages(0)
        setWarning("Received data in an unexpected format")
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch messages")
    } finally {
      setLoading(false)
    }
  }

  // Format phone number from JID
  const formatPhone = (jid: string) => {
    if (!jid) return "Unknown"
    const parts = jid.split("@")
    return parts[0] || "Unknown"
  }

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return "";
    
    try {
      // Para timestamps em segundos (formato UNIX)
      let timestampMs = timestamp;
      if (timestamp < 10000000000) {
        timestampMs = timestamp * 1000; // Converter para milissegundos
      }
      
      const date = new Date(timestampMs);
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        console.error("Timestamp inválido:", timestamp);
        return "";
      }
      
      // Formatar como DD/MM, HH:MM
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      return `${day}/${month}, ${time}`;
    } catch (error) {
      console.error("Erro ao formatar timestamp:", error);
      return "";
    }
  }

  // Get message content - handle different message formats
  const getMessageContent = (message: Message) => {
    // Handle standard format
    if (message.message?.conversation) {
      return message.message.conversation
    }

    if (message.message?.extendedTextMessage?.text) {
      return message.message.extendedTextMessage.text
    }

    // Handle alternative format
    if (typeof message.message === "string") {
      return message.message
    }

    // Handle message type indicators
    if (message.messageType === "imageMessage" || message.message?.imageMessage) {
      return "[Image]"
    }

    if (message.messageType === "videoMessage" || message.message?.videoMessage) {
      return "[Video]"
    }

    if (message.messageType === "audioMessage" || message.message?.audioMessage) {
      return "[Audio]"
    }

    if (message.messageType === "documentMessage" || message.message?.documentMessage) {
      return "[Document]"
    }

    return "[Media or non-text message]"
  }

  // Determine if message is from me - handle different formats
  const isFromMe = (message: Message) => {
    return message.key?.fromMe || message.from_me || false
  }

  // Get remote JID - handle different formats
  const getRemoteJid = (message: Message) => {
    return message.key?.remoteJid || message.remote_jid || "Unknown"
  }

  // Get timestamp - handle different formats
  const getTimestamp = (message: Message) => {
    return message.messageTimestamp || message.message_timestamp || 0
  }

  if (loading && page === 1) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
          <CardDescription>Loading messages...</CardDescription>
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
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => fetchMessages(page)}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Messages</CardTitle>
        <CardDescription>
          {messages.length > 0
            ? `Showing ${messages.length} of ${totalMessages} messages (Page ${page} of ${totalPages})`
            : "No messages found"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {warning && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{warning}</AlertDescription>
          </Alert>
        )}

        {messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={message.id || index} className="flex items-start gap-4">
                <Avatar>
                  <AvatarFallback>
                    {isFromMe(message)
                      ? "Me"
                      : message.pushName?.charAt(0) || formatPhone(getRemoteJid(message)).charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">
                      {isFromMe(message) ? "You" : message.pushName || formatPhone(getRemoteJid(message))}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant={isFromMe(message) ? "outline" : "default"}>
                        {isFromMe(message) ? "Sent" : "Received"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatTimestamp(getTimestamp(message))}</span>
                    </div>
                  </div>
                  <p className="text-sm">{getMessageContent(message)}</p>
                  {message.MessageUpdate && message.MessageUpdate.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {message.MessageUpdate.map((update, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {update.status}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground">No messages were found.</p>
          </div>
        )}
      </CardContent>
      {messages.length > 0 && (
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            Next
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
