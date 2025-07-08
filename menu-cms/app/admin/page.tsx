"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  FolderOpen,
  Menu as MenuIcon,
  TrendingUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { StatsService, Stats } from "@/lib/stat-service";

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await StatsService.getStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const renderStatValue = (value: number | undefined) => {
    if (loading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (error) {
      return <span className="text-red-500">--</span>;
    }
    return value ?? "--";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tableau de bord</h2>
        <p className="text-muted-foreground">
          Gérez votre restaurant depuis cette interface d&apos;administration
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Erreur de chargement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Catégories</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {renderStatValue(stats?.categories.total)}
            </div>
            <p className="text-xs text-muted-foreground">
              Catégories de produits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {renderStatValue(stats?.products.total)}
            </div>
            <p className="text-xs text-muted-foreground">
              Produits disponibles: {renderStatValue(stats?.products.available)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menus</CardTitle>
            <MenuIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {renderStatValue(stats?.menus.total)}
            </div>
            <p className="text-xs text-muted-foreground">
              Standard: {renderStatValue(stats?.menus.standard)} | Limité:{" "}
              {renderStatValue(stats?.menus.limited)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statut</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={loading ? "secondary" : "default"}>
                {loading ? "Chargement..." : "En ligne"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Système opérationnel
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/admin/categories" className="block">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Gérer les catégories
              </CardTitle>
              <CardDescription>
                Organisez vos produits par catégories
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/admin/products" className="block">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Gérer les produits
              </CardTitle>
              <CardDescription>
                Ajoutez et modifiez vos produits
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/admin/menus" className="block">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MenuIcon className="h-5 w-5" />
                Gérer les menus
              </CardTitle>
              <CardDescription>Créez et configurez vos menus</CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Informations importantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              • Vous êtes connecté en tant qu&apos;administrateur
            </p>
            <p className="text-sm">
              • Tous les changements sont sauvegardés automatiquement
            </p>
            <p className="text-sm">
              • L&apos;authentification est gérée par le microservice sur le
              port 3001
            </p>
            {stats && (
              <p className="text-sm text-muted-foreground">
                • Dernière mise à jour des statistiques:{" "}
                {new Date().toLocaleTimeString("fr-FR")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
