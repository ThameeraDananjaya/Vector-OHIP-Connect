"use client";

import { useState, useEffect } from 'react';
import { Save, RotateCcw, Download, Upload, Eye, EyeOff, Search, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { saveConfig, loadConfig, clearConfig, exportConfig, importConfig, type EnvironmentId } from '@/lib/storage';
import type { Environment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface SetupPanelProps {
  environment: Environment;
  envId: EnvironmentId;
}

export function SetupPanel({ environment, envId }: SetupPanelProps) {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [showSecrets, setShowSecrets] = useState(false);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);

  const safeEnvironment = environment ?? {};
  const safeVariables = safeEnvironment?.variables ?? [];

  useEffect(() => {
    const saved = loadConfig(envId);
    const initial: Record<string, string> = {};
    safeVariables.forEach((v: any) => {
      initial[v?.key ?? ''] = saved?.[v?.key ?? ''] ?? v?.value ?? '';
    });
    setValues(initial);
  }, [environment, envId]);

  const handleSave = () => {
    saveConfig(envId, values);
    toast({
      title: 'Configuration Saved',
      description: `${safeEnvironment?.name ?? 'Environment'} settings saved to local storage`,
    });
  };

  const handleReset = () => {
    clearConfig(envId);
    const initial: Record<string, string> = {};
    safeVariables.forEach((v: any) => {
      initial[v?.key ?? ''] = v?.value ?? '';
    });
    setValues(initial);
    toast({
      title: 'Configuration Reset',
      description: 'Settings have been reset to defaults',
    });
  };

  const handleExport = () => {
    // Export current input field values (not just what's saved in localStorage)
    const exportData = {
      environment: envId,
      name: safeEnvironment?.name ?? envId,
      config: values // Export the current form values, not localStorage
    };
    const data = JSON.stringify(exportData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ohip-${envId}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Configuration Exported',
      description: `${safeEnvironment?.name ?? 'Environment'} settings exported successfully`,
    });
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement)?.files?.[0];
      if (!file) return;
      const text = await file.text();
      // Import to current environment only
      if (importConfig(envId, text)) {
        const saved = loadConfig(envId);
        // Merge with default values for any missing keys
        const updated: Record<string, string> = {};
        safeVariables.forEach((v: any) => {
          updated[v?.key ?? ''] = saved?.[v?.key ?? ''] ?? v?.value ?? '';
        });
        setValues(updated);
        toast({
          title: 'Configuration Imported',
          description: `${safeEnvironment?.name ?? 'Environment'} settings imported successfully`,
        });
      } else {
        toast({
          title: 'Import Failed',
          description: 'Invalid configuration file format',
          variant: 'destructive',
        });
      }
    };
    input.click();
  };

  const handleGenerateToken = async () => {
    setIsGeneratingToken(true);
    const envName = safeEnvironment?.name ?? envId;
    
    try {
      const response = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          environment: envId,
          credentials: values,
        }),
      });
      
      const data = await response.json();
      
      if (data?.success) {
        toast({
          title: `${envName} Token Generated`,
          description: `Token valid until ${new Date(data?.token?.expiresAt ?? '').toLocaleString()}`,
        });
      } else {
        toast({
          title: `${envName} Token Generation Failed`,
          description: data?.error ?? 'Unknown error',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: `${envName} Token Error`,
        description: error?.message ?? 'Failed to generate token',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const filteredVariables = safeVariables.filter((v: any) => 
    !search || (v?.key?.toLowerCase?.()?.includes?.(search?.toLowerCase?.()) ?? false)
  );

  const isSecret = (key: string): boolean => {
    const secretPatterns = ['secret', 'password', 'token', 'key', 'credential'];
    const keyLower = key?.toLowerCase?.() ?? '';
    return secretPatterns.some(p => keyLower.includes(p));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-lg">{safeEnvironment?.name ?? 'Environment'}</h2>
            <p className="text-sm text-muted-foreground">{safeEnvironment?.description ?? ''}</p>
          </div>
          <Badge variant="outline">{filteredVariables.length} variables</Badge>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSave} size="sm">
            <Save className="w-4 h-4 mr-2" /> Save
          </Button>
          <Button onClick={handleReset} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" /> Reset
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button onClick={handleImport} variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" /> Import
          </Button>
          <Button onClick={() => setShowSecrets(!showSecrets)} variant="ghost" size="sm">
            {showSecrets ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showSecrets ? 'Hide' : 'Show'} Secrets
          </Button>
          <Button onClick={handleGenerateToken} disabled={isGeneratingToken} size="sm" className="ml-auto">
            <Key className="w-4 h-4 mr-2" />
            {isGeneratingToken ? 'Generating...' : 'Generate Token'}
          </Button>
        </div>
      </div>
      
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search variables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      {/* Variables List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {filteredVariables.map((variable: any) => (
            <div key={variable?.key ?? ''} className="space-y-1">
              <label className="text-sm font-medium flex items-center gap-2">
                {variable?.key ?? ''}
                {isSecret(variable?.key ?? '') && (
                  <Badge variant="outline" className="text-xs">Secret</Badge>
                )}
              </label>
              <Input
                type={isSecret(variable?.key ?? '') && !showSecrets ? 'password' : 'text'}
                value={values?.[variable?.key ?? ''] ?? ''}
                onChange={(e) => setValues(prev => ({ ...(prev ?? {}), [variable?.key ?? '']: e.target.value }))}
                placeholder={variable?.value || 'Enter value'}
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
