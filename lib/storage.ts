const STORAGE_KEYS = {
  OPERA_CLOUD_CONFIG: 'ohip_opera_cloud_config',
  DISTRIBUTION_CONFIG: 'ohip_distribution_config',
  RA_STORAGE_CONFIG: 'ohip_ra_storage_config',
} as const;

export type EnvironmentId = 'opera_cloud' | 'distribution' | 'ra_storage';

const getStorageKey = (envId: EnvironmentId): string => {
  switch (envId) {
    case 'opera_cloud': return STORAGE_KEYS.OPERA_CLOUD_CONFIG;
    case 'distribution': return STORAGE_KEYS.DISTRIBUTION_CONFIG;
    case 'ra_storage': return STORAGE_KEYS.RA_STORAGE_CONFIG;
    default: return `ohip_${envId}_config`;
  }
};

export const saveConfig = (envId: EnvironmentId, config: Record<string, string>): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(envId), JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config:', e);
  }
};

export const loadConfig = (envId: EnvironmentId): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(getStorageKey(envId));
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error('Failed to load config:', e);
    return {};
  }
};

export const clearConfig = (envId: EnvironmentId): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(getStorageKey(envId));
  } catch (e) {
    console.error('Failed to clear config:', e);
  }
};

export const exportAllConfigs = (): string => {
  const configs: Record<string, Record<string, string>> = {};
  (['opera_cloud', 'distribution', 'ra_storage'] as EnvironmentId[]).forEach(envId => {
    configs[envId] = loadConfig(envId);
  });
  return JSON.stringify(configs, null, 2);
};

export const importAllConfigs = (jsonStr: string): boolean => {
  try {
    const configs = JSON.parse(jsonStr);
    Object.entries(configs).forEach(([envId, config]) => {
      saveConfig(envId as EnvironmentId, config as Record<string, string>);
    });
    return true;
  } catch (e) {
    console.error('Failed to import configs:', e);
    return false;
  }
};

// Export single environment config
export const exportConfig = (envId: EnvironmentId): string => {
  const config = loadConfig(envId);
  return JSON.stringify({ environment: envId, config }, null, 2);
};

// Import single environment config
export const importConfig = (envId: EnvironmentId, jsonStr: string): boolean => {
  try {
    const data = JSON.parse(jsonStr);
    // Support both formats: { config: {...} } or direct config object
    const config = data?.config ?? data;
    if (typeof config === 'object' && config !== null) {
      saveConfig(envId, config as Record<string, string>);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed to import config:', e);
    return false;
  }
};
