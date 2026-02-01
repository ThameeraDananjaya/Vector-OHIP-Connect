export const replaceVariables = (
  template: string,
  variables: Record<string, string>
): string => {
  if (!template) return '';
  let result = template;
  
  // Replace {{variable}} patterns
  const varPattern = /\{\{([^}]+)\}\}/g;
  let match;
  while ((match = varPattern.exec(template)) !== null) {
    const varName = match?.[1] ?? '';
    const value = variables?.[varName] ?? match?.[0] ?? '';
    result = result?.replace?.(match?.[0] ?? '', value) ?? result;
  }
  
  // Replace :variable patterns in path
  const pathPattern = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
  while ((match = pathPattern.exec(template)) !== null) {
    const varName = match?.[1] ?? '';
    const value = variables?.[varName] ?? match?.[0] ?? '';
    result = result?.replace?.(match?.[0] ?? '', value) ?? result;
  }
  
  return result;
};

export const buildUrl = (
  baseUrl: string,
  pathParams: Record<string, string>,
  queryParams: Record<string, string>
): string => {
  let url = replaceVariables(baseUrl, pathParams);
  
  const params = Object.entries(queryParams ?? {})
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  
  if (params) {
    url += (url?.includes?.('?') ? '&' : '?') + params;
  }
  
  return url;
};

export const extractPathParams = (url: string): string[] => {
  const params: string[] = [];
  
  // Extract {{variable}} patterns
  const varPattern = /\{\{([^}]+)\}\}/g;
  let match;
  while ((match = varPattern.exec(url ?? '')) !== null) {
    if (match?.[1] && !params.includes(match[1])) {
      params.push(match[1]);
    }
  }
  
  // Extract :variable patterns
  const pathPattern = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
  while ((match = pathPattern.exec(url ?? '')) !== null) {
    if (match?.[1] && !params.includes(match[1])) {
      params.push(match[1]);
    }
  }
  
  return params;
};
