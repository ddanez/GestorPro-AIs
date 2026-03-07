
export const analyzeFinancialData = async (data: any) => {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    return "Error: No se ha detectado una sesión activa. Por favor, inicia sesión de nuevo.";
  }

  const prompt = `
    Eres un experto analista financiero para pequeños negocios. 
    Analiza los siguientes datos financieros de un negocio llamado "D'Danez Gestor Pro".
    Los datos incluyen ventas, compras de inventario (costo de inversión) y gastos operativos (alquiler, servicios, etc.).
    
    Proporciona:
    1. Un resumen ejecutivo del estado financiero actual.
    2. Análisis de rentabilidad (Ingresos vs Egresos Totales).
    3. Identificación de tendencias en ventas y gastos.
    4. 3 recomendaciones estratégicas para mejorar la utilidad neta.
    
    Responde en formato Markdown, con un tono profesional pero motivador. 
    Usa emojis para resaltar puntos clave.
    Menciona específicamente la "Utilidad Neta" (Ingresos - Compras - Gastos).
  `;

  try {
    console.log("🤖 Solicitando análisis al servidor...");
    const response = await fetch('/api/gemini/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ prompt, data })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error en la respuesta del servidor');
    }

    const result = await response.json();
    console.log("✅ Análisis completado exitosamente.");
    return result.text;
  } catch (error: any) {
    console.error("❌ Error al analizar datos con el servidor:", error);
    return `Lo siento, no pude realizar el análisis en este momento. ${error.message || 'Por favor, intenta más tarde.'}`;
  }
};
