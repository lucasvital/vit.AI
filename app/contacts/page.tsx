import { ContactList } from "@/components/contact-list"

export default function ContactsPage() {
  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Contacts</h1>
      <ContactList />
    </div>
  )
}
