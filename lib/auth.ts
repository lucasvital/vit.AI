import { db } from "./db";
import { users, sessions, User, NewUser, Session } from "./schema";
import { eq, and, gte } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

// Configurações
const SESSION_EXPIRY_DAYS = 7;
const COOKIE_NAME = "dash_session";

// Gerar hash de senha
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// Verificar senha
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Registrar novo usuário
export async function registerUser(name: string, email: string, password: string): Promise<User | null> {
  try {
    // Verificar se o e-mail já existe
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      throw new Error("E-mail já cadastrado");
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password);

    // Inserir usuário
    const newUser: NewUser = {
      name,
      email,
      password: hashedPassword,
    };

    const result = await db.insert(users).values(newUser).returning();
    return result[0] || null;
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    throw error;
  }
}

// Autenticar usuário
export async function loginUser(email: string, password: string): Promise<User | null> {
  try {
    // Buscar usuário pelo e-mail
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    const user = existingUser[0];

    // Verificar se usuário existe
    if (!user) {
      return null;
    }

    // Verificar senha
    const passwordValid = await verifyPassword(password, user.password);
    if (!passwordValid) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Erro ao autenticar usuário:", error);
    throw error;
  }
}

// Criar sessão para usuário
export async function createSession(userId: number): Promise<Session> {
  try {
    // Calcular expiração
    const expires = new Date();
    expires.setDate(expires.getDate() + SESSION_EXPIRY_DAYS);

    // Gerar token de sessão
    const token = uuidv4();

    // Inserir sessão
    const result = await db
      .insert(sessions)
      .values({
        userId,
        token,
        expires,
      })
      .returning();

    // Definir cookie
    const cookieStore = cookies();
    cookieStore.set({
      name: COOKIE_NAME,
      value: token,
      expires,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return result[0];
  } catch (error) {
    console.error("Erro ao criar sessão:", error);
    throw error;
  }
}

// Validar sessão
export async function validateSession(): Promise<User | null> {
  try {
    // Obter token do cookie
    const cookieStore = cookies();
    const sessionToken = cookieStore.get(COOKIE_NAME)?.value;
    if (!sessionToken) {
      return null;
    }

    // Buscar sessão
    const now = new Date();
    const existingSession = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.token, sessionToken),
          gte(sessions.expires, now)
        )
      );

    if (existingSession.length === 0) {
      return null;
    }

    // Buscar usuário
    const session = existingSession[0];
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId));

    return existingUser[0] || null;
  } catch (error) {
    console.error("Erro ao validar sessão:", error);
    return null;
  }
}

// Encerrar sessão
export async function logout(): Promise<void> {
  try {
    // Apagar cookie
    const cookieStore = cookies();
    cookieStore.delete(COOKIE_NAME);

    // Opcionalmente, limpar sessão do banco também
    const sessionToken = cookieStore.get(COOKIE_NAME)?.value;
    if (sessionToken) {
      await db.delete(sessions).where(eq(sessions.token, sessionToken));
    }
  } catch (error) {
    console.error("Erro ao encerrar sessão:", error);
    throw error;
  }
}

// Middleware para verificar autenticação
export async function authMiddleware() {
  const user = await validateSession();
  if (!user) {
    return { authenticated: false, user: null };
  }
  return { authenticated: true, user };
} 