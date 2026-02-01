"use client";

import { useState, useEffect } from "react";
import { Key, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TokenIndicatorProps {
  environment: string;
  onRefresh?: () => void;
  className?: string;
}

export function TokenIndicator({
  environment,
  onRefresh,
  className,
}: TokenIndicatorProps) {
  const [tokenStatus, setTokenStatus] = useState<
    "valid" | "expired" | "none" | "loading"
  >("loading");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkToken();
  }, [environment]);

  const checkToken = async () => {
    try {
      const envKey = ["property", "workflows", "nor1"].includes(environment)
        ? "opera_cloud"
        : ["ra_data", "ra_storage"].includes(environment)
          ? "ra_storage"
          : environment;

      const response = await fetch(`/api/token?environment=${envKey}`);
      const data = await response.json();

      if (data?.valid) {
        setTokenStatus("valid");
        setExpiresAt(data?.token?.expiresAt ?? null);
      } else {
        setTokenStatus("none");
        setExpiresAt(null);
      }
    } catch (e) {
      setTokenStatus("none");
      setExpiresAt(null);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    onRefresh?.();
    await checkToken();
    setIsRefreshing(false);
  };

  const getTimeRemaining = () => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1.5">
        <Key className="w-4 h-4 text-muted-foreground" />
        {tokenStatus === "loading" ? (
          <Badge variant="outline" className="gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Checking...
          </Badge>
        ) : tokenStatus === "valid" ? (
          <Badge variant="success" className="gap-1">
            <CheckCircle className="w-3 h-3" />
            Valid
            {getTimeRemaining() && (
              <span className="ml-1 opacity-75 flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {getTimeRemaining()}
              </span>
            )}
          </Badge>
        ) : (
          <Badge variant="warning" className="gap-1">
            <XCircle className="w-3 h-3" />
            No Token
          </Badge>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="h-7 px-2"
      >
        <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
      </Button>
    </div>
  );
}
