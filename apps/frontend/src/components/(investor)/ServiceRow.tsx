'use client';

interface ServiceRowProps {
    title: string;
    services: {
        id: string;
        name: string;
        image: string;
        description: string;
    }[];
}

export const ServiceRow = ({ title, services }: ServiceRowProps) => {
    return (
        <div className="mb-8">
            <h2 className="text-white text-xl font-semibold mb-4 px-4 md:px-12">{title}</h2>
            <div className="flex gap-2 overflow-x-auto px-4 md:px-12 pb-4 scrollbar-hide">
                {services.map((service) => (
                    <div
                        key={service.id}
                        className="flex-shrink-0 w-[200px] md:w-[250px] group cursor-pointer"
                    >
                        <div className="relative rounded-md overflow-hidden transition-transform duration-300 group-hover:scale-105 group-hover:z-10">
                            {/* Image/Gradient Background */}
                            <div className={`h-32 md:h-36 ${service.image} flex items-center justify-center`}>
                                <span className="text-4xl">{service.id}</span>
                            </div>

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <h3 className="text-white text-sm font-semibold mb-1">{service.name}</h3>
                                    <p className="text-gray-300 text-xs line-clamp-2">{service.description}</p>
                                    <button className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors">
                                        Apply Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
