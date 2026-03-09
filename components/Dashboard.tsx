
import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  CreditCard, 
  AlertTriangle,
  ShoppingCart,
  Tag,
  HandCoins,
  DollarSign,
  PiggyBank,
  Trash2,
  Wallet
} from 'lucide-react';
import { Sale, Purchase, Product, AppSettings, Expense } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
  products: Product[];
  settings: AppSettings;
}

const Dashboard: React.FC<Props> = ({ sales, purchases, expenses, products, settings }) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Memoizar estadísticas para rendimiento
  const stats = useMemo(() => {
    const salesToday = sales.filter(s => s.date.startsWith(today));
    const purchasesToday = purchases.filter(p => p.date.startsWith(today));
    
    const grossSalesToday = salesToday.reduce((sum, s) => sum + (s.totalUSD || 0), 0);
    const cashSalesToday = salesToday.reduce((sum, s) => sum + (s.paidAmountUSD || 0), 0);
    const creditSalesToday = grossSalesToday - cashSalesToday;
    const collectionsToday = cashSalesToday; 
    const totalPurchasesToday = purchasesToday.reduce((sum, p) => sum + (p.totalUSD || 0), 0);
    const totalExpensesToday = expenses.filter(e => e.date.startsWith(today)).reduce((sum, e) => sum + (e.amountUSD || 0), 0);
    const wasteTodayUSD = (products.reduce((sum, p) => sum + ((p.mermaTotal || 0) * (p.costUSD || 0)), 0) / 30) || 0;
    
    const totalCreditsPending = sales.filter(s => s.status === 'pending').reduce((sum, s) => sum + ((s.totalUSD || 0) - (s.paidAmountUSD || 0)), 0);
    const lowStockProducts = products.filter(p => (p.stock || 0) <= (p.minStock || 0));

    // Calcular productos más vendidos
    const productSales: Record<string, { name: string, quantity: number, total: number }> = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.name, quantity: 0, total: 0 };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].total += (item.priceUSD || 0) * item.quantity;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Datos para el gráfico de tendencia (últimos 7 días)
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const daySales = sales.filter(s => s.date.startsWith(dateStr)).reduce((sum, s) => sum + s.totalUSD, 0);
      return {
        name: d.toLocaleDateString('es-VE', { weekday: 'short' }),
        total: daySales,
        date: dateStr
      };
    }).reverse();

    return {
      grossSalesToday, cashSalesToday, creditSalesToday, collectionsToday,
      totalPurchasesToday, totalExpensesToday, wasteTodayUSD, totalCreditsPending, lowStockProducts,
      topProducts,
      last7Days
    };
  }, [sales, purchases, expenses, products, today]);

  const StatCard = ({ label, value, icon: Icon, color, isToday }: any) => (
    <div className="bg-[#1e293b] p-5 rounded-[2rem] border border-slate-700/50 shadow-lg group hover:border-slate-500 transition-all">
      <div className="flex justify-between items-start mb-3">
        <div className={`p-3 rounded-2xl ${color} bg-opacity-10 ${color.replace('bg-', 'text-')} group-hover:scale-110 transition-transform`}>
          <Icon size={20} />
        </div>
        {isToday && <span className="text-[7px] font-black text-orange-500 bg-orange-500/10 px-2 py-1 rounded-lg tracking-widest uppercase">Hoy</span>}
      </div>
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">{label}</p>
      <h3 className="text-2xl font-black text-white mt-1.5 tracking-tighter leading-none">${(value || 0).toFixed(2)}</h3>
      <div className="flex items-center gap-1.5 mt-2">
         <span className="text-[10px] font-bold text-slate-400">{((value || 0) * (settings.exchangeRate || 0)).toLocaleString()} Bs</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
         <div className="space-y-1">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-orange-500 flex items-center gap-2">
               <TrendingUp size={16} /> Resumen de Actividad
            </h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estado del negocio al {new Date().toLocaleDateString('es-VE')}</p>
         </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Ventas Brutas" value={stats.grossSalesToday} icon={Tag} color="bg-orange-500" isToday />
        <StatCard label="Ventas Contado" value={stats.cashSalesToday} icon={DollarSign} color="bg-emerald-500" isToday />
        <StatCard label="Ventas Crédito" value={stats.creditSalesToday} icon={CreditCard} color="bg-rose-500" isToday />
        <StatCard label="Cobranzas Hoy" value={stats.collectionsToday} icon={PiggyBank} color="bg-indigo-500" isToday />
        <StatCard label="Gastos Hoy" value={stats.totalExpensesToday} icon={Wallet} color="bg-rose-500" isToday />
        <StatCard label="Compras Hoy" value={stats.totalPurchasesToday} icon={ShoppingCart} color="bg-amber-500" isToday />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
           <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-rose-500/20 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
                 <AlertTriangle size={120} />
              </div>
              <div className="flex justify-between items-center mb-4">
                 <AlertTriangle size={24} />
                 <span className="text-[8px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded-lg">Urgente</span>
              </div>
              <h3 className="text-4xl font-black tracking-tighter">{stats.lowStockProducts.length}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mt-1">Productos bajo el mínimo</p>
              
              {stats.lowStockProducts.length > 0 && (
                <div className="mt-4 space-y-2">
                  {stats.lowStockProducts.slice(0, 3).map(p => (
                    <div key={p.id} className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest bg-white/10 p-2 rounded-lg">
                      <span className="truncate max-w-[100px]">{p.name}</span>
                      <span className="text-white">{p.stock}</span>
                    </div>
                  ))}
                  {stats.lowStockProducts.length > 3 && (
                    <p className="text-[8px] text-center opacity-70">y {stats.lowStockProducts.length - 3} más...</p>
                  )}
                </div>
              )}
           </div>

           <div className="bg-[#1e293b] p-6 rounded-[2.5rem] border border-slate-700">
              <div className="flex justify-between items-center mb-4">
                 <HandCoins size={24} className="text-emerald-500" />
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cartera Clientes</span>
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total por Cobrar</p>
              <h3 className="text-3xl font-black text-white tracking-tighter mt-1">${(stats.totalCreditsPending || 0).toFixed(2)}</h3>
              <div className="mt-3 p-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                 <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest text-center">Capital Pendiente</p>
              </div>
           </div>

           <div className="bg-[#1e293b] p-6 rounded-[2.5rem] border border-slate-700">
               <div className="flex justify-between items-center mb-4">
                  <TrendingUp size={24} className="text-indigo-500" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Rendimiento</span>
               </div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Top Productos</p>
               <div className="mt-4 space-y-3">
                  {stats.topProducts.length > 0 ? (
                    stats.topProducts.map((p, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-500">#{i+1}</span>
                          <p className="text-[10px] font-black text-white uppercase truncate max-w-[100px]">{p.name}</p>
                        </div>
                        <span className="text-[10px] font-black text-indigo-400">{p.quantity} unds</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] font-black text-slate-600 uppercase text-center py-4">Sin datos de venta</p>
                  )}
               </div>
            </div>
        </div>

        <div className="md:col-span-2 bg-[#1e293b] p-6 rounded-[2.5rem] border border-slate-700">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                 <TrendingUp size={14} /> Tendencia de Ventas (7 días)
              </h3>
              <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg uppercase tracking-widest">En Vivo</span>
           </div>
           
           <div className="h-[200px] w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={stats.last7Days}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff', fontSize: '10px' }}
                      labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '4px' }}
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                       {stats.last7Days.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.date === today ? '#f97316' : '#6366f1'} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>

           <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <Tag size={14} /> Historial Reciente de Ventas
           </h3>
           <div className="space-y-3">
              {sales.slice(0, 5).length > 0 ? (
                sales.slice(0, 5).map(s => (
                  <div key={s.id} className="flex items-center justify-between p-4 bg-[#0f172a] rounded-2xl border border-slate-700/30">
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                           <Tag size={18}/>
                        </div>
                        <div>
                           <p className="text-xs font-black text-white uppercase truncate max-w-[150px]">{s.customerName}</p>
                           <p className="text-[8px] text-slate-500 font-bold uppercase">{s.status === 'paid' ? 'Contado' : 'Crédito'}</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-sm font-black text-white leading-none">${(s.totalUSD || 0).toFixed(2)}</p>
                        <p className="text-[8px] text-orange-500 font-bold uppercase mt-1">{((s.totalUSD || 0) * (s.exchangeRate || settings.exchangeRate)).toLocaleString()} Bs</p>
                     </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No hay movimientos hoy</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
