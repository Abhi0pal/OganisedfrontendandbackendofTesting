'use client';

interface ServiceCardProps {
    title: string;
    description: string;
    icon: string;
    href: string;
    color: string;
}

export const ServiceCard = ({ title, description, icon, href, color }: ServiceCardProps) => {
    return (
        <a
            href={href}
            className="block p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-red-200 transition-all duration-300 group"
        >
            <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                {title}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-2">{description}</p>
            <div className="mt-4 flex items-center text-red-600 text-sm font-medium">
                Apply Now <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </div>
        </a>
    );
};
