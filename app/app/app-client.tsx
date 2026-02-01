"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Globe,
  Hotel,
  Workflow,
  Layers,
  BarChart3,
  Database,
  Settings,
  Home,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ApiModule } from '@/components/api-module';
import { SetupPanel } from '@/components/setup-panel';
import { cn } from '@/lib/utils';
import type { Collection, Environment } from '@/lib/types';
import type { EnvironmentId } from '@/lib/storage';

const tabs = [
  { id: 'distribution', name: 'Distribution', icon: Globe, env: 'distribution' as EnvironmentId },
  { id: 'property', name: 'OPERA Property', icon: Hotel, env: 'opera_cloud' as EnvironmentId },
  { id: 'workflows', name: 'OPERA Workflows', icon: Workflow, env: 'opera_cloud' as EnvironmentId },
  { id: 'nor1', name: 'Nor1 Upgrade', icon: Layers, env: 'opera_cloud' as EnvironmentId },
  { id: 'ra_data', name: 'R&A Data APIs', icon: BarChart3, env: 'ra_storage' as EnvironmentId },
  { id: 'ra_storage', name: 'R&A Object Storage', icon: Database, env: 'ra_storage' as EnvironmentId },
  { id: 'setup', name: 'Setup', icon: Settings, env: 'opera_cloud' as EnvironmentId },
];

const setupTabs = [
  { id: 'opera_cloud', name: 'OPERA Cloud', description: '255 variables' },
  { id: 'distribution', name: 'Distribution', description: '61 variables' },
  { id: 'ra_storage', name: 'R&A Object Storage', description: '9 variables' },
];

export default function AppClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('distribution');
  const [activeSetupTab, setActiveSetupTab] = useState<EnvironmentId>('opera_cloud');
  const [collections, setCollections] = useState<Record<string, Collection>>({});
  const [environments, setEnvironments] = useState<Record<string, Environment>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const tabParam = searchParams?.get?.('tab');
    if (tabParam && tabs.some(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [collectionsRes, environmentsRes] = await Promise.all([
        fetch('/collections.json'),
        fetch('/environments.json'),
      ]);
      
      const collectionsData = await collectionsRes.json();
      const environmentsData = await environmentsRes.json();
      
      setCollections(collectionsData ?? {});
      setEnvironments(environmentsData ?? {});
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.push(`/app?tab=${tabId}`, { scroll: false });
  };

  const currentTab = tabs.find(t => t.id === activeTab) ?? tabs[0];
  const currentCollection = collections?.[activeTab];
  const currentEnvironment = environments?.[activeSetupTab];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading API collections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex items-center h-14 gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">V</span>
              </div>
              <span className="font-semibold text-sm hidden md:inline">Vector OHIP Connect</span>
            </Link>
            
            <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1">
              {tabs.map(tab => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    'shrink-0 gap-2',
                    activeTab === tab.id && 'shadow-sm'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.name}</span>
                </Button>
              ))}
            </nav>
            
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Home className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <main className="max-w-[1400px] mx-auto">
        {activeTab === 'setup' ? (
          <div>
            {/* Setup Sub-navigation */}
            <div className="border-b bg-muted/30">
              <div className="flex items-center gap-2 p-3">
                {setupTabs.map(tab => (
                  <Button
                    key={tab.id}
                    variant={activeSetupTab === tab.id ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveSetupTab(tab.id as EnvironmentId)}
                    className="gap-2"
                  >
                    {tab.name}
                    <Badge variant="outline" className="text-xs">
                      {tab.description}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Setup Panel */}
            {currentEnvironment && (
              <SetupPanel
                environment={currentEnvironment}
                envId={activeSetupTab}
              />
            )}
          </div>
        ) : (
          /* API Module */
          currentCollection ? (
            <ApiModule
              collection={currentCollection}
              environment={currentTab?.env ?? 'opera_cloud'}
            />
          ) : (
            <div className="flex items-center justify-center h-[calc(100vh-120px)]">
              <div className="text-center">
                <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Module Not Found</h3>
                <p className="text-muted-foreground">The requested API module could not be loaded.</p>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}
