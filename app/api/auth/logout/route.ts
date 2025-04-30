import { NextResponse } from "next/server";
import { logout } from "@/lib/auth";

export async function POST() {
  try {
    // Executar logout
    await logout();
    
    // Retornar sucesso
    return NextResponse.json({
      success: true,
      message: "Logout realizado com sucesso"
    });
  } catch (error) {
    console.error("Erro ao processar logout:", error);
    
    return NextResponse.json(
      { error: "Erro ao realizar logout" },
      { status: 500 }
    );
  }
} 