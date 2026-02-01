"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Upload,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MethodBadge } from "@/components/method-badge";
import { JsonViewer } from "@/components/json-viewer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { loadConfig, type EnvironmentId } from "@/lib/storage";
import { replaceVariables, buildUrl, extractPathParams } from "@/lib/url-utils";
import type { Endpoint } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface PayloadBuilderProps {
  endpoint: Endpoint;
  collection: string;
  environment: EnvironmentId;
}

// Type definitions for field extraction
interface FieldInfo {
  path: string;
  displayName: string;
  sampleValue: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  isArrayItem: boolean;
  arrayPath?: string;
}

// Extract fields from JSON for Excel with human-readable names
function extractFieldsForExcel(
  obj: any,
  path = "",
  displayPath = "",
): FieldInfo[] {
  const fields: FieldInfo[] = [];

  if (obj === null || obj === undefined) return fields;

  if (Array.isArray(obj)) {
    // For arrays, process first item as template
    if (obj.length > 0) {
      const firstItem = obj[0];
      const childFields = extractFieldsForExcel(
        firstItem,
        `${path}[0]`,
        displayPath,
      );
      childFields.forEach((f) => {
        f.isArrayItem = true;
        f.arrayPath = path;
      });
      fields.push(...childFields);
    }
  } else if (typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      const newPath = path ? `${path}.${key}` : key;
      const newDisplayPath = displayPath
        ? `${displayPath} > ${formatFieldName(key)}`
        : formatFieldName(key);
      const value = obj[key];

      if (value === null || value === undefined) {
        fields.push({
          path: newPath,
          displayName: newDisplayPath,
          sampleValue: "",
          type: "string",
          isArrayItem: false,
        });
      } else if (Array.isArray(value)) {
        // Recurse into array
        const childFields = extractFieldsForExcel(
          value,
          newPath,
          newDisplayPath,
        );
        fields.push(...childFields);
      } else if (typeof value === "object") {
        // Recurse into nested object
        const childFields = extractFieldsForExcel(
          value,
          newPath,
          newDisplayPath,
        );
        fields.push(...childFields);
      } else {
        // Primitive value
        fields.push({
          path: newPath,
          displayName: newDisplayPath,
          sampleValue: String(value),
          type: typeof value as "string" | "number" | "boolean",
          isArrayItem: false,
        });
      }
    }
  }

  return fields;
}

// Format field name to be human readable
function formatFieldName(key: string): string {
  // Convert camelCase to Title Case with spaces
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/([a-z])([0-9])/gi, "$1 $2")
    .trim();
}

// Build nested object from flat Excel data
function buildNestedObjectFromExcel(
  data: Record<string, any>,
  templateObj: any,
): any {
  const result = JSON.parse(JSON.stringify(templateObj)); // Deep clone template

  // Create a map of display names to paths from template
  const fieldMap = new Map<string, string>();
  const fields = extractFieldsForExcel(templateObj);
  fields.forEach((f) => {
    fieldMap.set(f.displayName.toLowerCase().trim(), f.path);
  });

  // Process each Excel column
  for (const [displayName, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === "") continue;

    const path = fieldMap.get(displayName.toLowerCase().trim());
    if (!path) continue;

    setValueAtPath(result, path, value);
  }

  return result;
}

// Set value at a path like "reservations[0].roomStay.arrivalDate"
function setValueAtPath(obj: any, path: string, value: any): void {
  const parts = path.match(/([^.\[\]]+|\[\d+\])/g) || [];
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    let part = parts[i];
    const isArrayIndex = part.startsWith("[");

    if (isArrayIndex) {
      const idx = parseInt(part.slice(1, -1));
      // Ensure array exists and has enough elements
      if (!Array.isArray(current)) continue;
      while (current.length <= idx) {
        current.push({});
      }
      current = current[idx];
    } else {
      if (!(part in current)) {
        // Check if next part is array index
        const nextPart = parts[i + 1];
        current[part] = nextPart?.startsWith("[") ? [] : {};
      }
      current = current[part];
    }
  }

  // Set the final value
  const lastPart = parts[parts.length - 1];
  if (lastPart.startsWith("[")) {
    const idx = parseInt(lastPart.slice(1, -1));
    if (Array.isArray(current)) {
      current[idx] = parseValue(value);
    }
  } else {
    current[lastPart] = parseValue(value);
  }
}

