
import { GoogleGenAI, Type } from "@google/genai";

// Use process.env.GEMINI_API_KEY as per guidelines
const apiKey = (process.env as any).GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export const analyzeFinancialData = async (data: any) => {
  // Use a more stable model version
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Eres un experto analista financiero para pequeños negocios. 
    Analiza los siguientes datos financieros de un negocio llamado "D'Danez Gestor Pro".
    Los datos incluyen ventas, compras de inventario (costo de inversión) y gastos operativos (alquiler, servicios, etc.).
    
    Proporciona:
    1. Un resumen ejecutivo del estado financiero actual.
    2. Análisis de rentabilidad (Ingresos vs Egresos Totales).
    3. Identificación de tendencias en ventas y gastos.
    4. 3 recomendaciones estratégicas para mejorar la utilidad neta.
    
    DATOS:
    ${JSON.stringify(data, null, 2)}
    
    Responde en formato Markdown, con un tono profesional pero motivador. 
    Usa emojis para resaltar puntos clave.
    Menciona específicamente la "Utilidad Neta" (Ingresos - Compras - Gastos).
  `;

  if (!apiKey) {
    console.error("❌ Gemini API Key is missing. Please set GEMINI_API_KEY in environment variables.");
    return "Error: No se ha configurado la llave de API de Gemini. Por favor, contacta al administrador.";
  }

  try {
    console.log(`🤖 Iniciando análisis con Gemini (${model})...`);
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
    });
    
    if (!response || !response.text) {
      throw new Error("La respuesta de Gemini está vacía.");
    }

    console.log("✅ Análisis completado exitosamente.");
    return response.text;
  } catch (error: any) {
    console.error("❌ Error al analizar datos con Gemini:", error);
    
    // Provide more specific error messages if possible
    if (error.message?.includes("API key not valid")) {
      return "Error: La llave de API de Gemini no es válida. Por favor, verifícala.";
    }
    if (error.message?.includes("model not found")) {
      return `Error: El modelo '${model}' no está disponible o no existe.`;
    }
    
    return "Lo siento, no pude realizar el análisis en este momento. Por favor, intenta más tarde.";
  }
};
