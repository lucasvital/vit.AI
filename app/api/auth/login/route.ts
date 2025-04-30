import { NextResponse } from "next/server";
import { loginUser, createSession } from "@/lib/auth";
import { z } from "zod";

// Schema de validação
const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validar dados
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;
    
    // Tentar autenticar usuário
    const user = await loginUser(email, password);
    
    if (!user) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos" },
        { status: 401 }
      );
    }
    
    // Criar sessão
    await createSession(user.id);
    
    // Retornar sucesso
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Erro ao processar login:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Erro ao processar a requisição de login" },
      { status: 500 }
    );
  }
} 