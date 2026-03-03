
import React, { useState, useMemo } from 'react';
import { Plus, Search, User, Phone, Trash2, Edit2, X, UserCheck, Mail, Loader2, History, TrendingUp, Wallet, Receipt, ArrowRight } from 'lucide-react';
import { Customer, Supplier, Seller, AppSettings, Sale, Purchase, CompanyInfo } from '../types';
import { dbService } from '../db';
import { TicketModal } from './TicketModal';

interface Props {
  type: 'customers' | 'suppliers' | 'sellers';
  items: any[];
  setItems: React.Dispatch<React.SetStateAction<any[]>>;
  relatedData: any[]; // sales o purchases
  payments: any[];
  settings: AppSettings;
  company?: CompanyInfo;
}

export const Contacts: React.FC<Props> = ({ type, items, setItems, relatedData, payments, settings, company }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados para el historial
  const [historyItem, setHistoryItem] = useState<any>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const filteredItems = useMemo(() => {
    return items.filter(i => 
      (i.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (i.rif || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.phone || '').includes(searchTerm)
    );
  }, [items, searchTerm]);

  const saveItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const newItem = {
        id: editingItem?.id || crypto.randomUUID(),
        name: formData.get('name') as string,
        rif: formData.get('rif') as string || '',
        phone: formData.get('phone') as string,
        ...(type === 'customers' ? { email: formData.get('email') as string } : {}),
        ...(type === 'sellers' ? { status: 'active' } : {})
      };
      
      await dbService.put(type, newItem);
      
      setItems(prev => {
        const filtered = prev.filter(i => i.id !== newItem.id);
        return [...filtered, newItem].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      });
      
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error(err);
      alert("Error al guardar el registro.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('¿Seguro que desea eliminar este contacto?')) return;
    try {
      await dbService.delete(type, id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      alert("No se pudo eliminar el contacto.");
    }
  };

  // Filtrar historial específico para el contacto seleccionado
  const historyData = useMemo(() => {
    if (!historyItem) return [];
    
    const ops = relatedData.filter(op => {
      if (type === 'customers') return op.customerId === historyItem.id;
      if (type === 'suppliers') return op.supplierId === historyItem.id;
      if (type === 'sellers') return op.sellerId === historyItem.id;
      return false;
    }).map(op => ({ ...op, entryType: 'operation' }));

    const pays = payments.filter(p => p.entityId === historyItem.id).map(p => ({ ...p, entryType: 'payment' }));

    return [...ops, ...pays].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [historyItem, relatedData, payments, type]);

  // Resumen del historial
  const historyStats = useMemo(() => {
    const totalOps = historyData.filter(h => h.entryType === 'operation').length;
    const totalAmount = historyData.filter(h => h.entryType === 'operation').reduce((sum, op) => sum + (op.totalUSD || 0), 0);
    const pendingAmount = historyData.filter(h => h.entryType === 'operation').reduce((sum, op) => {
      const balance = (op.totalUSD || 0) - (op.paidAmountUSD || 0);
      return sum + (op.status === 'pending' ? balance : 0);
    }, 0);
    return { totalOps, totalAmount, pendingAmount };
  }, [historyData]);

  const labels = {
    customers: { title: 'Clientes', icon: User, color: 'text-orange-500' },
    suppliers: { title: 'Proveedores', icon: User, color: 'text-indigo-500' },
    sellers: { title: 'Vendedores', icon: UserCheck, color: 'text-emerald-500' }
  };

  const currentLabel = labels[type];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={18} />
          <input 
            type="text" placeholder={`Buscar en ${currentLabel.title}...`} 
            className="w-full bg-[#1e293b] border border-slate-700 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold outline-none transition-all text-white focus:border-orange-500/50"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="bg-orange-500 hover:bg-orange-600 text-white font-black p-3 rounded-2xl shadow-lg active:scale-95 transition-all">
          <Plus size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-[#1e293b] p-5 rounded-[1.5rem] border border-slate-700 shadow-lg relative group transition-all hover:scale-[1.02] hover:border-slate-500">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setHistoryItem(item)} className="p-2 bg-slate-800 rounded-lg text-orange-500 hover:text-white" title="Ver Historial"><History size={14} /></button>
              <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white"><Edit2 size={14} /></button>
              <button onClick={() => deleteItem(item.id)} className="p-2 bg-rose-500/10 rounded-lg text-rose-500 hover:bg-rose-500 hover:text-white"><Trash2 size={14} /></button>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center ${currentLabel.color}`}>
                <currentLabel.icon size={24} />
              </div>
              <div className="max-w-[70%]">
                <h3 className="font-black truncate text-sm text-white leading-tight uppercase">{item.name}</h3>
                <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-0.5">
                  {type === 'sellers' ? 'Personal de Ventas' : (item.rif || 'Sin Identificación')}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                 <Phone size={12} className="text-orange-500" /> {item.phone || 'Sin teléfono'}
              </div>
              {item.email && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                   <Mail size={12} className="text-orange-500" /> {item.email}
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setHistoryItem(item)}
              className="mt-4 w-full py-2 bg-slate-800/50 hover:bg-orange-500/10 border border-slate-700 hover:border-orange-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-orange-500 transition-all flex items-center justify-center gap-2"
            >
              Consultar Historial <ArrowRight size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* MODAL DE EDICIÓN / NUEVO CONTACTO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-[#1e293b] w-full max-w-md rounded-[2.5rem] p-8 border border-slate-700 animate-in zoom-in-95">
            <h2 className="text-xl font-black mb-6 uppercase tracking-tighter text-orange-500">
              {editingItem ? 'Editar' : 'Nuevo'} {currentLabel.title.slice(0, -1)}
            </h2>
            <form onSubmit={saveItem} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Nombre Completo / Razón Social</label>
                <input name="name" defaultValue={editingItem?.name} className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-orange-500/50" required />
              </div>
              
              {type !== 'sellers' && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Identificación (RIF/CI)</label>
                  <input name="rif" defaultValue={editingItem?.rif} className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-orange-500/50" />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Teléfono</label>
                <input name="phone" defaultValue={editingItem?.phone} className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-orange-500/50" required />
              </div>

              {type === 'customers' && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Email</label>
                  <input name="email" type="email" defaultValue={editingItem?.email} className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-orange-500/50" />
                </div>
              )}

              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving} className="flex-1 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Cancelar</button>
                <button type="submit" disabled={isSaving} className="flex-[2] bg-orange-500 text-white font-black py-4 rounded-xl shadow-lg uppercase text-[10px] tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Guardar Datos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE HISTORIAL */}
      {historyItem && (
        <div className="fixed inset-0 bg-[#0f172a] z-[350] flex flex-col animate-in slide-in-from-right duration-300">
           <div className="p-4 bg-[#1e293b] border-b border-slate-700 flex justify-between items-center sticky top-0 z-50">
              <div className="flex items-center gap-4">
                 <button onClick={() => setHistoryItem(null)} className="p-2 bg-slate-800 rounded-full text-white"><X size={20}/></button>
                 <div>
                    <h2 className="text-sm font-black uppercase text-orange-500 tracking-tighter">Historial Detallado</h2>
                    <p className="text-[10px] font-bold text-white uppercase">{historyItem.name}</p>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em]">Tasa Hoy</p>
                 <p className="text-[10px] font-black text-orange-500">{settings.exchangeRate} Bs/$</p>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <div className="max-w-4xl mx-auto space-y-6">
                 
                 {/* Resumen de Cuenta */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#1e293b] p-5 rounded-[2rem] border border-slate-700/50 shadow-lg">
                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Operaciones</p>
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg"><Receipt size={18}/></div>
                          <h3 className="text-2xl font-black text-white">{historyStats.totalOps}</h3>
                       </div>
                    </div>
                    <div className="bg-[#1e293b] p-5 rounded-[2rem] border border-slate-700/50 shadow-lg">
                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Volumen Total</p>
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><TrendingUp size={18}/></div>
                          <div>
                             <h3 className="text-2xl font-black text-white">${historyStats.totalAmount.toFixed(2)}</h3>
                             <p className="text-[8px] font-bold text-slate-500">{(historyStats.totalAmount * settings.exchangeRate).toLocaleString()} Bs</p>
                          </div>
                       </div>
                    </div>
                    <div className="bg-[#1e293b] p-5 rounded-[2rem] border border-slate-700/50 shadow-lg">
                       <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1">Saldo Pendiente</p>
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg"><Wallet size={18}/></div>
                          <div>
                             <h3 className="text-2xl font-black text-white">${historyStats.pendingAmount.toFixed(2)}</h3>
                             <p className="text-[8px] font-bold text-slate-500">{(historyStats.pendingAmount * settings.exchangeRate).toLocaleString()} Bs</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Tabla de Movimientos */}
                 <div className="bg-[#1e293b] rounded-[2rem] border border-slate-700 overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-slate-700/50 bg-slate-800/30 flex justify-between items-center">
                       <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Listado de Transacciones</h3>
                       <span className="text-[8px] font-black uppercase bg-orange-500/10 text-orange-500 px-2 py-1 rounded-md">Cronológico</span>
                    </div>
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead>
                             <tr className="bg-slate-900/50 text-[8px] font-black uppercase tracking-widest text-slate-500">
                                <th className="px-6 py-4">Fecha / Folio</th>
                                <th className="px-6 py-4">Concepto</th>
                                <th className="px-6 py-4 text-center">Estatus</th>
                                <th className="px-6 py-4 text-right">Monto</th>
                                <th className="px-6 py-4 text-center">Acción</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700/30">
                             {historyData.length > 0 ? historyData.map((op: any, idx) => (
                               <tr key={op.id} className="hover:bg-slate-800/40 transition-colors group">
                                  <td className="px-6 py-4">
                                     <p className="text-[10px] font-black text-white">{new Date(op.date).toLocaleDateString()}</p>
                                     <p className="text-[8px] text-slate-500 font-bold uppercase">{op.id.slice(0,10)}</p>
                                  </td>
                                  <td className="px-6 py-4">
                                     <p className="text-[10px] font-black text-slate-300 uppercase">
                                        {op.entryType === 'payment' ? (type === 'customers' ? 'Cobro / Abono Recibido' : 'Pago / Abono Realizado') : (type === 'customers' ? 'Venta de Productos' : (type === 'suppliers' ? 'Abastecimiento de Stock' : 'Venta Comisionable'))}
                                     </p>
                                     <p className="text-[8px] text-slate-500 font-bold">{op.entryType === 'payment' ? 'TRANSACCIÓN FINANCIERA' : `${op.items?.length || 0} ITEMS`}</p>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                     {op.entryType === 'payment' ? (
                                       <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                         COMPLETADO
                                       </span>
                                     ) : (
                                       <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${op.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                                          {op.status === 'paid' ? 'PAGADO' : 'PENDIENTE'}
                                       </span>
                                     )}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                     <p className={`text-[11px] font-black ${op.entryType === 'payment' ? 'text-emerald-400' : 'text-white'}`}>
                                       {op.entryType === 'payment' ? '+' : ''}${ (op.entryType === 'payment' ? op.amountUSD : op.totalUSD).toFixed(2) }
                                     </p>
                                     <p className="text-[8px] text-orange-500 font-bold">
                                       {((op.entryType === 'payment' ? op.amountUSD : op.totalUSD) * (op.exchangeRate || settings.exchangeRate)).toLocaleString()} Bs
                                     </p>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                     {op.entryType === 'operation' && (
                                       <button 
                                          onClick={() => setSelectedTicket(op)}
                                          className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-orange-500 hover:scale-110 transition-all"
                                       >
                                          <History size={14} />
                                       </button>
                                     )}
                                  </td>
                               </tr>
                             )) : (
                               <tr>
                                  <td colSpan={5} className="px-6 py-20 text-center">
                                     <div className="flex flex-col items-center opacity-30">
                                        <Receipt size={40} className="mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Sin movimientos registrados</p>
                                     </div>
                                  </td>
                               </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* TICKET DESDE EL HISTORIAL */}
      {selectedTicket && (
        <TicketModal 
          isOpen={!!selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
          data={selectedTicket} 
          company={company || ({} as CompanyInfo)} 
          settings={settings} 
          title={isMemoPurchase(selectedTicket) ? "COMPRA" : "VENTA"}
        />
      )}
    </div>
  );
};

// Helper para detectar si un objeto es una compra o venta
function isMemoPurchase(data: any): data is Purchase {
  return data && ('supplierName' in data || 'supplierId' in data);
}

export default Contacts;
