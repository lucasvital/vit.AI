"use client"

import { useEffect, useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Send, Download, Clock, Phone, Check, X, User } from "lucide-react"
import { Loader2 } from "lucide-react"

interface Activity {
  id: string;
  type: 'message' | 'login' | 'call' | 'status';
  action: string;
  description: string;
  timestamp: string;
  user: {
    name: string;
    avatar?: string;
    role?: string;
  };
  status?: 'success' | 'failed' | 'pending';
}

interface Contact {
  id: string;
  remoteJid: string;
  pushName: string;
  profilePicUrl: string;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const dataFetched = useRef(false);

  useEffect(() => {
    // Evitar múltiplas chamadas e loops
    if (dataFetched.current) return;
    
    async function fetchData() {
      try {
        setLoading(true);
        dataFetched.current = true;
        
        // Buscar mensagens e contatos em paralelo
        const messagesEndpoint = typeof window !== 'undefined' 
          ? `${window.location.origin}/api/evolution/messages?limit=10`
          : `http://localhost:3000/api/evolution/messages?limit=10`;
          
        const contactsEndpoint = typeof window !== 'undefined' 
          ? `${window.location.origin}/api/evolution/contacts`
          : `http://localhost:3000/api/evolution/contacts`;
          
        const [messagesResponse, contactsResponse] = await Promise.all([
          fetch(messagesEndpoint),
          fetch(contactsEndpoint)
        ]);

        if (!messagesResponse.ok) {
          const errorData = await messagesResponse.json();
          throw new Error(errorData.error || "Falha ao buscar atividades recentes");
        }

        // Processar resposta de contatos
        let contactsList: Contact[] = [];
        if (!contactsResponse.ok) {
          console.warn("Falha ao buscar contatos, usando avatares gerados");
        } else {
          const contactsData = await contactsResponse.json();
          if (contactsData.success && contactsData.data) {
            contactsList = contactsData.data;
            setContacts(contactsList);
          }
        }

        const messagesData = await messagesResponse.json();
        
        if (messagesData.success && messagesData.data && messagesData.data.messages && messagesData.data.messages.records) {
          const messages = messagesData.data.messages.records;
          const activityEntries = generateActivitiesFromMessages(messages, contactsList);
          setActivities(activityEntries);
        } else {
          setActivities([]);
        }
      } catch (error) {
        console.error("Erro ao carregar atividades recentes:", error);
        setError(error instanceof Error ? error.message : "Erro desconhecido");
        setActivities([]);
      } finally {
        setLoading(false);
      }
    }

    // Gerar avatar baseado no número do telefone (fallback)
    function generateAvatarUrl(phoneNumber: string) {
      // Extrair os últimos 4 dígitos do número para tornar o avatar único
      const lastDigits = phoneNumber.replace(/\D/g, '').slice(-4);
      // Gerar um avatar usando uma API pública de avatares
      return `https://api.dicebear.com/7.x/micah/svg?seed=${lastDigits}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    }

    // Encontrar a foto do perfil do contato
    function findContactProfilePic(remoteJid: string, contactsList: Contact[]): string | undefined {
      const contact = contactsList.find(c => c.remoteJid === remoteJid);
      return contact?.profilePicUrl;
    }

    // Processar mensagens e transformá-las em atividades
    function generateActivitiesFromMessages(messages: any[], contactsList: Contact[]) {
      return messages.slice(0, 6).map((msg) => {
        const isFromMe = msg.key?.fromMe || msg.from_me;
        const timestamp = new Date(msg.messageTimestamp * 1000);
        const timeStr = timestamp.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        // Extrair nome do contato ou número
        let contactName = "Desconhecido";
        let remoteJid = "";
        
        if (msg.key?.remoteJid) {
          remoteJid = msg.key.remoteJid;
          contactName = msg.pushName || msg.key.remoteJid.split('@')[0];
        } else if (msg.remote_jid) {
          remoteJid = msg.remote_jid;
          contactName = msg.pushName || msg.remote_jid.split('@')[0];
        }
        
        // Obter foto de perfil do contato
        const profilePic = findContactProfilePic(remoteJid, contactsList);
        
        // Resumir o conteúdo da mensagem
        let messageContent = "Mensagem de texto";
        if (msg.message?.conversation) {
          messageContent = msg.message.conversation.substring(0, 30) + (msg.message.conversation.length > 30 ? "..." : "");
        } else if (msg.message?.imageMessage) {
          messageContent = "Imagem";
        } else if (msg.message?.videoMessage) {
          messageContent = "Vídeo";
        } else if (msg.message?.audioMessage) {
          messageContent = "Áudio";
        } else if (msg.message?.documentMessage) {
          messageContent = "Documento";
        }
        
        return {
          id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: 'message',
          action: isFromMe ? `Mensagem enviada para ${contactName}` : `Mensagem recebida de ${contactName}`,
          description: messageContent,
          timestamp: timeStr,
          user: {
            name: isFromMe ? "Atendente" : contactName,
            role: isFromMe ? "Operador" : "Cliente",
            avatar: isFromMe ? "https://ui-avatars.com/api/?name=Atendente&background=6366f1&color=fff" : (profilePic || generateAvatarUrl(contactName))
          },
          status: 'success'
        } as Activity;
      });
    }

    fetchData();
    
    // Limpar referência quando o componente for desmontado
    return () => {
      dataFetched.current = false;
    };
  }, []); // Remover contacts da dependência para evitar o loop

  const getActivityIcon = (activity: Activity) => {
    switch (activity.type) {
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'login':
        return <User className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'status':
        return activity.status === 'success' ? <Check className="h-4 w-4" /> : 
               activity.status === 'failed' ? <X className="h-4 w-4" /> : 
               <Clock className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'Operador':
        return 'default';
      case 'Cliente':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade Recente</CardTitle>
        <CardDescription>Últimas ações da sua equipe e clientes</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-destructive">{error}</p>
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-5">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                  <AvatarFallback className={activity.user.role === "Operador" ? "bg-primary text-primary-foreground" : "bg-muted"}>
                    {activity.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium leading-none">{activity.user.name}</p>
                    <Badge variant={getRoleBadgeVariant(activity.user.role || '')} className="text-xs">
                      {activity.user.role}
                    </Badge>
                  </div>
                  <div className="flex items-start gap-1">
                    <div className="mt-0.5">{getActivityIcon(activity)}</div>
                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                  </div>
                  <p className="text-xs text-muted-foreground italic">{activity.description}</p>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">{activity.timestamp}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground">Nenhuma atividade recente</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
