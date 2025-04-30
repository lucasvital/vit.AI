import { MessagesChatInterface } from "@/components/messages-chat-interface";

export default function ChatPage() {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-zinc-100">Chat</h1>
        <p className="text-zinc-400">
          Acompanhe suas conversas instantâneas
        </p>
      </div>
      
      <div className="h-[calc(100vh-220px)] w-full rounded-xl overflow-hidden shadow-xl border border-zinc-800">
        <MessagesChatInterface />
      </div>
    </div>
  );
} 