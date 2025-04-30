"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Interfaces
interface Contact {
  id: string;
  remoteJid: string;
  pushName?: string;
  lastMessageTimestamp?: number;
  messageCount?: number;
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
  fromClient?: boolean;
}

interface ChatGroup {
  contact: Contact;
  messages: Message[];
}

export function ChatInterface() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const messagesPerPage = 20;
  const [contactsData, setContactsData] = useState<{[key: string]: any}>({});

  // Buscar dados da API de contatos
  useEffect(() => {
    async function fetchContactsData() {
      try {
        const contactsEndpoint = typeof window !== 'undefined' 
          ? `${window.location.origin}/api/evolution/contacts`
          : 'http://localhost:3000/api/evolution/contacts';
          
        const response = await fetch(contactsEndpoint);
        
        if (!response.ok) {
          console.error("Falha ao buscar dados dos contatos");
          return;
        }
        
        const data = await response.json();
        
        // Criar mapa de contatos pelo remoteJid para acesso rápido
        const contactsMap: {[key: string]: any} = {};
        if (data.data && Array.isArray(data.data)) {
          data.data.forEach((contact: any) => {
            if (contact.remoteJid) {
              contactsMap[contact.remoteJid] = contact;
            }
          });
        }
        
        setContactsData(contactsMap);
      } catch (error) {
        console.error("Erro ao buscar dados dos contatos:", error);
      }
    }
    
    fetchContactsData();
  }, []);

  // Buscar mensagens do servidor
  useEffect(() => {
    async function fetchMessages() {
      try {
        setLoading(true);
        
        // URL absoluta
        const messagesEndpoint = typeof window !== 'undefined' 
          ? `${window.location.origin}/api/evolution/messages?limit=100`
          : 'http://localhost:3000/api/evolution/messages?limit=100';
          
        const response = await fetch(messagesEndpoint);
        
        if (!response.ok) {
          throw new Error("Falha ao buscar mensagens");
        }
        
        const data = await response.json();

        // Depuração para verificar o formato dos dados da API
        console.log("Dados recebidos da API:", data);
        
        // Verificar formato específico de um item para debug
        if (data.data && data.data.messages && data.data.messages.records && data.data.messages.records.length > 0) {
          const sampleMessage = data.data.messages.records[0];
          console.log("Amostra de mensagem recebida:", sampleMessage);
          console.log("Timestamp da amostra:", sampleMessage.messageTimestamp);
          console.log("Data formatada:", new Date(sampleMessage.messageTimestamp * 1000).toLocaleString());
        }
        
        // Processar mensagens dependendo do formato da resposta
        let messagesList: Message[] = [];
        
        if (data.data && data.data.messages && data.data.messages.records) {
          console.log("Processando mensagens do formato 1");
          // Mostrar timestamps originais antes do processamento
          data.data.messages.records.forEach((msg: any, i: number) => {
            console.log(`Original msg ${i}: timestamp=${msg.messageTimestamp}, fromMe=${msg.key?.fromMe}, data=${new Date(msg.messageTimestamp * 1000).toLocaleString()}`);
          });
          
          // Processar mensagens
          messagesList = data.data.messages.records.map((msg: any) => {
            const isFromClient = !msg.key?.fromMe && !msg.from_me;
            // Adicionar flag para identificar mensagens do cliente
            return { ...msg, fromClient: isFromClient };
          }).map(formatMessage);
        } else if (data.data && Array.isArray(data.data)) {
          console.log("Processando mensagens do formato 2");
          data.data.forEach((msg: any, i: number) => {
            console.log(`Original msg ${i}: timestamp=${msg.messageTimestamp}, fromMe=${msg.key?.fromMe}, data=${new Date(msg.messageTimestamp * 1000).toLocaleString()}`);
          });
          
          messagesList = data.data.map((msg: any) => {
            const isFromClient = !msg.key?.fromMe && !msg.from_me;
            return { ...msg, fromClient: isFromClient };
          }).map(formatMessage);
        } else if (Array.isArray(data)) {
          console.log("Processando mensagens do formato 3");
          data.forEach((msg: any, i: number) => {
            console.log(`Original msg ${i}: timestamp=${msg.messageTimestamp}, fromMe=${msg.key?.fromMe}, data=${new Date(msg.messageTimestamp * 1000).toLocaleString()}`);
          });
          
          messagesList = data.map((msg: any) => {
            const isFromClient = !msg.key?.fromMe && !msg.from_me;
            return { ...msg, fromClient: isFromClient };
          }).map(formatMessage);
        }

        // Log de depuração para verificar timestamps
        console.log("Mensagens processadas com timestamps:", 
          messagesList.map(m => ({
            msg: m.message.substring(0, 20) + (m.message.length > 20 ? "..." : ""),
            fromMe: m.fromMe,
            timestamp: m.messageTimestamp,
            date: new Date(m.messageTimestamp).toLocaleString()
          }))
        );
        
        // Garantir que os timestamps estejam em formato consistente e ordenados corretamente
        messagesList.sort((a, b) => a.messageTimestamp - b.messageTimestamp);
        
        // Log após ordenação
        console.log("Mensagens ordenadas por timestamp:");
        messagesList.forEach((msg, i) => {
          console.log(`${i+1}. [${new Date(msg.messageTimestamp).toLocaleString()}] ${msg.fromMe ? "Você" : "Contato"}: ${msg.message.substring(0, 30)}`);
        });
        
        setMessages(messagesList);
        
        // Agrupar mensagens por contato
        const groups = groupMessagesByContact(messagesList);
        
        // Enriquecer grupos com dados de contatos da API
        const enrichedGroups = groups.map(group => {
          const contactInfo = contactsData[group.contact.remoteJid];
          if (contactInfo) {
            group.contact.pushName = contactInfo.pushName || group.contact.pushName;
            group.contact.profilePicUrl = contactInfo.profilePicUrl;
          }
          return group;
        });
        
        setChatGroups(enrichedGroups);
        
        // Selecionar o primeiro contato automaticamente se houver algum
        if (enrichedGroups.length > 0 && !selectedContact) {
          setSelectedContact(enrichedGroups[0].contact);
        }
        
        // Extrair lista de contatos
        setContacts(enrichedGroups.map(g => g.contact));
      } catch (error) {
        console.error("Erro ao buscar mensagens:", error);
        setError("Não foi possível carregar as mensagens");
      } finally {
        setLoading(false);
      }
    }
    
    fetchMessages();
  }, [contactsData]);

  // Carregar mais mensagens ao rolar
  const loadMoreMessages = async () => {
    if (loadingMoreMessages || !selectedContact || !hasMoreMessages) return;

    try {
      setLoadingMoreMessages(true);
      const nextPage = page + 1;
      
      // Salvar a altura do scroll atual e o número de mensagens
      const scrollContainer = document.querySelector('.scroll-area-viewport');
      const previousScrollHeight = scrollContainer?.scrollHeight || 0;
      const previousMessagesCount = sortedMessages.length;
      
      // Simular carregamento de mais mensagens
      // Em uma implementação real, você faria uma chamada à API com o nextPage
      
      // Exemplo simulado:
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Verificar se há mais mensagens para este contato
      // Esta é uma simulação - em uma implementação real, a API informaria se há mais mensagens
      const remainingMessages = sortedMessages.length;
      
      if (remainingMessages < messagesPerPage) {
        setHasMoreMessages(false);
      } else {
        setPage(nextPage);
        
        // Em uma implementação real, aqui você adicionaria as novas mensagens carregadas
        // Por exemplo:
        // const newMessages = [...dadosDaApi];
        // setChatGroups(atualizarGruposComNovasMensagens);
      }
      
      // Restaurar a posição do scroll após o DOM ser atualizado
      setTimeout(() => {
        if (scrollContainer) {
          const newScrollHeight = scrollContainer.scrollHeight;
          const additionalHeight = newScrollHeight - previousScrollHeight;
          
          if (additionalHeight > 0) {
            scrollContainer.scrollTop = additionalHeight;
          }
        }
      }, 100);
      
    } catch (error) {
      console.error("Erro ao carregar mais mensagens:", error);
    } finally {
      setLoadingMoreMessages(false);
    }
  };

  // Handle de rolagem para carregar mais mensagens
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const scrollTop = target.scrollTop;
    
    // Se o usuário rolar para próximo do topo, carrega mais mensagens (mensagens mais antigas)
    if (scrollTop < 50 && !loadingMoreMessages && hasMoreMessages) {
      loadMoreMessages();
    }
  };

  // Função para formatar uma mensagem da API no formato padronizado
  function formatMessage(message: any): Message {
    // Extrair timestamp das diferentes fontes possíveis
    let timestamp = message.messageTimestamp;
    
    // Verificar se existe timestamp em deviceListMetadata
    if (message.message?.messageContextInfo?.deviceListMetadata?.senderTimestamp) {
      timestamp = parseInt(message.message.messageContextInfo.deviceListMetadata.senderTimestamp);
    }
    
    // Verificar outros possíveis campos de timestamp
    if (!timestamp && message.key?.messageTimestamp) {
      timestamp = message.key.messageTimestamp;
    }
    
    // Fazer fallback para outros campos de timestamp
    if (!timestamp) {
      timestamp = message.message_timestamp || message.timestamp || Date.now();
    }
    
    // Converter para número se for string
    if (typeof timestamp === 'string') {
      timestamp = parseInt(timestamp);
    }
    
    // Verificar se é cliente ou atendente
    const fromMe = message.key?.fromMe || message.from_me || false;
    
    // Processar diferentes formatos de timestamp
    // Verificar se o timestamp está em segundos (10 dígitos)
    // O formato UNIX geralmente tem 10 dígitos e representa segundos desde 1970
    if (timestamp > 1000000000 && timestamp < 10000000000) {
      timestamp = timestamp * 1000; // Converter de segundos para ms
    }
    
    const formattedMessage: Message = {
      id: message.id || `msg-${Math.random().toString(36).substr(2, 9)}`,
      remoteJid: message.key?.remoteJid || message.remote_jid || "unknown",
      message: extractMessageContent(message),
      fromMe: fromMe,
      messageTimestamp: timestamp,
      pushName: message.pushName || "",
      fromClient: message.fromClient || false
    };
    
    return formattedMessage;
  }

  // Extrair conteúdo da mensagem
  function extractMessageContent(message: any): string {
    if (message.message?.conversation) {
      return message.message.conversation;
    }
    if (message.message?.extendedTextMessage?.text) {
      return message.message.extendedTextMessage.text;
    }
    if (typeof message.message === "string") {
      return message.message;
    }
    
    // Identificar tipos de mídia
    if (message.messageType === "imageMessage" || message.message?.imageMessage) {
      return "[Imagem]";
    }
    if (message.messageType === "videoMessage" || message.message?.videoMessage) {
      return "[Vídeo]";
    }
    if (message.messageType === "audioMessage" || message.message?.audioMessage) {
      return "[Áudio]";
    }
    if (message.messageType === "documentMessage" || message.message?.documentMessage) {
      return "[Documento]";
    }
    
    return "[Mensagem]";
  }

  // Agrupar mensagens por contato
  function groupMessagesByContact(messages: Message[]): ChatGroup[] {
    // Primeiro, garantir que as mensagens estão ordenadas por timestamp
    const sortedMessages = [...messages].sort((a, b) => a.messageTimestamp - b.messageTimestamp);
    console.log("Agrupando mensagens já ordenadas por timestamp");
    
    const groupsMap = new Map<string, ChatGroup>();
    
    sortedMessages.forEach(message => {
      const jid = message.remoteJid;
      
      if (!jid) return;
      
      if (!groupsMap.has(jid)) {
        // Buscar informações de contato da API
        const contactInfo = contactsData[jid];
        
        // Criar novo grupo se não existir
        groupsMap.set(jid, {
          contact: {
            id: `contact-${Math.random().toString(36).substr(2, 9)}`,
            remoteJid: jid,
            pushName: message.pushName || (contactInfo?.pushName) || formatPhoneNumber(jid),
            lastMessageTimestamp: message.messageTimestamp,
            messageCount: 1,
            lastMessage: message.message,
            profilePicUrl: contactInfo?.profilePicUrl || undefined
          },
          messages: [message]
        });
      } else {
        // Adicionar mensagem ao grupo existente
        const group = groupsMap.get(jid)!;
        group.messages.push(message);
        
        // Atualizar informações do contato
        if (message.messageTimestamp > (group.contact.lastMessageTimestamp || 0)) {
          group.contact.lastMessageTimestamp = message.messageTimestamp;
          group.contact.lastMessage = message.message;
        }
        group.contact.messageCount = group.messages.length;
      }
    });
    
    // Verificar a ordenação das mensagens em cada grupo
    groupsMap.forEach((group, jid) => {
      console.log(`Verificando ordenação do grupo ${jid} (${group.contact.pushName || formatPhoneNumber(jid)})`);
      group.messages.forEach((msg, i) => {
        console.log(`  ${i+1}. [${new Date(msg.messageTimestamp).toLocaleString()}] ${msg.fromMe ? "Você" : "Contato"}: ${msg.message.substring(0, 30)}`);
      });
    });
    
    // Converter mapa em array e ordenar por timestamp da última mensagem (mais recente primeiro)
    return Array.from(groupsMap.values())
      .sort((a, b) => (b.contact.lastMessageTimestamp || 0) - (a.contact.lastMessageTimestamp || 0));
  }

  // Filtrar contatos com base na pesquisa
  const filteredContacts = searchQuery.trim() === "" 
    ? contacts 
    : contacts.filter(contact => 
        contact.pushName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        formatPhoneNumber(contact.remoteJid).includes(searchQuery.toLowerCase())
      );

  // Formatar número de telefone a partir do JID
  function formatPhoneNumber(jid: string): string {
    if (!jid) return "Desconhecido";
    const parts = jid.split("@");
    return parts[0] || jid;
  }

  // Formatar como DD/MM, HH:MM (igual à Atividade Recente)
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
  };

  // Formatar data
  function formatDate(timestamp: number): string {
    if (!timestamp) return "";
    
    try {
      // Para timestamps em segundos (10 dígitos - formato UNIX)
      let timestampMs = timestamp;
      if (timestamp > 1000000000 && timestamp < 10000000000) {
        timestampMs = timestamp * 1000; // Converter para milissegundos
      }
      
      const date = new Date(timestampMs);
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        console.error("Timestamp inválido ao formatar data:", timestamp);
        return "";
      }
      
      // Formatar como DD/MM (igual à Atividade Recente)
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${day}/${month}`;
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "";
    }
  }

  // Buscar dados simulados da API para testar a ordenação correta
  const simulateMessages = (selectedContact: Contact): Message[] => {
    if (!selectedContact) return [];
    
    // Se já temos mensagens reais para este contato, use-as
    const existingGroup = chatGroups.find(g => g.contact.remoteJid === selectedContact.remoteJid);
    if (existingGroup && existingGroup.messages.length > 0) {
      return existingGroup.messages;
    }
    
    // Caso contrário, crie algumas mensagens simuladas para teste
    // Usar timestamps UNIX em segundos, similares aos que vêm da API
    const now = Math.floor(Date.now() / 1000); // Tempo atual em segundos
    const fiveMinutesInSeconds = 5 * 60;
    
    // Criar uma conversa simulada com alternância de remetentes na ordem correta
    return [
      {
        id: "test-1",
        remoteJid: selectedContact.remoteJid,
        message: "e ai guri",
        fromMe: false,
        messageTimestamp: now - (fiveMinutesInSeconds * 5) // Cliente: agora - 5 minutos
      },
      {
        id: "test-2",
        remoteJid: selectedContact.remoteJid,
        message: "Bom dia! É um prazer recebê-lo na SmartImob. Espero que esteja a ter um excelente início de dia.",
        fromMe: true,
        messageTimestamp: now - (fiveMinutesInSeconds * 4) // Atendente: agora - 4 minutos
      },
      {
        id: "test-3",
        remoteJid: selectedContact.remoteJid,
        message: "Antes de continuarmos, posso saber o seu nome? Gosto de saber com quem estou a falar 😊.",
        fromMe: true,
        messageTimestamp: now - (fiveMinutesInSeconds * 4) + 5 // Continuação da mesma mensagem
      },
      {
        id: "test-4",
        remoteJid: selectedContact.remoteJid,
        message: "Lucas Vital",
        fromMe: false,
        messageTimestamp: now - (fiveMinutesInSeconds * 3) // Cliente: agora - 3 minutos
      },
      {
        id: "test-5",
        remoteJid: selectedContact.remoteJid,
        message: "Muito prazer, Lucas Vital! 😊",
        fromMe: true,
        messageTimestamp: now - (fiveMinutesInSeconds * 2) // Atendente: agora - 2 minutos
      },
      {
        id: "test-6",
        remoteJid: selectedContact.remoteJid,
        message: "Diga-me, procura uma casa, apartamento, terreno ou outro tipo de imóvel?",
        fromMe: true,
        messageTimestamp: now - (fiveMinutesInSeconds * 2) + 5 // Continuação da mesma mensagem
      }
    ];
  };

  // Encontrar mensagens do contato selecionado
  const selectedMessages = selectedContact 
    ? chatGroups.find(group => group.contact.remoteJid === selectedContact.remoteJid)?.messages || 
      // Se não há mensagens reais, use mensagens simuladas para teste
      (messages.length === 0 ? simulateMessages(selectedContact) : [])
    : [];

  // Ordenar mensagens do mais antigo para o mais recente por timestamp
  const sortedMessages = [...selectedMessages].sort((a, b) => a.messageTimestamp - b.messageTimestamp);

  // Referência para o contêiner de mensagens
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Rolar para o final quando as mensagens mudam ou um novo contato é selecionado
  useEffect(() => {
    // Verificar se há mensagens antes de rolar
    if (selectedContact && sortedMessages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [selectedContact, sortedMessages.length]);

  // Função para testar se as mensagens estão sendo corrertamente ordenadas
  useEffect(() => {
    if (selectedContact && sortedMessages.length > 0) {
      console.log("Mensagens ordenadas para", selectedContact.pushName || selectedContact.remoteJid);
      sortedMessages.forEach((msg, i) => {
        logTimestamp(msg, i);
      });
    }
  }, [selectedContact, sortedMessages.length]);

  // Lidar com o envio de nova mensagem
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedContact) return;
    
    // Criar mensagem com timestamp atual
    const currentTime = Date.now();
    const newMsg: Message = {
      id: `msg-${currentTime}`,
      remoteJid: selectedContact.remoteJid,
      message: newMessage,
      fromMe: true,
      messageTimestamp: currentTime,
      fromClient: false
    };
    
    console.log("Nova mensagem sendo enviada:", {
      message: newMsg.message.substring(0, 30), 
      timestamp: newMsg.messageTimestamp,
      hora: new Date(newMsg.messageTimestamp).toLocaleTimeString()
    });
    
    // Atualizar estado
    setMessages(prev => {
      const updatedMessages = [...prev, newMsg];
      updatedMessages.sort((a, b) => a.messageTimestamp - b.messageTimestamp);
      return updatedMessages;
    });
    
    // Atualizar grupos de chat
    setChatGroups(prev => {
      const updated = [...prev];
      const groupIndex = updated.findIndex(g => g.contact.remoteJid === selectedContact.remoteJid);
      
      if (groupIndex >= 0) {
        console.log("Estado antes de adicionar nova mensagem:", updated[groupIndex].messages.length, "mensagens");
        
        // Adicionar mensagem ao grupo
        updated[groupIndex].messages.push(newMsg);
        // Manter as mensagens ordenadas cronologicamente
        updated[groupIndex].messages.sort((a, b) => a.messageTimestamp - b.messageTimestamp);
        
        console.log("Estado após adicionar nova mensagem:", updated[groupIndex].messages.length, "mensagens");
        
        // Atualizar informações do contato
        updated[groupIndex].contact.lastMessage = newMessage;
        updated[groupIndex].contact.lastMessageTimestamp = newMsg.messageTimestamp;
        updated[groupIndex].contact.messageCount = (updated[groupIndex].contact.messageCount || 0) + 1;
        
        // Log para depuração
        console.log("Mensagens após envio (ordenadas):");
        updated[groupIndex].messages.forEach((msg, i) => {
          logTimestamp(msg, i);
        });
        
        // Reordenar grupos para que o mais recente fique no topo
        updated.sort((a, b) => (b.contact.lastMessageTimestamp || 0) - (a.contact.lastMessageTimestamp || 0));
      }
      
      return updated;
    });
    
    setNewMessage("");

    // Rolar para a última mensagem após o envio
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Simular recebimento de mensagem do cliente
  const handleClientMessage = (messageText: string) => {
    if (!selectedContact) return;
    
    // Criar mensagem do cliente com timestamp atual
    const currentTime = Date.now();
    const clientMsg: Message = {
      id: `client-msg-${currentTime}`,
      remoteJid: selectedContact.remoteJid,
      message: messageText,
      fromMe: false,
      messageTimestamp: currentTime, // Usar hora atual para novas mensagens
      pushName: selectedContact.pushName || "",
      fromClient: true
    };
    
    console.log("Nova mensagem do cliente:", {
      message: clientMsg.message,
      timestamp: clientMsg.messageTimestamp,
      hora: new Date(clientMsg.messageTimestamp).toLocaleTimeString()
    });
    
    // Atualizar estado
    setMessages(prev => {
      const updatedMessages = [...prev, clientMsg];
      updatedMessages.sort((a, b) => a.messageTimestamp - b.messageTimestamp);
      return updatedMessages;
    });
    
    // Atualizar grupos de chat
    setChatGroups(prev => {
      const updated = [...prev];
      const groupIndex = updated.findIndex(g => g.contact.remoteJid === selectedContact.remoteJid);
      
      if (groupIndex >= 0) {
        // Adicionar mensagem ao grupo
        updated[groupIndex].messages.push(clientMsg);
        // Manter as mensagens ordenadas cronologicamente
        updated[groupIndex].messages.sort((a, b) => a.messageTimestamp - b.messageTimestamp);
        
        // Verificar se ordenação está correta
        console.log("Mensagens após adicionar mensagem do cliente:");
        updated[groupIndex].messages.forEach((msg, i) => {
          logTimestamp(msg, i);
        });
        
        // Atualizar informações do contato
        updated[groupIndex].contact.lastMessage = messageText;
        updated[groupIndex].contact.lastMessageTimestamp = clientMsg.messageTimestamp;
        updated[groupIndex].contact.messageCount = (updated[groupIndex].contact.messageCount || 0) + 1;
        
        // Reordenar grupos para que o mais recente fique no topo
        updated.sort((a, b) => (b.contact.lastMessageTimestamp || 0) - (a.contact.lastMessageTimestamp || 0));
      }
      
      return updated;
    });

    // Rolar para a última mensagem após o envio
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Formatar timestamp para exibição (log)
  const logTimestamp = (message: Message, index: number): void => {
    try {
      const date = new Date(message.messageTimestamp);
      console.log(`${index+1}. [${date.toLocaleTimeString()}] ${message.fromMe ? "Você" : "Contato"}: ${message.message.substring(0, 30)}`);
    } catch (error) {
      console.error("Erro ao logar timestamp:", error);
    }
  };

  if (loading) {
    return (
      <Card className="h-[700px]">
        <CardHeader>
          <CardTitle>Mensagens</CardTitle>
          <CardDescription>Carregando conversas...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-[700px]">
        <CardHeader>
          <CardTitle>Mensagens</CardTitle>
          <CardDescription>Erro ao carregar conversas</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full h-full rounded-lg border overflow-hidden bg-background flex">
      {/* Painel de Contatos (Lateral Esquerda) - com altura fixa e rolagem própria */}
      <div className="w-[350px] border-r flex flex-col h-full">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar contatos..."
              className="pl-8 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Lista de contatos com rolagem própria */}
        <ScrollArea className="flex-1">
          <div className="py-2 px-1">
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => {
                const isSelected = selectedContact?.remoteJid === contact.remoteJid;
                const group = chatGroups.find(g => g.contact.remoteJid === contact.remoteJid);
                
                return (
                  <div 
                    key={contact.id}
                    className={`p-3 rounded-md cursor-pointer mb-2 ${
                      isSelected ? "bg-primary/10" : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedContact(contact)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 rounded-full w-11 h-11 flex items-center justify-center overflow-hidden">
                        {contact.profilePicUrl ? (
                          <img 
                            src={contact.profilePicUrl} 
                            alt={contact.pushName || formatPhoneNumber(contact.remoteJid)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="bg-muted w-full h-full flex items-center justify-center">
                            <span className="font-medium text-sm">
                              {(contact.pushName?.[0] || formatPhoneNumber(contact.remoteJid)[0] || "?").toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col">
                          <p className="font-medium truncate text-sm leading-tight mb-0.5">
                            {contact.pushName || formatPhoneNumber(contact.remoteJid)}
                          </p>
                          <div className="flex items-baseline justify-between">
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {group?.messages[group.messages.length - 1]?.fromMe ? "Você: " : ""}
                              {contact.lastMessage}
                            </p>
                            {contact.lastMessageTimestamp && (
                              <span className="text-xs text-muted-foreground ml-1 flex-shrink-0">
                                {formatTimestamp(contact.lastMessageTimestamp)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                Nenhum contato encontrado
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-3 border-t">
          <p className="text-xs text-muted-foreground">
            {contacts.length} contatos, {messages.length} mensagens
          </p>
        </div>
      </div>
      
      {/* Painel de Mensagens - com altura fixa */}
      <div className="flex-1 flex flex-col h-full">
        {selectedContact ? (
          <>
            {/* Cabeçalho do Chat */}
            <div className="p-3 border-b flex items-center gap-3">
              <div className="flex-shrink-0 rounded-full w-9 h-9 flex items-center justify-center overflow-hidden">
                {selectedContact.profilePicUrl ? (
                  <img 
                    src={selectedContact.profilePicUrl} 
                    alt={selectedContact.pushName || formatPhoneNumber(selectedContact.remoteJid)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="bg-muted w-full h-full flex items-center justify-center">
                    <span className="font-medium text-sm">
                      {(selectedContact.pushName?.[0] || formatPhoneNumber(selectedContact.remoteJid)[0] || "?").toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="overflow-hidden">
                <h3 className="font-medium truncate text-sm">
                  {selectedContact.pushName || formatPhoneNumber(selectedContact.remoteJid)}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {formatPhoneNumber(selectedContact.remoteJid)}
                </p>
              </div>
            </div>
            
            {/* Mensagens - Com rolagem própria e fixada na parte inferior */}
            <div className="flex-1 overflow-hidden bg-muted/20">
              <ScrollArea className="h-full">
                <div className="px-4 py-4 flex flex-col min-h-full justify-end">
                  {loadingMoreMessages && (
                    <div className="flex justify-center my-2">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {!hasMoreMessages && sortedMessages.length > messagesPerPage && (
                      <div className="text-center my-1">
                        <Badge variant="outline" className="text-xs">
                          Todas as mensagens carregadas
                        </Badge>
                      </div>
                    )}
                    
                    {sortedMessages.length > 0 ? (
                      sortedMessages.map((message, index) => {
                        // Verifica se deve mostrar a data
                        const showDate = index === 0 || 
                          formatDate(message.messageTimestamp) !== 
                          formatDate(sortedMessages[index - 1].messageTimestamp);
                        
                        // Verificar se esta mensagem representa uma alternância de remetente
                        const prevMessage = index > 0 ? sortedMessages[index - 1] : null;
                        const isNewSender = prevMessage && prevMessage.fromMe !== message.fromMe;
                        
                        // Verificar se a próxima mensagem é do mesmo remetente (para estilo de agrupamento)
                        const nextMessage = index < sortedMessages.length - 1 ? sortedMessages[index + 1] : null;
                        const isLastInGroup = !nextMessage || nextMessage.fromMe !== message.fromMe;
                        
                        // Verificação extra de ordenação: timestamp deveria sempre aumentar
                        if (prevMessage && message.messageTimestamp < prevMessage.messageTimestamp) {
                          console.error("ERRO DE ORDENAÇÃO: Mensagem fora de ordem cronológica!", 
                            { 
                              indice: index,
                              msgAtual: message.message.substring(0, 20),
                              timestampAtual: message.messageTimestamp,
                              dataAtual: new Date(message.messageTimestamp).toLocaleString(),
                              msgAnterior: prevMessage.message.substring(0, 20),
                              timestampAnterior: prevMessage.messageTimestamp,
                              dataAnterior: new Date(prevMessage.messageTimestamp).toLocaleString()
                            }
                          );
                        }
                        
                        return (
                          <div key={message.id} className="mb-1">
                            {showDate && (
                              <div className="text-center my-3">
                                <Badge variant="outline" className="text-xs px-2 py-0.5">
                                  {formatDate(message.messageTimestamp)}
                                </Badge>
                              </div>
                            )}
                            
                            {/* Adicionar espaço maior entre mensagens de remetentes diferentes */}
                            {isNewSender && <div className="h-3"></div>}
                            
                            {/* Mensagem recebida (à esquerda) */}
                            {!message.fromMe && (
                              <div className="flex items-end mb-1 gap-2">
                                {/* Exibir avatar apenas para a primeira mensagem de uma sequência */}
                                {(index === 0 || isNewSender || 
                                  formatDate(message.messageTimestamp) !== formatDate(sortedMessages[index - 1].messageTimestamp)) ? (
                                  <div className="flex-shrink-0 rounded-full w-8 h-8 flex items-center justify-center overflow-hidden">
                                    {selectedContact.profilePicUrl ? (
                                      <img 
                                        src={selectedContact.profilePicUrl} 
                                        alt={selectedContact.pushName || formatPhoneNumber(selectedContact.remoteJid)}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="bg-muted w-full h-full flex items-center justify-center">
                                        <span className="font-medium text-xs">
                                          {(selectedContact.pushName?.[0] || formatPhoneNumber(selectedContact.remoteJid)[0] || "?").toUpperCase()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="w-8 flex-shrink-0"></div> // Espaço reservado para alinhar as mensagens
                                )}
                                
                                <div className={`max-w-[70%] ${
                                  // Estilo para agrupamento visual de mensagens
                                  index > 0 && !isNewSender && !showDate
                                    ? isLastInGroup 
                                      ? "bg-card rounded-lg rounded-tl-sm px-4 py-2 shadow-sm mb-0" 
                                      : "bg-card rounded-lg rounded-tl-sm rounded-br-sm px-4 py-2 shadow-sm mb-[2px]"
                                    : isLastInGroup
                                      ? "bg-card rounded-lg px-4 py-2 shadow-sm mb-0"
                                      : "bg-card rounded-lg rounded-br-sm px-4 py-2 shadow-sm mb-[2px]"
                                }`}>
                                  <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                                  <div className="text-right mt-1">
                                    <span className="text-xs text-muted-foreground">
                                      {formatTimestamp(message.messageTimestamp)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Mensagem enviada (à direita) */}
                            {message.fromMe && (
                              <div className="flex items-end justify-end mb-1">
                                <div className={`max-w-[70%] ${
                                  // Estilo para agrupamento visual de mensagens
                                  index > 0 && !isNewSender && !showDate
                                    ? isLastInGroup 
                                      ? "bg-primary text-primary-foreground rounded-lg rounded-tr-sm px-4 py-2 shadow-sm mb-0" 
                                      : "bg-primary text-primary-foreground rounded-lg rounded-tr-sm rounded-bl-sm px-4 py-2 shadow-sm mb-[2px]"
                                    : isLastInGroup
                                      ? "bg-primary text-primary-foreground rounded-lg px-4 py-2 shadow-sm mb-0"
                                      : "bg-primary text-primary-foreground rounded-lg rounded-bl-sm px-4 py-2 shadow-sm mb-[2px]"
                                }`}>
                                  <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                                  <div className="text-right mt-1">
                                    <span className="text-xs opacity-80">
                                      {formatTimestamp(message.messageTimestamp)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex items-center justify-center py-10">
                        <p className="text-muted-foreground">Nenhuma mensagem encontrada</p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </ScrollArea>
            </div>
            
            {/* Campo de Mensagem */}
            <div className="p-3 border-t flex gap-2">
              <Input 
                placeholder="Digite uma mensagem..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 h-10 rounded-full"
              />
              <Button size="icon" className="h-10 w-10 rounded-full" onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </Button>
              
              {/* Botão de teste - apenas visível em ambiente de desenvolvimento */}
              {process.env.NODE_ENV === 'development' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-2 text-xs"
                  onClick={() => {
                    // Testar com dados simulados
                    if (!selectedContact) return;
                    
                    // Limpar mensagens existentes
                    setChatGroups(prev => {
                      const updated = [...prev];
                      const groupIndex = updated.findIndex(g => g.contact.remoteJid === selectedContact.remoteJid);
                      if (groupIndex >= 0) {
                        updated[groupIndex].messages = [];
                      }
                      return updated;
                    });
                    
                    setMessages([]);
                    
                    // Teste atualizado com timestamps corrigidos
                    console.log("INÍCIO DO TESTE DE CONVERSA");
                    
                    // Mensagem do cliente primeiro
                    setTimeout(() => {
                      console.log("Enviando mensagem do cliente 1");
                      handleClientMessage("e ai guri");
                    }, 500);
                    
                    // Resposta do atendente
                    setTimeout(() => {
                      console.log("Enviando mensagem do atendente 1");
                      setNewMessage("Bom dia! É um prazer recebê-lo na SmartImob. Espero que esteja a ter um excelente início de dia.");
                      handleSendMessage();
                    }, 1500);
                    
                    setTimeout(() => {
                      console.log("Enviando mensagem do atendente 2");
                      setNewMessage("Antes de continuarmos, posso saber o seu nome? Gosto de saber com quem estou a falar 😊.");
                      handleSendMessage();
                    }, 2500);
                    
                    // Outra mensagem do cliente
                    setTimeout(() => {
                      console.log("Enviando mensagem do cliente 2");
                      handleClientMessage("Lucas Vital");
                    }, 3500);
                    
                    // Respostas finais do atendente
                    setTimeout(() => {
                      console.log("Enviando mensagem do atendente 3");
                      setNewMessage("Muito prazer, Lucas Vital! 😊");
                      handleSendMessage();
                    }, 4500);
                    
                    setTimeout(() => {
                      console.log("Enviando mensagem do atendente 4");
                      setNewMessage("Diga-me, procura uma casa, apartamento, terreno ou outro tipo de imóvel?");
                      handleSendMessage();
                    }, 5500);
                    
                    // Verificar o resultado final
                    setTimeout(() => {
                      console.log("RESULTADO FINAL DO TESTE:");
                      selectedContact && sortedMessages.forEach((msg, i) => {
                        logTimestamp(msg, i);
                      });
                    }, 6000);
                  }}
                >
                  Testar Conversa
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-4">
              <p className="text-muted-foreground mb-2">Selecione um contato para ver as mensagens</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 