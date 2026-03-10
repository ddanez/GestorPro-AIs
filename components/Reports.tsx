
import React from 'react';
import { BarChart3, Download, FileSpreadsheet, PieChart, TrendingUp } from 'lucide-react';
import { Sale, Purchase, AppSettings, Product, Expense } from '../types';
import AIAnalysis from './AIAnalysis';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
  products: Product[];
  settings: AppSettings;
}

const Reports: React.FC<Props> = ({ sales, purchases, expenses, products, settings }) => {
  const chartData = [
    { name: 'Ventas', total: sales.reduce((sum, s) => sum + s.totalUSD, 0) },
    { name: 'Compras', total: purchases.reduce((sum, p) => sum + p.totalUSD, 0) },
    { name: 'Gastos', total: expenses.reduce((sum, e) => sum + e.amountUSD, 0) },
  ];

  const exportToCSV = () => {
    const headers = ['ID', 'Fecha', 'Cliente', 'Total USD', 'Total BS', 'Estado'];
    const rows = sales.map(s => [
      s.id,
      s.date,
      s.customerName,
      s.totalUSD.toFixed(2),
      s.totalBS.toFixed(2),
      s.status === 'paid' ? 'Pagado' : 'Pendiente'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ventas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalSales = sales.reduce((sum, s) => sum + s.totalUSD, 0);
  const totalPurchases = purchases.reduce((sum, p) => sum + p.totalUSD, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amountUSD, 0);
  const estimatedProfit = totalSales - totalPurchases - totalExpenses;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-bold">Reportes</h1>
        <p className="text-slate-400 text-sm">Análisis y exportación de datos</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AIAnalysis 
          sales={sales} 
          purchases={purchases} 
          expenses={expenses} 
          products={products} 
          settings={settings}
        />
        
        <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-700 shadow-xl space-y-6">
           <h2 className="text-xl font-bold flex items-center gap-2">
              <FileSpreadsheet className="text-orange-500" /> Exportar Ventas
           </h2>
           <div className="space-y-4">
              <p className="text-xs text-slate-400">Descarga un archivo CSV con el historial completo de ventas para abrir en Excel.</p>
              <button 
                onClick={exportToCSV}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all active:scale-95"
              >
                 <Download size={20} /> Descargar CSV (Excel)
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
                 <span className="font-bold text-white">${totalSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-400">Costo de Inversión (Compras):</span>
                 <span className="font-bold text-rose-400">${totalPurchases.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-400">Gastos Operativos:</span>
                 <span className="font-bold text-rose-400">${totalExpenses.toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
                 <span className="font-bold">Utilidad Neta Estimada:</span>
                 <span className={`text-xl font-black ${estimatedProfit >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                   ${estimatedProfit.toFixed(2)}
                 </span>
              </div>
           </div>
        </div>

        <div className="bg-[#1e293b] p-8 rounded-3xl border border-slate-700 shadow-xl space-y-6 md:col-span-2">
           <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="text-indigo-400" /> Comparativa Financiera (USD)
           </h2>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="total" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={60} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
