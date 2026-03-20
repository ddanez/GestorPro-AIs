
import React, { useEffect, useRef } from 'react';
import { Trophy, Star, X, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  promotionName: string;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({ isOpen, onClose, customerName, promotionName }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Play fanfare sound
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => console.log('Audio play blocked:', err));
      }
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />
          
          <audio 
            ref={audioRef} 
            src="https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3" 
            preload="auto"
          />

          <motion.div
            initial={{ scale: 0.5, y: 100, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.5, y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            className="relative bg-[#1e293b] w-full max-w-lg rounded-[3rem] border-4 border-orange-500 shadow-[0_0_50px_rgba(249,115,22,0.5)] p-10 text-center overflow-hidden"
          >
            {/* Background Sparkles/Stars */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    scale: [0, 1.5, 0],
                    x: Math.random() * 400 - 200,
                    y: Math.random() * 400 - 200
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                  className="absolute left-1/2 top-1/2 text-orange-400"
                >
                  <Star size={Math.random() * 20 + 10} fill="currentColor" />
                </motion.div>
              ))}
            </div>

            <div className="relative z-10 space-y-6">
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-orange-500/50"
              >
                <Trophy size={48} className="text-white" />
              </motion.div>

              <div className="space-y-2">
                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">
                  ¡TENEMOS UN <span className="text-orange-500">GANADOR!</span>
                </h2>
                <div className="h-1 w-24 bg-orange-500 mx-auto rounded-full" />
              </div>

              <div className="space-y-4 py-4">
                <p className="text-xl font-bold text-slate-300 uppercase tracking-widest">
                  FELICIDADES, <span className="text-white font-black">{customerName}</span>
                </p>
                <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Has completado la meta de:</p>
                  <p className="text-2xl font-black text-orange-500 uppercase tracking-tight">{promotionName}</p>
                </div>
                <p className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-2">
                  <Gift size={18} /> ¡PREMIO LISTO PARA CANJEAR!
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-orange-500/20 uppercase text-xs tracking-[0.2em] active:scale-95"
              >
                CONTINUAR
              </button>
            </div>

            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
