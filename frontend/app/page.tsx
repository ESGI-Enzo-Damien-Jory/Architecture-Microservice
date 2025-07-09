"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ShoppingCart,
  Star,
  Clock,
  Truck,
  ChefHat,
  Users,
  CheckCircle,
  ArrowRight,
  Play,
  Zap,
  Shield,
  Heart,
  Globe,
  Smartphone,
  Award,
  TrendingUp,
  Menu,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGetStarted = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  const features = [
    {
      icon: ShoppingCart,
      title: "Commande Instantanée",
      description:
        "Passez vos commandes en quelques clics avec notre interface intuitive",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Clock,
      title: "Livraison Express",
      description: "Livraison en 30 minutes ou moins, garanti dans votre zone",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: ChefHat,
      title: "Cuisine de Qualité",
      description:
        "Des chefs expérimentés préparent vos plats avec des ingrédients frais",
      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: Smartphone,
      title: "App Mobile",
      description:
        "Disponible sur iOS et Android pour commander où que vous soyez",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Shield,
      title: "Paiement Sécurisé",
      description:
        "Transactions 100% sécurisées avec cryptage de niveau bancaire",
      gradient: "from-indigo-500 to-blue-500",
    },
    {
      icon: Award,
      title: "Qualité Premium",
      description: "Noté 4.9/5 par nos clients avec plus de 10k avis positifs",
      gradient: "from-yellow-500 to-orange-500",
    },
  ];

  const testimonials = [
    {
      name: "Marie Dubois",
      role: "Cliente fidèle",
      image:
        "https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=100&h=100&fit=crop&crop=face",
      content:
        "Service exceptionnel ! Les plats arrivent toujours chauds et délicieux. L'app est super facile à utiliser.",
      rating: 5,
    },
    {
      name: "Thomas Martin",
      role: "Entrepreneur",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      content:
        "Parfait pour mes pauses déjeuner au bureau. Livraison ultra rapide et qualité au rendez-vous !",
      rating: 5,
    },
    {
      name: "Sophie Chen",
      role: "Étudiante",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      content:
        "Les prix sont abordables et la variété de plats est incroyable. Je recommande à 100% !",
      rating: 5,
    },
  ];

  const stats = [
    { number: "50k+", label: "Clients satisfaits" },
    { number: "200k+", label: "Commandes livrées" },
    { number: "4.9/5", label: "Note moyenne" },
    { number: "30min", label: "Livraison moyenne" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-xl shadow-lg" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                AMS
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-gray-700 hover:text-orange-500 transition-colors"
              >
                Fonctionnalités
              </a>
              <a
                href="#testimonials"
                className="text-gray-700 hover:text-orange-500 transition-colors"
              >
                Avis clients
              </a>
              <a
                href="#pricing"
                className="text-gray-700 hover:text-orange-500 transition-colors"
              >
                Tarifs
              </a>
              <a
                href="#contact"
                className="text-gray-700 hover:text-orange-500 transition-colors"
              >
                Contact
              </a>
            </div>

            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="bg-gradient-to-r from-orange-500 to-red-500"
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => router.push("/login")}>
                    Connexion
                  </Button>
                  <Button
                    onClick={() => router.push("/register")}
                    className="bg-gradient-to-r from-orange-500 to-red-500"
                  >
                    S'inscrire
                  </Button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-t">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <a href="#features" className="block px-3 py-2 text-gray-700">
                  Fonctionnalités
                </a>
                <a
                  href="#testimonials"
                  className="block px-3 py-2 text-gray-700"
                >
                  Avis clients
                </a>
                <a href="#pricing" className="block px-3 py-2 text-gray-700">
                  Tarifs
                </a>
                <a href="#contact" className="block px-3 py-2 text-gray-700">
                  Contact
                </a>
                <div className="flex flex-col gap-2 px-3 pt-2">
                  {user ? (
                    <Button
                      onClick={() => router.push("/dashboard")}
                      className="w-full"
                    >
                      Dashboard
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => router.push("/login")}
                        className="w-full"
                      >
                        Connexion
                      </Button>
                      <Button
                        onClick={() => router.push("/register")}
                        className="w-full"
                      >
                        S'inscrire
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 min-h-screen flex items-center bg-gradient-to-br from-orange-50 via-white to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <Badge className="mb-4 bg-orange-100 text-orange-800 border-orange-200">
                  🚀 Nouveau : Livraison en 20 minutes !
                </Badge>
                <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    La meilleure
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                    livraison de nourriture
                  </span>
                </h1>
                <p className="text-xl text-gray-600 mt-6 leading-relaxed">
                  Découvrez des plats délicieux préparés par les meilleurs chefs
                  et livrés directement chez vous en un temps record.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-lg px-8 py-4"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Commander maintenant
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-4"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Voir la démo
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-gray-900">
                      {stat.number}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1448997999437-3cb667cf2085?w=600&h=800&fit=crop"
                  alt="Delicious food"
                  width={600}
                  height={800}
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>

              {/* Floating cards */}
              <div className="absolute -top-4 -right-4 bg-white p-4 rounded-xl shadow-lg border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Commande livrée !</p>
                    <p className="text-xs text-gray-500">Il y a 2 minutes</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-xl shadow-lg border">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-6 h-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-full border-2 border-white"
                      ></div>
                    ))}
                  </div>
                  <div>
                    <p className="font-medium text-sm">+120 commandes</p>
                    <p className="text-xs text-gray-500">Aujourd'hui</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-800">
              Fonctionnalités
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir notre service ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nous offrons bien plus qu'une simple livraison de nourriture.
              Découvrez une expérience culinaire exceptionnelle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card
                  key={index}
                  className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-0 shadow-lg overflow-hidden"
                >
                  <CardContent className="p-8">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-800">
              Témoignages
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ce que disent nos clients
            </h2>
            <p className="text-xl text-gray-600">
              Plus de 50 000 clients nous font confiance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      width={48}
                      height={48}
                      className="rounded-full mr-4"
                      unoptimized
                    />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Prêt à commander votre premier repas ?
            </h2>
            <p className="text-xl text-orange-100 mb-8">
              Rejoignez des milliers de clients satisfaits et découvrez pourquoi
              nous sommes la plateforme de livraison préférée.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="bg-white text-orange-500 hover:bg-gray-100 text-lg px-8 py-4"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Commander maintenant
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-orange-500 text-lg px-8 py-4"
              >
                En savoir plus
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                  <ChefHat className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">FoodDelivery</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                La plateforme de livraison de nourriture qui révolutionne votre
                expérience culinaire. Des plats délicieux, livrés rapidement,
                partout en France.
              </p>
              <div className="flex space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <Globe className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <Heart className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <Users className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Liens rapides</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    À propos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Menu
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Livraison
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Centre d'aide
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Politique de confidentialité
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Conditions d'utilisation
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>
              &copy; 2025 FoodDelivery. Tous droits réservés. Fait avec ❤️ en
              France.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
