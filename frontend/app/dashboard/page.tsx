"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserMenu } from "@/components/auth/UserMenu";
import { useAuth } from "@/lib/authStore";
import { StatsService } from "@/lib/services/statsService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ShoppingCart,
  Package,
  Truck,
  Users,
  Settings,
  ChefHat,
  FolderOpen,
  BarChart3,
  Clock,
  Loader2,
  AlertCircle,
  TrendingUp,
  Euro,
  ArrowLeft,
  Plus,
  Minus,
  Star,
  Filter,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  // Charger les stats au montage
  useEffect(() => {
    const loadStats = async () => {
      if (!user?.role) return;

      try {
        setLoading(true);
        setError(null);

        if (user.role === "admin") {
          const adminStats = await StatsService.getOrderStats();
          setStats(adminStats);
        } else {
          const userOrders = await StatsService.getUserOrders();
          console.log("[DASHBOARD] User orders received:", userOrders);

          let calculatedStats;
          switch (user.role) {
            case "client":
              calculatedStats = StatsService.calculateUserStats(
                userOrders.orders
              );
              break;
            case "cook":
              calculatedStats = StatsService.calculateCookStats(
                userOrders.orders
              );
              break;
            case "delivery":
              calculatedStats = StatsService.calculateDeliveryStats(
                userOrders.orders
              );
              break;
            default:
              calculatedStats = {};
          }

          console.log("[DASHBOARD] Calculated stats:", calculatedStats);
          setStats({ ...calculatedStats, orders: userOrders.orders });
        }
      } catch (err) {
        console.error("Error loading dashboard stats:", err);
        setError("Erreur lors du chargement des statistiques");
        setStats(getDefaultStats(user.role));
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user?.role]);

  const getDefaultStats = (role?: string) => {
    switch (role) {
      case "client":
        return { ordersThisMonth: 0, totalSpent: 0, averageOrderValue: 0 };
      case "cook":
        return { ordersToday: 0, inProgress: 0, averageTime: "0min" };
      case "delivery":
        return { deliveriesToday: 0, inProgress: 0, averageTime: "0min" };
      case "admin":
        return {
          orders_today: 0,
          revenue_today: 0,
          total_orders: 0,
          orders_by_status: {},
        };
      default:
        return {};
    }
  };

  const getRoleSpecificActions = () => {
    switch (user?.role) {
      case "client":
        return [
          {
            title: "Commander",
            description: "Découvrez notre menu et passez commande",
            icon: ShoppingCart,
            href: "/menu",
            color: "bg-blue-500",
            primary: true,
          },
          {
            title: "Mes commandes",
            description: "Suivez vos commandes en cours",
            icon: Clock,
            href: "/my-orders",
            color: "bg-green-500",
          },
        ];

      case "cook":
        return [
          {
            title: "Commandes cuisine",
            description: "Gérer les commandes en préparation",
            icon: ChefHat,
            href: "/kitchen",
            color: "bg-orange-500",
            primary: true,
          },
          {
            title: "Voir le menu",
            description: "Consulter les produits disponibles",
            icon: Package,
            href: "/menu-view",
            color: "bg-purple-500",
          },
        ];

      case "delivery":
        return [
          {
            title: "Livraisons",
            description: "Gérer les livraisons assignées",
            icon: Truck,
            href: "/delivery",
            color: "bg-cyan-500",
            primary: true,
          },
          {
            title: "Historique",
            description: "Voir l'historique des livraisons",
            icon: BarChart3,
            href: "/delivery-history",
            color: "bg-indigo-500",
          },
        ];

      case "admin":
        return [
          {
            title: "Administration",
            description: "Accéder au panel d'administration complet",
            icon: Settings,
            href: "/admin",
            color: "bg-red-500",
            primary: true,
          },
          {
            title: "Gestion Menu",
            description: "Gérer catégories, produits et menus",
            icon: FolderOpen,
            href: "/admin/categories",
            color: "bg-yellow-500",
          },
          {
            title: "Utilisateurs",
            description: "Gérer les comptes utilisateurs",
            icon: Users,
            href: "/admin/users",
            color: "bg-pink-500",
          },
          {
            title: "Statistiques",
            description: "Voir les analytics et rapports",
            icon: BarChart3,
            href: "/admin/stats",
            color: "bg-emerald-500",
          },
        ];

      default:
        return [];
    }
  };

  const getQuickStats = () => {
    if (!stats || loading) return [];

    switch (user?.role) {
      case "client":
        return [
          {
            label: "Commandes ce mois",
            value: stats.ordersThisMonth?.toString() || "0",
            color: "text-blue-600",
            icon: ShoppingCart,
          },
          {
            label: "Total dépensé",
            value: StatsService.formatPrice(stats.totalSpent || 0),
            color: "text-green-600",
            icon: Euro,
          },
          {
            label: "Panier moyen",
            value: StatsService.formatPrice(stats.averageOrderValue || 0),
            color: "text-purple-600",
            icon: TrendingUp,
          },
        ];

      case "cook":
        return [
          {
            label: "Commandes aujourd'hui",
            value: stats.ordersToday?.toString() || "0",
            color: "text-orange-600",
            icon: ChefHat,
          },
          {
            label: "En préparation",
            value: stats.inProgress?.toString() || "0",
            color: "text-red-600",
            icon: Clock,
          },
          {
            label: "Temps moyen",
            value: stats.averageTime || "0min",
            color: "text-blue-600",
            icon: BarChart3,
          },
        ];

      case "delivery":
        return [
          {
            label: "Livraisons aujourd'hui",
            value: stats.deliveriesToday?.toString() || "0",
            color: "text-cyan-600",
            icon: Truck,
          },
          {
            label: "En cours",
            value: stats.inProgress?.toString() || "0",
            color: "text-orange-600",
            icon: Package,
          },
          {
            label: "Temps moyen",
            value: stats.averageTime || "0min",
            color: "text-green-600",
            icon: Clock,
          },
        ];

      case "admin":
        return [
          {
            label: "Commandes aujourd'hui",
            value: stats.orders_today?.toString() || "0",
            color: "text-blue-600",
            icon: ShoppingCart,
          },
          {
            label: "Revenus du jour",
            value: StatsService.formatPrice(stats.revenue_today || 0),
            color: "text-green-600",
            icon: Euro,
          },
          {
            label: "Total commandes",
            value: StatsService.formatNumber(stats.total_orders || 0),
            color: "text-purple-600",
            icon: BarChart3,
          },
        ];

      default:
        return [];
    }
  };

  const getRecentActivity = () => {
    if (!stats?.orders || !Array.isArray(stats.orders)) {
      return [1, 2, 3].map((item) => ({
        id: item,
        title:
          user?.role === "client"
            ? `Commande #${1000 + item} livrée`
            : user?.role === "cook"
            ? `Menu Big Mac préparé`
            : user?.role === "delivery"
            ? `Livraison rue de la Paix terminée`
            : user?.role === "admin"
            ? `Nouveau produit ajouté au menu`
            : "Activité",
        time: `Il y a ${item} heure${item > 1 ? "s" : ""}`,
        status:
          user?.role === "client"
            ? "Livrée"
            : user?.role === "cook"
            ? "Terminé"
            : user?.role === "delivery"
            ? "Terminé"
            : user?.role === "admin"
            ? "Nouveau"
            : "Terminé",
      }));
    }

    return stats.orders.slice(0, 3).map((order: any, index: number) => {
      const createdAt = new Date(order.created_at);
      const timeAgo = Math.floor(
        (Date.now() - createdAt.getTime()) / (1000 * 60 * 60)
      );

      return {
        id: order.id,
        title:
          user?.role === "client"
            ? `Commande #${order.id.slice(-4)}`
            : user?.role === "cook"
            ? `Commande #${order.id.slice(-4)}`
            : user?.role === "delivery"
            ? `Livraison #${order.id.slice(-4)}`
            : `Commande #${order.id.slice(-4)}`,
        time: timeAgo > 0 ? `Il y a ${timeAgo}h` : "À l'instant",
        status:
          order.status === "delivered"
            ? "Livrée"
            : order.status === "preparing"
            ? "En cours"
            : order.status === "confirmed"
            ? "Confirmée"
            : order.status === "pending"
            ? "En attente"
            : order.status === "cancelled"
            ? "Annulée"
            : order.status,
        amount: order.total_price_cents,
      };
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header - Style identique au menu */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => window.history.back()}
                  className="p-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {getWelcomeMessage()}, {user?.email?.split("@")[0]}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Connecté en tant que{" "}
                    <Badge variant="outline" className="ml-1">
                      {user?.role}
                    </Badge>
                  </p>
                </div>
              </div>
              <UserMenu />
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Message d'accueil - Style du menu */}
          <div className="mb-8 bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Bienvenue sur votre tableau de bord !
            </h2>
            <p className="text-gray-600">
              Voici un aperçu de votre activité et de vos statistiques.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Filtres - Style du menu */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    placeholder="Rechercher dans vos activités..."
                    className="pl-10 w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              <Button variant="outline" className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
            </div>
          </div>

          {/* Stats Section - Style des cartes menu */}
          {getQuickStats().length > 0 && (
            <section className="mb-12">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Vos Statistiques
                </h2>
                <div className="h-1 w-16 bg-primary rounded"></div>
                <p className="text-gray-600 mt-2">
                  Aperçu de votre performance et activité
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {getQuickStats().map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <Card
                      key={index}
                      className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-2 hover:border-primary/20"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">
                            {stat.label}
                          </CardTitle>
                          <div
                            className={`p-3 rounded-full ${stat.color
                              .replace("text-", "bg-")
                              .replace("-600", "-100")}`}
                          >
                            <IconComponent
                              className={`h-6 w-6 ${stat.color}`}
                            />
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        {loading ? (
                          <div className="flex items-center mt-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span className="text-sm text-gray-500">
                              Chargement...
                            </span>
                          </div>
                        ) : (
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${stat.color}`}>
                              {stat.value}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* Actions Section - Style menu */}
          <section className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Actions Principales
              </h2>
              <div className="h-1 w-16 bg-primary rounded"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {getRoleSpecificActions().map((action, index) => {
                const IconComponent = action.icon;

                return (
                  <Link key={index} href={action.href}>
                    <Card
                      className={`group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-2 hover:border-primary/20 ${
                        action.primary
                          ? "ring-2 ring-primary ring-opacity-20"
                          : ""
                      }`}
                    >
                      <div className="relative">
                        <div className="relative h-56 overflow-hidden bg-gray-100">
                          <div
                            className={`absolute inset-0 ${action.color} opacity-10`}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <IconComponent
                              className={`h-16 w-16 ${action.color.replace(
                                "bg-",
                                "text-"
                              )}`}
                            />
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="absolute top-4 left-4">
                          <Badge
                            variant="default"
                            className="flex items-center gap-1"
                          >
                            <IconComponent className="h-3 w-3" />
                            Action
                          </Badge>
                        </div>

                        {action.primary && (
                          <div className="absolute top-4 right-4">
                            <Badge className="bg-green-500 text-white">
                              <Star className="h-3 w-3 mr-1" />
                              Recommandé
                            </Badge>
                          </div>
                        )}
                      </div>

                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-xl">
                            {action.title}
                          </CardTitle>
                        </div>

                        <CardDescription className="text-base">
                          {action.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <Button
                          className="w-full flex items-center gap-2"
                          size="lg"
                        >
                          <IconComponent className="h-4 w-4" />
                          Accéder
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Recent Activity - Style menu */}
          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
              <CardDescription>
                {user?.role === "client" &&
                  "Vos dernières commandes et activités"}
                {user?.role === "cook" && "Dernières commandes traitées"}
                {user?.role === "delivery" && "Dernières livraisons effectuées"}
                {user?.role === "admin" && "Activité générale du système"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span className="text-sm text-gray-500">
                    Chargement de l'activité...
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  {getRecentActivity().map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-sm">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {activity.amount && (
                          <span className="text-sm font-medium text-green-600">
                            {StatsService.formatPrice(activity.amount)}
                          </span>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {activity.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 text-center">
                <Button variant="outline" size="sm">
                  Voir tout l&apos;historique
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help Section - Style menu */}
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="font-medium text-gray-900 mb-2">
                  Besoin d&apos;aide ?
                </h3>
                <p className="text-gray-600 mb-4">
                  Notre équipe support est là pour vous accompagner
                </p>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" size="sm">
                    📞 Contacter le support
                  </Button>
                  <Button variant="outline" size="sm">
                    📚 Guide d&apos;utilisation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
