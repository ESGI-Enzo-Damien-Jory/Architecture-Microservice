"use client";

import { useState, useEffect } from "react";
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
  GripVertical,
  Package,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  Eye,
  EyeOff,
} from "lucide-react";
import { ProductService } from "@/lib/product-service";
import { CategoryService } from "@/lib/category-service";
import { Product } from "@/types/product";
import { ProductCategory } from "@/types/category";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);

  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");

  // States pour les modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // States pour les formulaires
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priceString: "",
    categoryId: "",
    available: true,
    imageUrl: "",
    position: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  // Charger les données
  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        ProductService.getProducts(),
        CategoryService.getCategories(),
      ]);
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

  // Produits filtrés
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ??
        false);

    const matchesCategory =
      selectedCategoryFilter === "all" ||
      product.categoryId === selectedCategoryFilter;

    const matchesAvailability =
      availabilityFilter === "all" ||
      (availabilityFilter === "available" && product.available) ||
      (availabilityFilter === "unavailable" && !product.available);

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  // Fonctions de réorganisation
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", "");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    setReordering(true);
    try {
      const newProducts = [...filteredProducts];
      const draggedItem = newProducts[draggedIndex];

      // Retirer l'élément de sa position actuelle
      newProducts.splice(draggedIndex, 1);
      // L'insérer à la nouvelle position
      newProducts.splice(dropIndex, 0, draggedItem);

      // Mettre à jour les positions dans la base de données
      // On met à jour toutes les positions des produits affectés
      const updatePromises = newProducts.map((product, index) =>
        ProductService.updateProduct(product.id, { position: index })
      );

      await Promise.all(updatePromises);

      // Recharger les données pour avoir l'état correct
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la réorganisation"
      );
      // En cas d'erreur, recharger les données pour revenir à l'état correct
      await loadData();
    } finally {
      setDraggedIndex(null);
      setReordering(false);
    }
  };

  // Créer un produit
  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.categoryId || !formData.priceString)
      return;

    setSubmitting(true);
    try {
      await ProductService.createProduct({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        priceCents: ProductService.priceStringToCents(formData.priceString),
        categoryId: formData.categoryId,
        available: formData.available,
        imageUrl: formData.imageUrl.trim() || undefined,
        position: formData.position || undefined,
      });

      setIsCreateOpen(false);
      setFormData({
        name: "",
        description: "",
        priceString: "",
        categoryId: "",
        available: true,
        imageUrl: "",
        position: 0,
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

  // Modifier un produit
  const handleEdit = async () => {
    if (
      !selectedProduct ||
      !formData.name.trim() ||
      !formData.categoryId ||
      !formData.priceString
    )
      return;

    setSubmitting(true);
    try {
      await ProductService.updateProduct(selectedProduct.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        priceCents: ProductService.priceStringToCents(formData.priceString),
        categoryId: formData.categoryId,
        available: formData.available,
        imageUrl: formData.imageUrl.trim() || undefined,
        position: formData.position,
      });

      setIsEditOpen(false);
      setSelectedProduct(null);
      setFormData({
        name: "",
        description: "",
        priceString: "",
        categoryId: "",
        available: true,
        imageUrl: "",
        position: 0,
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

  // Supprimer un produit
  const handleDelete = async () => {
    if (!selectedProduct) return;

    setSubmitting(true);
    try {
      await ProductService.deleteProduct(selectedProduct.id);

      setIsDeleteOpen(false);
      setSelectedProduct(null);
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
  const toggleAvailability = async (product: Product) => {
    try {
      await ProductService.updateProduct(product.id, {
        available: !product.available,
      });
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la modification"
      );
    }
  };

  // Ouvrir la modale d'édition
  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      priceString: ProductService.centsToPriceString(product.priceCents),
      categoryId: product.categoryId,
      available: product.available,
      imageUrl: product.imageUrl || "",
      position: product.position,
    });
    setIsEditOpen(true);
  };

  // Ouvrir la modale de suppression
  const openDeleteModal = (product: Product) => {
    setSelectedProduct(product);
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
          <h1 className="text-3xl font-bold">Produits</h1>
          <p className="text-muted-foreground">
            Gérez vos produits. Glissez-déposez pour réorganiser.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau produit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un produit</DialogTitle>
              <DialogDescription>
                Ajoutez un nouveau produit à votre catalogue
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Nom du produit *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex: Big Mac, McChicken..."
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
                  placeholder="Description du produit..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="price">Prix (€) *</Label>
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
                <Label htmlFor="category">Catégorie *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, categoryId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
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

              <div>
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  type="number"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      position: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
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
                <Label htmlFor="available">Produit disponible</Label>
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
                  submitting ||
                  !formData.name.trim() ||
                  !formData.categoryId ||
                  !formData.priceString
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

      {/* Indicateur de réorganisation */}
      {reordering && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Réorganisation en cours...</AlertDescription>
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
              <Label htmlFor="categoryFilter">Catégorie</Label>
              <Select
                value={selectedCategoryFilter}
                onValueChange={setSelectedCategoryFilter}
              >
                <SelectTrigger>
                  <SelectValue />
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
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">Total produits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {products.filter((p) => p.available).length}
            </div>
            <p className="text-xs text-muted-foreground">Disponibles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {products.filter((p) => !p.available).length}
            </div>
            <p className="text-xs text-muted-foreground">Indisponibles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{filteredProducts.length}</div>
            <p className="text-xs text-muted-foreground">Résultats filtrés</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des produits */}
      <div className="grid gap-4">
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {products.length === 0 ? "Aucun produit" : "Aucun résultat"}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {products.length === 0
                  ? "Commencez par créer votre premier produit"
                  : "Essayez de modifier vos filtres de recherche"}
              </p>
              {products.length === 0 && (
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un produit
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredProducts.map((product, index) => (
            <Card
              key={product.id}
              className={`hover:shadow-md transition-all duration-200 ${
                draggedIndex === index ? "opacity-50 scale-95" : ""
              } ${reordering ? "pointer-events-none" : ""}`}
              draggable={!reordering}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDrop={(e) => handleDrop(e, index)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col space-y-1">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                  </div>

                  {product.imageUrl && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {product.description && (
                        <span className="block">{product.description}</span>
                      )}
                      <span className="block mt-1">
                        <Badge variant="outline" className="mr-2">
                          {product.category?.name}
                        </Badge>
                        Position: {product.position}
                      </span>
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="text-right mr-4">
                    <div className="text-xl font-bold">
                      {ProductService.formatPrice(product.priceCents)}
                    </div>
                    <Badge
                      variant={ProductService.getAvailabilityBadgeVariant(
                        product.available
                      )}
                    >
                      {ProductService.getAvailabilityText(product.available)}
                    </Badge>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAvailability(product)}
                    disabled={reordering}
                  >
                    {product.available ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(product)}
                    disabled={reordering}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteModal(product)}
                    disabled={reordering}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {/* Modale d'édition */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le produit</DialogTitle>
            <DialogDescription>
              Modifiez les informations du produit
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="edit-name">Nom du produit *</Label>
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
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-price">Prix (€) *</Label>
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
              <Label htmlFor="edit-category">Catégorie *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, categoryId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="edit-imageUrl">URL de l&apos;image</Label>
              <Input
                id="edit-imageUrl"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="edit-position">Position</Label>
              <Input
                id="edit-position"
                type="number"
                value={formData.position}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    position: parseInt(e.target.value) || 0,
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
              <Label htmlFor="edit-available">Produit disponible</Label>
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
                submitting ||
                !formData.name.trim() ||
                !formData.categoryId ||
                !formData.priceString
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
            <DialogTitle>Supprimer le produit</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le produit &quot;
              {selectedProduct?.name}&quot; ? Cette action est irréversible.
              {selectedProduct?.menuProducts &&
                selectedProduct.menuProducts.length > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Ce produit est utilisé dans{" "}
                      {selectedProduct.menuProducts.length} menu(s). Vous devez
                      d&apos;abord le retirer des menus avant de pouvoir le
                      supprimer.
                    </p>
                  </div>
                )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={
                submitting ||
                (selectedProduct?.menuProducts &&
                  selectedProduct.menuProducts.length > 0)
              }
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
