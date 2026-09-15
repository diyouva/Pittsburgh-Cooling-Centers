import { useEffect, useState } from 'react';

export default function MetricCard({ label, value, unit, icon, color = '#B33951', delay = 0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={`bg-[#fdfbf3] rounded-xl p-5 border border-[#e8ddb8]
        hover:border-[#d9cc9e] transition-all duration-300 hover:shadow-md
        ${visible ? 'animate-in' : 'opacity-0'}`}
      style={{ borderLeftColor: color, borderLeftWidth: '3px' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wider text-[#54494B]">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-[#171717]">{value}</span>
        {unit && <span className="text-sm text-[#54494B]">{unit}</span>}
      </div>
    </div>
  );
}
