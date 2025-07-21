import { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  description?: string;
  colorClass?: string;
  className?: string;
}

export function KpiCard({ 
  title, 
  value, 
  icon,
  description, 
  colorClass = "text-blue-600",
  className = ''
}: KpiCardProps) {
  return (
    <div className={`bg-white rounded-3xl shadow-lg border border-gray-100 flex flex-col justify-between p-8 min-h-[170px] transition-shadow hover:shadow-xl ${className}`}>
      <div className="relative z-10 mb-5">
        <div className={`flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 ${colorClass}`}>
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-xs font-semibold text-gray-600 tracking-widest uppercase mb-1">{title}</h3>
        <p className="mt-1 text-4xl font-extrabold text-gray-900">{value}</p>
        {description && (
          <p className="mt-2 text-xs text-gray-500">{description}</p>
        )}
      </div>
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl"></div>
    </div>
  );
}
