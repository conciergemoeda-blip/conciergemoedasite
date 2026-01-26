import React from 'react';

interface EmptyStateProps {
    icon?: string;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    illustration?: 'search' | 'filter' | 'generic';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon = 'search_off',
    title,
    description,
    actionLabel,
    onAction,
    illustration = 'search'
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in-up">
            {/* Illustration Circle with Icon */}
            <div className="relative mb-6">
                {/* Decorative circles  */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-primary/5 animate-pulse"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-primary/10 animate-pulse delay-150"></div>
                </div>

                {/* Icon Container */}
                <div className="relative z-10 w-20 h-20 mx-auto flex items-center justify-center rounded-full bg-gradient-primary shadow-lg">
                    <span className="material-symbols-outlined text-4xl text-white icon-filled">
                        {icon}
                    </span>
                </div>
            </div>

            {/* Text Content */}
            <h3 className="font-serif font-bold text-2xl text-gray-900 mb-2">
                {title}
            </h3>
            <p className="text-gray-500 max-w-md mb-6 leading-relaxed">
                {description}
            </p>

            {/* Decorative Suggestions */}
            {illustration === 'search' && (
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                    {['Piscina', 'Vista Serra', 'Churrasqueira', 'Wi-Fi'].map((suggestion, index) => (
                        <span
                            key={suggestion}
                            className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer animate-fade-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {suggestion}
                        </span>
                    ))}
                </div>
            )}

            {/* Action Button */}
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="btn-lift inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg transition-all"
                >
                    <span className="material-symbols-outlined text-lg">refresh</span>
                    {actionLabel}
                </button>
            )}

            {/* Subtle help text */}
            <p className="text-xs text-gray-400 mt-6 italic">
                💡 Dica: Tente ajustar os filtros ou buscar por outra localização
            </p>
        </div>
    );
};
