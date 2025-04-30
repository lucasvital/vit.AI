import { NextResponse } from "next/server";
import { validateSession } from "@/lib/auth";

export async function GET() {
  try {
    // Validar sessão atual
    const user = await validateSession();
    
    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }
    
    // Retornar dados do usuário (sem senha)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Erro ao obter usuário atual:", error);
    
    return NextResponse.json(
      { error: "Erro ao processar a requisição" },
      { status: 500 }
    );
  }
} 