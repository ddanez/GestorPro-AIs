
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || "" });

export const analyzeFinancialData = async (data: any) => {
  const model = "gemini-3.1-flash-lite-preview";
  
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

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing data with Gemini:", error);
    return "Lo siento, no pude realizar el análisis en este momento. Por favor, intenta más tarde.";
  }
};
