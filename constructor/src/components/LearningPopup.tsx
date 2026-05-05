import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { EquipmentDefinition } from '../data/equipments';
import { X, Lightbulb } from 'lucide-react';

interface LearningPopupProps {
  equipment: EquipmentDefinition | null;
  onClose: () => void;
}

export const LearningPopup: React.FC<LearningPopupProps> = ({ equipment, onClose }) => {
  return (
    <AnimatePresence>
      {equipment && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 w-[90%] md:w-96 max-w-sm"
        >
          <div className="glass-dark rounded-2xl overflow-hidden shadow-2xl border border-sky-500/30">
            <div className="bg-sky-900/50 px-4 py-3 border-b border-sky-500/20 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                <h3 className="font-bold text-sky-100">学習ポイント: {equipment.name}</h3>
              </div>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors bg-slate-800/50 hover:bg-slate-700 p-1 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-slate-200 text-sm mb-4 leading-relaxed">
                {equipment.description}
              </p>
              <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50">
                <p className="text-sm font-medium text-sky-300">
                  {equipment.learningPoint}
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  理解した
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
