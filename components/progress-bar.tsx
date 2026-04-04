interface ProgressBarProps {
  current: number;
  target: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({
  current,
  target,
  showLabel = true,
  size = 'md',
}: ProgressBarProps) {
  const percentage = Math.min((current / target) * 100, 100);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className="w-full">
      <div className={`w-full bg-muted rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className="bg-accent h-full transition-all duration-500 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between items-center mt-2 text-sm">
          <span className="text-muted-foreground">
            {current.toFixed(2)} ALGO
          </span>
          <span className="text-foreground font-semibold">
            {percentage.toFixed(0)}%
          </span>
          <span className="text-muted-foreground">
            {target.toFixed(2)} ALGO
          </span>
        </div>
      )}
    </div>
  );
}
