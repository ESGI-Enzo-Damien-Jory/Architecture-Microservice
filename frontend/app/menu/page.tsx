"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authStore";
import { useCartStore } from "@/lib/store/cartStore";
import {
  MenuService,
  ProductCategory,
  Menu,
  Product,
} from "@/lib/services/menuService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  ShoppingCart,
  Star,
  Plus,
  Minus,
  Search,
  Filter,
  AlertCircle,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { toast } from "sonner";

export default function MenuPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { items: cartItems, addItem, getItemCount, getTotal } = useCartStore();

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [quantities, setQuantities] = useState<Map<string, number>>(new Map());

  // Vérification d'accès
  useEffect(() => {
    if (!isLoading) {
      if (!MenuService.canAccessMenu(user?.role)) {
        router.push("/unauthorized");
        return;
      }
      loadMenuData();
    }
  }, [isLoading, user, router]);

  const loadMenuData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("[MENU_PAGE] Loading menu data...");

      const [categoriesData, menusData] = await Promise.all([
        MenuService.getCategories(),
        MenuService.getMenus(),
      ]);

      console.log("[MENU_PAGE] Data loaded:", {
        categories: categoriesData.length,
        menus: menusData.length,
      });

      setCategories(
        MenuService.getAvailableCategoriesWithProducts(categoriesData)
      );
      setMenus(MenuService.getAvailableMenus(menusData));
    } catch (err) {
      console.error("[MENU_PAGE] Error loading menu data:", err);

      if (err instanceof Error) {
        if (
          err.message.includes("401") ||
          err.message.includes("Session expirée")
        ) {
          router.push("/login");
          return;
        }

        if (err.message.includes("403")) {
          router.push("/unauthorized");
          return;
        }

        setError(err.message);
      } else {
        setError("Erreur lors du chargement du menu");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (id: string, change: number) => {
    setQuantities((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(id) || 0;
      const newQuantity = Math.max(0, current + change);

      if (newQuantity === 0) {
        newMap.delete(id);
      } else {
        newMap.set(id, newQuantity);
      }

      return newMap;
    });
  };

  const handleAddToCart = (item: Product | Menu, type: "product" | "menu") => {
    const quantity = quantities.get(item.id) || 1;

    addItem(item, type, quantity);

    // Reset quantity after adding
    setQuantities((prev) => {
      const newMap = new Map(prev);
      newMap.delete(item.id);
      return newMap;
    });

    // Show success toast
    toast.success(`${item.name} ajouté au panier`, {
      description: `Quantité: ${quantity}`,
      duration: 2000,
    });
  };

  const goToCart = () => {
    router.push("/cart");
  };

  const filteredCategories = categories.filter((category) => {
    if (selectedCategory !== "all" && category.id !== selectedCategory)
      return false;

    if (searchTerm) {
      return category.products?.some(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return true;
  });

  const filteredMenus = menus.filter((menu) => {
    if (searchTerm) {
      return (
        menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        menu.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return true;
  });

  // Loading state pendant la vérification d'auth
  if (isLoading || (loading && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">
            {isLoading
              ? "Vérification de l'authentification..."
              : "Chargement du menu..."}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button onClick={loadMenuData} className="flex-1">
              Réessayer
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Vérification finale des permissions (UI)
  if (!MenuService.canAccessMenu(user?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Accès refusé
          </h1>
          <p className="text-gray-600 mb-6">
            Seuls les clients peuvent accéder au menu de commande.
          </p>
          <Button onClick={() => router.push("/dashboard")}>
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notre Menu</h1>
                <p className="text-sm text-gray-600">
                  Connecté en tant que {user?.email}
                </p>
              </div>
            </div>

            {/* Cart Button */}
            <Button
              className="relative"
              onClick={goToCart}
              disabled={cartItems.length === 0}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Panier
              {cartItems.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {getItemCount()}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="mb-8 bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Bienvenue sur notre menu de commande !
          </h2>
          <p className="text-gray-600">
            Découvrez nos délicieux produits et menus. Ajoutez vos favoris au
            panier pour passer commande.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un produit ou menu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Menus Section */}
        {filteredMenus.length > 0 && (
          <section className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Nos Menus
              </h2>
              <div className="h-1 w-16 bg-primary rounded"></div>
              <p className="text-gray-600 mt-2">
                Découvrez nos formules complètes avec des économies garanties
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMenus.map((menu) => {
                const quantity = quantities.get(menu.id) || 0;
                const savings = MenuService.calculateMenuSavings(menu);

                return (
                  <Card
                    key={menu.id}
                    className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-2 hover:border-primary/20"
                  >
                    <div className="relative">
                      {menu.imageUrl && (
                        <div className="relative h-56 overflow-hidden">
                          <Image
                            src={menu.imageUrl}
                            alt={menu.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                          />
                        </div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-4 left-4">
                        <Badge
                          variant={MenuService.getMenuTypeBadgeVariant(
                            menu.type
                          )}
                          className="flex items-center gap-1"
                        >
                          {menu.type === "LIMITED" && (
                            <Star className="h-3 w-3" />
                          )}
                          {MenuService.getMenuTypeText(menu.type)}
                        </Badge>
                      </div>

                      {savings > 0 && (
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-green-500 text-white">
                            -{MenuService.formatPrice(savings)}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl">{menu.name}</CardTitle>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {MenuService.formatPrice(menu.priceCents)}
                          </div>
                          {savings > 0 && (
                            <div className="text-sm text-green-600 font-medium">
                              Économie de {MenuService.formatPrice(savings)}
                            </div>
                          )}
                        </div>
                      </div>

                      {menu.description && (
                        <CardDescription className="text-base">
                          {menu.description}
                        </CardDescription>
                      )}

                      {/* Produits inclus */}
                      {menu.menuProducts && menu.menuProducts.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium text-sm text-gray-700 mb-2">
                            Ce menu comprend :
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {menu.menuProducts.map(
                              (mp) =>
                                mp.product && (
                                  <Badge
                                    key={mp.id}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {mp.product.name}
                                  </Badge>
                                )
                            )}
                          </div>
                        </div>
                      )}
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(menu.id, -1)}
                            disabled={quantity === 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {quantity || 1}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(menu.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

                        <Button
                          onClick={() => handleAddToCart(menu, "menu")}
                          size="lg"
                          className="flex items-center gap-2"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Ajouter
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Categories and Products */}
        {filteredCategories.map((category) => (
          <section key={category.id} className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {category.name}
              </h2>
              <div className="h-1 w-16 bg-primary rounded"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.products
                ?.filter((product) => {
                  if (searchTerm) {
                    return (
                      product.name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      product.description
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase())
                    );
                  }
                  return true;
                })
                .map((product) => {
                  const quantity = quantities.get(product.id) || 0;

                  return (
                    <Card
                      key={product.id}
                      className="group hover:shadow-lg transition-all duration-300 overflow-hidden"
                    >
                      {product.imageUrl && (
                        <div className="relative h-48 overflow-hidden">
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                          />
                        </div>
                      )}

                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg line-clamp-2">
                            {product.name}
                          </CardTitle>
                          <div className="text-xl font-bold text-primary">
                            {MenuService.formatPrice(product.priceCents)}
                          </div>
                        </div>
                        {product.description && (
                          <CardDescription className="line-clamp-2">
                            {product.description}
                          </CardDescription>
                        )}
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(product.id, -1)}
                              disabled={quantity === 0}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {quantity || 1}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(product.id, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          <Button
                            onClick={() => handleAddToCart(product, "product")}
                            className="flex items-center gap-2"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            Ajouter
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </section>
        ))}

        {/* Empty State */}
        {filteredCategories.length === 0 &&
          filteredMenus.length === 0 &&
          !loading && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun résultat trouvé
              </h3>
              <p className="text-gray-600 mb-4">
                Essayez de modifier vos critères de recherche
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
              >
                Réinitialiser les filtres
              </Button>
            </div>
          )}

        {/* Cart Summary (when items in cart) */}
        {cartItems.length > 0 && (
          <div className="fixed bottom-4 right-4 z-50">
            <Card className="p-4 shadow-lg">
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-medium">{getItemCount()} article(s)</p>
                  <p className="text-lg font-bold text-primary">
                    {MenuService.formatPrice(getTotal())}
                  </p>
                </div>
                <Button onClick={goToCart}>Voir le panier</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
