'use client';

export const HeroBanner = () => {
    return (
        <div className="relative h-[70vh] md:h-[80vh] bg-gradient-to-r from-[#141414] via-gray-900 to-[#141414]">
            {/* Background Image/Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 via-black to-black" />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent" />

            {/* Content */}
            <div className="relative h-full flex items-center px-4 md:px-12">
                <div className="max-w-2xl">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">NEW</span>
                        <span className="text-gray-300 text-sm">Single Window Clearance System</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                        Start Your
                        <br />
                        <span className="text-red-600">Investment Journey</span>
                    </h1>

                    <p className="text-gray-300 text-lg mb-6 max-w-lg">
                        Apply for all government clearances from a single platform. Track your applications in real-time and get approvals faster.
                    </p>

                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition-colors">
                            <span>▶</span> New Application
                        </button>
                        <button className="flex items-center gap-2 px-6 py-3 bg-gray-600/80 hover:bg-gray-600 text-white font-semibold rounded transition-colors">
                            <span>ℹ️</span> More Info
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-8 mt-8">
                        <div>
                            <p className="text-3xl font-bold text-white">12</p>
                            <p className="text-gray-400 text-sm">Total Applications</p>
                        </div>
                        <div className="w-px h-12 bg-gray-700" />
                        <div>
                            <p className="text-3xl font-bold text-green-500">8</p>
                            <p className="text-gray-400 text-sm">Approved</p>
                        </div>
                        <div className="w-px h-12 bg-gray-700" />
                        <div>
                            <p className="text-3xl font-bold text-yellow-500">3</p>
                            <p className="text-gray-400 text-sm">In Progress</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
