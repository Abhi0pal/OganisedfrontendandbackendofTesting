'use client';

export const QuickLinks = () => {
    const links = [
        { icon: '📄', label: 'Download Forms', href: '/investor/forms' },
        { icon: '📞', label: 'Contact Directory', href: '/investor/contacts' },
        { icon: '📖', label: 'User Manual', href: '/investor/manual' },
        { icon: '💬', label: 'FAQs', href: '/investor/faqs' },
        { icon: '🎥', label: 'Video Tutorials', href: '/investor/tutorials' },
        { icon: '📊', label: 'Fee Calculator', href: '/investor/calculator' },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span>🔗</span> Quick Links
            </h3>
            <div className="grid grid-cols-2 gap-3">
                {links.map((link, index) => (
                    <a
                        key={index}
                        href={link.href}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-red-50 hover:border-red-200 border border-transparent transition-all group"
                    >
                        <span className="text-xl">{link.icon}</span>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-red-600">
                            {link.label}
                        </span>
                    </a>
                ))}
            </div>
        </div>
    );
};
