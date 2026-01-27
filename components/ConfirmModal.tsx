import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    isDanger?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    isDanger = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-full ${isDanger ? 'bg-red-50 text-red-600' : 'bg-primary/10 text-primary'}`}>
                            <span className="material-symbols-outlined">
                                {isDanger ? 'warning' : 'help'}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 font-serif">{title}</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed mb-6">
                        {message}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={onConfirm}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all active:scale-95 shadow-lg ${isDanger
                                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200'
                                    : 'bg-primary hover:bg-primary-dark text-white shadow-primary/20'
                                }`}
                        >
                            {confirmLabel}
                        </button>
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3 px-4 rounded-xl font-bold bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all border border-gray-100"
                        >
                            {cancelLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
