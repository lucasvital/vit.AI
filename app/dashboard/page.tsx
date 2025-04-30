"use client"
import { EvolutionInstances } from "@/components/evolution-instances"
import { ContactList } from "@/components/contact-list"
import { MessageList } from "@/components/message-list"

export default function DashboardPage() {
  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Dashboard</h1>
      <div className="w-full grid gap-6">
        <EvolutionInstances />
        <div className="grid gap-6 md:grid-cols-2">
          <ContactList />
          <MessageList limit={10} />
        </div>
      </div>
    </div>
  )
}
