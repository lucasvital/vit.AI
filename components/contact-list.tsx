"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Loader2, Search } from "lucide-react"

interface Contact {
  id: string
  remoteJid: string
  pushName: string
  profilePicUrl?: string
  createdAt: string
  updatedAt: string
  instanceId: string
}

export function ContactList() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchContacts() {
      try {
        setLoading(true)
        setError(null)

        const apiEndpoint = typeof window !== 'undefined' 
          ? `${window.location.origin}/api/evolution/contacts`
          : 'http://localhost:3000/api/evolution/contacts';
          
        const response = await fetch(apiEndpoint)

        if (!response.ok) {
          const errorText = await response.text()
          try {
            const errorData = JSON.parse(errorText)
            throw new Error(errorData.error || "Failed to fetch contacts")
          } catch {
            throw new Error(`Failed to fetch contacts: ${errorText.substring(0, 100)}...`)
          }
        }

        const data = await response.json()
        setContacts(data.data || [])
        setFilteredContacts(data.data || [])
      } catch (error) {
        console.error("Error fetching contacts:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch contacts")
      } finally {
        setLoading(false)
      }
    }

    fetchContacts()
  }, [])

  // Filter contacts when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContacts(contacts)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = contacts.filter(
      (contact) =>
        contact.pushName?.toLowerCase().includes(query) ||
        formatPhoneNumber(contact.remoteJid).toLowerCase().includes(query),
    )
    setFilteredContacts(filtered)
  }, [searchQuery, contacts])

  // Format phone number from JID (e.g., "553591891712@s.whatsapp.net" -> "553591891712")
  const formatPhoneNumber = (jid: string) => {
    if (!jid) return ""
    return jid.split("@")[0] || jid
  }

  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return "?"
    return name.charAt(0).toUpperCase()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
          <CardDescription>Loading contacts...</CardDescription>
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
          <CardTitle>Contacts</CardTitle>
          <CardDescription>Error loading contacts</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contacts</CardTitle>
        <CardDescription>{contacts.length} contacts found</CardDescription>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search contacts..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredContacts.length > 0 ? (
          <div className="space-y-4">
            {filteredContacts.map((contact) => (
              <div key={contact.id} className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={contact.profilePicUrl || "/placeholder.svg"} alt={contact.pushName || "Contact"} />
                  <AvatarFallback>{getInitials(contact.pushName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{contact.pushName || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">{formatPhoneNumber(contact.remoteJid)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground">
              {searchQuery ? "No contacts match your search" : "No contacts found"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
