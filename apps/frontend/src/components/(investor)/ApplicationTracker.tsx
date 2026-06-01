'use client';

interface Application {
    id: string;
    serviceName: string;
    applicationNo: string;
    submittedDate: string;
    status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'pending_docs';
    currentStage: string;
    progress: number;
}

export const ApplicationTracker = () => {
    const applications: Application[] = [
        {
            id: '1',
            serviceName: 'Land Allotment',
            applicationNo: 'LA-2024-00123',
            submittedDate: '2024-12-01',
            status: 'under_review',
            currentStage: 'District Collector Review',
            progress: 60
        },
        {
            id: '2',
            serviceName: 'Environmental Clearance',
            applicationNo: 'EC-2024-00456',
            submittedDate: '2024-11-28',
            status: 'pending_docs',
            currentStage: 'Awaiting Documents',
            progress: 30
        },
        {
            id: '3',
            serviceName: 'Building Permission',
            applicationNo: 'BP-2024-00789',
            submittedDate: '2024-11-20',
            status: 'approved',
            currentStage: 'Completed',
            progress: 100
        },
    ];

    const statusConfig = {
        submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
        under_review: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
        approved: { label: 'Approved', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
        rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
        pending_docs: { label: 'Pending Documents', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-red-50 to-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">My Applications</h3>
                        <p className="text-sm text-gray-500 mt-1">Track your application status</p>
                    </div>
                    <a href="/investor/applications" className="text-sm text-red-600 hover:text-red-700 font-medium">
                        View All →
                    </a>
                </div>
            </div>

            <div className="divide-y divide-gray-100">
                {applications.map((app) => (
                    <div key={app.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h4 className="font-medium text-gray-900">{app.serviceName}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {app.applicationNo} • Submitted: {app.submittedDate}
                                </p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${statusConfig[app.status].color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[app.status].dot}`}></span>
                                {statusConfig[app.status].label}
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative">
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${app.status === 'approved' ? 'bg-green-500' :
                                            app.status === 'rejected' ? 'bg-red-500' : 'bg-red-400'
                                        }`}
                                    style={{ width: `${app.progress}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-1.5">
                                <span className="text-xs text-gray-500">{app.currentStage}</span>
                                <span className="text-xs font-medium text-gray-700">{app.progress}%</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
