"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Save, AlertCircle, CheckCircle } from "lucide-react";
import styles from "./crearPaciente.module.css";

export default function CrearPacientePage() {
  const router = useRouter();
  const { usuario, token, loading: authLoading, isAuthenticated } = useAuth();

  const [enviado, setEnviado] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    cedula: "",
    nombre_completo: "",
    fecha_nacimiento: "",
    sexo: "M",
    telefono: "",
    email: "",
    direccion: "",
    ciudad: "",
    tipo_sangre: "",
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || usuario?.rol !== "medico") {
      router.push("/login");
    }
  }, [isAuthenticated, usuario, authLoading, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Limpiar mensajes al editar
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formData.cedula || !formData.nombre_completo || !formData.fecha_nacimiento) {
      setErrorMsg("Por favor completa los campos obligatorios: Cédula, Nombre y Fecha de Nacimiento.");
      return;
    }

    if (!token) {
      setErrorMsg("Sesión expirada. Por favor inicia sesión nuevamente.");
      return;
    }

    try {
      setEnviado(true);

      const response = await fetch("/api/pacientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMsg("¡Paciente creado exitosamente! Redirigiendo...");
        setFormData({
          cedula: "",
          nombre_completo: "",
          fecha_nacimiento: "",
          sexo: "M",
          telefono: "",
          email: "",
          direccion: "",
          ciudad: "",
          tipo_sangre: "",
        });
        setTimeout(() => router.push("/dashboard/mis-pacientes"), 1500);
      } else {
        // Mostrar el error real del servidor
        setErrorMsg(result.error || "Error desconocido al crear el paciente.");
      }
    } catch (error: any) {
      console.error("Error creando paciente:", error);
      setErrorMsg("Error de conexión. Verifica tu internet e intenta nuevamente.");
    } finally {
      setEnviado(false);
    }
  };

  if (authLoading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner} />
        <p>Verificando sesión...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <ArrowLeft size={20} />
          <span>Volver</span>
        </button>
        <div>
          <h1>Nuevo Paciente</h1>
          <p className={styles.subtitle}>Registra los datos del paciente</p>
        </div>
      </div>

      {/* Mensaje de error */}
      {errorMsg && (
        <div className={styles.alertError}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Mensaje de éxito */}
      {successMsg && (
        <div className={styles.alertSuccess}>
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      <div className={styles.formWrapper}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>👤</span>
              Información Básica
            </h2>
            <div className={styles.grid}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Cédula *</label>
                <input
                  className={styles.input}
                  type="text"
                  name="cedula"
                  placeholder="Ej: 001-2345678-9"
                  value={formData.cedula}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Nombre Completo *</label>
                <input
                  className={styles.input}
                  type="text"
                  name="nombre_completo"
                  placeholder="Nombre y apellidos"
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className={styles.grid3}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Fecha de Nacimiento *</label>
                <input
                  className={styles.input}
                  type="date"
                  name="fecha_nacimiento"
                  value={formData.fecha_nacimiento}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Sexo</label>
                <select
                  className={styles.select}
                  name="sexo"
                  value={formData.sexo}
                  onChange={handleChange}
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Tipo de Sangre</label>
                <select
                  className={styles.select}
                  name="tipo_sangre"
                  value={formData.tipo_sangre}
                  onChange={handleChange}
                >
                  <option value="">Seleccionar</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📞</span>
              Información de Contacto
            </h2>
            <div className={styles.grid}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Teléfono</label>
                <input
                  className={styles.input}
                  type="tel"
                  name="telefono"
                  placeholder="Número telefónico"
                  value={formData.telefono}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Email</label>
                <input
                  className={styles.input}
                  type="email"
                  name="email"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className={styles.grid}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Dirección</label>
                <input
                  className={styles.input}
                  type="text"
                  name="direccion"
                  placeholder="Dirección residencial"
                  value={formData.direccion}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Ciudad</label>
                <input
                  className={styles.input}
                  type="text"
                  name="ciudad"
                  placeholder="Ciudad"
                  value={formData.ciudad}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          <div className={styles.formButtons}>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={enviado}
            >
              {enviado ? (
                <>
                  <div className={styles.btnSpinner} />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Crear Paciente
                </>
              )}
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => router.back()}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
