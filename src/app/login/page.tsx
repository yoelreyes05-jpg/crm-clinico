"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login, obtenerSesion } from "@/lib/auth";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Verificar si ya está logueado
  useEffect(() => {
    const sesion = obtenerSesion();
    if (sesion) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const result = await login(email, password);

    if (result.success) {
      setSuccess("✅ Autenticación exitosa. Redirigiendo...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } else {
      setError(result.error || "Error al iniciar sesión");
    }

    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🏥</span>
          </div>
          <h1>MEDIKIT</h1>
          <p className={styles.subtitle}>
            Sistema de Gestión Médica Multi-especialidad
          </p>
        </div>

        {error && (
          <div className={styles.alert + " " + styles.alertError}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className={styles.alert + " " + styles.alertSuccess}>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className={styles.form} autoComplete="off">
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <Mail size={18} />
              Correo Electrónico
            </label>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="tu@email.com"
              required
              autoComplete="off"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              <Lock size={18} />
              Contraseña
            </label>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
            <a href="/recuperar-contrasena" className={styles.forgotPassword}>
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
          >
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                Ingresando...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Ingresar al Sistema
              </>
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <p className={styles.version}>v1.0.0 - Producción</p>
        </div>
      </div>

      <div className={styles.background}></div>
    </div>
  );
}
