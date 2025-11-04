"use client";

import { useEffect, useRef } from "react";
import { signOut } from "next-auth/react";

const INACTIVITY_MS = (parseInt(process.env.NEXT_PUBLIC_INACTIVITY_MINUTES || "30") || 30) * 60 * 1000; // 30 min por defecto

export default function InactivityLogout() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const resetTimer = () => {
      // Limpiar timer anterior
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Crear nuevo timer
      timerRef.current = setTimeout(() => {
        console.log("🔒 Sesión cerrada por inactividad");
        signOut({ callbackUrl: "/auth/login" });
      }, INACTIVITY_MS);
    };

    // Eventos que indican actividad del usuario
    const events = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
      "visibilitychange", // Cuando el usuario cambia de pestaña
    ];

    // Agregar listeners a todos los eventos
    events.forEach((eventName) => {
      window.addEventListener(eventName, resetTimer);
    });

    // Iniciar el timer
    resetTimer();

    // Cleanup: remover listeners y limpiar timer
    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, resetTimer);
      });
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Este componente no renderiza nada
  return null;
}
