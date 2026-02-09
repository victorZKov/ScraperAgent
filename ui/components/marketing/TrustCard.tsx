interface TrustCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function TrustCard({ icon, title, description }: TrustCardProps) {
  return (
    <div className="text-center p-6 rounded-xl border border-border-subtle bg-surface/30">
      <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
    </div>
  );
}
