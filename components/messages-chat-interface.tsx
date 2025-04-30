"use client"

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Loader2, MoreVertical, Phone, Search, Video, Info, Send } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

// Interfaces
interface Contact {
  id: string;
  remoteJid: string;
  pushName?: string;
  lastMessageTimestamp?: number;
  lastMessage?: string;
  profilePicUrl?: string;
}

interface Message {
  id: string;
  remoteJid: string;
  message: string;
  fromMe: boolean;
  messageTimestamp: number;
  pushName?: string;
}

export function MessagesChatInterface() {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  
  // Função para buscar contatos
  useEffect(() => {
    async function fetchContacts() {
      try {
        setLoading(true);
        
        const contactsEndpoint = typeof window !== 'undefined' 
          ? `${window.location.origin}/api/evolution/contacts`
          : 'http://localhost:3000/api/evolution/contacts';
          
        const response = await fetch(contactsEndpoint);
        
        if (!response.ok) {
          throw new Error("Falha ao buscar contatos");
        }
        
        const data = await response.json();
        
        // Processando os contatos
        let contactsList: Contact[] = [];
        
        if (data.data && Array.isArray(data.data)) {
          contactsList = data.data.map((contact: any) => ({
            id: contact.id || contact.remoteJid,
            remoteJid: contact.remoteJid,
            pushName: contact.pushName || formatPhoneNumber(contact.remoteJid),
            lastMessageTimestamp: contact.lastMessageTimestamp,
            lastMessage: contact.lastMessage,
            profilePicUrl: contact.profilePicUrl
          }));
        }
        
        // Ordenando contatos pelo timestamp da última mensagem (mais recentes primeiro)
        contactsList.sort((a, b) => {
          return (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0);
        });
        
        setContacts(contactsList);
        
        // Selecionar o primeiro contato se existir
        if (contactsList.length > 0) {
          setSelectedContact(contactsList[0]);
        }
        
      } catch (error) {
        console.error("Erro ao buscar contatos:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchContacts();
  }, []);
  
  // Função para buscar mensagens do contato selecionado
  useEffect(() => {
    async function fetchMessages() {
      if (!selectedContact) return;
      
      try {
        const messagesEndpoint = typeof window !== 'undefined' 
          ? `${window.location.origin}/api/evolution/messages?limit=100`
          : 'http://localhost:3000/api/evolution/messages?limit=100';
          
        const response = await fetch(messagesEndpoint);
        
        if (!response.ok) {
          throw new Error("Falha ao buscar mensagens");
        }
        
        const data = await response.json();
        
        // Processando as mensagens
        let messagesList: Message[] = [];
        
        if (data.data && data.data.messages && data.data.messages.records) {
          messagesList = data.data.messages.records
            .filter((msg: any) => {
              const msgJid = msg.key?.remoteJid || msg.remote_jid;
              return msgJid === selectedContact.remoteJid;
            })
            .map((msg: any) => ({
              id: msg.id || msg.key?.id,
              remoteJid: msg.key?.remoteJid || msg.remote_jid,
              message: extractMessageContent(msg),
              fromMe: msg.key?.fromMe || msg.from_me,
              messageTimestamp: msg.messageTimestamp || msg.message_timestamp,
              pushName: msg.pushName
            }));
        } else if (data.data && Array.isArray(data.data)) {
          messagesList = data.data
            .filter((msg: any) => {
              const msgJid = msg.key?.remoteJid || msg.remote_jid;
              return msgJid === selectedContact.remoteJid;
            })
            .map((msg: any) => ({
              id: msg.id || msg.key?.id,
              remoteJid: msg.key?.remoteJid || msg.remote_jid,
              message: extractMessageContent(msg),
              fromMe: msg.key?.fromMe || msg.from_me,
              messageTimestamp: msg.messageTimestamp || msg.message_timestamp,
              pushName: msg.pushName
            }));
        }
        
        // Ordenando mensagens por timestamp
        messagesList.sort((a, b) => a.messageTimestamp - b.messageTimestamp);
        
        setMessages(messagesList);
        
        // Rolar para a última mensagem
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        
      } catch (error) {
        console.error("Erro ao buscar mensagens:", error);
      }
    }
    
    fetchMessages();
  }, [selectedContact]);
  
  // Função para extrair o conteúdo da mensagem
  function extractMessageContent(message: any): string {
    if (!message) return "";
    
    // Se a mensagem já estiver formatada como string
    if (typeof message.message === "string") return message.message;
    
    // Se a mensagem estiver no formato padrão do WhatsApp
    if (message.message) {
      // Texto simples
      if (message.message.conversation) return message.message.conversation;
      
      // Mensagem extendida
      if (message.message.extendedTextMessage?.text) return message.message.extendedTextMessage.text;
      
      // Legenda de imagem ou vídeo
      if (message.message.imageMessage?.caption) return `[Imagem] ${message.message.imageMessage.caption}`;
      if (message.message.videoMessage?.caption) return `[Vídeo] ${message.message.videoMessage.caption}`;
      
      // Outros tipos de mensagem
      if (message.message.audioMessage) return "[Áudio]";
      if (message.message.documentMessage) return "[Documento]";
      if (message.message.stickerMessage) return "[Sticker]";
      if (message.message.contactMessage) return "[Contato]";
      if (message.message.locationMessage) return "[Localização]";
    }
    
    return "[Mensagem]";
  }
  
  // Função para formatar número de telefone
  function formatPhoneNumber(jid: string): string {
    if (!jid) return "Desconhecido";
    return jid.split("@")[0] || "Desconhecido";
  }
  
  // Função para formatar data
  function formatTimestamp(timestamp: number): string {
    if (!timestamp) return "";
    
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Hoje - mostrar apenas hora
      return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } else if (diffDays === 1) {
      // Ontem
      return "Ontem";
    } else if (diffDays < 7) {
      // Dia da semana
      return date.toLocaleDateString([], {weekday: 'long'}).split('-')[0];
    } else {
      // Data completa para mensagens mais antigas
      return date.toLocaleDateString();
    }
  }
  
  // Filtrar contatos por pesquisa
  const filteredContacts = contacts.filter(contact => {
    const name = contact.pushName?.toLowerCase() || '';
    const phone = formatPhoneNumber(contact.remoteJid).toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return name.includes(query) || phone.includes(query);
  });
  
  return (
    <div className="flex h-full overflow-hidden bg-black">
      {/* Lista de contatos */}
      <div className="w-[330px] border-r border-zinc-800 bg-zinc-900 flex flex-col">
        <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between">
          <h3 className="font-medium text-lg text-white">Conversas</h3>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-800 text-zinc-300">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-3 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Pesquisar contatos..."
              className="w-full bg-zinc-800 py-2.5 pl-10 pr-4 rounded-full text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <ScrollArea className="flex-1">
            {filteredContacts.length > 0 ? (
              <div>
                {filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    className={cn(
                      "w-full text-left p-3 hover:bg-zinc-800 flex items-start gap-3 transition-colors border-b border-zinc-800/50",
                      selectedContact?.id === contact.id && "bg-zinc-800/80"
                    )}
                    onClick={() => setSelectedContact(contact)}
                  >
                    <Avatar className="flex-shrink-0 h-12 w-12 ring-1 ring-zinc-700 bg-zinc-800">
                      {contact.profilePicUrl ? (
                        <AvatarImage src={contact.profilePicUrl} alt={contact.pushName} />
                      ) : (
                        <AvatarFallback className="text-lg bg-zinc-800 text-emerald-500">
                          {contact.pushName?.charAt(0) || formatPhoneNumber(contact.remoteJid).charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="font-medium truncate text-zinc-200">
                          {contact.pushName || formatPhoneNumber(contact.remoteJid)}
                        </p>
                        {contact.lastMessageTimestamp && (
                          <span className="text-xs text-zinc-500">
                            {formatTimestamp(contact.lastMessageTimestamp)}
                          </span>
                        )}
                      </div>
                      {contact.lastMessage && (
                        <p className="text-sm text-zinc-400 truncate mt-0.5">
                          {contact.lastMessage}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-500">
                {searchQuery ? "Nenhum contato encontrado" : "Nenhum contato disponível"}
              </div>
            )}
          </ScrollArea>
        )}
      </div>
      
      {/* Área de conversa */}
      <div className="flex-1 flex flex-col bg-zinc-900">
        {selectedContact ? (
          <>
            {/* Cabeçalho do chat */}
            <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-900">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-1 ring-zinc-700 bg-zinc-800">
                  {selectedContact.profilePicUrl ? (
                    <AvatarImage src={selectedContact.profilePicUrl} alt={selectedContact.pushName} />
                  ) : (
                    <AvatarFallback className="bg-zinc-800 text-emerald-500">
                      {selectedContact.pushName?.charAt(0) || formatPhoneNumber(selectedContact.remoteJid).charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h2 className="font-medium text-white">
                    {selectedContact.pushName || formatPhoneNumber(selectedContact.remoteJid)}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {formatPhoneNumber(selectedContact.remoteJid)}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-800 text-zinc-300">
                  <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-800 text-zinc-300">
                  <Video className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-800 text-zinc-300">
                  <Info className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-800 text-zinc-300">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Mensagens */}
            <ScrollArea 
              className="flex-1 p-4 bg-[#0a0a0a]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.8 6.485 48.384 7.9l-7.9-7.9h2.83zM16.686 0L10.2 6.485 11.616 7.9l7.9-7.9h-2.83zm20.97 0l9.315 9.314-1.414 1.414L34.828 0h2.83zM22.344 0L13.03 9.314l1.414 1.414L25.172 0h-2.83zM32 0l12.142 12.142-1.414 1.414L30 .828 17.272 13.556l-1.414-1.414L28 0h4zM.284 0l28 28-1.414 1.414L0 2.544v2.83L25.456 28l-1.414 1.414L0 5.373v2.83L22.627 28l-1.414 1.414L0 8.202v2.83L19.8 28l-1.414 1.414L0 11.03v2.83L16.97 28l-1.414 1.414L0 13.858v2.83L14.142 28l-1.414 1.414L0 16.686v2.83L11.314 28l-1.414 1.414L0 19.515v2.83L8.485 28 7.07 29.414 0 22.344v2.83L5.657 28l-1.414 1.414L0 25.172v2.83L2.828 28 1.414 29.414 0 28v2h2l-1.414 1.414L0 28.829zM54.627 60l.83-.828-1.415-1.415L51.8 60h2.827zM5.373 60l-.83-.828L5.96 57.757 8.2 60H5.374zM48.97 60l3.657-3.657-1.414-1.414L46.143 60h2.828zM11.03 60L7.372 56.343 8.787 54.93 13.857 60H11.03zm32.284 0L49.8 53.515l-1.415-1.414-7.9 7.9h2.83zM16.686 60L10.2 53.515l1.415-1.414 7.9 7.9h-2.83zm20.97 0l9.315-9.314-1.414-1.414L34.828 60h2.83zM22.344 60L13.03 50.686l1.414-1.414L25.172 60h-2.83zM32 60l12.142-12.142-1.414-1.414L30 59.172 17.272 46.444l-1.414 1.414L28 60h4zM.284 60l28-28-1.414-1.414L0 57.456v-2.83L25.456 32l-1.414-1.414L0 54.627v-2.83L22.627 32l-1.414-1.414L0 51.798v-2.83L19.8 32l-1.414-1.414L0 48.97v-2.83L16.97 32l-1.414-1.414L0 46.142v-2.83L14.142 32l-1.414-1.414L0 43.314v-2.83L11.314 32l-1.414-1.414L0 40.485v-2.83L8.485 32 7.07 30.586 0 37.656v-2.83L5.657 32l-1.414-1.414L0 34.828v-2.83L2.828 32 1.414 30.586 0 32v-2h2L.586 28.586 0 31.172v-2.83L2.828 28 1.414 26.586 0 28.828v-2.83L5.657 28 4.242 26.586 0 22.343v-2.83L8.485 28l-1.414-1.414L0 19.514v-2.83L11.314 28 9.9 26.586 0 16.685v-2.83L14.142 28l-1.414-1.414L0 13.857v-2.83L16.97 28l-1.414-1.414L0 11.029v-2.83L19.8 28l-1.414-1.414L0 8.201v-2.83L22.627 28l-1.414-1.414L0 5.372V2.543L26.544 28l-1.414 1.414L0 2.544v-2.83L28 28l-1.414 1.414L0 .1 1.414 0h2.83L0 5.657V2.828L8.2 0h2.83L0 13.856v-2.83L13.858 0h2.83L0 19.8v-2.83L19.8 0h2.83L0 25.456v-2.83L28 0h4L0 32.142v-2.83L34.828 0h2.83L0 40.97v-2.83L43.8 0h2.83L0 49.8v-2.83L52.628 0h2.83L0 60h60z' fill='%23333333' fill-opacity='0.08' fill-rule='evenodd'/%3E%3C/svg%3E")`
              }}
            >
              {messages.length > 0 ? (
                <div className="space-y-2 pb-2">
                  {messages.map((message, index) => {
                    // Agrupar mensagens do mesmo remetente que são próximas
                    const prevMessage = index > 0 ? messages[index - 1] : null;
                    const isSameGroup = prevMessage && 
                      prevMessage.fromMe === message.fromMe && 
                      (message.messageTimestamp - prevMessage.messageTimestamp) < 300; // 5 minutos
                    
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.fromMe ? "justify-end" : "justify-start",
                          isSameGroup ? "mt-1" : "mt-4"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl py-2 px-4 shadow-md",
                            message.fromMe
                              ? "bg-emerald-600 text-white rounded-br-none"
                              : "bg-zinc-800 text-zinc-100 rounded-bl-none"
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.message}</p>
                          <div className="text-right mt-1 flex justify-end items-center gap-1">
                            <span className={cn(
                              "text-xs",
                              message.fromMe ? "text-emerald-100/70" : "text-zinc-400"
                            )}>
                              {formatTimestamp(message.messageTimestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                  <div className="p-8 bg-zinc-900/90 backdrop-blur-sm rounded-xl shadow-xl border border-zinc-800">
                    <p className="text-center mb-4">Sem mensagens para exibir</p>
                    <Badge variant="outline" className="mx-auto bg-transparent border-zinc-700 text-zinc-400">Histórico vazio</Badge>
                  </div>
                </div>
              )}
            </ScrollArea>
            
            {/* Input falso - apenas para mostrar o layout completo */}
            <div className="flex items-center p-3 gap-2 bg-zinc-900 border-t border-zinc-800">
              <div className="flex-1 bg-zinc-800 text-zinc-400 rounded-full p-3 text-sm pl-4">
                Visualização de mensagens (somente leitura)
              </div>
              <Button size="icon" className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white">
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 bg-zinc-900">
            <div className="p-8 bg-zinc-900/90 backdrop-blur-sm rounded-xl shadow-xl border border-zinc-800 max-w-md text-center">
              <h3 className="text-xl font-medium mb-3 text-zinc-300">Bem-vindo às mensagens</h3>
              <p className="mb-4 text-zinc-400">Selecione um contato para ver a conversa</p>
              <Badge variant="outline" className="mx-auto bg-transparent border-zinc-700 text-zinc-400">Escolha um contato</Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 