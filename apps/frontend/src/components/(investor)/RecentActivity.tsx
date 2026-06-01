'use client';

interface Activity {
    id: number;
    type: 'investment' | 'dividend' | 'redemption' | 'transfer';
    title: string;
    amount: string;
    date: string;
    status: 'completed' | 'pending' | 'failed';
}

export const RecentActivity = () => {
    const activities: Activity[] = [
        { id: 1, type: 'investment', title: 'Invested in Green Energy Fund', amount: '+₹50,000', date: '2 hours ago', status: 'completed' },
        { id: 2, type: 'dividend', title: 'Dividend from CIB Infrastructure', amount: '+₹1,200', date: '1 day ago', status: 'completed' },
        { id: 3, type: 'investment', title: 'SIP in Technology Fund', amount: '+₹10,000', date: '3 days ago', status: 'completed' },
        { id: 4, type: 'redemption', title: 'Partial redemption from Equity Fund', amount: '-₹25,000', date: '5 days ago', status: 'pending' },
    ];

    const typeIcons = {
        investment: '📈',
        dividend: '💵',
        redemption: '📤',
        transfer: '🔄'
    };

    const statusColors = {
        completed: 'text-green-600 bg-green-50',
        pending: 'text-yellow-600 bg-yellow-50',
        failed: 'text-red-600 bg-red-50'
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View All →
                </button>
            </div>

            <div className="space-y-4">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl">
                            {typeIcons[activity.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                            <p className="text-xs text-gray-500">{activity.date}</p>
                        </div>
                        <div className="text-right">
                            <p className={`text-sm font-semibold ${activity.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                                {activity.amount}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[activity.status]}`}>
                                {activity.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
