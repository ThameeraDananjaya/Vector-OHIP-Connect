"use client";

import { useState } from 'react';
import { FileCode2 } from 'lucide-react';
import { EndpointList } from '@/components/endpoint-list';
import { PayloadBuilder } from '@/components/payload-builder';
import { TokenIndicator } from '@/components/token-indicator';
import type { Collection, Endpoint } from '@/lib/types';
import type { EnvironmentId } from '@/lib/storage';

interface ApiModuleProps {
  collection: Collection;
  environment: EnvironmentId;
}

export function ApiModule({ collection, environment }: ApiModuleProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);

  const safeCollection = collection ?? {};
  const safeEndpoints = safeCollection?.endpoints ?? [];

  return (
    <div className="flex h-[calc(100vh-120px)]">
      {/* Sidebar */}
      <div className="w-80 border-r bg-card flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
          <h2 className="font-semibold truncate">{safeCollection?.name ?? 'Module'}</h2>
          <TokenIndicator environment={environment} />
        </div>
        <EndpointList
          endpoints={safeEndpoints}
          selectedId={selectedEndpoint?.id ?? null}
          onSelect={setSelectedEndpoint}
          className="flex-1"
        />
      </div>
      
      {/* Main content */}
      <div className="flex-1 bg-background">
        {selectedEndpoint ? (
          <PayloadBuilder
            endpoint={selectedEndpoint}
            collection={safeCollection?.id ?? ''}
            environment={environment}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <FileCode2 className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Select an Endpoint</h3>
            <p className="text-muted-foreground max-w-md">
              Choose an endpoint from the sidebar to view its details and build your API request.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              {safeEndpoints.length} endpoints available in {safeCollection?.name ?? 'this module'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
