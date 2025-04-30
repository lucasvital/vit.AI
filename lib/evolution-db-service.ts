import { neon } from "@neondatabase/serverless"

// The database connection URI for the Evolution database
const EVOLUTION_DB_URI = "postgresql://postgres:f9ff13189aca4ca6faea09dd77ba21de@postgres:5432/evolution"

// Create a SQL client for the Evolution database
export const evolutionSql = neon(EVOLUTION_DB_URI)

// Function to test the database connection
export async function testDatabaseConnection() {
  try {
    const result = await evolutionSql`
      SELECT current_database() as database, 
             current_user as user,
             version() as version
    `
    return {
      success: true,
      data: result[0],
    }
  } catch (error) {
    console.error("Database connection test failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Function to get message statistics for an instance
export async function getMessageStats(instanceName: string) {
  try {
    // Get total messages count
    const messageCount = await evolutionSql`
      SELECT COUNT(*) as count 
      FROM messages 
      WHERE instance_name = ${instanceName}
    `

    // Get messages per day for the last 7 days
    const messagesPerDay = await evolutionSql`
      SELECT 
        DATE(timestamp) as date, 
        COUNT(*) as count 
      FROM messages 
      WHERE instance_name = ${instanceName} 
        AND timestamp >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(timestamp)
      ORDER BY date
    `

    // Get total chats count
    const chatCount = await evolutionSql`
      SELECT COUNT(DISTINCT remote_jid) as count 
      FROM messages 
      WHERE instance_name = ${instanceName}
    `

    // Get top 5 most active chats
    const topChats = await evolutionSql`
      SELECT 
        remote_jid, 
        COUNT(*) as message_count 
      FROM messages 
      WHERE instance_name = ${instanceName}
      GROUP BY remote_jid
      ORDER BY message_count DESC
      LIMIT 5
    `

    return {
      messageCount: messageCount[0]?.count || 0,
      messagesPerDay,
      chatCount: chatCount[0]?.count || 0,
      topChats,
    }
  } catch (error) {
    console.error("Error fetching message stats:", error)
    throw error
  }
}

// Function to get recent messages for an instance
export async function getRecentMessages(instanceName: string, limit = 10) {
  try {
    const messages = await evolutionSql`
      SELECT 
        id,
        remote_jid,
        message_timestamp,
        message,
        from_me,
        sender_name
      FROM messages 
      WHERE instance_name = ${instanceName}
      ORDER BY message_timestamp DESC
      LIMIT ${limit}
    `
    return messages
  } catch (error) {
    console.error("Error fetching recent messages:", error)
    throw error
  }
}

// Function to get contacts for an instance
export async function getContacts(instanceName: string, limit = 100) {
  try {
    const contacts = await evolutionSql`
      SELECT 
        id,
        name,
        number,
        push_name
      FROM contacts 
      WHERE instance_name = ${instanceName}
      ORDER BY name
      LIMIT ${limit}
    `
    return contacts
  } catch (error) {
    console.error("Error fetching contacts:", error)
    throw error
  }
}

// Function to get chats for an instance
export async function getChats(instanceName: string, limit = 100) {
  try {
    const chats = await evolutionSql`
      SELECT 
        id,
        name,
        jid,
        unread_count
      FROM chats 
      WHERE instance_name = ${instanceName}
      ORDER BY unread_count DESC
      LIMIT ${limit}
    `
    return chats
  } catch (error) {
    console.error("Error fetching chats:", error)
    throw error
  }
}

export async function fetchEvolutionDatabaseInfo(apiUrl: string) {
  return {
    database: "evolution",
    user: "postgres",
    version: "15.3",
  }
}

export async function extractDatabaseConfigFromUrl(databaseUrl: string) {
  return {
    host: "localhost",
    port: 5432,
    database: "evolution",
    user: "postgres",
    password: "password",
  }
}

export async function fetchRecentMessages(dbConfig: any, instanceName: string, limit: number) {
  try {
    const messages = await evolutionSql`
      SELECT 
        id,
        remote_jid,
        message_timestamp,
        message,
        from_me,
        sender_name
      FROM messages 
      WHERE instance_name = ${instanceName}
      ORDER BY message_timestamp DESC
      LIMIT ${limit}
    `
    return messages
  } catch (error) {
    console.error("Error fetching recent messages:", error)
    throw error
  }
}

export async function fetchChatMetrics(dbConfig: any, instanceName: string) {
  try {
    // Get total messages count
    const messageCount = await evolutionSql`
      SELECT COUNT(*) as count 
      FROM messages 
      WHERE instance_name = ${instanceName}
    `

    // Get messages per day for the last 7 days
    const messagesPerDay = await evolutionSql`
      SELECT 
        DATE(timestamp) as date, 
        COUNT(*) as count 
      FROM messages 
      WHERE instance_name = ${instanceName} 
        AND timestamp >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(timestamp)
      ORDER BY date
    `

    // Get total chats count
    const chatCount = await evolutionSql`
      SELECT COUNT(DISTINCT remote_jid) as count 
      FROM messages 
      WHERE instance_name = ${instanceName}
    `

    // Get top 5 most active chats
    const topChats = await evolutionSql`
      SELECT 
        remote_jid, 
        COUNT(*) as message_count 
      FROM messages 
      WHERE instance_name = ${instanceName}
      GROUP BY remote_jid
      ORDER BY message_count DESC
      LIMIT 5
    `

    return {
      messageCount: messageCount[0]?.count || 0,
      messagesPerDay,
      chatCount: chatCount[0]?.count || 0,
      topChats,
    }
  } catch (error) {
    console.error("Error fetching message stats:", error)
    throw error
  }
}
