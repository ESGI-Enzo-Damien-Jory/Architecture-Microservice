"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  FolderOpen,
  Menu,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  MessageSquare,
  Server,
  Truck,
  RefreshCw,
  PackageCheck,
  ForkKnife,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { StatsService, Stats } from "@/lib/stat-service";

interface ServiceStatus {
  name: string;
  status: "healthy" | "unhealthy" | "checking";
  responseTime?: number;
  error?: string;
  port: string;
}

const SERVICES = [
  {
    name: "Auth Service",
    url: `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/health`,
    icon: Server,
    port: "3001",
  },
  {
    name: "Kitchen Service",
    url: `${process.env.NEXT_PUBLIC_KITCHEN_SERVICE_URL}/health`,
    icon: ForkKnife,
    port: "5003",
  },
  {
    name: "Delivery Service",
    url: `${process.env.NEXT_PUBLIC_DELIVERY_SERVICE_URL}/health`,
    icon: Truck,
    port: "3333",
  },
  {
    name: "Order Service",
    url: `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/health`,
    icon: PackageCheck,
    port: "5002",
  },
  {
    name: "RabbitMQ",
    url: `${process.env.NEXT_PUBLIC_RABBIT_MQ_URL}/api/overview`,
    icon: MessageSquare,
    port: "15672",
    auth: { username: "admin", password: "supersecret" },
  },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>(() =>
    SERVICES.map((s) => ({
      name: s.name,
      status: "checking" as const,
      port: s.port,
    }))
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  // Fonction simple pour checker un service
  const checkService = async (
    service: (typeof SERVICES)[0]
  ): Promise<ServiceStatus> => {
    const start = Date.now();

    try {
      const headers: Record<string, string> = {};

      if (service.auth) {
        headers.Authorization = `Basic ${btoa(
          `${service.auth.username}:${service.auth.password}`
        )}`;
      }

      const response = await fetch(service.url, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(5000),
      });

      const responseTime = Date.now() - start;

      return {
        name: service.name,
        port: service.port,
        status: response.ok ? "healthy" : "unhealthy",
        responseTime,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      const responseTime = Date.now() - start;
      return {
        name: service.name,
        port: service.port,
        status: "unhealthy",
        responseTime,
        error: error instanceof Error ? error.message : "Erreur de connexion",
      };
    }
  };

  // Fonction pour checker tous les services
  const checkAllServices = useCallback(async () => {
    setLastCheck(new Date());

    try {
      // Checker tous les services en parallèle
      const promises = SERVICES.map((service) => checkService(service));
      const results = await Promise.all(promises);

      setServices(results);
    } catch (error) {
      console.error("❌ Erreur health check:", error);
    }
  }, []);

  // Manual refresh
  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    // Marquer en checking seulement pendant le refresh manuel
    setServices((prev) =>
      prev.map((s) => ({ ...s, status: "checking" as const }))
    );

    await checkAllServices();
    setIsRefreshing(false);
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const data = await StatsService.getStats();
      setStats(data);
      setStatsError(null);
    } catch (error) {
      setStatsError(error instanceof Error ? error.message : "Erreur");
    } finally {
      setStatsLoading(false);
    }
  };

  // Initial load et interval
  useEffect(() => {
    console.log("🚀 Initialisation dashboard");

    // Load initial data
    fetchStats();
    checkAllServices();

    // Auto refresh toutes les 30 secondes
    const interval = setInterval(() => {
      checkAllServices();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [checkAllServices]);

  // Helpers
  const getStatusIcon = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "unhealthy":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "checking":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
  };

  const getStatusBadge = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "healthy":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            En ligne
          </Badge>
        );
      case "unhealthy":
        return <Badge variant="destructive">Hors ligne</Badge>;
      case "checking":
        return <Badge variant="secondary">Vérification...</Badge>;
    }
  };

  const renderStatValue = (value?: number) => {
    if (statsLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (statsError) return <span className="text-red-500">--</span>;
    return value?.toString() ?? "--";
  };

  // Calculs
  const healthyCount = services.filter((s) => s.status === "healthy").length;
  const unhealthyServices = services.filter((s) => s.status === "unhealthy");

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-gray-600">Surveillance de votre infrastructure</p>
      </div>

      {/* Stats error */}
      {statsError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>Erreur stats: {statsError}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle>
                Services ({healthyCount}/{SERVICES.length})
              </CardTitle>
            </div>
            <Button
              onClick={handleRefresh}
              size="sm"
              disabled={isRefreshing}
              variant="outline"
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Vérification..." : "Actualiser"}
            </Button>
          </div>
          <CardDescription>
            Dernière vérification: {lastCheck.toLocaleTimeString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {SERVICES.map((serviceConfig, index) => {
              const service = services[index];
              const IconComponent = serviceConfig.icon;

              return (
                <div
                  key={serviceConfig.name}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{serviceConfig.name}</p>
                      <p className="text-sm text-gray-500">
                        Port {serviceConfig.port}
                        {service?.responseTime &&
                          ` • ${service.responseTime}ms`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {service && getStatusIcon(service.status)}
                    {service && getStatusBadge(service.status)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Catégories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {renderStatValue(stats?.categories?.total)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Produits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {renderStatValue(stats?.products?.total)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Menus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {renderStatValue(stats?.menus?.total)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Système</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge
                variant={
                  healthyCount === SERVICES.length ? "default" : "destructive"
                }
              >
                {healthyCount}/{SERVICES.length}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/admin/categories">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Catégories
              </CardTitle>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/admin/products">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Produits
              </CardTitle>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/admin/menus">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Menu className="h-5 w-5" />
                Menus
              </CardTitle>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Services en panne */}
      {unhealthyServices.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Services en panne ({unhealthyServices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unhealthyServices.map((service) => (
                <div
                  key={service.name}
                  className="flex justify-between items-center p-2 bg-white rounded border"
                >
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-red-600">{service.error}</p>
                  </div>
                  <Badge variant="destructive">Hors ligne</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
