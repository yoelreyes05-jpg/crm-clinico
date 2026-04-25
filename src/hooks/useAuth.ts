import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { obtenerSesion, obtenerUsuarioActual, logout as authLogout, obtenerToken } from "@/lib/auth";
import { UsuarioSession } from "@/types";

interface AuthState {
  usuario: UsuarioSession | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

/**
 * Hook personalizado para manejar autenticación
 * Evita parpadeos y re-renders innecesarios
 * Usa referencias para evitar loops de re-render
 */
export function useAuth() {
  const router = useRouter();
  const initRef = useRef(false);
  const [state, setState] = useState<AuthState>({
    usuario: null,
    token: null,
    loading: true,
    error: null,
    initialized: false,
  });

  // Inicializar autenticación solo UNA VEZ al montar
  useEffect(() => {
    // Prevenir ejecución múltiple
    if (initRef.current) return;
    initRef.current = true;

    const initAuth = async () => {
      try {
        // Pequeño delay para permitir que el DOM se renderice
        await new Promise(resolve => setTimeout(resolve, 0));

        const session = obtenerSesion();
        const usuario = obtenerUsuarioActual();
        const token = obtenerToken();

        if (!session || !usuario || !token) {
          setState({
            usuario: null,
            token: null,
            loading: false,
            error: "No autenticado",
            initialized: true,
          });

          // Redirigir a login de forma asincrónica
          router.push("/login");
          return;
        }

        setState({
          usuario,
          token,
          loading: false,
          error: null,
          initialized: true,
        });
      } catch (err) {
        console.error("Error en initAuth:", err);
        setState({
          usuario: null,
          token: null,
          loading: false,
          error: "Error de autenticación",
          initialized: true,
        });
        router.push("/login");
      }
    };

    initAuth();
  }, []); // Array vacío - solo se ejecuta al montar

  // Función logout memorizada
  const logout = useCallback(async () => {
    await authLogout();
    router.push("/login");
  }, [router]);

  return {
    usuario: state.usuario,
    token: state.token,
    loading: state.loading,
    error: state.error,
    initialized: state.initialized,
    logout,
    isAuthenticated: !!state.usuario && !!state.token,
  };
}
