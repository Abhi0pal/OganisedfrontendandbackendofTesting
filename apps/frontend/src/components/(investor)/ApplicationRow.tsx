'use client';

export const ApplicationRow = () => {
    const applications = [
        { id: 'LA-2024-001', name: 'Land Allotment', status: 'approved', progress: 100, icon: '🏭' },
        { id: 'EC-2024-002', name: 'Environmental Clearance', status: 'in_progress', progress: 65, icon: '🌿' },
        { id: 'BP-2024-003', name: 'Building Permission', status: 'in_progress', progress: 40, icon: '🏗️' },
        { id: 'PC-2024-004', name: 'Power Connection', status: 'submitted', progress: 20, icon: '⚡' },
        { id: 'WC-2024-005', name: 'Water Connection', status: 'pending', progress: 10, icon: '💧' },
    ];

    const statusColors = {
        approved: 'text-green-500',
        in_progress: 'text-yellow-500',
        submitted: 'text-blue-500',
        pending: 'text-gray-500',
        rejected: 'text-red-500',
    };

    return (
        <div className="mb-8 px-4 md:px-12">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-xl font-semibold">My Applications</h2>
                <a href="/investor/applications" className="text-gray-400 hover:text-white text-sm">
                    See All →
                </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {applications.map((app) => (
                    <div
                        key={app.id}
                        className="bg-gray-900/80 rounded-lg p-4 border border-gray-800 hover:border-gray-700 hover:bg-gray-800/80 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-2xl">{app.icon}</span>
                            <span className={`text-xs font-medium ${statusColors[app.status as keyof typeof statusColors]}`}>
                                {app.status.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>

                        <h3 className="text-white text-sm font-medium mb-1 truncate">{app.name}</h3>
                        <p className="text-gray-500 text-xs mb-3">{app.id}</p>

                        {/* Progress Bar */}
                        <div className="relative h-1 bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${app.status === 'approved' ? 'bg-green-500' :
                                    app.status === 'rejected' ? 'bg-red-500' : 'bg-red-600'
                                    }`}
                                style={{ width: `${app.progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-gray-500 text-xs">Progress</span>
                            <span className="text-gray-400 text-xs">{app.progress}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};