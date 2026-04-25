import { NextRequest, NextResponse } from "next/server";

// ============================================================
// POST /api/auth/logout
// ============================================================

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(
      {
        success: true,
        message: "Sesión cerrada correctamente",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error en logout:", error);
    return NextResponse.json(
      {
        error: "Error al cerrar sesión",
      },
      { status: 500 }
    );
  }
}
