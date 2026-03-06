
import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Tag, Box, AlertTriangle, Layers } from 'lucide-react';
import { Product, AppSettings } from '../types';
import { dbService } from '../db';
import { parseNumber } from '../utils';

interface Props {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  settings: AppSettings;
}

const CATEGORIES = ['Víveres', 'Charcutería', 'Lácteos', 'Limpieza', 'Bebidas', 'Snacks', 'Otros'];

const Inventory: React.FC<Props> = ({ products, setProducts, settings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Optimización: Memoizar filtrado para evitar lag
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const saveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newProduct: Product = {
      id: editingProduct?.id || crypto.randomUUID(),
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      category: formData.get('category') as string || 'Otros',
      priceUSD: parseNumber(formData.get('priceUSD') as string) || 0,
      costUSD: parseNumber(formData.get('costUSD') as string) || 0,
      stock: parseNumber(formData.get('stock') as string) || 0,
      minStock: parseNumber(formData.get('minStock') as string) || 0,
    };
    await dbService.put('products', newProduct);
    setProducts(prev => {
      const filtered = prev.filter(p => p.id !== newProduct.id);
      return [...filtered, newProduct].sort((a,b) => (a.name || '').localeCompare(b.name || ''));
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={18} />
          <input 
            type="text" placeholder="Producto, SKU o Categoría..." 
            className="w-full bg-[#1e293b] border border-slate-700 rounded-2xl py-3 pl-12 pr-4 text-xs focus:ring-2 focus:ring-orange-500/50 outline-none font-bold transition-all text-white"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }} className="bg-orange-500 hover:bg-orange-600 text-white font-black p-3 rounded-2xl shadow-lg active:scale-95 transition-all">
          <Plus size={20} />
        </button>
      </div>

      <div className="bg-[#1e293b] rounded-[1.5rem] border border-slate-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#0f172a]/50 text-slate-500">
                <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest">Producto</th>
                <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-center">Stock</th>
                <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest">Precio</th>
                <th className="px-5 py-3 text-[9px] font-black uppercase tracking-widest text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filteredProducts.map(p => (
                <tr key={p.id} onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="hover:bg-slate-800/40 cursor-pointer transition-colors group">
                  <td className="px-5 py-3">
                    <p className="font-bold text-xs text-white leading-tight uppercase">{p.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[7px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">{p.sku}</span>
                      <span className="text-[7px] text-orange-400 font-bold uppercase">{p.category || 'Otros'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black inline-block ${(p.stock || 0) <= (p.minStock || 0) ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                      {(p.stock || 0) % 1 === 0 ? (p.stock || 0) : (p.stock || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-xs font-black text-white">${(p.priceUSD || 0).toFixed(2)}</p>
                    <p className="text-[8px] text-orange-500 font-bold">{((p.priceUSD || 0) * settings.exchangeRate).toLocaleString()} Bs</p>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Edit2 size={14} className="text-slate-600 group-hover:text-orange-500 transition-colors inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-[#1e293b] w-full max-w-lg rounded-[2.5rem] p-8 border border-slate-700 animate-in zoom-in-95">
            <h2 className="text-xl font-black mb-6 uppercase tracking-tighter text-orange-500 flex items-center gap-2">
              <Box size={24} /> {editingProduct ? 'Editar' : 'Nuevo'} Producto
            </h2>
            <form onSubmit={saveProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Descripción</label>
                  <input name="name" defaultValue={editingProduct?.name} className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Categoría</label>
                  <select name="category" defaultValue={editingProduct?.category || 'Otros'} className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500">
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-500 uppercase ml-2">SKU / Código</label>
                   <input name="sku" defaultValue={editingProduct?.sku} className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-2">PVP ($)</label>
                  <input name="priceUSD" type="number" step="0.01" lang="en-US" defaultValue={editingProduct?.priceUSD} className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-xs font-black text-emerald-400 outline-none focus:border-orange-500" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Existencia</label>
                  <input name="stock" type="number" step="any" lang="en-US" defaultValue={editingProduct?.stock || 0} className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Costo ($)</label>
                  <input name="costUSD" type="number" step="0.01" lang="en-US" defaultValue={editingProduct?.costUSD} className="w-full bg-[#0f172a] border border-slate-700 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-orange-500" required />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Cerrar</button>
                <button type="submit" className="flex-[2] bg-orange-500 text-white font-black py-3 rounded-xl shadow-lg uppercase tracking-widest text-[10px]">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
