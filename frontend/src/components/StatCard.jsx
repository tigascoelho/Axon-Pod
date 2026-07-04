export default function StatCard({ label, value, unit, sub, color = 'accent', icon }) {
  const colorMap = {
    accent: 'text-accent',
    warning: 'text-warning',
    danger: 'text-danger',
    muted: 'text-text-muted',
  };
  return (
    <div className="card flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        {icon && <span className="text-text-muted text-base">{icon}</span>}
      </div>
      <div className={`text-2xl font-bold ${colorMap[color] || 'text-text-primary'}`}>
        {value}
        {unit && <span className="text-sm font-normal text-text-muted ml-1">{unit}</span>}
      </div>
      {sub && <span className="text-xs text-text-muted">{sub}</span>}
    </div>
  );
}
