
import React, { useState } from 'react';
import { Sparkles, BrainCircuit, Loader2, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { analyzeFinancialData } from '../geminiService';
import Markdown from 'react-markdown';

interface Props {
  sales: any[];
  purchases: any[];
  expenses: any[];
  products: any[];
}

const AIAnalysis: React.FC<Props> = ({ sales, purchases, expenses, products }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    const data = {
      resumen: {
        totalVentas: sales.length,
        totalCompras: purchases.length,
        totalGastosOperativos: expenses.length,
        totalProductos: products.length,
        ingresosUSD: sales.reduce((sum, s) => sum + s.totalUSD, 0),
        costoInversionUSD: purchases.reduce((sum, p) => sum + p.totalUSD, 0),
        gastosOperativosUSD: expenses.reduce((sum, e) => sum + e.amountUSD, 0),
      },
      ventasRecientes: sales.slice(-10).map(s => ({ fecha: s.date, total: s.totalUSD })),
      gastosRecientes: expenses.slice(-10).map(e => ({ fecha: e.date, desc: e.description, total: e.amountUSD })),
      productosBajoStock: products.filter(p => p.stock <= (p.minStock || 5)).map(p => ({ nombre: p.name, stock: p.stock }))
    };

    const result = await analyzeFinancialData(data);
    setAnalysis(result || "No se pudo generar el análisis.");
    setLoading(false);
  };

  return (
    <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-700 shadow-xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="text-amber-400 animate-pulse" /> Análisis Inteligente Gemini
        </h2>
        {!analysis && !loading && (
          <button 
            onClick={handleAnalyze}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold py-2 px-4 rounded-full flex items-center gap-2 transition-all transform hover:scale-105"
          >
            <BrainCircuit size={16} /> Generar Análisis
          </button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="text-indigo-500 animate-spin" size={48} />
          <p className="text-slate-400 animate-pulse">Gemini está analizando tus finanzas...</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
          <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed">
            <Markdown>{analysis}</Markdown>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setAnalysis(null)}
              className="text-xs text-slate-500 hover:text-slate-300 underline"
            >
              Nuevo análisis
            </button>
            
            {analysis.includes("configura tu llave de API de Gemini") && (
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                ⚠️ VE A LA PESTAÑA DE "AJUSTES" PARA CONFIGURAR TU LLAVE.
              </p>
            )}
            
            {analysis.includes("No se ha detectado la llave") && (
              <button 
                onClick={async () => {
                  // Try to find aistudio in window or parent (for mobile/iframe issues)
                  const aiStudio = (window as any).aistudio || (window.parent as any)?.aistudio;
                  
                  if (aiStudio && typeof aiStudio.openSelectKey === 'function') {
                    try {
                      await aiStudio.openSelectKey();
                      // After opening, we assume success as per guidelines and reload
                      setTimeout(() => window.location.reload(), 1000);
                    } catch (e) {
                      console.error("Error calling openSelectKey:", e);
                      alert("Error al abrir el configurador de llaves.");
                    }
                  } else {
                    console.error("AI Studio API not found in window.aistudio or parent.aistudio");
                    alert("La herramienta de configuración no se detectó automáticamente. Por favor, asegúrate de estar usando el entorno de AI Studio o intenta recargar la página.");
                  }
                }}
                className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold py-1 px-3 rounded-full transition-all"
              >
                Configurar Llave Manualmente
              </button>
            )}
          </div>
        </div>
      )}

      {!analysis && !loading && (
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <div className="bg-[#0f172a] p-4 rounded-full">
            <TrendingUp className="text-slate-600" size={32} />
          </div>
          <p className="text-slate-400 text-sm max-w-xs">
            Obtén una visión profunda de tu negocio. Gemini analizará tus ventas, stock y gastos para darte consejos estratégicos.
          </p>
        </div>
      )}
    </div>
  );
};

export default AIAnalysis;
