
import React from 'react';
import { Package } from 'lucide-react';
import { CompanyInfo } from '../types';

interface SplashProps {
  company: CompanyInfo;
}

const Splash: React.FC<SplashProps> = ({ company }) => {
  return (
    <div className="fixed inset-0 bg-[#0f172a] flex flex-col items-center justify-between py-20 z-[100]">
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          <div className={`${company.logo ? 'w-48 h-48' : 'w-32 h-32 bg-orange-500 rounded-[2.5rem] shadow-2xl shadow-orange-500/40'} flex items-center justify-center animate-pulse`}>
             {company.logo ? (
               <img src={company.logo} alt="Logo" className="w-full h-full object-contain drop-shadow-2xl" />
             ) : (
               <Package size={64} className="text-white" />
             )}
          </div>
        </div>
      </div>

      <div className="text-center space-y-4 px-6">
         <h1 className="text-3xl font-black text-white tracking-tight uppercase">{company.name}</h1>
         <div className="w-48 bg-slate-800 h-1.5 rounded-full overflow-hidden mx-auto">
           <div className="bg-orange-500 h-full w-1/2 animate-[loading_1.5s_ease-in-out_infinite]"></div>
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
