import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

export function DevBadge() {
  return (
    <Badge
      variant="outline"
      className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300 flex items-center gap-1"
    >
      <Shield className="w-3 h-3" />
      <span>Deweloper</span>
    </Badge>
  );
}
