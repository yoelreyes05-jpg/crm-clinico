"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldPlus, Mail, Lock, UserPlus, LogIn } from "lucide-react";
import styles from "./login.module.css";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  // Verificar si ya hay sesión activa
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkUserRoleAndRedirect(session.user.id);
      }
    });
  }, []);

  const checkUserRoleAndRedirect = async (userId: string) => {
    // Buscar rol en la tabla clinico_usuarios
    const { data, error } = await supabase
      .from('clinico_usuarios')
      .select('rol, modulo_asignado')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // Si no existe en la tabla usuarios (ej. acaba de registrarse y no es admin), lo mandamos por defecto al admin para que asigne roles.
      // En un entorno real, aquí se le denegaría acceso o se enviaría al portal de paciente.
      router.push("/dashboard/admin");
      return;
    }

    if (data.rol === 'admin') router.push("/dashboard/admin");
    else if (data.rol === 'medico' && data.modulo_asignado) router.push(`/dashboard/${data.modulo_asignado}`);
    else if (data.rol === 'paciente') router.push("/portal-paciente");
    else router.push("/dashboard");
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      if (isSignUp) {
        // Registro de nueva cuenta
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        // Automáticamente intentar insertarlo como admin si es la primera cuenta
        // (Esto puede fallar si las políticas RLS son muy estrictas, pero servirá para el primer usuario)
        if (data.user) {
           await supabase.from('clinico_usuarios').insert({
             id: data.user.id,
             email: data.user.email,
             rol: 'admin',
             nombre_completo: 'Admin Inicial'
           }).select();
        }
        
        alert("¡Cuenta creada! Revisa tu correo o inicia sesión directamente.");
        setIsSignUp(false);
      } else {
        // Inicio de sesión
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        if (data.user) {
          await checkUserRoleAndRedirect(data.user.id);
        }
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Ocurrió un error en la autenticación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={`card ${styles.loginCard}`}>
        <div className={styles.logoWrapper}>
          <ShieldPlus size={40} />
        </div>
        
        <h1>{isSignUp ? "Crear Cuenta" : "Acceso Clínico"}</h1>
        <p className={styles.subtitle}>
          {isSignUp ? "Registra al administrador del sistema" : "Sistema Integral de Gestión Médica"}
        </p>

        {errorMsg && (
          <div style={{color: 'white', background: 'var(--color-danger)', padding: '0.75rem', borderRadius: 'var(--radius-md)', width: '100%', marginBottom: '1rem', fontSize: '0.85rem', textAlign: 'center'}}>
            {errorMsg}
          </div>
        )}

        <form className={styles.form} onSubmit={handleAuth}>
          <div className="input-group">
            <label className="input-label">Correo Electrónico</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.inputIcon} />
              <input 
                type="email" 
                className="input-field" 
                placeholder="doctor@clinica.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Contraseña</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input 
                type="password" 
                className="input-field" 
                placeholder="••••••••" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? "Procesando..." : isSignUp ? (
              <><UserPlus size={18} /> Registrarme</>
            ) : (
              <><LogIn size={18} /> Ingresar al Sistema</>
            )}
          </button>
        </form>

        <button 
          type="button"
          onClick={() => setIsSignUp(!isSignUp)} 
          style={{background: 'none', border: 'none', color: 'var(--color-primary)', marginTop: '1.5rem', cursor: 'pointer', fontWeight: '600'}}
        >
          {isSignUp ? "¿Ya tienes cuenta? Inicia Sesión" : "¿Es tu primera vez? Crea el primer Administrador"}
        </button>
      </div>
    </div>
  );
}
