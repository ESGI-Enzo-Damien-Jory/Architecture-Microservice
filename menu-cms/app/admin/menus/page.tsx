"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  Eye,
  EyeOff,
  ChefHat,
  Star,
} from "lucide-react";
import { MenuService } from "@/lib/menu-service";
import { ProductService } from "@/lib/product-service";
import { CategoryService } from "@/lib/category-service";
import { Menu, MenuType, ProductCategory } from "@/types/menu";
import { Product } from "@/types/product";
import ProductSelector from "@/components/ProductSelector";

export default function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");

  // States pour les modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);

  // States pour les formulaires
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priceString: "",
    type: MenuType.STANDARD,
    available: true,
    imageUrl: "",
    selectedProductIds: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);

  // Charger les données
  const loadData = async () => {
    try {
      setLoading(true);
      const [menusData, productsData, categoriesData] = await Promise.all([
        MenuService.getMenus(),
        ProductService.getProducts(),
        CategoryService.getCategories(),
      ]);
      setMenus(menusData);
      setProducts(productsData);
      setCategories(categoriesData);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors du chargement"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Menus filtrés
  const filteredMenus = menus.filter((menu) => {
    const matchesSearch =
      menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (menu.description?.toLowerCase().includes(searchTerm.toLowerCase()) ??
        false);

    const matchesType =
      selectedTypeFilter === "all" || menu.type === selectedTypeFilter;

    const matchesAvailability =
      availabilityFilter === "all" ||
      (availabilityFilter === "available" && menu.available) ||
      (availabilityFilter === "unavailable" && !menu.available);

    return matchesSearch && matchesType && matchesAvailability;
  });

  // Créer un menu
  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.priceString) return;

    setSubmitting(true);
    try {
      await MenuService.createMenu({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        priceCents: MenuService.priceStringToCents(formData.priceString),
        type: formData.type,
        available: formData.available,
        imageUrl: formData.imageUrl.trim() || undefined,
        productIds: formData.selectedProductIds,
      });

      setIsCreateOpen(false);
      setFormData({
        name: "",
        description: "",
        priceString: "",
        type: MenuType.STANDARD,
        available: true,
        imageUrl: "",
        selectedProductIds: [],
      });
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la création"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Modifier un menu
  const handleEdit = async () => {
    if (!selectedMenu || !formData.name.trim() || !formData.priceString) return;

    setSubmitting(true);
    try {
      await MenuService.updateMenu(selectedMenu.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        priceCents: MenuService.priceStringToCents(formData.priceString),
        type: formData.type,
        available: formData.available,
        imageUrl: formData.imageUrl.trim() || undefined,
        productIds: formData.selectedProductIds,
      });

      setIsEditOpen(false);
      setSelectedMenu(null);
      setFormData({
        name: "",
        description: "",
        priceString: "",
        type: MenuType.STANDARD,
        available: true,
        imageUrl: "",
        selectedProductIds: [],
      });
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la modification"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Supprimer un menu
  const handleDelete = async () => {
    if (!selectedMenu) return;

    setSubmitting(true);
    try {
      await MenuService.deleteMenu(selectedMenu.id);

      setIsDeleteOpen(false);
      setSelectedMenu(null);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la suppression"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Basculer la disponibilité
  const toggleAvailability = async (menu: Menu) => {
    try {
      await MenuService.updateMenu(menu.id, {
        available: !menu.available,
      });
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la modification"
      );
    }
  };

  // Ouvrir la modale d'édition
  const openEditModal = (menu: Menu) => {
    setSelectedMenu(menu);
    setFormData({
      name: menu.name,
      description: menu.description || "",
      priceString: MenuService.centsToPriceString(menu.priceCents),
      type: menu.type,
      available: menu.available,
      imageUrl: menu.imageUrl || "",
      selectedProductIds: menu.menuProducts?.map((mp) => mp.productId) || [],
    });
    setIsEditOpen(true);
  };

  // Ouvrir la modale de suppression
  const openDeleteModal = (menu: Menu) => {
    setSelectedMenu(menu);
    setIsDeleteOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Menus</h1>
          <p className="text-muted-foreground">
            Gérez vos formules et menus. Combinez vos produits en offres
            attractives.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau menu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Créer un menu</DialogTitle>
              <DialogDescription>
                Créez une nouvelle formule en combinant plusieurs produits
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Nom du menu *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex: Menu Big Mac, Menu Best Of..."
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Description du menu..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="price">Prix du menu (€) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.priceString}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      priceString: e.target.value,
                    }))
                  }
                  placeholder="9.50"
                />
              </div>

              <div>
                <Label htmlFor="type">Type de menu</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: MenuType) =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MenuType.STANDARD}>Standard</SelectItem>
                    <SelectItem value={MenuType.LIMITED}>
                      Édition limitée
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="imageUrl">URL de l&apos;image</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      imageUrl: e.target.value,
                    }))
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="col-span-2">
                <ProductSelector
                  products={products}
                  categories={categories}
                  selectedProductIds={formData.selectedProductIds}
                  onSelectionChange={(productIds) =>
                    setFormData((prev) => ({
                      ...prev,
                      selectedProductIds: productIds,
                    }))
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      available: e.target.checked,
                    }))
                  }
                />
                <Label htmlFor="available">Menu disponible</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  submitting || !formData.name.trim() || !formData.priceString
                }
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nom ou description..."
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="typeFilter">Type</Label>
              <Select
                value={selectedTypeFilter}
                onValueChange={setSelectedTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value={MenuType.STANDARD}>Standard</SelectItem>
                  <SelectItem value={MenuType.LIMITED}>
                    Édition limitée
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="availabilityFilter">Disponibilité</Label>
              <Select
                value={availabilityFilter}
                onValueChange={setAvailabilityFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="available">Disponibles</SelectItem>
                  <SelectItem value="unavailable">Indisponibles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{menus.length}</div>
            <p className="text-xs text-muted-foreground">Total menus</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {menus.filter((m) => m.available).length}
            </div>
            <p className="text-xs text-muted-foreground">Disponibles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {menus.filter((m) => m.type === MenuType.STANDARD).length}
            </div>
            <p className="text-xs text-muted-foreground">Standard</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {menus.filter((m) => m.type === MenuType.LIMITED).length}
            </div>
            <p className="text-xs text-muted-foreground">Édition limitée</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des menus */}
      <div className="grid gap-4">
        {filteredMenus.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ChefHat className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {menus.length === 0 ? "Aucun menu" : "Aucun résultat"}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {menus.length === 0
                  ? "Commencez par créer votre premier menu"
                  : "Essayez de modifier vos filtres de recherche"}
              </p>
              {menus.length === 0 && (
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un menu
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredMenus.map((menu) => {
            const productsPrices =
              menu.menuProducts?.map((mp) => mp.product?.priceCents || 0) || [];
            const savings = MenuService.calculateSavings(
              menu.priceCents,
              productsPrices
            );
            const totalProductsPrice = productsPrices.reduce(
              (sum, price) => sum + price,
              0
            );

            return (
              <Card
                key={menu.id}
                className="hover:shadow-md transition-all duration-200"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center space-x-4">
                    {menu.imageUrl && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                        {/* <img
                          src={menu.imageUrl}
                          alt={menu.name}
                          className="w-full h-full object-cover"
                        /> */}
                        <Image
                          src={menu.imageUrl}
                          alt={menu.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {menu.name}
                        {menu.type === MenuType.LIMITED && (
                          <Star className="h-4 w-4 text-yellow-500" />
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {menu.description && (
                          <span className="block">{menu.description}</span>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge
                            variant={MenuService.getMenuTypeBadgeVariant(
                              menu.type
                            )}
                          >
                            {MenuService.getMenuTypeText(menu.type)}
                          </Badge>
                          {menu.menuProducts &&
                            menu.menuProducts.length > 0 && (
                              <Badge variant="outline">
                                {menu.menuProducts.length} produit
                                {menu.menuProducts.length > 1 ? "s" : ""}
                              </Badge>
                            )}
                          {savings > 0 && (
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-200"
                            >
                              Économie: {MenuService.formatPrice(savings)}
                            </Badge>
                          )}
                        </div>

                        {/* Produits inclus */}
                        {menu.menuProducts && menu.menuProducts.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">
                              Produits inclus:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {menu.menuProducts.map((mp, index) => (
                                <span
                                  key={mp.id}
                                  className="text-xs bg-muted px-2 py-1 rounded"
                                >
                                  {mp.product?.name}
                                  {index < menu.menuProducts!.length - 1
                                    ? " +"
                                    : ""}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="text-right mr-4">
                      <div className="text-xl font-bold">
                        {MenuService.formatPrice(menu.priceCents)}
                      </div>
                      {totalProductsPrice > 0 && (
                        <div className="text-sm text-muted-foreground line-through">
                          {MenuService.formatPrice(totalProductsPrice)}
                        </div>
                      )}
                      <Badge
                        variant={MenuService.getAvailabilityBadgeVariant(
                          menu.available
                        )}
                      >
                        {MenuService.getAvailabilityText(menu.available)}
                      </Badge>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleAvailability(menu)}
                    >
                      {menu.available ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(menu)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteModal(menu)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            );
          })
        )}
      </div>

      {/* Modale d'édition */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Modifier le menu</DialogTitle>
            <DialogDescription>
              Modifiez les informations du menu
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="edit-name">Nom du menu *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="edit-price">Prix du menu (€) *</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={formData.priceString}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    priceString: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="edit-type">Type de menu</Label>
              <Select
                value={formData.type}
                onValueChange={(value: MenuType) =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MenuType.STANDARD}>Standard</SelectItem>
                  <SelectItem value={MenuType.LIMITED}>
                    Édition limitée
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="edit-imageUrl">URL de limage</Label>
              <Input
                id="edit-imageUrl"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))
                }
              />
            </div>

            <div className="col-span-2">
              <ProductSelector
                products={products}
                categories={categories}
                selectedProductIds={formData.selectedProductIds}
                onSelectionChange={(productIds) =>
                  setFormData((prev) => ({
                    ...prev,
                    selectedProductIds: productIds,
                  }))
                }
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-available"
                checked={formData.available}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    available: e.target.checked,
                  }))
                }
              />
              <Label htmlFor="edit-available">Menu disponible</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleEdit}
              disabled={
                submitting || !formData.name.trim() || !formData.priceString
              }
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modale de suppression */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le menu</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le menu &quot;
              {selectedMenu?.name}&quot; ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteOpen(false);
                setSelectedMenu(null);
              }}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
