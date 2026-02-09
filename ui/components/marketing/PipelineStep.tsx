interface PipelineStepProps {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function PipelineStep({ step, title, description, icon }: PipelineStepProps) {
  return (
    <div className="flex flex-col items-center text-center group">
      {/* Step number + icon */}
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-border-subtle flex items-center justify-center text-blue-400 group-hover:border-blue-500/30 transition-all">
          {icon}
        </div>
        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center">
          {step}
        </span>
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed max-w-[220px]">
        {description}
      </p>
    </div>
  );
}
