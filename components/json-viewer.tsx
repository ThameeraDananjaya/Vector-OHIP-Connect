"use client";

import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JsonViewerProps {
  data: any;
  expanded?: boolean;
  className?: string;
}

export function JsonViewer({ data, expanded = true, className }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  const renderValue = (value: any, depth: number = 0): React.ReactNode => {
    if (value === null) {
      return <span className="json-null">null</span>;
    }
    if (value === undefined) {
      return <span className="json-null">undefined</span>;
    }
    if (typeof value === 'boolean') {
      return <span className="json-boolean">{value.toString()}</span>;
    }
    if (typeof value === 'number') {
      return <span className="json-number">{value}</span>;
    }
    if (typeof value === 'string') {
      return <span className="json-string">"{value}"</span>;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return <span>[]</span>;
      return (
        <JsonObject obj={value} isArray depth={depth} />
      );
    }
    if (typeof value === 'object') {
      const keys = Object.keys(value ?? {});
      if (keys.length === 0) return <span>{'{}'}</span>;
      return (
        <JsonObject obj={value} depth={depth} />
      );
    }
    return <span>{String(value)}</span>;
  };

  return (
    <div className={cn('relative font-mono text-sm', className)}>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded bg-muted hover:bg-muted/80 transition-colors z-10"
        title="Copy JSON"
      >
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
      </button>
      <div className="overflow-auto max-h-[500px] p-4 bg-muted/50 rounded-lg">
        {renderValue(data)}
      </div>
    </div>
  );
}

function JsonObject({ obj, isArray = false, depth = 0 }: { obj: any; isArray?: boolean; depth?: number }) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const entries = isArray ? (obj ?? []).map((v: any, i: number) => [i, v]) : Object.entries(obj ?? {});
  const brackets = isArray ? ['[', ']'] : ['{', '}'];

  if (entries.length === 0) {
    return <span>{brackets[0] + brackets[1]}</span>;
  }

  return (
    <span>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="inline-flex items-center hover:bg-muted rounded"
      >
        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
      <span>{brackets[0]}</span>
      {!isExpanded && (
        <span className="text-muted-foreground"> ... {entries.length} items </span>
      )}
      {isExpanded && (
        <div className="ml-4 border-l border-border pl-2">
          {entries.map(([key, value]: [any, any], index: number) => (
            <div key={key}>
              <span className="json-key">{isArray ? '' : `"${key}": `}</span>
              <JsonValueRenderer value={value} depth={depth + 1} />
              {index < entries.length - 1 && ','}
            </div>
          ))}
        </div>
      )}
      <span>{brackets[1]}</span>
    </span>
  );
}

function JsonValueRenderer({ value, depth }: { value: any; depth: number }) {
  if (value === null) return <span className="json-null">null</span>;
  if (value === undefined) return <span className="json-null">undefined</span>;
  if (typeof value === 'boolean') return <span className="json-boolean">{value.toString()}</span>;
  if (typeof value === 'number') return <span className="json-number">{value}</span>;
  if (typeof value === 'string') return <span className="json-string">"{value}"</span>;
  if (Array.isArray(value)) return <JsonObject obj={value} isArray depth={depth} />;
  if (typeof value === 'object') return <JsonObject obj={value} depth={depth} />;
  return <span>{String(value)}</span>;
}
