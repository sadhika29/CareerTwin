export function Progress({ value = 0, max = 100, colorClass = 'bg-success', label, showValue = true, className = '' }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm font-medium text-text-secondary">{label}</span>}
          {showValue && <span className="text-sm font-semibold text-text-primary">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className="h-2 w-full bg-border/50 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
