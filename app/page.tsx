"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Overview } from "@/components/overview"
import { RecentActivity } from "@/components/recent-activity"
import { MessageSquare, Users, Clock, ThumbsUp, ArrowUp, ArrowDown } from "lucide-react"

// Interfaces para os tipos de dados
interface Message {
  id?: string;
  key?: {
    id?: string;
    fromMe?: boolean;
    remoteJid?: string;
  };
  from_me?: boolean;
  remote_jid?: string;
  message?: any;
}

export default function Home() {
  const [metrics, setMetrics] = useState({
    totalChats: 0,
    totalContacts: 0,
    avgMessagesPerChat: 0,
    responseRate: 0,
    loading: true
  })

  useEffect(() => {
    async function fetchData() {
      try {
        // Buscar mensagens
        const messagesEndpoint = `${window.location.origin}/api/evolution/messages?limit=1000`;
        const contactsEndpoint = `${window.location.origin}/api/evolution/contacts`;
        
        const [messagesResponse, contactsResponse] = await Promise.all([
          fetch(messagesEndpoint),
          fetch(contactsEndpoint)
        ]);
        
        if (!messagesResponse.ok || !contactsResponse.ok) {
          throw new Error("Falha ao buscar dados");
        }
        
        const messagesData = await messagesResponse.json();
        const contactsData = await contactsResponse.json();
        
        // Extrair mensagens dependendo do formato da resposta
        let messages: Message[] = [];
        if (messagesData.data && messagesData.data.messages && messagesData.data.messages.records) {
          messages = messagesData.data.messages.records;
        } else if (messagesData.data && Array.isArray(messagesData.data)) {
          messages = messagesData.data;
        } else if (Array.isArray(messagesData)) {
          messages = messagesData;
        }
        
        // Extrair contatos
        let contacts: any[] = [];
        if (contactsData.data && Array.isArray(contactsData.data)) {
          contacts = contactsData.data;
        } else if (Array.isArray(contactsData)) {
          contacts = contactsData;
        }
        
        // Calcular métricas
        // 1. Total de chats únicos
        const uniqueChats = new Set();
        messages.forEach((msg: Message) => {
          const jid = msg.key?.remoteJid || msg.remote_jid;
          if (jid) uniqueChats.add(jid);
        });
        
        // 2. Média de mensagens por chat
        const avgMessages = uniqueChats.size > 0 
          ? Math.round((messages.length / uniqueChats.size) * 10) / 10
          : 0;
        
        // 3. Taxa de resposta (mensagens respondidas / mensagens recebidas)
        const incomingMessages = messages.filter((msg: Message) => !(msg.key?.fromMe || msg.from_me)).length;
        const outgoingMessages = messages.filter((msg: Message) => msg.key?.fromMe || msg.from_me).length;
        
        const responseRate = incomingMessages > 0 
          ? Math.round((outgoingMessages / incomingMessages) * 100) 
          : 0;
        
        setMetrics({
          totalChats: uniqueChats.size,
          totalContacts: contacts.length,
          avgMessagesPerChat: avgMessages,
          responseRate: responseRate,
          loading: false
        });
        
      } catch (error) {
        console.error("Erro ao buscar dados para métricas:", error);
        setMetrics(prev => ({...prev, loading: false}));
      }
    }
    
    fetchData();
  }, []);

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Conversas</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {metrics.loading ? (
                <div className="animate-pulse bg-muted h-8 w-16 rounded"></div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics.totalChats}</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    Conversas únicas registradas
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contatos Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {metrics.loading ? (
                <div className="animate-pulse bg-muted h-8 w-16 rounded"></div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics.totalContacts}</div>
                  <p className="text-xs text-muted-foreground">
                    Contatos cadastrados
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média de Mensagens</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {metrics.loading ? (
                <div className="animate-pulse bg-muted h-8 w-16 rounded"></div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics.avgMessagesPerChat}</div>
                  <p className="text-xs text-muted-foreground">
                    Mensagens por conversa
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Resposta</CardTitle>
              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {metrics.loading ? (
                <div className="animate-pulse bg-muted h-8 w-16 rounded"></div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics.responseRate}%</div>
                  <p className="text-xs text-muted-foreground flex items-center">
                    {metrics.responseRate >= 100 ? (
                      <ArrowUp className="text-green-500 h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDown className="text-amber-500 h-3 w-3 mr-1" />
                    )}
                    Taxa de resposta enviadas/recebidas
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="activity">Atividade Recente</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <Overview />
          </TabsContent>
          <TabsContent value="activity" className="space-y-4">
            <RecentActivity />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
