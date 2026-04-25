
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    console.log("=== DEBUG INFO ===");
    console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓" : "✗");

    // Buscar el usuario
    const { data, error } = await supabase
      .from("usuarios_clinica")
      .select("*")
      .eq("email", "yoelreyes05@gmail.com")
      .single();

    console.log("Query result:", { data, error });

    if (error) {
      return NextResponse.json({
        status: "error",
        message: error.message,
        error: error,
      });
    }

    return NextResponse.json({
      status: "ok",
      usuario: {
        id: data?.id,
        email: data?.email,
        nombre_completo: data?.nombre_completo,
        rol: data?.rol,
        password_hash: data?.password_hash,
        estado: data?.estado,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      message: error.message,
    });
  }
}
