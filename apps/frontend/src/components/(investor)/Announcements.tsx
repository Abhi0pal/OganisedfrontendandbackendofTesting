'use client';

export const Announcements = () => {
    const announcements = [
        {
            id: 1,
            type: 'important',
            title: 'New Online Payment Gateway Launched',
            description: 'Pay your application fees online through multiple payment modes including UPI, Net Banking, and Cards.',
            date: '2024-12-05',
            isNew: true
        },
        {
            id: 2,
            type: 'update',
            title: 'Revised Guidelines for Land Allotment',
            description: 'Updated guidelines for industrial land allotment process. Please review before applying.',
            date: '2024-12-03',
            isNew: true
        },
        {
            id: 3,
            type: 'notice',
            title: 'Office Closed on 25th December',
            description: 'All offices will remain closed on account of Christmas. Online services will continue.',
            date: '2024-12-01',
            isNew: false
        },
    ];

    const typeConfig = {
        important: { icon: '🔴', bg: 'bg-red-50 border-red-200' },
        update: { icon: '🔵', bg: 'bg-blue-50 border-blue-200' },
        notice: { icon: '🟡', bg: 'bg-yellow-50 border-yellow-200' },
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-red-50 to-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">📢</span>
                        <h3 className="text-lg font-semibold text-gray-900">Announcements</h3>
                    </div>
                    <a href="/investor/announcements" className="text-sm text-red-600 hover:text-red-700 font-medium">
                        View All →
                    </a>
                </div>
            </div>

            <div className="divide-y divide-gray-100">
                {announcements.map((item) => (
                    <div
                        key={item.id}
                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${typeConfig[item.type as keyof typeof typeConfig].bg} border-l-4`}
                    >
                        <div className="flex items-start gap-3">
                            <span className="text-lg">{typeConfig[item.type as keyof typeof typeConfig].icon}</span>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-gray-900 text-sm">{item.title}</h4>
                                    {item.isNew && (
                                        <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded uppercase">
                                            New
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                                <p className="text-xs text-gray-400 mt-2">{item.date}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};