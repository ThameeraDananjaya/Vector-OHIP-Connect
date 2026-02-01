export interface EnvVariable {
  key: string;
  value: string;
  type: string;
  enabled: boolean;
}

export interface Environment {
  id: string;
  name: string;
  description: string;
  originalName: string;
  variables: EnvVariable[];
}

export interface PathParam {
  key: string;
  value: string;
  description: string;
}

export interface QueryParam {
  key: string;
  value: string;
  description: string;
  disabled: boolean;
}

export interface Header {
  key: string;
  value: string;
  description: string;
  disabled: boolean;
}

export interface Endpoint {
  id: string;
  name: string;
  method: string;
  url: string;
  pathParams: PathParam[];
  queryParams: QueryParam[];
  headers: Header[];
  hasBody: boolean;
  bodyMode: string | null;
  bodyRaw: string | null;
  body?: any;
  request?: {
    // Add this (for nested structures)
    body?: {
      raw?: string;
    };
  };
  folder: string;
  description: string;
}

export interface Folder {
  name: string;
  path: string;
  description: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  originalName: string;
  endpoints: Endpoint[];
  folders: Folder[];
  endpointCount: number;
}

export interface TokenInfo {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: string;
  environment: string;
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
  headers?: Record<string, string>;
  duration?: number;
}
