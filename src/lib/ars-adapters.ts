// ============================================================
// ARQUITECTURA DE ADAPTADORES PARA ASEGURADORAS (ARS)
// ============================================================
// Cada ARS tiene su propio adapter con su implementación de
// validación de cobertura. Agregar una nueva integración NO
// afecta el resto del sistema: se crea el adapter, se registra
// en ADAPTERS y se asigna a la aseguradora (columna `adapter`).
//
// Adapters disponibles:
//  - manual : sin API. La cobertura se registra manualmente
//             usando el tarifario/plan configurado como base.
//  - <ars>  : implementaciones específicas cuando la ARS
//             provea API (requiere convenio y credenciales).
// ============================================================

export interface DatosValidacion {
  numero_afiliado: string;
  cedula?: string;
  tipo_servicio?: string;
  codigo_procedimiento?: string;
  monto_servicio?: number;
  plan?: string;
}

export interface ConfigAseguradora {
  id: string;
  nombre: string;
  adapter?: string;
  api_base_url?: string;
  api_usuario?: string;
  api_key?: string;
  api_token?: string;
  config?: Record<string, any>;
}

export interface ResultadoValidacion {
  ok: boolean;
  estado: "validado" | "rechazado" | "pendiente" | "error";
  cobertura_aprobada: boolean;
  copago: number;
  deducible: number;
  monto_autorizado: number;
  numero_autorizacion?: string;
  via: "api" | "manual";
  mensaje?: string;
  respuesta_raw?: any;
}

export interface ArsAdapter {
  nombre: string;
  /** Consulta la cobertura del afiliado en la ARS */
  validarCobertura(
    aseguradora: ConfigAseguradora,
    datos: DatosValidacion,
    contexto: { tarifa?: { tarifa: number; copago: number }; plan?: { copago_defecto: number; cobertura_pct: number } }
  ): Promise<ResultadoValidacion>;
}

// ============================================================
// ADAPTER MANUAL (por defecto)
// Sin API: calcula usando el tarifario/plan configurado y deja
// la autorización en estado pendiente de confirmación manual.
// ============================================================
const manualAdapter: ArsAdapter = {
  nombre: "manual",
  async validarCobertura(_aseguradora, datos, contexto) {
    const monto = Number(datos.monto_servicio || 0);

    // Prioridad: tarifa específica > plan > estimación 80/20
    if (contexto.tarifa) {
      return {
        ok: true,
        estado: "validado",
        cobertura_aprobada: true,
        copago: Number(contexto.tarifa.copago || 0),
        deducible: 0,
        monto_autorizado: Number(contexto.tarifa.tarifa || 0),
        via: "manual",
        mensaje: "Cobertura calculada según tarifario configurado. Confirmar autorización con la ARS.",
      };
    }
    if (contexto.plan) {
      const autorizado = Math.round(monto * (Number(contexto.plan.cobertura_pct) / 100) * 100) / 100;
      return {
        ok: true,
        estado: "validado",
        cobertura_aprobada: true,
        copago: Number(contexto.plan.copago_defecto || Math.max(0, monto - autorizado)),
        deducible: 0,
        monto_autorizado: autorizado,
        via: "manual",
        mensaje: "Cobertura calculada según plan configurado. Confirmar autorización con la ARS.",
      };
    }
    // Estimación estándar RD: ARS cubre 80%, paciente 20%
    const autorizado = Math.round(monto * 0.8 * 100) / 100;
    return {
      ok: true,
      estado: "pendiente",
      cobertura_aprobada: false,
      copago: Math.round((monto - autorizado) * 100) / 100,
      deducible: 0,
      monto_autorizado: autorizado,
      via: "manual",
      mensaje: "Estimación 80/20 (sin tarifario configurado). Validar con la ARS y confirmar manualmente.",
    };
  },
};

// ============================================================
// ADAPTER API GENÉRICO (REST)
// Para ARS con API REST: usa api_base_url + token. El formato
// de request/response se ajusta en config JSONB por aseguradora.
// ============================================================
const apiGenericoAdapter: ArsAdapter = {
  nombre: "api_generico",
  async validarCobertura(aseguradora, datos, contexto) {
    if (!aseguradora.api_base_url) {
      return {
        ok: false,
        estado: "error",
        cobertura_aprobada: false,
        copago: 0,
        deducible: 0,
        monto_autorizado: 0,
        via: "api",
        mensaje: "La aseguradora no tiene API configurada (api_base_url vacío). Configúrala en el módulo ARS.",
      };
    }
    try {
      const endpoint = aseguradora.config?.endpoint_validacion || "/coberturas/validar";
      const res = await fetch(`${aseguradora.api_base_url}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(aseguradora.api_token ? { Authorization: `Bearer ${aseguradora.api_token}` } : {}),
          ...(aseguradora.api_key ? { "x-api-key": aseguradora.api_key } : {}),
        },
        body: JSON.stringify({
          afiliado: datos.numero_afiliado,
          cedula: datos.cedula,
          servicio: datos.tipo_servicio,
          codigo: datos.codigo_procedimiento,
          monto: datos.monto_servicio,
        }),
        signal: AbortSignal.timeout(15000),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          ok: false,
          estado: "error",
          cobertura_aprobada: false,
          copago: 0,
          deducible: 0,
          monto_autorizado: 0,
          via: "api",
          mensaje: `La API de la ARS respondió ${res.status}. Validar manualmente.`,
          respuesta_raw: json,
        };
      }
      // Mapeo estándar; los nombres de campos se pueden ajustar en config.mapeo
      const m = aseguradora.config?.mapeo || {};
      return {
        ok: true,
        estado: json[m.aprobada ?? "aprobada"] ? "validado" : "rechazado",
        cobertura_aprobada: !!json[m.aprobada ?? "aprobada"],
        copago: Number(json[m.copago ?? "copago"] || 0),
        deducible: Number(json[m.deducible ?? "deducible"] || 0),
        monto_autorizado: Number(json[m.monto_autorizado ?? "monto_autorizado"] || 0),
        numero_autorizacion: json[m.numero_autorizacion ?? "numero_autorizacion"],
        via: "api",
        respuesta_raw: json,
      };
    } catch (e: any) {
      // Fallback: si la API falla, usar cálculo manual
      const manual = await manualAdapter.validarCobertura(aseguradora, datos, contexto);
      return { ...manual, mensaje: `API no disponible (${e?.message}). ${manual.mensaje}` };
    }
  },
};

// ============================================================
// REGISTRO DE ADAPTERS
// Para agregar una ARS con API propia: crear su adapter aquí
// (ej. senasaAdapter con su autenticación y formato) y
// registrarlo con su clave.
// ============================================================
const ADAPTERS: Record<string, ArsAdapter> = {
  manual: manualAdapter,
  api_generico: apiGenericoAdapter,
  // senasa: senasaAdapter,      ← futura integración
  // humano: humanoAdapter,      ← futura integración
  // universal: universalAdapter ← futura integración
};

export function getAdapter(nombre?: string): ArsAdapter {
  return ADAPTERS[nombre || "manual"] || manualAdapter;
}

export const ADAPTERS_DISPONIBLES = Object.keys(ADAPTERS);
