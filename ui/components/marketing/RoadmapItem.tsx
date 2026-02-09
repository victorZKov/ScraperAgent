interface RoadmapItemProps {
  quarter: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned';
}

export default function RoadmapItem({ quarter, title, description, status }: RoadmapItemProps) {
  const statusStyles = {
    completed: 'bg-green-500',
    'in-progress': 'bg-blue-500 animate-pulse',
    planned: 'bg-border-subtle',
  };

  const statusLabel = {
    completed: 'Completed',
    'in-progress': 'In Progress',
    planned: 'Planned',
  };

  return (
    <div className="flex gap-4">
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${statusStyles[status]} shrink-0 mt-1.5`} />
        <div className="w-px flex-1 bg-border-subtle/60" />
      </div>

      {/* Content */}
      <div className="pb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-xs font-mono text-text-muted bg-surface-elevated px-2 py-0.5 rounded">
            {quarter}
          </span>
          <span className="text-xs text-text-faint">{statusLabel[status]}</span>
        </div>
        <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
        <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