// Parse string value to appropriate type
function parseValue(value: any): any {
  if (typeof value === "string") {
    // Try to parse as JSON first (for complex values)
    try {
      return JSON.parse(value);
    } catch {
      // Check for boolean
      if (value.toLowerCase() === "true") return true;
      if (value.toLowerCase() === "false") return false;
      // Check for number
      if (/^-?\d+(\.\d+)?$/.test(value)) {
        return parseFloat(value);
      }
      return value;
    }
  }
  return value;
}

export function PayloadBuilder({
  endpoint,
  collection,
  environment,
}: PayloadBuilderProps) {
  const { toast } = useToast();
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showDescription, setShowDescription] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const safeEndpoint = endpoint ?? {};
  const isPostMethod = (safeEndpoint?.method ?? "").toUpperCase() === "POST";

  useEffect(() => {
    // Initialize with endpoint defaults and environment variables
    const config = loadConfig(environment);

    // Parse URL to separate base URL from query string
    const fullUrl = safeEndpoint?.url ?? "";
    const [baseUrl, queryString] = fullUrl.split("?");

    // Extract path params from base URL (not including query string)
    const urlParams = extractPathParams(baseUrl);
    const initialPathParams: Record<string, string> = {};

    urlParams.forEach((param) => {
      initialPathParams[param] = config?.[param] ?? "";
    });

    (safeEndpoint?.pathParams ?? []).forEach((p: any) => {
      if (p?.key) {
        initialPathParams[p.key] = config?.[p.key] ?? p?.value ?? "";
      }
    });

    setPathParams(initialPathParams);

    // Initialize query params - extract from URL query string AND from queryParams array
    const initialQueryParams: Record<string, string> = {};

    // First, parse query params from the URL itself
    if (queryString) {
      const urlSearchParams = new URLSearchParams(queryString);
      urlSearchParams.forEach((value, key) => {
        // Replace any {{variable}} placeholders with config values or empty string
        const resolvedValue = value.replace(
          /\{\{(\w+)\}\}/g,
          (_, varName) => config?.[varName] ?? "",
        );
        initialQueryParams[key] = resolvedValue;
      });
    }

    // Then add/override with explicit queryParams from endpoint definition
    (safeEndpoint?.queryParams ?? [])
      .filter((p: any) => !p?.disabled)
      .forEach((p: any) => {
        if (p?.key) {
          initialQueryParams[p.key] = config?.[p.key] ?? p?.value ?? "";
        }
      });
    setQueryParams(initialQueryParams);

    // Initialize headers
    const initialHeaders: Record<string, string> = {};
    (safeEndpoint?.headers ?? [])
      .filter((h: any) => !h?.disabled)
      .forEach((h: any) => {
        if (h?.key) {
          const value = replaceVariables(h?.value ?? "", config);
          initialHeaders[h.key] = value;
        }
      });
    setHeaders(initialHeaders);

    // Initialize body
    if (safeEndpoint?.bodyRaw) {
      try {
        const bodyWithVars = replaceVariables(safeEndpoint.bodyRaw, config);
        const parsed = JSON.parse(bodyWithVars);
        setBody(JSON.stringify(parsed, null, 2));
      } catch {
        setBody(safeEndpoint.bodyRaw);
      }
    } else {
      setBody("");
    }

    setResponse(null);
    setValidationErrors([]);
    setShowDescription(false);
  }, [endpoint, environment]);

  // Store the template JSON for upload reconstruction
  const [templateJson, setTemplateJson] = useState<any>(null);

  // Parse the body JSON for template generation
  // const getBodyJson = (): any => {
  //   try {
  //     if (body?.trim?.()) {
  //       return JSON.parse(body);
  //     } else if (safeEndpoint?.bodyRaw) {
  //       const config = loadConfig(environment);
  //       const bodyWithVars = replaceVariables(safeEndpoint.bodyRaw, config);
  //       return JSON.parse(bodyWithVars);
  //     }
  //   } catch {
  //     return null;
  //   }
  //   return null;
  // };

  const getBodyJson = (): any => {
    try {
      // 1. If the textarea 'body' state has content, use that
      if (body && body.trim() !== "") {
        return JSON.parse(body);
      }

      // 2. Try to find the raw string in various common locations
      const rawString =
        safeEndpoint?.bodyRaw ||
        (typeof safeEndpoint?.body === "string" ? safeEndpoint.body : null) ||
        safeEndpoint?.request?.body?.raw;

      if (rawString) {
        const config = loadConfig(environment);
        const bodyWithVars = replaceVariables(rawString, config);
        return JSON.parse(bodyWithVars);
      }

      // 3. If body is already an object (not a string)
      if (safeEndpoint?.body && typeof safeEndpoint.body === "object") {
        return safeEndpoint.body;
      }
    } catch (e) {
      console.error("Failed to parse JSON body:", e);
      return null;
    }
    return null;
  };

  // Download Excel template with human-readable field names in rows (Field Name | Value format)
  const handleDownloadTemplate = () => {
    // window.alert("Button was clicked!");

    // console.log("ENDPOINT OBJECT:", safeEndpoint);

    debugger;
    try {
      const jsonBody = getBodyJson();
      // console.log("GENERATED JSON BODY:", jsonBody);
      if (!jsonBody) {
        toast({
          title: "No Body Found",
          description: "No request body found to create template",
          variant: "destructive",
        });
        return;
      }

      // Extract all fields with human-readable names
      const fields = extractFieldsForExcel(jsonBody);
      if (fields.length === 0) {
        toast({
          title: "No Fields Found",
          description: "No fields found in the request body to create template",
          variant: "destructive",
        });
        return;
      }

      // Create worksheet with Field Name as column A and Value as column B (row-based format)
      const wsData: (string | number | boolean)[][] = [
        [
          "Field Name",
          "Your Value",
          "Sample/Default Value",
          "JSON Path (Reference)",
        ],
      ];

      fields.forEach((field) => {
        wsData.push([
          field.displayName,
          "", // Empty cell for user to fill
          field.sampleValue,
          field.path,
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Payload Template");

      // Set column widths
      ws["!cols"] = [
        { wch: 50 }, // Field Name
        { wch: 40 }, // Your Value
        { wch: 30 }, // Sample Value
        { wch: 60 }, // JSON Path
      ];

      // Store template for later reconstruction
      setTemplateJson(jsonBody);

      const fileName = `${(safeEndpoint?.name ?? "endpoint").replace(/[^a-zA-Z0-9]/g, "_")}_template.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Template Downloaded",
        description: `Fill in "Your Value" column and upload the file`,
      });
    } catch (error: any) {
      toast({
        title: "Error Creating Template",
        description: error?.message ?? "Failed to create Excel template",
        variant: "destructive",
      });
    }
  };

  // Upload Excel file and convert to JSON payload intelligently
  const handleUploadExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(
          firstSheet,
          { defval: "" },
        );

        if (jsonData.length === 0) {
          toast({
            title: "Empty File",
            description: "The Excel file has no data rows",
            variant: "destructive",
          });
          return;
        }

        // Get template JSON (either stored or parse from body)
        const template = templateJson || getBodyJson();
        if (!template) {
          toast({
            title: "No Template Found",
            description: "Please download the template first before uploading",
            variant: "destructive",
          });
          return;
        }

        // Check if this is our row-based format (Field Name, Your Value columns)
        const firstRow = jsonData[0];
        const hasFieldNameColumn = "Field Name" in firstRow;

        if (hasFieldNameColumn) {
          // Row-based format: each row is a field
          const fieldValues: Record<string, any> = {};

          jsonData.forEach((row: any) => {
            const fieldName = row["Field Name"];
            const value = row["Your Value"];
            const jsonPath = row["JSON Path (Reference)"];

            // Use either the value column or fall back to sample if empty
            if (fieldName && value !== undefined && value !== "") {
              // If we have JSON path, use it directly for more accuracy
              if (jsonPath) {
                setValueAtPath(template, jsonPath, parseValue(value));
              } else {
                fieldValues[fieldName] = value;
              }
            }
          });

          // If we didn't use JSON paths, build from display names
          if (Object.keys(fieldValues).length > 0) {
            const result = buildNestedObjectFromExcel(fieldValues, template);
            setBody(JSON.stringify(result, null, 2));
          } else {
            setBody(JSON.stringify(template, null, 2));
          }
        } else {
          // Column-based format (legacy): first row has field names as columns
          const rowData = jsonData[0];
          const result = buildNestedObjectFromExcel(rowData, template);
          setBody(JSON.stringify(result, null, 2));
        }

        toast({
          title: "Payload Loaded",
          description:
            "Excel data converted to JSON payload successfully. Review and click Submit.",
        });
      } catch (error: any) {
        toast({
          title: "Error Reading Excel",
          description: error?.message ?? "Failed to parse Excel file",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validatePayload = (): boolean => {
    const errors: string[] = [];

    // Check required path params (use base URL without query string)
    const [baseUrlForValidation] = (safeEndpoint?.url ?? "").split("?");
    const urlParams = extractPathParams(baseUrlForValidation);
    urlParams.forEach((param) => {
      if (!pathParams?.[param]?.trim?.()) {
        errors.push(`Path parameter '${param}' is required`);
      }
    });

    // Validate JSON body if present
    if (body?.trim?.()) {
      try {
        JSON.parse(body);
      } catch {
        errors.push("Request body is not valid JSON");
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validatePayload()) {
      toast({
        title: "Validation Failed",
        description: "Please fix the validation errors before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      const config = loadConfig(environment);
      const allParams = { ...(config ?? {}), ...(pathParams ?? {}) };

      // Use base URL without query string, then add query params from state
      const [baseUrl] = (safeEndpoint?.url ?? "").split("?");
      const finalUrl = buildUrl(
        replaceVariables(baseUrl, allParams),
        {},
        queryParams ?? {},
      );

      const proxyResponse = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: safeEndpoint?.method ?? "GET",
          url: finalUrl,
          headers: headers ?? {},
          body: body?.trim?.() ? JSON.parse(body) : undefined,
          environment,
          collection,
          endpoint: safeEndpoint?.name ?? "Unknown",
        }),
      });

      const data = await proxyResponse.json();
      setResponse(data);

      if (data?.success) {
        toast({
          title: "Request Successful",
          description: `Status: ${data?.statusCode ?? "unknown"}`,
        });
      } else {
        toast({
          title: "Request Failed",
          description: data?.error ?? "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      const errorMessage = error?.message ?? "Failed to execute request";
      setResponse({ error: errorMessage, success: false });
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get base URL without query string for display and building
  const fullUrl = safeEndpoint?.url ?? "";
  const [baseUrlForDisplay] = fullUrl.split("?");

  const urlParams = extractPathParams(baseUrlForDisplay);
  const enabledHeaders = (safeEndpoint?.headers ?? []).filter(
    (h: any) => !h?.disabled,
  );

  // Get all query param keys from state (which includes URL-extracted and explicit params)
  const queryParamKeys = Object.keys(queryParams ?? {});

  return (
    <div className="flex flex-col h-full">
      {/* Hidden file input for Excel upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUploadExcel}
        accept=".xlsx,.xls"
        className="hidden"
      />

      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center gap-3 mb-2">
          <MethodBadge method={safeEndpoint?.method ?? "GET"} />
          <h2 className="font-semibold text-lg truncate">
            {safeEndpoint?.name ?? "Endpoint"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground font-mono truncate flex-1">
            {baseUrlForDisplay}
          </p>
          {safeEndpoint?.description && (
            <button
              onClick={() => setShowDescription(!showDescription)}
              className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
            >
              {showDescription ? (
                <EyeOff className="w-3 h-3" />
              ) : (
                <Eye className="w-3 h-3" />
              )}
              {showDescription ? "Hide description" : "Show description"}
            </button>
          )}
        </div>
        {showDescription && safeEndpoint?.description && (
          <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted/50 rounded">
            {safeEndpoint.description}
          </p>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Path Parameters */}
          {urlParams.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                Path Parameters
                <Badge variant="outline">{urlParams.length}</Badge>
              </h3>
              <div className="space-y-3">
                {urlParams.map((param) => (
                  <div key={param}>
                    <label className="text-sm font-medium mb-1 block">
                      {param}
                    </label>
                    <Input
                      value={pathParams?.[param] ?? ""}
                      onChange={(e) =>
                        setPathParams((prev) => ({
                          ...(prev ?? {}),
                          [param]: e.target.value,
                        }))
                      }
                      placeholder={`Enter ${param}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Query Parameters */}
          {queryParamKeys.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                Query Parameters
                <Badge variant="outline">{queryParamKeys.length}</Badge>
              </h3>
              <div className="space-y-3">
                {queryParamKeys.map((paramKey: string) => (
                  <div key={paramKey}>
                    <label className="text-sm font-medium mb-1 block">
                      {paramKey}
                    </label>
                    <Input
                      value={queryParams?.[paramKey] ?? ""}
                      onChange={(e) =>
                        setQueryParams((prev) => ({
                          ...(prev ?? {}),
                          [paramKey]: e.target.value,
                        }))
                      }
                      placeholder={`Enter ${paramKey}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Headers */}
          {enabledHeaders.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                Headers
                <Badge variant="outline">{enabledHeaders.length}</Badge>
              </h3>
              <div className="space-y-3">
                {enabledHeaders.map((header: any) => (
                  <div key={header?.key ?? ""}>
                    <label className="text-sm font-medium mb-1 block">
                      {header?.key ?? ""}
                    </label>
                    <Input
                      value={headers?.[header?.key ?? ""] ?? ""}
                      onChange={(e) =>
                        setHeaders((prev) => ({
                          ...(prev ?? {}),
                          [header?.key ?? ""]: e.target.value,
                        }))
                      }
                      placeholder={header?.value ?? ""}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Request Body */}
          {safeEndpoint?.hasBody && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Request Body</h3>
                {isPostMethod && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadTemplate}
                      className="text-xs h-7"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download Template
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs h-7"
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      Upload Excel
                    </Button>
                  </div>
                )}
              </div>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Enter JSON body"
                className="font-mono text-sm min-h-[200px]"
              />
              {isPostMethod && (
                <p className="text-xs text-muted-foreground mt-2">
                  Tip: Download the Excel template, fill in your data, then
                  upload it to auto-populate the payload.
                </p>
              )}
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 text-destructive font-medium mb-2">
                <AlertCircle className="w-4 h-4" />
                Validation Errors
              </div>
              <ul className="text-sm text-destructive space-y-1">
                {validationErrors.map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={validatePayload}
              className="flex-1"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Validate
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Submit
            </Button>
          </div>

          {/* Response */}
          {response && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                Response
                {response?.statusCode && (
                  <Badge
                    variant={response?.success ? "success" : "destructive"}
                  >
                    {response.statusCode}
                  </Badge>
                )}
                {response?.duration && (
                  <span className="text-xs text-muted-foreground">
                    {response.duration}ms
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                  onClick={() => {
                    const jsonData = JSON.stringify(
                      response?.data ?? response,
                      null,
                      2,
                    );
                    const blob = new Blob([jsonData], {
                      type: "application/json",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    const fileName = `${endpoint?.name?.replace(/[^a-zA-Z0-9]/g, "_") ?? "response"}_${new Date().toISOString().slice(0, 10)}.json`;
                    a.download = fileName;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download JSON
                </Button>
              </h3>
              <JsonViewer data={response?.data ?? response} />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
