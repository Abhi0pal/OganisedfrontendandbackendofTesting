'use client';

interface Application {
    id: string;
    fundName: string;
    amount: string;
    date: string;
    status: 'approved' | 'pending' | 'rejected' | 'processing';
    type: 'SIP' | 'Lumpsum' | 'Redemption';
}

export const ApplicationsTable = () => {
    const applications: Application[] = [
        { id: 'APP001', fundName: 'Green Energy Fund', amount: '₹1,00,000', date: '2024-12-01', status: 'approved', type: 'Lumpsum' },
        { id: 'APP002', fundName: 'Technology Growth Fund', amount: '₹10,000/month', date: '2024-11-28', status: 'processing', type: 'SIP' },
        { id: 'APP003', fundName: 'Infrastructure Fund', amount: '₹50,000', date: '2024-11-25', status: 'pending', type: 'Lumpsum' },
        { id: 'APP004', fundName: 'Equity Diversified Fund', amount: '₹25,000', date: '2024-11-20', status: 'approved', type: 'Redemption' },
    ];

    const statusStyles = {
        approved: 'bg-green-100 text-green-700',
        pending: 'bg-yellow-100 text-yellow-700',
        rejected: 'bg-red-100 text-red-700',
        processing: 'bg-blue-100 text-blue-700'
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">My Applications</h3>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                        + New Application
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fund Name</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {applications.map((app) => (
                            <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm font-medium text-blue-600">{app.id}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">{app.fundName}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                                        {app.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{app.amount}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{app.date}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusStyles[app.status]}`}>
                                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button className="text-sm text-gray-500 hover:text-blue-600">View</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
