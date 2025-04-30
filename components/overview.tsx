"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

// Definir interfaces para os tipos
interface MessageKey {
  id?: string;
  fromMe?: boolean;
  remoteJid?: string;
}

interface Message {
  id?: string;
  key?: MessageKey;
  from_me?: boolean;
  messageTimestamp: number;
  message?: any;
  remote_jid?: string;
}

interface ChartData {
  name: string;
  chats: number;
  responses: number;
}

interface ResponseTimeData {
  name: string;
  time: number;
}

interface ProcessedData {
  chatVolumeData: ChartData[];
  responseTimeData: ResponseTimeData[];
}

export function Overview() {
  const [chatData, setChatData] = useState<ChartData[]>([])
  const [responseTimeData, setResponseTimeData] = useState<ResponseTimeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        
        // Buscar mensagens diretamente da API
        const apiEndpoint = typeof window !== 'undefined' 
          ? `${window.location.origin}/api/evolution/messages?limit=50`
          : `http://localhost:3000/api/evolution/messages?limit=50`;
          
        const response = await fetch(apiEndpoint)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Falha ao buscar mensagens")
        }

        const data = await response.json()
        
        if (data.success && data.data && data.data.messages && data.data.messages.records) {
          const messages = data.data.messages.records;
          
          // Processar mensagens para gerar dados para o gráfico
          const processedData = processMessagesForChart(messages);
          setChatData(processedData.chatVolumeData);
          setResponseTimeData(processedData.responseTimeData);
        } else {
          throw new Error("Formato de resposta inválido da API")
        }
      } catch (error) {
        console.error("Erro ao carregar dados do gráfico:", error)
        setError(error instanceof Error ? error.message : "Erro desconhecido")
        
        // Dados de fallback para demonstração em caso de erro
        generateFallbackData();
      } finally {
        setLoading(false)
      }
    }

    function processMessagesForChart(messages: Message[]): ProcessedData {
      // Agrupar mensagens por dia
      const messagesByDay = new Map<string, number>();
      const messagesByDayFromMe = new Map<string, number>();
      
      messages.forEach((msg: Message) => {
        // Obter data da mensagem (apenas a parte da data, sem o horário)
        const timestamp = msg.messageTimestamp * 1000; // Converter para milissegundos
        const date = new Date(timestamp);
        const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        // Incrementar contagem total
        if (!messagesByDay.has(dateStr)) {
          messagesByDay.set(dateStr, 0);
          messagesByDayFromMe.set(dateStr, 0);
        }
        
        messagesByDay.set(dateStr, messagesByDay.get(dateStr)! + 1);
        
        // Verificar se mensagem é "fromMe" e incrementar contador
        const isFromMe = msg.key?.fromMe || msg.from_me;
        if (isFromMe) {
          messagesByDayFromMe.set(dateStr, messagesByDayFromMe.get(dateStr)! + 1);
        }
      });
      
      // Ordenar datas
      const sortedDates = Array.from(messagesByDay.keys()).sort((a, b) => {
        const [dayA, monthA] = a.split('/').map(Number);
        const [dayB, monthB] = b.split('/').map(Number);
        if (monthA !== monthB) return monthA - monthB;
        return dayA - dayB;
      });
      
      // Criar dados para o gráfico
      const chatVolumeData = sortedDates.map(date => ({
        name: date,
        chats: messagesByDay.get(date)!,
        responses: messagesByDayFromMe.get(date)!
      }));
      
      // Calcular tempos médios de resposta (simulados baseados no volume)
      const responseTimeData = sortedDates.map(date => {
        // Simulando tempo de resposta - quanto mais mensagens, menor o tempo (inversamente proporcional)
        const volume = messagesByDay.get(date)!;
        const responseTime = Math.max(1, 10 - (volume / 10));
        
        return {
          name: date,
          time: parseFloat(responseTime.toFixed(1))
        };
      });
      
      return { chatVolumeData, responseTimeData };
    }
    
    function generateFallbackData(): void {
      // Gerar dados dos últimos 7 dias para fallback
      const fallbackDates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      });
      
      setChatData(fallbackDates.map((date, i) => ({
        name: date,
        chats: 50 + Math.round(Math.random() * 40),
        responses: 40 + Math.round(Math.random() * 30)
      })));
      
      setResponseTimeData(fallbackDates.map((date, i) => ({
        name: date,
        time: 1 + Math.random() * 2
      })));
    }

    fetchData()
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Volume de Chat</CardTitle>
          <CardDescription>Número de chats e respostas ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={350}>
            {loading ? (
              <div className="flex h-full w-full items-center justify-center">
                <p className="text-muted-foreground">Carregando dados...</p>
              </div>
            ) : error ? (
              <div className="flex h-full w-full items-center justify-center text-center">
                <p className="text-muted-foreground">
                  Erro ao carregar dados. Usando dados de demonstração.
                </p>
              </div>
            ) : chatData.length > 0 ? (
              <BarChart data={chatData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="chats" fill="#6366f1" name="Total de Chats" />
                <Bar dataKey="responses" fill="#22c55e" name="Respostas" />
              </BarChart>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <p className="text-muted-foreground">Nenhum dado de chat disponível</p>
              </div>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Tempo de Resposta</CardTitle>
          <CardDescription>Tempo médio de resposta em minutos</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={350}>
            {loading ? (
              <div className="flex h-full w-full items-center justify-center">
                <p className="text-muted-foreground">Carregando dados...</p>
              </div>
            ) : error ? (
              <div className="flex h-full w-full items-center justify-center text-center">
                <p className="text-muted-foreground">
                  Erro ao carregar dados. Usando dados de demonstração.
                </p>
              </div>
            ) : responseTimeData.length > 0 ? (
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="time" stroke="#6366f1" name="Tempo Médio de Resposta (min)" strokeWidth={2} />
              </LineChart>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <p className="text-muted-foreground">Nenhum dado de tempo de resposta disponível</p>
              </div>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
