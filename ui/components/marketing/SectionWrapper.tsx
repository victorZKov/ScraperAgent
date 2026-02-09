interface SectionWrapperProps {
  id?: string;
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'accent';
  children: React.ReactNode;
}

export default function SectionWrapper({
  id,
  title,
  subtitle,
  variant = 'default',
  children,
}: SectionWrapperProps) {
  const bg =
    variant === 'accent'
      ? 'bg-gradient-to-br from-blue-500/5 to-purple-500/5'
      : '';

  return (
    <section id={id} className={`py-20 ${bg}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-3 text-text-secondary max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
