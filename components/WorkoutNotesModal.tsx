import React from 'react';
import { X } from 'lucide-react';

interface WorkoutNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes?: string;
}

const WorkoutNotesModal: React.FC<WorkoutNotesModalProps> = ({ isOpen, onClose, notes }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm p-6 rounded-2xl shadow-lg bg-white" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-800">Заметки</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        <div className="max-h-60 overflow-y-auto text-slate-600 whitespace-pre-line">
          {notes ? notes : <p className="text-slate-400">Нет заметок к этой тренировке.</p>}
        </div>
      </div>
    </div>
  );
};

export default WorkoutNotesModal;