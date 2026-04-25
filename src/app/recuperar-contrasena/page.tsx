"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Check } from "lucide-react";
import styles from "./recuperar.module.css";

type Step = "email" | "reset" | "success";

function RecuperarContraseniaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [passwordData, setPasswordData] = useState({
    contrasena_nueva: "",
    confirmar_contrasena: "",
  });

  const token = searchParams.get("token");

  useEffect(() => {
    if (token) setStep("reset");
  }, [token]);

  const handleSolicitarRecuperacion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Por favor ingresa tu email");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setMessage("Si el email existe en el sistema, recibirás un enlace de recuperación.");
        setStep("success");
        setTimeout(() => router.push("/login"), 5000);
      } else {
        setError("Error al procesar la solicitud");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.contrasena_nueva || !passwordData.confirmar_contrasena) {
      setError("Por favor completa todos los campos");
      return;
    }

    if (passwordData.contrasena_nueva !== passwordData.confirmar_contrasena) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (passwordData.contrasena_nueva.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          contrasena_nueva: passwordData.contrasena_nueva,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Contraseña actualizada exitosamente");
        setStep("success");
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(data.error || "Error al cambiar contraseña");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>🏥</div>
          <h1 className={styles.logoTitle}>CRM Clínico</h1>
        </div>

        {step === "email" && (
          <form onSubmit={handleSolicitarRecuperacion} className={styles.form}>
            <h2 className={styles.heading}>Recuperar Contraseña</h2>
            <p className={styles.subtitle}>
              Ingresa tu email para recibir un enlace de recuperación
            </p>

            <div className={styles.inputGroup}>
              <Mail size={18} className={styles.icon} />
              <input
                className={styles.input}
                type="email"
                placeholder="Tu email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {message && <div className={styles.success}>{message}</div>}

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? "Enviando..." : "Enviar Enlace de Recuperación"}
            </button>

            <button
              type="button"
              className={styles.backLink}
              onClick={() => router.push("/login")}
            >
              Volver al Login
            </button>
          </form>
        )}

        {step === "reset" && token && (
          <form onSubmit={handleResetPassword} className={styles.form}>
            <h2 className={styles.heading}>Nueva Contraseña</h2>
            <p className={styles.subtitle}>Ingresa tu nueva contraseña</p>

            <div className={styles.inputGroup}>
              <Lock size={18} className={styles.icon} />
              <input
                className={styles.input}
                type="password"
                placeholder="Nueva contraseña"
                value={passwordData.contrasena_nueva}
                onChange={e =>
                  setPasswordData({ ...passwordData, contrasena_nueva: e.target.value })
                }
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <Lock size={18} className={styles.icon} />
              <input
                className={styles.input}
                type="password"
                placeholder="Confirmar contraseña"
                value={passwordData.confirmar_contrasena}
                onChange={e =>
                  setPasswordData({
                    ...passwordData,
                    confirmar_contrasena: e.target.value,
                  })
                }
                required
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? "Cambiando..." : "Cambiar Contraseña"}
            </button>

            <button
              type="button"
              className={styles.backLink}
              onClick={() => router.push("/login")}
            >
              Volver al Login
            </button>
          </form>
        )}

        {step === "success" && (
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>
              <Check size={44} />
            </div>

            <h2 className={styles.heading}>¡Éxito!</h2>
            <p className={styles.subtitle}>{message}</p>
            <p className={styles.redirectText}>
              Serás redirigido al login en breve...
            </p>

            <button className={styles.btn} onClick={() => router.push("/login")}>
              Ir al Login Ahora
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <RecuperarContraseniaContent />
    </Suspense>
  );
}
