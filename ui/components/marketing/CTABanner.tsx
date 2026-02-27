import Link from 'next/link';

interface CTABannerProps {
  heading: string;
  subtext?: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

export default function CTABanner({
  heading,
  subtext,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: CTABannerProps) {
  return (
    <div className="text-center p-10 rounded-2xl border border-border-subtle bg-gradient-to-br from-blue-500/5 to-purple-500/5">
      <h2 className="text-2xl font-bold text-text-primary mb-2">{heading}</h2>
      {subtext && (
        <p className="text-text-secondary mb-8 max-w-lg mx-auto">{subtext}</p>
      )}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href={primaryHref}
          className="px-8 py-3 rounded-xl text-base font-semibold bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 transition-all shadow-lg shadow-brand-500/20"
        >
          {primaryLabel}
        </Link>
        {secondaryHref && secondaryLabel && (
          <Link
            href={secondaryHref}
            className="px-8 py-3 rounded-xl text-base font-semibold text-text-secondary border border-border-subtle hover:bg-surface-elevated/60 transition-all"
          >
            {secondaryLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
