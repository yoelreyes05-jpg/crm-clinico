import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================
// Enviar email de recuperación vía Resend (resend.com — gratis)
// Si RESEND_API_KEY no está configurada, solo imprime el link
// ============================================================
async function enviarEmailRecuperacion(
  email: string,
  nombre: string,
  resetLink: string
) {
  const resendKey = process.env.RESEND_API_KEY;

  if (!resendKey) {
    // Sin clave de email: mostrar link en log del servidor (desarrollo)
    console.log("=== LINK DE RECUPERACIÓN (configurar RESEND_API_KEY en producción) ===");
    console.log(`Para: ${email}`);
    console.log(`Link: ${resetLink}`);
    console.log("======================================================================");
    return;
  }

  // Envío real usando Resend API (sin paquete extra, solo fetch)
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "CRM Clínico <noreply@tudominio.com>",
      to: [email],
      subject: "Recuperación de Contraseña — CRM Clínico",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#0284c7;margin-bottom:8px">🏥 CRM Clínico</h2>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin-bottom:20px">
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>Recibimos una solicitud para restablecer tu contraseña. Si no la realizaste, ignora este correo.</p>
          <p style="margin:24px 0">
            <a href="${resetLink}"
               style="background:#0284c7;color:#fff;padding:11px 22px;
                      text-decoration:none;border-radius:7px;font-weight:600;
                      display:inline-block">
              Restablecer Contraseña
            </a>
          </p>
          <p style="color:#94a3b8;font-size:12px">
            Este enlace expirará en 24 horas.<br>
            Si el botón no funciona, copia este enlace en tu navegador:<br>
            <span style="color:#0284c7">${resetLink}</span>
          </p>
        </div>
      `,
    }),
  });
}

// ============================================================
// POST /api/auth/forgot-password
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    // Buscar usuario en usuarios_clinica (única tabla de usuarios)
    const { data: usuario } = await supabase
      .from("usuarios_clinica")
      .select("id, nombre_completo, email")
      .eq("email", email)
      .single();

    // Respuesta genérica por seguridad (no revelar si el email existe)
    const respuestaGenerica = NextResponse.json(
      { message: "Si el email existe en el sistema, recibirás un enlace de recuperación." },
      { status: 200 }
    );

    if (!usuario) return respuestaGenerica;

    // Generar token seguro
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Guardar token en la tabla
    const { error: updateError } = await supabase
      .from("usuarios_clinica")
      .update({
        reset_token: hashedToken,
        reset_token_expires: expiresAt.toISOString(),
      })
      .eq("id", usuario.id);

    if (updateError) {
      // Si las columnas reset_token no existen aún, devolver éxito genérico
      console.error("Error guardando token (¿columnas reset_token faltan?):", updateError.message);
      return respuestaGenerica;
    }

    // Construir link y enviar email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${appUrl}/recuperar-contrasena?token=${resetToken}`;

    try {
      await enviarEmailRecuperacion(usuario.email, usuario.nombre_completo, resetLink);
    } catch (emailErr) {
      console.error("Error enviando email:", emailErr);
      // No bloquear el flujo si el email falla
    }

    return respuestaGenerica;
  } catch (error: any) {
    console.error("Error forgot-password:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
