"use client";

import { useState, useEffect } from "react";
import { Users, Search, Activity, HeartPulse, Droplets, Baby } from "lucide-react";
import styles from "../dashboard.module.css";
import { supabase } from "@/lib/supabase";

export default function PacientesPage() {
  const [modulo, setModulo] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<any>(null);
  const [historia, setHistoria] = useState<any[]>([]);

  useEffect(() => {
    checkModulo();
  }, []);

  const checkModulo = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase.from('clinico_usuarios').select('modulo_asignado').eq('id', session.user.id).single();
      if (data?.modulo_asignado) {
        setModulo(data.modulo_asignado);
      }
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modulo) return alert("No tienes un módulo asignado. Eres admin o paciente.");
    if (!searchTerm) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(`clinico_pacientes_${modulo}`)
        .select('*')
        .ilike('nombre', `%${searchTerm}%`)
        .order('creado_en', { ascending: false });

      if (error) throw error;
      setPacientes(data || []);
      setSelectedPaciente(null);
      setHistoria([]);
    } catch (error: any) {
      alert("Error al buscar pacientes: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadHistoria = async (paciente: any) => {
    setSelectedPaciente(paciente);
    if (!modulo) return;

    try {
      const { data, error } = await supabase
        .from(`clinico_historias_${modulo}`)
        .select('*, clinico_usuarios(nombre_completo)')
        .eq('paciente_id', paciente.id)
        .order('fecha_consulta', { ascending: false });

      if (error) throw error;
      setHistoria(data || []);
    } catch (error: any) {
      alert("Error al cargar historial: " + error.message);
    }
  };

  const getModuleIcon = () => {
    switch (modulo) {
      case 'cardiologia': return <Activity size={36} color="#059669" />;
      case 'ginecologia': return <HeartPulse size={36} color="#e11d48" />;
      case 'urologia': return <Droplets size={36} color="#0284c7" />;
      case 'pediatria': return <Baby size={36} color="#8b5cf6" />;
      default: return <Users size={36} color="var(--color-primary)" />;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header} style={{ marginBottom: '2rem' }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          {getModuleIcon()}
          <div>
            <h1>Historial de Pacientes</h1>
            <p className="text-muted">Busca pacientes de tu módulo ({modulo ? modulo.toUpperCase() : 'Ninguno'}) y revisa sus consultas previas.</p>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Panel Izquierdo: Buscador y Lista */}
        <div>
          <form onSubmit={handleSearch} className="card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
            <div className="input-group">
              <label className="input-label">Buscar Paciente por Nombre</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ej. Juan Pérez" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0 1rem' }} disabled={loading}>
                  <Search size={20} />
                </button>
              </div>
            </div>
          </form>

          {pacientes.length > 0 && (
            <div className="card" style={{ padding: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Resultados de la búsqueda:</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {pacientes.map(p => (
                  <li 
                    key={p.id} 
                    onClick={() => loadHistoria(p)}
                    style={{
                      padding: '1rem',
                      marginBottom: '0.5rem',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      border: '1px solid var(--color-border)',
                      backgroundColor: selectedPaciente?.id === p.id ? 'var(--color-surface-hover)' : 'transparent',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <strong>{p.nombre}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                      Identidad: {p.identidad || p.identidad_tutor}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Panel Derecho: Detalles del Historial */}
        <div>
          {selectedPaciente ? (
            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{selectedPaciente.nombre}</h2>
                <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                  <span><strong>Identidad:</strong> {selectedPaciente.identidad || selectedPaciente.identidad_tutor}</span>
                  <span><strong>Teléfono:</strong> {selectedPaciente.telefono || selectedPaciente.telefono_tutor}</span>
                  <span><strong>Sexo:</strong> {selectedPaciente.sexo}</span>
                </div>
              </div>

              <h3 style={{ marginBottom: '1rem' }}>Consultas Previas ({historia.length})</h3>
              
              {historia.length === 0 ? (
                <p className="text-muted">No hay consultas registradas para este paciente.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {historia.map((h: any) => (
                    <div key={h.id} style={{ padding: '1.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.4)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
                          {new Date(h.fecha_consulta).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        <span style={{ fontSize: '0.8rem', backgroundColor: '#e2e8f0', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                          Dr(a). {h.clinico_usuarios?.nombre_completo || 'Desconocido'}
                        </span>
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>MOTIVO DE CONSULTA:</strong>
                        <p>{h.motivo_consulta}</p>
                      </div>
                      
                      {h.examen_fisico && (
                        <div style={{ marginBottom: '0.5rem' }}>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>EXAMEN FÍSICO / OBSERVACIONES:</strong>
                          <p>{h.examen_fisico || h.observaciones}</p>
                        </div>
                      )}

                      {/* Algunos campos específicos por módulo */}
                      {h.psa && <p><strong style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>PSA:</strong> {h.psa}</p>}
                      {h.presion_arterial && <p><strong style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>PA:</strong> {h.presion_arterial}</p>}
                      {h.peso_actual && <p><strong style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Peso:</strong> {h.peso_actual} kg</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', color: 'var(--color-text-muted)' }}>
              <Search size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>Busca y selecciona un paciente para ver su historial médico completo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
