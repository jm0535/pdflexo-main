import React from 'react';
import { Badge } from '@/components/ui/badge';

const ComingSoonBadge: React.FC = () => {
  return (
    <div className="absolute top-0 right-0 z-10">
      <Badge className="rounded-bl-md rounded-tr-md rounded-tl-none rounded-br-none px-3 py-1.5 text-xs font-bold bg-orange-500 text-white border-orange-600 shadow-sm">
        COMING SOON
      </Badge>
    </div>
  );
};

export default ComingSoonBadge;
