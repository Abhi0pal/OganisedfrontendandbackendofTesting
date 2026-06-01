'use client';

export const QuickActions = () => {
    const actions = [
        { label: 'Invest More', icon: '💰', color: 'from-green-500 to-green-600' },
        { label: 'Redeem', icon: '💸', color: 'from-orange-500 to-orange-600' },
        { label: 'Transfer', icon: '🔄', color: 'from-blue-500 to-blue-600' },
        { label: 'Download Statement', icon: '📄', color: 'from-purple-500 to-purple-600' },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
                {actions.map((action, index) => (
                    <button
                        key={index}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}>
                            {action.icon}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{action.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
