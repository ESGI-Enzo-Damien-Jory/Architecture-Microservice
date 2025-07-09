"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserMenu } from "@/components/auth/UserMenu";
import { useAuth } from "@/lib/authStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
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
            href: "/orders",
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
    switch (user?.role) {
      case "client":
        return [
          { label: "Commandes ce mois", value: "3", color: "text-blue-600" },
          { label: "Points fidélité", value: "150", color: "text-green-600" },
          {
            label: "Économies réalisées",
            value: "25€",
            color: "text-purple-600",
          },
        ];

      case "cook":
        return [
          {
            label: "Commandes aujourd'hui",
            value: "12",
            color: "text-orange-600",
          },
          { label: "En préparation", value: "3", color: "text-red-600" },
          { label: "Temps moyen", value: "18min", color: "text-blue-600" },
        ];

      case "delivery":
        return [
          {
            label: "Livraisons aujourd'hui",
            value: "8",
            color: "text-cyan-600",
          },
          { label: "En cours", value: "2", color: "text-orange-600" },
          { label: "Temps moyen", value: "25min", color: "text-green-600" },
        ];

      case "admin":
        return [
          {
            label: "Commandes aujourd'hui",
            value: "47",
            color: "text-blue-600",
          },
          {
            label: "Revenus du jour",
            value: "1,234€",
            color: "text-green-600",
          },
          {
            label: "Utilisateurs actifs",
            value: "156",
            color: "text-purple-600",
          },
        ];

      default:
        return [];
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
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
              <UserMenu />
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Stats */}
          {getQuickStats().length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {getQuickStats().map((stat, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          {stat.label}
                        </p>
                        <p className={`text-3xl font-bold ${stat.color}`}>
                          {stat.value}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Main Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Actions principales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getRoleSpecificActions().map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <Link key={index} href={action.href}>
                    <Card
                      className={`hover:shadow-lg transition-all duration-300 cursor-pointer group ${
                        action.primary
                          ? "ring-2 ring-primary ring-opacity-20"
                          : ""
                      }`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div
                            className={`p-2 rounded-lg ${action.color} bg-opacity-10`}
                          >
                            <IconComponent
                              className={`h-6 w-6 ${action.color.replace(
                                "bg-",
                                "text-"
                              )}`}
                            />
                          </div>
                          {action.primary && (
                            <Badge className="bg-primary">Recommandé</Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {action.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <CardDescription className="text-base">
                          {action.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Activity - Role specific */}
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
              <div className="space-y-4">
                {/* Sample activity items - would be replaced with real data */}
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-sm">
                          {user?.role === "client" &&
                            `Commande #${1000 + item} livrée`}
                          {user?.role === "cook" && `Menu Big Mac préparé`}
                          {user?.role === "delivery" &&
                            `Livraison rue de la Paix terminée`}
                          {user?.role === "admin" &&
                            `Nouveau produit ajouté au menu`}
                        </p>
                        <p className="text-xs text-gray-500">
                          Il y a {item} heure{item > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {user?.role === "client" && "Livrée"}
                      {user?.role === "cook" && "Terminé"}
                      {user?.role === "delivery" && "Terminé"}
                      {user?.role === "admin" && "Nouveau"}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-center">
                <Button variant="outline" size="sm">
                  Voir tout l&apos;historique
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
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
