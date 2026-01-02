
import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-xs p-6 rounded-2xl shadow-lg bg-white text-center" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-slate-800 mb-2">{title}</h2>
        <p className="text-slate-600 mb-6">{message}</p>
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={onClose}
            className="w-full px-6 py-2.5 font-semibold rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            className="w-full px-6 py-2.5 font-semibold rounded-lg bg-sky-500 text-white hover:bg-sky-600 shadow-sm transition-colors"
          >
            ОК
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
