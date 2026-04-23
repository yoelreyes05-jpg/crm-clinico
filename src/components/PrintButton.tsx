"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button 
      onClick={handlePrint} 
      className="btn btn-outline no-print"
      title="Imprimir Historia Clínica"
    >
      <Printer size={18} />
      <span>Imprimir Formulario</span>
    </button>
  );
}
