import { Check } from 'lucide-react';

const VerifiedBadge = () => (
  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gradient-cyber ml-1" title="Verified Bot">
    <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />
  </span>
);

export default VerifiedBadge;
