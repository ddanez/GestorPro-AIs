
import React, { useState } from 'react';
import { CheckCircle2, DollarSign, Calendar, User, Truck, MessageCircle, Wallet } from 'lucide-react';
import { AppSettings, Sale, Purchase, CompanyInfo } from '../types';
import { dbService } from '../db';
import { TicketModal } from './TicketModal';

interface Props {
  type: 'cxc' | 'cxp';
  items: (Sale | Purchase)[];
  settings: AppSettings;
  company: CompanyInfo;
  onUpdate: () => void;
}

const Accounts: React.FC<Props> = ({ type, items, settings, company, onUpdate }) => {
  const [ticketData, setTicketData] = useState<any>(null);
  const [paymentModal, setPaymentModal] = useState<(Sale | Purchase) | null>(null);
  const [amountToPay, setAmountToPay] = useState<number>(0);

  const handleProcessPayment = async () => {
    if (!paymentModal) return;
    const item = paymentModal;
    const currentPaid = item.paidAmountUSD || 0;
    const total = item.totalUSD || 0;
    const newPaid = currentPaid + amountToPay;
    const isFullyPaid = newPaid >= total;
    
    // Almacenar datos para el ticket de abono respetando la identidad del proveedor si es CxP
    const updatedItem = { ...item, status: (isFullyPaid ? 'paid' : 'pending') as 'paid' | 'pending', paidAmountUSD: newPaid };
    await dbService.put(type === 'cxc' ? 'sales' : 'purchases', updatedItem);

    // Guardar el cobro/pago por separado
    const paymentRecord = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      relatedId: item.id,
      entityId: type === 'cxc' ? (item as Sale).customerId : (item as Purchase).supplierId,
      amountUSD: amountToPay,
      exchangeRate: settings.exchangeRate,
      type: type
    };
    await dbService.put('payments', paymentRecord);
    
    // Crear objeto de ticket enriquecido con nombre correcto
    setTicketData({ 
      ...updatedItem, 
      totalUSD: amountToPay, 
      totalBS: amountToPay * settings.exchangeRate, 
      date: new Date().toISOString()
    });
    
    setPaymentModal(null);
    setAmountToPay(0);
    onUpdate();
  };

  const totalPending = items.reduce((sum, item) => sum + ((item.totalUSD || 0) - (item.paidAmountUSD || 0)), 0);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="bg-[#1e293b] p-4 rounded-2xl border border-slate-700 shadow-lg flex justify-between items-center">
         <div>
            <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest leading-none mb-1">Saldo Total Pendiente</p>
            <p className="text-2xl font-black text-white leading-none">${(totalPending || 0).toFixed(2)}</p>
         </div>
         <span className="px-3 py-1 bg-rose-500/10 text-rose-500 text-[8px] font-black rounded-lg border border-rose-500/20 uppercase tracking-widest">MOROSIDAD</span>
      </div>

      <div className="space-y-3">
        {items.map(item => {
          const balance = (item.totalUSD || 0) - (item.paidAmountUSD || 0);
          return (
            <div key={item.id} className="bg-[#1e293b] p-4 rounded-2xl border border-slate-700 flex justify-between items-center gap-4 hover:border-slate-500 transition-colors">
               <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
                    {type === 'cxc' ? <User size={18} /> : <Truck size={18} />}
                  </div>
                  <div className="truncate">
                     <p className="font-black text-xs text-white leading-tight uppercase truncate">{ (item as Sale).customerName || (item as Purchase).supplierName }</p>
                     <p className="text-[8px] text-rose-500 font-black uppercase mt-0.5">Pendiente: ${(balance || 0).toFixed(2)}</p>
                  </div>
               </div>
               <button 
                  onClick={() => { setPaymentModal(item); setAmountToPay(balance); }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-md flex items-center gap-2"
               >
                  ABONAR
               </button>
            </div>
          );
        })}
      </div>

      {paymentModal && (
        <div className="fixed inset-0 bg-black/95 z-[250] flex items-center justify-center p-4">
           <div className="bg-[#1e293b] w-full max-w-sm rounded-[2.5rem] p-8 border border-slate-700 animate-in zoom-in-95">
              <h3 className="text-lg font-black text-emerald-500 mb-6 uppercase tracking-tighter">Registrar Abono</h3>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Monto USD</label>
                    <input type="number" step="0.01" value={amountToPay} onChange={(e) => setAmountToPay(parseFloat(e.target.value) || 0)} className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl p-4 text-xl font-black text-white outline-none" autoFocus />
                 </div>
                 <div className="flex gap-3 pt-4">
                   <button onClick={() => setPaymentModal(null)} className="flex-1 py-3 font-black text-slate-500 uppercase text-[9px]">Cancelar</button>
                   <button onClick={handleProcessPayment} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-black uppercase text-[9px] shadow-lg">Confirmar</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      <TicketModal isOpen={!!ticketData} onClose={() => setTicketData(null)} data={ticketData} company={company} settings={settings} />
    </div>
  );
};

export default Accounts;
