
import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  PieChart, 
  TrendingUp, 
  Calendar, 
  CreditCard, 
  ShoppingBag, 
  Package, 
  PackageSearch, 
  PackageX, 
  Layers, 
  Users, 
  Truck, 
  Trash2, 
  Wallet, 
  ClipboardList,
  ArrowLeft,
  Search,
  ChevronRight,
  X
} from 'lucide-react';
import { Sale, Purchase, AppSettings, Product, Expense, Customer, Supplier } from '../types';
import AIAnalysis from './AIAnalysis';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

interface Props {
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  settings: AppSettings;
}

type ReportType = 
  | 'transactions_day' 
  | 'transactions_summary' 
  | 'sales_credit' 
  | 'purchases_credit' 
  | 'product_sales' 
  | 'product_purchases' 
  | 'products_no_sales' 
  | 'category_sales' 
  | 'clients_ranking' 
  | 'suppliers_ranking' 
  | 'product_waste' 
  | 'payment_methods' 
  | 'inventory_adjustments';

const Reports: React.FC<Props> = ({ sales, purchases, expenses, products, customers, suppliers, settings }) => {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const reportCards = [
    { id: 'transactions_day', title: 'Transacciones Por Día', icon: <Calendar size={24} />, color: 'bg-emerald-500' },
    { id: 'transactions_summary', title: 'Resumen Transacciones', icon: <BarChart3 size={24} />, color: 'bg-emerald-600' },
    { id: 'sales_credit', title: 'Ventas Crédito', icon: <CreditCard size={24} />, color: 'bg-amber-500' },
    { id: 'purchases_credit', title: 'Compras Crédito', icon: <ShoppingBag size={24} />, color: 'bg-amber-600' },
    { id: 'product_sales', title: 'Producto Ventas', icon: <Package size={24} />, color: 'bg-indigo-500' },
    { id: 'product_purchases', title: 'Producto Compras', icon: <PackageSearch size={24} />, color: 'bg-indigo-600' },
    { id: 'products_no_sales', title: 'Productos Sin Ventas', icon: <PackageX size={24} />, color: 'bg-rose-500' },
    { id: 'category_sales', title: 'Categoría Ventas', icon: <Layers size={24} />, color: 'bg-rose-600' },
    { id: 'clients_ranking', title: 'Ranking Clientes', icon: <Users size={24} />, color: 'bg-cyan-500' },
    { id: 'suppliers_ranking', title: 'Ranking Proveedores', icon: <Truck size={24} />, color: 'bg-cyan-600' },
    { id: 'product_waste', title: 'Merma Productos', icon: <Trash2 size={24} />, color: 'bg-yellow-600' },
    { id: 'payment_methods', title: 'Forma Pago', icon: <Wallet size={24} />, color: 'bg-teal-600' },
    { id: 'inventory_adjustments', title: 'Modificación Inventario', icon: <ClipboardList size={24} />, color: 'bg-slate-600' },
  ];
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

  const renderReportDetail = () => {
    if (!selectedReport) return null;

    let title = "";
    let content = null;

    switch (selectedReport) {
      case 'transactions_day':
        title = "Transacciones Por Día";
        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          return {
            date: dateStr,
            total: sales.filter(s => s.date.startsWith(dateStr)).reduce((sum, s) => sum + s.totalUSD, 0)
          };
        }).reverse();

        content = (
          <div className="space-y-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7Days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `$${val}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                  <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
        break;

      case 'category_sales':
        title = "Ventas por Categoría";
        const categoryData = products.reduce((acc: any[], p) => {
          const catSales = sales.reduce((sum, s) => 
            sum + s.items.filter(i => i.productId === p.id).reduce((isum, item) => isum + (item.quantity * item.priceUSD), 0), 0
          );
          const existing = acc.find(a => a.name === p.category);
          if (existing) {
            existing.value += catSales;
          } else {
            acc.push({ name: p.category, value: catSales });
          }
          return acc;
        }, []).filter(c => c.value > 0).sort((a, b) => b.value - a.value);

        content = (
          <div className="space-y-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={100} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                  <Bar dataKey="value" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
        break;

      case 'product_waste':
        title = "Merma de Productos";
        const wasteProducts = products
          .filter(p => (p.mermaTotal || 0) > 0)
          .sort((a, b) => (b.mermaTotal || 0) - (a.mermaTotal || 0));
        
        content = (
          <div className="space-y-4">
            <div className="bg-[#0f172a] rounded-2xl overflow-hidden border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1e293b] text-slate-400 font-black uppercase tracking-widest">
                  <tr>
                    <th className="p-4">Producto</th>
                    <th className="p-4 text-right">Cantidad Merma</th>
                    <th className="p-4 text-right">Valor Est. (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {wasteProducts.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 font-bold">{p.name}</td>
                      <td className="p-4 text-right font-black text-rose-400">{p.mermaTotal}</td>
                      <td className="p-4 text-right font-black text-slate-400">${((p.mermaTotal || 0) * p.costUSD).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
        break;

      case 'payment_methods':
        title = "Ventas por Forma de Pago";
        // Asumiendo que las ventas pagadas son 'Efectivo' por defecto si no hay campo
        const paymentData = [
          { name: 'Contado', value: sales.filter(s => s.status === 'paid').reduce((sum, s) => sum + s.totalUSD, 0) },
          { name: 'Crédito', value: sales.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.totalUSD, 0) },
        ].sort((a, b) => b.value - a.value);

        content = (
          <div className="space-y-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `$${val}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                  <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
        break;

      case 'product_sales':
        title = "Top Productos Vendidos";
        const topProducts = products
          .map(p => ({
            name: p.name,
            total: sales.reduce((sum, s) => sum + s.items.filter(i => i.productId === p.id).reduce((isum, item) => isum + item.quantity, 0), 0)
          }))
          .filter(p => p.total > 0)
          .sort((a, b) => b.total - a.total)
          .slice(0, 10);
        
        content = (
          <div className="space-y-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} hide />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={100} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                  <Bar dataKey="total" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-[#0f172a] rounded-2xl overflow-hidden border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1e293b] text-slate-400 font-black uppercase tracking-widest">
                  <tr>
                    <th className="p-4">Producto</th>
                    <th className="p-4 text-right">Cantidad Vendida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {topProducts.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 font-bold">{p.name}</td>
                      <td className="p-4 text-right font-black text-emerald-400">{p.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
        break;

      case 'sales_credit':
        title = "Ventas a Crédito (CXC)";
        const creditSales = sales.filter(s => s.status === 'pending');
        content = (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1e293b] p-4 rounded-2xl border border-slate-700">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Pendiente</p>
                <p className="text-2xl font-black text-amber-400">${creditSales.reduce((sum, s) => sum + s.totalUSD, 0).toFixed(2)}</p>
              </div>
              <div className="bg-[#1e293b] p-4 rounded-2xl border border-slate-700">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cant. Facturas</p>
                <p className="text-2xl font-black text-white">{creditSales.length}</p>
              </div>
            </div>
            <div className="bg-[#0f172a] rounded-2xl overflow-hidden border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1e293b] text-slate-400 font-black uppercase tracking-widest">
                  <tr>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Fecha</th>
                    <th className="p-4 text-right">Monto USD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {creditSales.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 font-bold">{s.customerName}</td>
                      <td className="p-4 text-slate-400">{new Date(s.date).toLocaleDateString()}</td>
                      <td className="p-4 text-right font-black text-amber-400">${s.totalUSD.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
        break;

      case 'clients_ranking':
        title = "Ranking de Clientes";
        const clientRanking = customers
          .map(c => ({
            name: c.name,
            total: sales.filter(s => s.customerId === c.id).reduce((sum, s) => sum + s.totalUSD, 0)
          }))
          .filter(c => c.total > 0)
          .sort((a, b) => b.total - a.total);
        
        content = (
          <div className="space-y-4">
            <div className="bg-[#0f172a] rounded-2xl overflow-hidden border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1e293b] text-slate-400 font-black uppercase tracking-widest">
                  <tr>
                    <th className="p-4">Cliente</th>
                    <th className="p-4 text-right">Total Comprado (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {clientRanking.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 font-bold">{c.name}</td>
                      <td className="p-4 text-right font-black text-emerald-400">${c.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
        break;

      default:
        title = "Reporte en Desarrollo";
        content = (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
               <BarChart3 className="text-slate-600" size={40} />
            </div>
            <p className="text-slate-400 text-sm">Estamos trabajando en la visualización detallada de este reporte.</p>
          </div>
        );
    }

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedReport(null)} />
        <div className="relative bg-[#0f172a] w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
          <header className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#1e293b]/50">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSelectedReport(null)}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-xl font-black uppercase tracking-tighter">{title}</h2>
            </div>
            <button 
              onClick={() => setSelectedReport(null)}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
            >
              <X size={24} />
            </button>
          </header>
          <div className="p-6 overflow-y-auto">
            {content}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {renderReportDetail()}
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reportes</h1>
          <p className="text-slate-400 text-sm">Análisis detallado de tu negocio</p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar reporte..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#1e293b] border border-slate-700 rounded-2xl py-3 pl-12 pr-6 text-sm focus:outline-none focus:border-orange-500 transition-all w-full md:w-64"
          />
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {reportCards
          .filter(card => card.title.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((card) => (
          <button 
            key={card.id}
            onClick={() => setSelectedReport(card.id as ReportType)}
            className="group relative flex flex-col items-center justify-center p-6 rounded-[2rem] bg-[#1e293b] border border-slate-700 hover:border-orange-500/50 transition-all hover:shadow-2xl hover:shadow-orange-500/10 active:scale-95 overflow-hidden"
          >
            <div className={`w-14 h-14 ${card.color} rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
              {card.icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-center text-slate-300 group-hover:text-white transition-colors">
              {card.title}
            </span>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight size={16} className="text-slate-500" />
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        <AIAnalysis 
          sales={sales} 
          purchases={purchases} 
          expenses={expenses} 
          products={products} 
          settings={settings}
        />
        
        <div className="bg-[#1e293b] p-8 rounded-[2.5rem] border border-slate-700 shadow-xl space-y-6">
           <h2 className="text-xl font-bold flex items-center gap-2">
              <FileSpreadsheet className="text-orange-500" /> Exportar Datos
           </h2>
           <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={exportToCSV}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-slate-700"
              >
                 <Download size={20} /> Ventas (CSV)
              </button>
              <button 
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-slate-700 opacity-50 cursor-not-allowed"
              >
                 <Download size={20} /> Inventario (PDF)
              </button>
           </div>
        </div>

        <div className="bg-[#1e293b] p-8 rounded-[2.5rem] border border-slate-700 shadow-xl space-y-6">
           <h2 className="text-xl font-bold flex items-center gap-2">
              <PieChart className="text-emerald-500" /> Resumen Financiero
           </h2>
           <div className="space-y-4 py-4">
              <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-400">Ventas Brutas:</span>
                 <span className="font-bold text-white">${totalSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-400">Inversión (Compras):</span>
                 <span className="font-bold text-rose-400">${totalPurchases.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-400">Gastos Operativos:</span>
                 <span className="font-bold text-rose-400">${totalExpenses.toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
                 <span className="font-bold">Utilidad Neta:</span>
                 <span className={`text-xl font-black ${estimatedProfit >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                   ${estimatedProfit.toFixed(2)}
                 </span>
              </div>
           </div>
        </div>

        <div className="bg-[#1e293b] p-8 rounded-[2.5rem] border border-slate-700 shadow-xl space-y-6 md:col-span-2">
           <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="text-indigo-400" /> Comparativa Financiera (USD)
           </h2>
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={[
                    { name: 'Ventas', total: totalSales },
                    { name: 'Compras', total: totalPurchases },
                    { name: 'Gastos', total: totalExpenses },
                 ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={60}>
                      <Cell fill="#10b981" />
                      <Cell fill="#f43f5e" />
                      <Cell fill="#6366f1" />
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
