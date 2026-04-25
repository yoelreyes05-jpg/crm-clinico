import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Usar service key para evitar RLS en login
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================
// POST /api/auth/login
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Buscar usuario en usuarios_clinica (admin + médicos unificados)
    const { data: usuarios, error: errorBusqueda } = await supabase
      .from("usuarios_clinica")
      .select("*")
      .eq("email", email.toLowerCase().trim());

    if (errorBusqueda) {
      console.error("Error en búsqueda:", errorBusqueda);
      return NextResponse.json({ error: "Error al buscar usuario" }, { status: 500 });
    }

    if (!usuarios || usuarios.length === 0) {
      return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
    }

    const usuario = usuarios[0];

    if (!usuario.estado) {
      return NextResponse.json({ error: "Usuario inactivo. Contacta al administrador." }, { status: 401 });
    }

    // -------------------------------------------------------
    // Verificar contraseña: soporta bcrypt Y texto plano
    // (texto plano para el admin inicial, bcrypt para médicos
    //  creados desde el panel)
    // -------------------------------------------------------
    const esHash = usuario.password_hash?.startsWith("$2");
    let passwordValido = false;

    if (esHash) {
      // Médico creado con bcrypt desde el panel de admin
      passwordValido = await bcrypt.compare(password, usuario.password_hash);
    } else {
      // Admin inicial con contraseña en texto plano en la BD
      passwordValido = password === usuario.password_hash;

      // Aprovechar este login para migrar la contraseña a bcrypt
      if (passwordValido) {
        const nuevoHash = await bcrypt.hash(password, 10);
        await supabase
          .from("usuarios_clinica")
          .update({ password_hash: nuevoHash })
          .eq("id", usuario.id);
      }
    }

    if (!passwordValido) {
      return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
    }

    // Generar JWT
    const jwtSecret =
      process.env.JWT_SECRET ||
      "dev_secret_jwt_key_change_in_production_min_32_chars";

    const token = jwt.sign(
      {
        id: usuario.id,                      // ID de usuarios_clinica
        email: usuario.email,
        rol: usuario.rol,
        especialidad: usuario.especialidad,
      },
      jwtSecret,
      { expiresIn: "12h" }
    );

    const usuarioSeguro = {
      id: usuario.id,
      email: usuario.email,
      nombre_completo: usuario.nombre_completo,
      rol: usuario.rol,
      especialidad: usuario.especialidad,
    };

    return NextResponse.json(
      { success: true, user: usuarioSeguro, token, message: "Autenticación exitosa" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error en login:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}

// ============================================================
// GET /api/auth/login — verificar token activo
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const jwtSecret =
      process.env.JWT_SECRET ||
      "dev_secret_jwt_key_change_in_production_min_32_chars";

    const decoded = jwt.verify(token, jwtSecret) as any;

    const { data: usuario, error } = await supabase
      .from("usuarios_clinica")
      .select("id, email, nombre_completo, rol, especialidad, estado")
      .eq("id", decoded.id)
      .single();

    if (error || !usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: usuario,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 });
  }
}
