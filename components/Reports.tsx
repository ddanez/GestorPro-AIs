
import React from 'react';
import { BarChart3, Download, FileSpreadsheet, PieChart } from 'lucide-react';
import { Sale, Purchase, AppSettings } from '../types';

interface Props {
  sales: Sale[];
  purchases: Purchase[];
  settings: AppSettings;
}

const Reports: React.FC<Props> = ({ sales, purchases, settings }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-bold">Reportes</h1>
        <p className="text-slate-400 text-sm">Análisis y exportación de datos</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-700 shadow-xl space-y-6">
           <h2 className="text-xl font-bold flex items-center gap-2">
              <FileSpreadsheet className="text-orange-500" /> Exportar Ventas
           </h2>
           <div className="space-y-4">
              <div className="flex flex-col gap-2">
                 <label className="text-xs text-slate-400">Desde</label>
                 <input type="date" className="bg-[#0f172a] border border-slate-700 rounded-xl p-3 focus:outline-none" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="flex flex-col gap-2">
                 <label className="text-xs text-slate-400">Hasta</label>
                 <input type="date" className="bg-[#0f172a] border border-slate-700 rounded-xl p-3 focus:outline-none" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20">
                 <Download size={20} /> Generar Reporte PDF
              </button>
           </div>
        </div>

        <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-700 shadow-xl space-y-6">
           <h2 className="text-xl font-bold flex items-center gap-2">
              <PieChart className="text-emerald-500" /> Resumen de Utilidades
           </h2>
           <div className="space-y-4 py-4">
              <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-400">Ventas Brutas:</span>
                 <span className="font-bold text-white">${sales.reduce((sum, s) => sum + s.totalUSD, 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-400">Costo de Inversión:</span>
                 <span className="font-bold text-rose-400">${purchases.reduce((sum, p) => sum + p.totalUSD, 0).toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
                 <span className="font-bold">Utilidad Estimada:</span>
                 <span className="text-xl font-black text-emerald-400">${(sales.reduce((sum, s) => sum + s.totalUSD, 0) - (sales.reduce((sum, s) => sum + (s.items.length * 10), 0))).toFixed(2)}</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
