import { cn } from '@/lib/utils';

interface MethodBadgeProps {
  method: string;
  className?: string;
}

export function MethodBadge({ method, className }: MethodBadgeProps) {
  const methodUpper = method?.toUpperCase?.() ?? 'GET';
  
  const getMethodClass = () => {
    switch (methodUpper) {
      case 'GET': return 'method-get';
      case 'POST': return 'method-post';
      case 'PUT': return 'method-put';
      case 'PATCH': return 'method-patch';
      case 'DELETE': return 'method-delete';
      default: return 'method-get';
    }
  };

  return (
    <span className={cn(
      'px-2 py-0.5 rounded text-xs font-semibold uppercase',
      getMethodClass(),
      className
    )}>
      {methodUpper}
    </span>
  );
}
