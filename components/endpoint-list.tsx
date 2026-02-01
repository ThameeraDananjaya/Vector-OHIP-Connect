"use client";

import { useState, useMemo } from 'react';
import { Search, Folder, ChevronRight, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MethodBadge } from '@/components/method-badge';
import { cn } from '@/lib/utils';
import type { Endpoint } from '@/lib/types';

interface EndpointListProps {
  endpoints: Endpoint[];
  selectedId: string | null;
  onSelect: (endpoint: Endpoint) => void;
  className?: string;
}

export function EndpointList({ endpoints, selectedId, onSelect, className }: EndpointListProps) {
  const [search, setSearch] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const safeEndpoints = endpoints ?? [];

  const filteredEndpoints = useMemo(() => {
    if (!search?.trim?.()) return safeEndpoints;
    const searchLower = search.toLowerCase();
    return safeEndpoints.filter(ep => 
      (ep?.name?.toLowerCase?.()?.includes?.(searchLower) ?? false) ||
      (ep?.url?.toLowerCase?.()?.includes?.(searchLower) ?? false) ||
      (ep?.folder?.toLowerCase?.()?.includes?.(searchLower) ?? false)
    );
  }, [safeEndpoints, search]);

  const groupedEndpoints = useMemo(() => {
    const groups: Record<string, Endpoint[]> = {};
    filteredEndpoints.forEach(ep => {
      const folder = ep?.folder || 'Root';
      if (!groups[folder]) groups[folder] = [];
      groups[folder].push(ep);
    });
    return groups;
  }, [filteredEndpoints]);

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folder)) {
        next.delete(folder);
      } else {
        next.add(folder);
      }
      return next;
    });
  };

  const folders = Object.keys(groupedEndpoints).sort();

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search endpoints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          {filteredEndpoints.length} endpoints
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {folders.map(folder => {
            const isExpanded = expandedFolders.has(folder);
            const folderEndpoints = groupedEndpoints[folder] ?? [];
            
            return (
              <div key={folder} className="mb-1">
                <button
                  onClick={() => toggleFolder(folder)}
                  className="flex items-center gap-1 w-full p-2 text-left text-sm font-medium hover:bg-muted rounded-md transition-colors"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <Folder className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate flex-1">{folder}</span>
                  <span className="text-xs text-muted-foreground">{folderEndpoints.length}</span>
                </button>
                {isExpanded && (
                  <div className="ml-4 space-y-0.5">
                    {folderEndpoints.map(ep => (
                      <button
                        key={ep?.id}
                        onClick={() => onSelect(ep)}
                        className={cn(
                          'flex items-center gap-2 w-full p-2 text-left text-sm rounded-md transition-colors',
                          selectedId === ep?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        )}
                      >
                        <MethodBadge method={ep?.method ?? 'GET'} />
                        <span className="truncate flex-1">{ep?.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
