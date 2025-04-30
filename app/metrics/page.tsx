"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

// Mock data for the charts
const monthlyData = []
const channelData = []

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

export default function MetricsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Chat Metrics</h1>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chat Volume Trends</CardTitle>
              <CardDescription>Monthly chat volume and response metrics</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={400}>
                {monthlyData.length > 0 ? (
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="chats" fill="#6366f1" name="Total Chats" />
                    <Bar dataKey="responses" fill="#22c55e" name="Responses" />
                  </BarChart>
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <p className="text-muted-foreground">No monthly data available</p>
                  </div>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="satisfaction" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Satisfaction Ratings</CardTitle>
              <CardDescription>Monthly satisfaction scores (%)</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={400}>
                {monthlyData.length > 0 ? (
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[80, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="satisfaction"
                      stroke="#6366f1"
                      name="Satisfaction (%)"
                      strokeWidth={2}
                    />
                  </LineChart>
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <p className="text-muted-foreground">No satisfaction data available</p>
                  </div>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chat Channels</CardTitle>
              <CardDescription>Distribution of chats by channel</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="w-full max-w-md">
                <ResponsiveContainer width="100%" height={400}>
                  {channelData.length > 0 ? (
                    <PieChart>
                      <Pie
                        data={channelData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {channelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <p className="text-muted-foreground">No channel data available</p>
                    </div>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
