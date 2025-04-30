import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";
import { z } from "zod";

// Schema de validação
const registerSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validar dados
    const validatedData = registerSchema.parse(body);
    const { name, email, password } = validatedData;
    
    // Tentar registrar usuário
    try {
      const user = await registerUser(name, email, password);
      
      if (!user) {
        return NextResponse.json(
          { error: "Falha ao criar usuário" },
          { status: 500 }
        );
      }
      
      // Retornar sucesso
      return NextResponse.json({
        success: true,
        message: "Usuário registrado com sucesso"
      });
    } catch (registrationError) {
      console.error("Erro ao registrar usuário:", registrationError);
      
      // Verificar se é um erro de email já cadastrado
      if (registrationError instanceof Error && 
          registrationError.message.includes("E-mail já cadastrado")) {
        return NextResponse.json(
          { error: "Este e-mail já está cadastrado" },
          { status: 409 }
        );
      }
      
      throw registrationError;
    }
  } catch (error) {
    console.error("Erro ao processar registro:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Erro ao processar a requisição de registro" },
      { status: 500 }
    );
  }
} 