// app/page.tsx
"use client";

import { useAuthStore } from "@/lib/auth-store";
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
  Shield,
  ChefHat,
  Truck,
  Users,
  ArrowRight,
  Sparkles,
  Settings,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  // Rediriger vers admin si déjà connecté en tant qu'admin
  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      router.push("/admin");
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-orange-600" />
              <h1 className="text-xl font-bold text-gray-900">
                Restaurant CMS
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Shield className="h-3 w-3" />
                    {user?.role || "Connecté"}
                  </Badge>
                  <Button asChild>
                    <Link href="/admin">
                      <Settings className="mr-2 h-4 w-4" />
                      Administration
                    </Link>
                  </Button>
                </div>
              ) : (
                <Button asChild>
                  <Link href="/login">
                    <Shield className="mr-2 h-4 w-4" />
                    Se connecter
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative">
            <Sparkles className="absolute -top-4 -left-4 h-8 w-8 text-yellow-400 animate-pulse" />
            <Sparkles className="absolute -top-2 -right-6 h-6 w-6 text-orange-400 animate-pulse delay-1000" />

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Système de Gestion
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
                Restaurant
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Interface complète pour gérer vos menus, produits et catégories.
              Solution moderne avec authentification sécurisée et interface
              intuitive.
            </p>

            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="text-lg px-8 py-6">
                  <Link href="/login">
                    <Shield className="mr-2 h-5 w-5" />
                    Accéder à l&apos;administration
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6"
                >
                  <Eye className="mr-2 h-5 w-5" />
                  Voir la démonstration
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Fonctionnalités principales
            </h2>
            <p className="text-lg text-gray-600">
              Tout ce dont vous avez besoin pour gérer efficacement votre
              restaurant
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle>Authentification</CardTitle>
                <CardDescription>
                  Système sécurisé avec gestion des rôles (Admin, Cook, Client,
                  Delivery)
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChefHat className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>Gestion Menus</CardTitle>
                <CardDescription>
                  Créez et organisez vos menus standard et éditions limitées
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle>Multi-rôles</CardTitle>
                <CardDescription>
                  Interface adaptée selon le rôle : admin complet, consultation
                  pour les autres
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle>API Moderne</CardTitle>
                <CardDescription>
                  Architecture microservices avec API RESTful et
                  authentification JWT
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Accès selon votre rôle
            </h2>
            <p className="text-lg text-gray-600">
              Chaque utilisateur a accès aux fonctionnalités adaptées à son rôle
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <Shield className="h-5 w-5" />
                  Admin
                </CardTitle>
                <CardDescription>Accès complet</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  <li>• CRUD complet</li>
                  <li>• Gestion des menus</li>
                  <li>• Gestion des produits</li>
                  <li>• Gestion des catégories</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <ChefHat className="h-5 w-5" />
                  Cook
                </CardTitle>
                <CardDescription>Consultation</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  <li>• Voir les menus</li>
                  <li>• Voir les produits</li>
                  <li>• Consulter les catégories</li>
                  <li>• Lecture seule</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Users className="h-5 w-5" />
                  Client
                </CardTitle>
                <CardDescription>Consultation</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  <li>• Voir les menus</li>
                  <li>• Voir les produits</li>
                  <li>• Consulter les catégories</li>
                  <li>• Lecture seule</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <Truck className="h-5 w-5" />
                  Delivery
                </CardTitle>
                <CardDescription>Pas d&apos;accès CMS</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  <li>• Pas d&apos;accès</li>
                  <li>• Rôle dédié livraison</li>
                  <li>• Interface séparée</li>
                  <li>• -</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-20 bg-gradient-to-r from-orange-600 to-red-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Prêt à commencer ?
            </h2>
            <p className="text-xl text-orange-100 mb-8">
              Connectez-vous avec vos identifiants pour accéder à l&apos;interface
              d&apos;administration
            </p>
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="text-lg px-8 py-6"
            >
              <Link href="/login">
                <Shield className="mr-2 h-5 w-5" />
                Se connecter maintenant
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <ChefHat className="h-6 w-6 text-orange-500" />
              <span className="text-lg font-semibold">Restaurant CMS</span>
            </div>
            <p className="text-sm">
              Système de gestion moderne pour restaurants • Architecture
              microservices
            </p>
            <p className="text-xs mt-2 text-gray-500">
              Authentification via microservice port 3001
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
