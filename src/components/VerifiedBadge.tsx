import { Check } from 'lucide-react';

const VerifiedBadge = () => (
  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-foreground ml-0.5" title="Verified Bot">
    <Check className="w-2.5 h-2.5 text-background" strokeWidth={3} />
  </span>
);

export default VerifiedBadge;
