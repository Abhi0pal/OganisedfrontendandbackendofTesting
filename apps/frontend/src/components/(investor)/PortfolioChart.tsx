'use client';

export const PortfolioChart = () => {
    // Mock chart data - in real app, use a charting library like Recharts
    const mockBars = [40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Portfolio Performance</h3>
                    <p className="text-sm text-gray-500">Year to date growth</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg">
                        1Y
                    </button>
                    <button className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                        6M
                    </button>
                    <button className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                        1M
                    </button>
                </div>
            </div>

            {/* Simple Bar Chart */}
            <div className="flex items-end justify-between h-48 gap-2">
                {mockBars.map((height, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div
                            className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all hover:from-blue-700 hover:to-blue-500"
                            style={{ height: `${height}%` }}
                        />
                        <span className="text-xs text-gray-400">{months[index]}</span>
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">Total Returns</p>
                    <p className="text-xl font-bold text-green-600">+₹10,00,000</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">CAGR</p>
                    <p className="text-xl font-bold text-gray-900">12.5%</p>
                </div>
            </div>
        </div>
    );
};
