"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Save, Search, UserPlus, CheckCircle2, ShieldCheck, X } from "lucide-react";
import styles from "./crearCita.module.css";
import his from "../his.module.css";

interface Paciente {
  id: string;
  nombre_completo: string;
  cedula: string;
}

interface Medico {
  id: string;
  nombre_completo: string;
  especialidad: string;
}

export default function CrearCitaPage() {
  const router = useRouter();
  const { usuario, token, loading: authLoading, isAuthenticated } = useAuth();

  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(authLoading);
  const [enviado, setEnviado] = useState(false);

  // Búsqueda de paciente por cédula
  const [cedulaBusqueda, setCedulaBusqueda] = useState("");
  const [pacienteEncontrado, setPacienteEncontrado] = useState<Paciente | null>(null);
  const [busquedaSinResultado, setBusquedaSinResultado] = useState(false);

  // Seguro del paciente (se llena automáticamente al encontrarlo)
  const [seguroInfo, setSeguroInfo] = useState<{ ars: string; numero_afiliado: string } | null>(null);
  const [consultandoSeguro, setConsultandoSeguro] = useState(false);

  // Validación de cobertura (integración ARS)
  const [validacion, setValidacion] = useState<{ estado: string; copago: number; monto_autorizado: number; mensaje?: string } | null>(null);
  const [validandoCobertura, setValidandoCobertura] = useState(false);

  // Registro de paciente desde esta misma pantalla
  const [aseguradoras, setAseguradoras] = useState<{ id: string; nombre: string }[]>([]);
  const [showPacienteModal, setShowPacienteModal] = useState(false);
  const [guardandoPaciente, setGuardandoPaciente] = useState(false);
  const [pacForm, setPacForm] = useState({
    cedula: "", nombre_completo: "", fecha_nacimiento: "", sexo: "M", tipo_sangre: "",
    telefono: "", email: "", direccion: "", ciudad: "",
    tipo: "privado", aseguradora_id: "", numero_afiliado: "", plan: "",
  });

  const [formData, setFormData] = useState({
    paciente_id: "",
    medico_id: usuario?.id || "",
    especialidad: usuario?.especialidad || "",
    fecha_cita: "",
    duracion_minutos: 30,
    tipo_paciente: "privado",
    monto_estimado: "",
    motivo_cita: "",
    notas: "",
  });

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !usuario || !["medico", "secretaria", "admin"].includes(usuario.rol)) {
      router.push("/login");
      return;
    }

    cargarDatos();
  }, [isAuthenticated, usuario, authLoading, router]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [pacientesRes, medicosRes, arsRes] = await Promise.all([
        fetch("/api/pacientes", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/medicos", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/aseguradoras", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (pacientesRes.ok) {
        const data = await pacientesRes.json();
        setPacientes(data.data || []);
      }
      if (medicosRes.ok) {
        const data = await medicosRes.json();
        setMedicos(data.data || []);
      }
      if (arsRes.ok) {
        const data = await arsRes.json();
        setAseguradoras(data.data || []);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Consultar el seguro del paciente y llenar los campos automáticamente
  const consultarSeguro = async (pacienteId: string) => {
    setConsultandoSeguro(true);
    setSeguroInfo(null);
    try {
      const res = await fetch(`/api/seguros-pacientes?paciente_id=${pacienteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        const seguro = (d.data || [])[0];
        if (seguro) {
          setSeguroInfo({
            ars: seguro.aseguradora?.nombre || "ARS",
            numero_afiliado: seguro.numero_afiliado || "",
          });
          setFormData((prev) => ({ ...prev, tipo_paciente: "asegurado" }));
        } else {
          setFormData((prev) => ({ ...prev, tipo_paciente: "privado" }));
        }
      }
    } catch (e) {
      console.error("Error consultando seguro:", e);
    } finally {
      setConsultandoSeguro(false);
    }
  };

  // Buscar paciente por cédula (con o sin guiones)
  const buscarPaciente = () => {
    const cedula = cedulaBusqueda.replace(/[\s-]/g, "");
    if (!cedula) {
      alert("Escribe la cédula del paciente para buscar");
      return;
    }
    const encontrado = pacientes.find(
      (p) => (p.cedula || "").replace(/[\s-]/g, "") === cedula
    );
    if (encontrado) {
      setPacienteEncontrado(encontrado);
      setBusquedaSinResultado(false);
      setFormData((prev) => ({ ...prev, paciente_id: encontrado.id }));
      consultarSeguro(encontrado.id);
    } else {
      setPacienteEncontrado(null);
      setBusquedaSinResultado(true);
      setSeguroInfo(null);
      setFormData((prev) => ({ ...prev, paciente_id: "" }));
    }
  };

  const limpiarBusqueda = () => {
    setCedulaBusqueda("");
    setPacienteEncontrado(null);
    setBusquedaSinResultado(false);
    setSeguroInfo(null);
    setFormData((prev) => ({ ...prev, paciente_id: "", tipo_paciente: "privado" }));
  };

  // Registrar paciente NUEVO sin salir de la pantalla de citas
  const irANuevoPaciente = () => {
    setPacForm({
      ...pacForm,
      cedula: formatearCedulaLocal(cedulaBusqueda),
    });
    setShowPacienteModal(true);
  };

  const formatearCedulaLocal = (valor: string) => {
    const digitos = valor.replace(/\D/g, "").slice(0, 11);
    if (digitos.length <= 3) return digitos;
    if (digitos.length <= 10) return `${digitos.slice(0, 3)}-${digitos.slice(3)}`;
    return `${digitos.slice(0, 3)}-${digitos.slice(3, 10)}-${digitos.slice(10)}`;
  };

  const guardarPacienteNuevo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pacForm.tipo === "asegurado" && !pacForm.aseguradora_id) {
      alert("Selecciona la ARS del paciente asegurado");
      return;
    }
    setGuardandoPaciente(true);
    try {
      const res = await fetch("/api/pacientes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(pacForm),
      });
      const d = await res.json();
      if (!res.ok) {
        alert(`Error: ${d.error}`);
        return;
      }
      const nuevo = d.data;
      // Registrar su seguro si es asegurado
      if (pacForm.tipo === "asegurado" && nuevo?.id) {
        await fetch("/api/seguros-pacientes", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            paciente_id: nuevo.id,
            aseguradora_id: pacForm.aseguradora_id,
            numero_afiliado: pacForm.numero_afiliado || pacForm.cedula,
            plan: pacForm.plan || null,
          }),
        });
      }
      // Seleccionarlo automáticamente para la cita
      const pacienteNuevo = { id: nuevo.id, nombre_completo: nuevo.nombre_completo, cedula: nuevo.cedula };
      setPacientes((prev) => [...prev, pacienteNuevo]);
      setPacienteEncontrado(pacienteNuevo);
      setBusquedaSinResultado(false);
      setShowPacienteModal(false);
      setFormData((prev) => ({
        ...prev,
        paciente_id: nuevo.id,
        tipo_paciente: pacForm.tipo,
      }));
      if (pacForm.tipo === "asegurado") consultarSeguro(nuevo.id);
      else setSeguroInfo(null);
      alert("Paciente registrado y seleccionado para la cita");
    } finally {
      setGuardandoPaciente(false);
    }
  };

  // Validar cobertura con la ARS (vía adapter configurado)
  const validarCobertura = async () => {
    if (!formData.paciente_id) return alert("Primero selecciona el paciente");
    setValidandoCobertura(true);
    try {
      const res = await fetch("/api/ars/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          paciente_id: formData.paciente_id,
          tipo_servicio: "consulta",
          monto_servicio: Number(formData.monto_estimado || 0),
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setValidacion({
          estado: d.data.estado,
          copago: Number(d.data.copago),
          monto_autorizado: Number(d.data.monto_autorizado),
          mensaje: d.mensaje,
        });
      } else {
        alert(`Error: ${d.error}`);
      }
    } finally {
      setValidandoCobertura(false);
    }
  };

  // Formatear cédula dominicana con guiones automáticos: 001-1234567-8
  const formatearCedula = (valor: string) => {
    const digitos = valor.replace(/\D/g, "").slice(0, 11);
    if (digitos.length <= 3) return digitos;
    if (digitos.length <= 10) return `${digitos.slice(0, 3)}-${digitos.slice(3)}`;
    return `${digitos.slice(0, 3)}-${digitos.slice(3, 10)}-${digitos.slice(10)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.paciente_id ||
      !formData.medico_id ||
      !formData.especialidad ||
      !formData.fecha_cita
    ) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      setEnviado(true);

      const response = await fetch("/api/citas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          monto_estimado: Number(formData.monto_estimado || 0),
          seguro_validado:
            formData.tipo_paciente === "asegurado"
              ? validacion?.estado === "validado" ? "validado" : validacion?.estado === "rechazado" ? "rechazado" : "pendiente"
              : "no_aplica",
        }),
      });

      if (response.ok) {
        alert("Cita agendada exitosamente");
        setFormData({
          paciente_id: "",
          medico_id: usuario?.id || "",
          especialidad: usuario?.especialidad || "",
          fecha_cita: "",
          duracion_minutos: 30,
          tipo_paciente: "privado",
          monto_estimado: "",
          motivo_cita: "",
          notas: "",
        });
        router.push("/dashboard/mis-citas");
      } else {
        alert("Error al agendar la cita");
      }
    } catch (error) {
      console.error("Error agendando cita:", error);
      alert("Error al agendar la cita");
    } finally {
      setEnviado(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>
          <Plus size={26} strokeWidth={3} /> AGREGAR CONSULTA
        </h1>
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando...</div>
      ) : (
        <div className={styles.formWrapper}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <section className={styles.section}>
              <h2>Seleccionar Paciente *</h2>

              {/* Búsqueda por cédula */}
              <div className={styles.searchRow}>
                <input
                  type="text"
                  placeholder="Buscar por cédula (Ej: 001-1234567-8)"
                  value={cedulaBusqueda}
                  maxLength={13}
                  inputMode="numeric"
                  onChange={(e) => {
                    setCedulaBusqueda(formatearCedula(e.target.value));
                    setBusquedaSinResultado(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      buscarPaciente();
                    }
                  }}
                  className={styles.searchInput}
                />
                <button
                  type="button"
                  className={styles.searchBtn}
                  onClick={buscarPaciente}
                >
                  <Search size={17} /> Buscar
                </button>
                <button
                  type="button"
                  className={styles.newPatientBtn}
                  onClick={irANuevoPaciente}
                  disabled={!busquedaSinResultado}
                  title={
                    busquedaSinResultado
                      ? "Registrar este paciente nuevo"
                      : "Se habilita cuando la cédula buscada no está registrada"
                  }
                >
                  <UserPlus size={17} /> Nuevo Paciente
                </button>
              </div>

              {/* Resultado de la búsqueda */}
              {pacienteEncontrado && (
                <div className={styles.pacienteCard}>
                  <CheckCircle2 size={18} color="#16a34a" />
                  <div>
                    <strong>{pacienteEncontrado.nombre_completo}</strong>
                    <span> — Cédula: {pacienteEncontrado.cedula}</span>
                    <div className={styles.seguroInfo}>
                      <ShieldCheck size={15} />
                      {consultandoSeguro ? (
                        <span>Consultando seguro...</span>
                      ) : seguroInfo ? (
                        <span>
                          <b>Asegurado</b> — {seguroInfo.ars}
                          {seguroInfo.numero_afiliado && ` · Afiliado: ${seguroInfo.numero_afiliado}`}
                        </span>
                      ) : (
                        <span><b>Privado</b> — sin seguro registrado</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.limpiarBtn}
                    onClick={limpiarBusqueda}
                  >
                    Cambiar
                  </button>
                </div>
              )}
              {busquedaSinResultado && (
                <div className={styles.noEncontrado}>
                  No hay ningún paciente registrado con esa cédula.
                  Usa el botón <b>Nuevo Paciente</b> para registrarlo.
                </div>
              )}

              {/* Alternativa: seleccionar de la lista */}
              {!pacienteEncontrado && (
                <select
                  value={formData.paciente_id}
                  onChange={(e) => {
                    setFormData({ ...formData, paciente_id: e.target.value });
                    const sel = pacientes.find((p) => p.id === e.target.value);
                    if (sel) {
                      setPacienteEncontrado(sel);
                      setBusquedaSinResultado(false);
                      consultarSeguro(sel.id);
                    }
                  }}
                  className={styles.selectField}
                >
                  <option value="">O selecciona de tu lista de pacientes...</option>
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre_completo} ({p.cedula})
                    </option>
                  ))}
                </select>
              )}
            </section>

            <section className={styles.section}>
              <h2>Información de la Cita</h2>
              <div className={styles.grid}>
                <div>
                  <label>Médico *</label>
                  <select
                    value={formData.medico_id}
                    onChange={(e) =>
                      setFormData({ ...formData, medico_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Seleccionar médico</option>
                    {medicos.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre_completo?.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Especialidad *</label>
                  <select
                    value={formData.especialidad}
                    onChange={(e) =>
                      setFormData({ ...formData, especialidad: e.target.value })
                    }
                    required
                  >
                    <option value="">Seleccionar especialidad</option>
                    <option value="cardiologia">Cardiología</option>
                    <option value="medicina_interna">Medicina Interna</option>
                    <option value="urologia">Urología</option>
                    <option value="ginecologia">Ginecología</option>
                    <option value="pediatria">Pediatría</option>
                    <option value="dermatologia">Dermatología</option>
                    <option value="oftalmologia">Oftalmología</option>
                    <option value="traumatologia">Traumatología</option>
                  </select>
                </div>
              </div>

              <div className={styles.grid}>
                <div>
                  <label>Fecha y Hora de la Cita *</label>
                  <input
                    type="datetime-local"
                    value={formData.fecha_cita}
                    onChange={(e) =>
                      setFormData({ ...formData, fecha_cita: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label>Tipo de Paciente *</label>
                  <div className={styles.checklistRow}>
                    <label className={styles.checkItem}>
                      <input
                        type="checkbox"
                        checked={formData.tipo_paciente === "asegurado"}
                        onChange={() =>
                          setFormData({ ...formData, tipo_paciente: "asegurado" })
                        }
                      />
                      <span>Asegurado (ARS)</span>
                    </label>
                    <label className={styles.checkItem}>
                      <input
                        type="checkbox"
                        checked={formData.tipo_paciente === "privado"}
                        onChange={() =>
                          setFormData({ ...formData, tipo_paciente: "privado" })
                        }
                      />
                      <span>Privado</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className={styles.grid}>
                <div>
                  <label>Monto Estimado (RD$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ej: 2500"
                    value={formData.monto_estimado}
                    onChange={(e) =>
                      setFormData({ ...formData, monto_estimado: e.target.value })
                    }
                  />
                </div>
                {formData.tipo_paciente === "asegurado" && (
                  <div>
                    <label>Cobertura del Seguro</label>
                    <button
                      type="button"
                      className={styles.searchBtn}
                      onClick={validarCobertura}
                      disabled={validandoCobertura || !formData.paciente_id}
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      <ShieldCheck size={16} />
                      {validandoCobertura ? "Validando con la ARS..." : "Validar Cobertura"}
                    </button>
                  </div>
                )}
              </div>

              {validacion && formData.tipo_paciente === "asegurado" && (
                <div className={validacion.estado === "validado" ? styles.pacienteCard : styles.noEncontrado}>
                  <div>
                    <strong>Cobertura {validacion.estado.toUpperCase()}</strong>
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      ARS autoriza: <b>RD$ {validacion.monto_autorizado.toFixed(2)}</b> ·
                      Copago del paciente: <b>RD$ {validacion.copago.toFixed(2)}</b>
                    </div>
                    {validacion.mensaje && (
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{validacion.mensaje}</div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label>Motivo de la Cita</label>
                <input
                  type="text"
                  placeholder="Ej: Consulta de seguimiento"
                  value={formData.motivo_cita}
                  onChange={(e) =>
                    setFormData({ ...formData, motivo_cita: e.target.value })
                  }
                />
              </div>

              <div>
                <label>Notas Adicionales</label>
                <textarea
                  placeholder="Notas sobre la cita..."
                  value={formData.notas}
                  onChange={(e) =>
                    setFormData({ ...formData, notas: e.target.value })
                  }
                />
              </div>
            </section>

            <div className={styles.formButtons}>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={enviado}
              >
                <Save size={20} /> {enviado ? "Agendando..." : "Agendar Cita"}
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
      )}

      {/* ===== Modal: registrar paciente desde la pantalla de citas ===== */}
      {showPacienteModal && (
        <div className={his.modalOverlay} onClick={() => setShowPacienteModal(false)}>
          <div className={his.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className={his.modalHeader}>
              <span className={his.modalTitle}><UserPlus size={17} /> Registrar Paciente Nuevo</span>
              <button className={his.iconBtn} onClick={() => setShowPacienteModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={guardarPacienteNuevo}>
              <div className={his.formGrid}>
                <div className={his.formGroup}>
                  <label className={his.label}>Cédula *</label>
                  <input className={his.input} type="text" maxLength={13} inputMode="numeric" required
                    value={pacForm.cedula}
                    onChange={(e) => setPacForm({ ...pacForm, cedula: formatearCedulaLocal(e.target.value) })} />
                </div>
                <div className={his.formGroup}>
                  <label className={his.label}>Nombre Completo *</label>
                  <input className={his.input} type="text" required value={pacForm.nombre_completo}
                    onChange={(e) => setPacForm({ ...pacForm, nombre_completo: e.target.value })} />
                </div>
                <div className={his.formGroup}>
                  <label className={his.label}>Fecha de Nacimiento *</label>
                  <input className={his.input} type="date" required value={pacForm.fecha_nacimiento}
                    onChange={(e) => setPacForm({ ...pacForm, fecha_nacimiento: e.target.value })} />
                </div>
                <div className={his.formGroup}>
                  <label className={his.label}>Sexo *</label>
                  <select className={his.select} value={pacForm.sexo} onChange={(e) => setPacForm({ ...pacForm, sexo: e.target.value })}>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
                <div className={his.formGroup}>
                  <label className={his.label}>Tipo de Sangre</label>
                  <select className={his.select} value={pacForm.tipo_sangre} onChange={(e) => setPacForm({ ...pacForm, tipo_sangre: e.target.value })}>
                    <option value="">Seleccionar</option>
                    {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className={his.formGroup}>
                  <label className={his.label}>Teléfono *</label>
                  <input className={his.input} type="tel" required value={pacForm.telefono}
                    onChange={(e) => setPacForm({ ...pacForm, telefono: e.target.value })} />
                </div>
                <div className={his.formGroup}>
                  <label className={his.label}>Email</label>
                  <input className={his.input} type="email" value={pacForm.email}
                    onChange={(e) => setPacForm({ ...pacForm, email: e.target.value })} />
                </div>
                <div className={his.formGroup}>
                  <label className={his.label}>Dirección</label>
                  <input className={his.input} type="text" value={pacForm.direccion}
                    onChange={(e) => setPacForm({ ...pacForm, direccion: e.target.value })} />
                </div>
                <div className={his.formGroup}>
                  <label className={his.label}>Ciudad</label>
                  <input className={his.input} type="text" value={pacForm.ciudad}
                    onChange={(e) => setPacForm({ ...pacForm, ciudad: e.target.value })} />
                </div>
                <div className={his.formGroup}>
                  <label className={his.label}>Tipo de Paciente *</label>
                  <select className={his.select} value={pacForm.tipo}
                    onChange={(e) => setPacForm({ ...pacForm, tipo: e.target.value })}>
                    <option value="privado">Privado</option>
                    <option value="asegurado">Asegurado (ARS)</option>
                  </select>
                </div>
                {pacForm.tipo === "asegurado" && (
                  <>
                    <div className={his.formGroup}>
                      <label className={his.label}>ARS *</label>
                      <select className={his.select} value={pacForm.aseguradora_id}
                        onChange={(e) => setPacForm({ ...pacForm, aseguradora_id: e.target.value })} required>
                        <option value="">Seleccionar ARS</option>
                        {aseguradoras.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                      </select>
                    </div>
                    <div className={his.formGroup}>
                      <label className={his.label}>No. de Afiliado (NSS)</label>
                      <input className={his.input} type="text" placeholder="Vacío = usa la cédula"
                        value={pacForm.numero_afiliado}
                        onChange={(e) => setPacForm({ ...pacForm, numero_afiliado: e.target.value })} />
                    </div>
                    <div className={his.formGroup}>
                      <label className={his.label}>Plan</label>
                      <input className={his.input} type="text" placeholder="Básico, Complementario..."
                        value={pacForm.plan}
                        onChange={(e) => setPacForm({ ...pacForm, plan: e.target.value })} />
                    </div>
                  </>
                )}
              </div>
              <div className={his.formActions}>
                <button type="button" className={his.btnGhost} onClick={() => setShowPacienteModal(false)}>Cancelar</button>
                <button type="submit" className={his.btnVerde} disabled={guardandoPaciente}>
                  {guardandoPaciente ? "Guardando..." : "Registrar y usar en la cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
