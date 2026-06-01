'use client';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: string;
  bgColor?: string;
}

export const StatCard = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  bgColor = 'bg-white'
}: StatCardProps) => {
  const changeColors = {
    positive: 'text-green-600 bg-green-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50'
  };

  return (
    <div className={`${bgColor} rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl">
          {icon}
        </div>
        {change && (
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${changeColors[changeType]}`}>
            {changeType === 'positive' ? '↑' : changeType === 'negative' ? '↓' : ''} {change}
          </span>
        )}
      </div>
      <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
};
