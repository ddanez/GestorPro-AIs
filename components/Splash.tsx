
import React from 'react';
import { Package } from 'lucide-react';
import { CompanyInfo } from '../types';

interface SplashProps {
  company: CompanyInfo;
}

const Splash: React.FC<SplashProps> = ({ company }) => {
  return (
    <div className="fixed inset-0 bg-[#0f172a] flex flex-col items-center justify-center z-[100]">
      <div className="relative">
        <div className="w-24 h-24 bg-orange-500 rounded-3xl flex items-center justify-center animate-bounce shadow-2xl shadow-orange-500/40">
           {company.logo ? (
             <img src={company.logo} alt="Logo" className="w-16 h-16 object-contain" />
           ) : (
             <Package size={48} className="text-white" />
           )}
        </div>
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center w-64">
           <h1 className="text-2xl font-bold text-white mb-1">{company.name}</h1>
           <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
             <div className="bg-orange-500 h-full w-1/2 animate-[loading_1.5s_ease-in-out_infinite]"></div>
           </div>
        </div>
      </div>
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default Splash;
