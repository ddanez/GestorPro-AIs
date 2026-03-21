
import React, { useState, useMemo, useRef } from 'react';
import { CheckCircle2, DollarSign, Calendar, User, Truck, MessageCircle, Wallet, ChevronDown, ChevronUp, ArrowRight, FileUp, Loader2, AlertCircle } from 'lucide-react';
import { AppSettings, Sale, Purchase, CompanyInfo, Customer, Supplier } from '../types';
import { dbService } from '../db';
import { parseNumber, calculateBS } from '../utils';
import { TicketModal } from './TicketModal';
import { PDFImportService, ExtractedDebt } from '../services/pdfImportService';

interface Props {
  type: 'cxc' | 'cxp';
  items: (Sale | Purchase)[];
  settings: AppSettings;
  company: CompanyInfo;
  onUpdate: () => void;
  customers: Customer[];
  suppliers: Supplier[];
}

const Accounts: React.FC<Props> = ({ type, items, settings, company, onUpdate, customers, suppliers }) => {
  const [ticketData, setTicketData] = useState<any>(null);
  const [paymentModal, setPaymentModal] = useState<{ entityId: string, name: string, invoiceId?: string, balance: number } | null>(null);
  const [amountToPay, setAmountToPay] = useState<number>(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grouped' | 'chronological'>('grouped');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chronologicalItems = useMemo(() => {
    return [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [items]);

  const grouped = useMemo(() => {
    const acc: Record<string, { id: string, name: string, totalPending: number, invoices: (Sale | Purchase)[], creditBalance: number }> = {};
    
    items.forEach(item => {
      const entityId = type === 'cxc' ? (item as Sale).customerId : (item as Purchase).supplierId;
      const entityName = type === 'cxc' ? (item as Sale).customerName : (item as Purchase).supplierName;
      
      // Agrupar por nombre normalizado para evitar duplicados visuales
      const groupKey = entityName.toLowerCase().trim();
      
      if (!acc[groupKey]) {
        const entity = type === 'cxc' 
          ? customers.find(c => c.id === entityId || c.name.toLowerCase().trim() === groupKey) 
          : suppliers.find(s => s.id === entityId || s.name.toLowerCase().trim() === groupKey);
          
        acc[groupKey] = {
          id: entityId,
          name: entityName,
          totalPending: 0,
          invoices: [],
          creditBalance: entity?.creditBalanceUSD || 0
        };
      }
      
      const balance = (item.totalUSD || 0) - (item.paidAmountUSD || 0);
      acc[groupKey].totalPending += balance;
      acc[groupKey].invoices.push(item);
    });
    
    // Add entities with credit balance even if no pending invoices
    const allEntities = type === 'cxc' ? customers : suppliers;
    allEntities.forEach(entity => {
      const groupKey = entity.name.toLowerCase().trim();
      if ((entity.creditBalanceUSD || 0) > 0 && !acc[groupKey]) {
        acc[groupKey] = {
          id: entity.id,
          name: entity.name,
          totalPending: 0,
          invoices: [],
          creditBalance: entity.creditBalanceUSD || 0
        };
      }
    });

    return Object.values(acc).sort((a, b) => b.totalPending - a.totalPending);
  }, [items, type, customers, suppliers]);

  const handleProcessPayment = async () => {
    if (!paymentModal) return;
    
    const { entityId, invoiceId } = paymentModal;
    let remaining = amountToPay;
    
    const entityGroup = grouped.find(g => g.id === entityId || g.name === paymentModal.name);
    if (!entityGroup) return;

    const invoicesToUpdate = invoiceId 
      ? [entityGroup.invoices.find(i => i.id === invoiceId)!] 
      : [...entityGroup.invoices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const inv of invoicesToUpdate) {
      if (remaining <= 0) break;
      const balance = (inv.totalUSD || 0) - (inv.paidAmountUSD || 0);
      const paymentForThis = Math.min(remaining, balance);
      
      const newPaid = (inv.paidAmountUSD || 0) + paymentForThis;
      const isFullyPaid = newPaid >= (inv.totalUSD || 0);
      
      const updatedInv = { 
        ...inv, 
        status: (isFullyPaid ? 'paid' : 'pending') as 'paid' | 'pending', 
        paidAmountUSD: newPaid 
      };
      await dbService.put(type === 'cxc' ? 'sales' : 'purchases', updatedInv);
      
      remaining -= paymentForThis;
    }
    
    // Surplus goes to credit balance
    if (remaining > 0) {
      const entity = type === 'cxc' 
        ? customers.find(c => c.id === entityId || c.name === paymentModal.name) 
        : suppliers.find(s => s.id === entityId || s.name === paymentModal.name);
        
      if (entity) {
        const updatedEntity = {
          ...entity,
          creditBalanceUSD: (entity.creditBalanceUSD || 0) + remaining
        };
        await dbService.put(type === 'cxc' ? 'customers' : 'suppliers', updatedEntity);
      }
    }
    
    // Record payment
    const paymentRecord = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      relatedId: invoiceId || 'multiple',
      entityId,
      amountUSD: amountToPay,
      exchangeRate: settings.exchangeRate,
      type: type
    };
    await dbService.put('payments', paymentRecord);
    
    setTicketData({ 
      id: crypto.randomUUID(),
      customerName: paymentModal.name,
      supplierName: paymentModal.name,
      totalUSD: amountToPay, 
      totalBS: amountToPay * settings.exchangeRate, 
      date: new Date().toISOString(),
      items: [{ name: invoiceId ? `Abono a Factura ${invoiceId.slice(-6)}` : 'Abono a Cuenta', quantity: 1, priceUSD: amountToPay }]
    });
    
    setPaymentModal(null);
    setAmountToPay(0);
    onUpdate();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);

    try {
      const apiKey = settings.geminiApiKey || (process.env.GEMINI_API_KEY as string);
      if (!apiKey) {
        throw new Error("No se encontró la API Key de Gemini. Por favor, configúrela en Ajustes.");
      }

      const base64 = await PDFImportService.fileToBase64(file);
      const service = new PDFImportService(apiKey);
      const extractedDebts = await service.extractDebtsFromPDF(base64);

      if (extractedDebts.length === 0) {
        throw new Error("No se pudieron extraer deudas del PDF. Verifique el formato del archivo.");
      }

      // Mantener una lista local de clientes para evitar duplicados durante el bucle
      const currentCustomers = [...customers];

      for (const debt of extractedDebts) {
        const normalizedName = debt.customerName.toLowerCase().trim();
        
        // 1. Buscar en la lista actualizada
        let customer = currentCustomers.find(c => c.name.toLowerCase().trim() === normalizedName);
        
        if (!customer) {
          customer = {
            id: crypto.randomUUID(),
            name: debt.customerName.trim(),
            rif: 'N/A',
            phone: 'N/A',
            email: 'N/A',
            creditBalanceUSD: 0
          };
          await dbService.put('customers', customer);
          currentCustomers.push(customer); // Añadir a la lista local para la siguiente iteración
        }

        // 2. Crear venta pendiente
        const sale: Sale = {
          id: crypto.randomUUID(),
          date: debt.date || new Date().toISOString(),
          customerId: customer.id,
          customerName: customer.name,
          items: [{ productId: 'import', name: debt.description || 'Deuda Importada', quantity: 1, priceUSD: debt.amountUSD }],
          totalUSD: debt.amountUSD,
          totalBS: debt.amountUSD * settings.exchangeRate,
          exchangeRate: settings.exchangeRate,
          status: 'pending',
          paidAmountUSD: 0
        };
        await dbService.put('sales', sale);
      }

      onUpdate();
      alert(`Se importaron ${extractedDebts.length} deudas correctamente.`);
    } catch (err: any) {
      console.error("Error al importar PDF:", err);
      setImportError(err.message || "Error desconocido al procesar el PDF.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const totalPending = grouped.reduce((sum, g) => sum + g.totalPending, 0);
  const totalCredit = grouped.reduce((sum, g) => sum + g.creditBalance, 0);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {type === 'cxc' && (
        <div className="bg-[#1e293b] p-4 rounded-2xl border border-slate-700 shadow-lg flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Importar Cuentas</h4>
              <p className="text-[8px] text-slate-500 font-bold uppercase">Sube un PDF de tu sistema anterior</p>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-lg disabled:opacity-50"
            >
              {isImporting ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
              {isImporting ? 'Procesando...' : 'Subir PDF'}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="application/pdf" 
              className="hidden" 
            />
          </div>
          {importError && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg text-rose-500 text-[8px] font-black uppercase">
              <AlertCircle size={12} />
              <span>{importError}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1e293b] p-4 rounded-2xl border border-slate-700 shadow-lg">
          <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest leading-none mb-1">Total Pendiente</p>
          <p className="text-xl font-black text-white leading-none">${(totalPending || 0).toFixed(2)}</p>
          <p className="text-[10px] font-black text-slate-400 mt-1">{calculateBS(totalPending, 'pending', undefined, settings.exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</p>
        </div>
        <div className="bg-[#1e293b] p-4 rounded-2xl border border-slate-700 shadow-lg">
          <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Saldo a Favor</p>
          <p className="text-xl font-black text-white leading-none">${(totalCredit || 0).toFixed(2)}</p>
          <p className="text-[10px] font-black text-slate-400 mt-1">{calculateBS(totalCredit, 'pending', undefined, settings.exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</p>
        </div>
      </div>

      <div className="flex bg-[#1e293b] p-1 rounded-xl border border-slate-700">
        <button 
          onClick={() => setViewMode('grouped')}
          className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'grouped' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Por Cliente
        </button>
        <button 
          onClick={() => setViewMode('chronological')}
          className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === 'chronological' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Cronológico
        </button>
      </div>

      <div className="space-y-3">
        {viewMode === 'grouped' ? (
          grouped.map(group => {
            const isExpanded = expandedId === group.id;
            return (
              <div key={group.id} className="bg-[#1e293b] rounded-2xl border border-slate-700 overflow-hidden transition-all">
                <div 
                  className="p-4 flex justify-between items-center gap-4 cursor-pointer hover:bg-slate-800/50"
                  onClick={() => setExpandedId(isExpanded ? null : group.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
                      {type === 'cxc' ? <User size={18} /> : <Truck size={18} />}
                    </div>
                    <div className="truncate">
                      <p className="font-black text-xs text-white leading-tight uppercase truncate">{group.name}</p>
                      <div className="flex flex-col mt-0.5">
                        {group.totalPending > 0 && (
                          <div className="flex gap-2">
                            <p className="text-[8px] text-rose-500 font-black uppercase">Deuda: ${group.totalPending.toFixed(2)}</p>
                            <p className="text-[8px] text-slate-400 font-black uppercase">({calculateBS(group.totalPending, 'pending', undefined, settings.exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.)</p>
                          </div>
                        )}
                        {group.creditBalance > 0 && (
                          <div className="flex gap-2">
                            <p className="text-[8px] text-emerald-500 font-black uppercase">Crédito: ${group.creditBalance.toFixed(2)}</p>
                            <p className="text-[8px] text-slate-400 font-black uppercase">({calculateBS(group.creditBalance, 'pending', undefined, settings.exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.)</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation();
                        setPaymentModal({ entityId: group.id, name: group.name, balance: group.totalPending }); 
                        setAmountToPay(group.totalPending); 
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl font-black text-[8px] uppercase tracking-widest transition-all shadow-md"
                    >
                      ABONAR
                    </button>
                    {isExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2 border-t border-slate-700/50 pt-3 bg-slate-900/30">
                    <div className="flex justify-between items-center mb-2 px-1">
                      <p className="text-[8px] font-black text-slate-500 uppercase">Detalle de Transacciones</p>
                      <button 
                        onClick={() => { 
                          setPaymentModal({ entityId: group.id, name: group.name, balance: group.totalPending }); 
                          setAmountToPay(group.totalPending); 
                        }}
                        className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-lg font-black text-[7px] uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                      >
                        <Wallet size={10} />
                        Agregar Pago
                      </button>
                    </div>
                    {group.invoices.length === 0 && (
                      <p className="text-[8px] text-slate-500 uppercase font-black text-center py-2">No hay facturas pendientes</p>
                    )}
                    {group.invoices.map(inv => {
                      const invBalance = (inv.totalUSD || 0) - (inv.paidAmountUSD || 0);
                      return (
                        <div key={inv.id} className="flex justify-between items-center p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
                          <div className="flex items-center gap-3">
                            <Calendar size={12} className="text-slate-500" />
                            <div>
                              <p className="text-[9px] font-black text-white uppercase">Factura #{inv.id.slice(-6)}</p>
                              <p className="text-[7px] text-slate-500 font-bold uppercase">{new Date(inv.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-[9px] font-black text-rose-500">${invBalance.toFixed(2)}</p>
                              <p className="text-[7px] text-slate-400 font-black uppercase">{calculateBS(invBalance, 'pending', undefined, settings.exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</p>
                              <p className="text-[7px] text-slate-500 font-bold uppercase">Original: ${inv.totalUSD.toFixed(2)}</p>
                            </div>
                            <button 
                              onClick={() => { 
                                setPaymentModal({ entityId: group.id, name: group.name, invoiceId: inv.id, balance: invBalance }); 
                                setAmountToPay(invBalance); 
                              }}
                              className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-all"
                            >
                              <ArrowRight size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          chronologicalItems.map(inv => {
            const invBalance = (inv.totalUSD || 0) - (inv.paidAmountUSD || 0);
            const entityId = type === 'cxc' ? (inv as Sale).customerId : (inv as Purchase).supplierId;
            const entityName = type === 'cxc' ? (inv as Sale).customerName : (inv as Purchase).supplierName;
            
            return (
              <div key={inv.id} className="bg-[#1e293b] p-4 rounded-2xl border border-slate-700 flex justify-between items-center gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div className="truncate">
                    <p className="font-black text-xs text-white leading-tight uppercase truncate">{entityName}</p>
                    <p className="text-[8px] text-slate-500 font-black uppercase mt-0.5">Factura #{inv.id.slice(-6)} • {new Date(inv.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-rose-500">${invBalance.toFixed(2)}</p>
                    <p className="text-[7px] text-slate-400 font-black uppercase">{calculateBS(invBalance, 'pending', undefined, settings.exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</p>
                  </div>
                  <button 
                    onClick={() => { 
                      setPaymentModal({ entityId, name: entityName, invoiceId: inv.id, balance: invBalance }); 
                      setAmountToPay(invBalance); 
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl transition-all shadow-md"
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {paymentModal && (
        <div className="fixed inset-0 bg-black/95 z-[250] flex items-center justify-center p-4">
          <div className="bg-[#1e293b] w-full max-w-sm rounded-[2.5rem] p-8 border border-slate-700 animate-in zoom-in-95">
            <h3 className="text-lg font-black text-emerald-500 mb-2 uppercase tracking-tighter">Registrar Abono</h3>
            <p className="text-[8px] font-black text-slate-400 uppercase mb-6 tracking-widest">{paymentModal.name}</p>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Monto USD</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={amountToPay} 
                  onChange={(e) => setAmountToPay(parseNumber(e.target.value) || 0)} 
                  className="w-full bg-[#0a0f1d] border border-slate-700 rounded-xl p-4 text-xl font-black text-white outline-none" 
                  autoFocus 
                />
              </div>

              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[8px] font-black text-slate-500 uppercase">Tasa Actual</span>
                  <span className="text-[10px] font-black text-white">{settings.exchangeRate.toFixed(2)} Bs/$</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-black text-slate-500 uppercase">Total en Bolívares</span>
                  <span className="text-lg font-black text-emerald-400">{(amountToPay * settings.exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</span>
                </div>
              </div>

              {amountToPay > paymentModal.balance && (
                <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                  <p className="text-[8px] font-black text-amber-500 uppercase text-center">
                    El excedente de ${(amountToPay - paymentModal.balance).toFixed(2)} se guardará como saldo a favor.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button onClick={() => setPaymentModal(null)} className="flex-1 py-3 font-black text-slate-500 uppercase text-[9px]">Cancelar</button>
                <button onClick={handleProcessPayment} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-black uppercase text-[9px] shadow-lg">Confirmar Pago</button>
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
