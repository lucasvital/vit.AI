import { pgTable, serial, timestamp, varchar, text, integer, uniqueIndex, uuid, boolean } from "drizzle-orm/pg-core"

// Tabela de usuários
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    emailIdx: uniqueIndex("email_idx").on(table.email),
  }
})

// Tabela de configurações Evolution
export const evolutionConfig = pgTable("evolution_config", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  apiUrl: varchar("api_url", { length: 255 }).notNull(),
  apiKey: varchar("api_key", { length: 255 }).notNull(),
  instanceName: varchar("instance_name", { length: 100 }).notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// Tabela de sessões
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  token: varchar("token", { length: 255 }).notNull(),
  expires: timestamp("expires").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type EvolutionConfig = typeof evolutionConfig.$inferSelect
export type NewEvolutionConfig = typeof evolutionConfig.$inferInsert

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
