import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Search,
  Plus,
  X,
  ShoppingCart,
  Check,
  Package,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  priceCents: number;
  available: boolean;
  categoryId: string;
  category?: {
    id: string;
    name: string;
  };
}

interface ProductCategory {
  id: string;
  name: string;
}

interface ProductSelectorProps {
  products: Product[];
  categories: ProductCategory[];
  selectedProductIds: string[];
  onSelectionChange: (productIds: string[]) => void;
  disabled?: boolean;
}

export default function ProductSelector({
  products,
  categories,
  selectedProductIds,
  onSelectionChange,
  disabled = false,
}: ProductSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [tempSelectedIds, setTempSelectedIds] =
    useState<string[]>(selectedProductIds);

  // Filtrer les produits
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Filtre par disponibilité
      if (!product.available) return false;

      // Filtre par recherche
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      // Filtre par catégorie
      const matchesCategory =
        selectedCategoryId === "all" ||
        product.categoryId === selectedCategoryId;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategoryId]);

  // Produits sélectionnés
  const selectedProducts = useMemo(() => {
    return products.filter((p) => selectedProductIds.includes(p.id));
  }, [products, selectedProductIds]);

  // Prix total des produits sélectionnés
  const totalPrice = useMemo(() => {
    return selectedProducts.reduce(
      (sum, product) => sum + product.priceCents,
      0
    );
  }, [selectedProducts]);

  const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)} €`;

  // Gestionnaires
  const handleOpenDialog = () => {
    setTempSelectedIds([...selectedProductIds]);
    setIsOpen(true);
  };

  const handleConfirm = () => {
    onSelectionChange(tempSelectedIds);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempSelectedIds([...selectedProductIds]);
    setIsOpen(false);
  };

  const toggleProduct = (productId: string) => {
    setTempSelectedIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleAll = () => {
    const allFilteredIds = filteredProducts.map((p) => p.id);
    const allSelected = allFilteredIds.every((id) =>
      tempSelectedIds.includes(id)
    );

    if (allSelected) {
      // Désélectionner tous les produits filtrés
      setTempSelectedIds((prev) =>
        prev.filter((id) => !allFilteredIds.includes(id))
      );
    } else {
      // Sélectionner tous les produits filtrés
      const newIds = [...tempSelectedIds];
      allFilteredIds.forEach((id) => {
        if (!newIds.includes(id)) {
          newIds.push(id);
        }
      });
      setTempSelectedIds(newIds);
    }
  };

  const removeProduct = (productId: string) => {
    onSelectionChange(selectedProductIds.filter((id) => id !== productId));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Produits inclus dans le menu</Label>
        {selectedProducts.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            disabled={disabled}
          >
            <X className="h-3 w-3 mr-1" />
            Tout effacer
          </Button>
        )}
      </div>

      {/* Produits sélectionnés */}
      {selectedProducts.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {selectedProducts.map((product) => (
              <Badge
                key={product.id}
                variant="default"
                className="flex items-center gap-1"
              >
                {product.name} - {formatPrice(product.priceCents)}
                {!disabled && (
                  <button
                    onClick={() => removeProduct(product.id)}
                    className="ml-1 hover:bg-red-500 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>

          <div className="text-sm text-muted-foreground">
            {selectedProducts.length} produit
            {selectedProducts.length > 1 ? "s" : ""} • Total:{" "}
            {formatPrice(totalPrice)}
          </div>
        </div>
      )}

      {/* Bouton pour ouvrir le sélecteur */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            onClick={handleOpenDialog}
            disabled={disabled}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {selectedProducts.length === 0
              ? "Sélectionner des produits"
              : "Modifier la sélection"}
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Sélectionner les produits du menu
            </DialogTitle>
            <DialogDescription>
              Choisissez les produits à inclure dans ce menu. Vous pouvez
              rechercher et filtrer par catégorie.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Barre de recherche et filtres */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="w-48">
                <Select
                  value={selectedCategoryId}
                  onValueChange={setSelectedCategoryId}
                >
                  <SelectTrigger>
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

            {/* Actions en lot */}
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAll}
                  disabled={filteredProducts.length === 0}
                >
                  {filteredProducts.every((p) => tempSelectedIds.includes(p.id))
                    ? "Désélectionner tout"
                    : "Sélectionner tout"}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {filteredProducts.length} produit
                  {filteredProducts.length > 1 ? "s" : ""} affiché
                  {filteredProducts.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="text-sm text-muted-foreground">
                {tempSelectedIds.length} sélectionné
                {tempSelectedIds.length > 1 ? "s" : ""}
              </div>
            </div>

            {/* Liste des produits */}
            <div className="max-h-96 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mb-2" />
                  <p>Aucun produit trouvé</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {filteredProducts.map((product) => {
                    const isSelected = tempSelectedIds.includes(product.id);

                    return (
                      <div
                        key={product.id}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-primary/5 border-primary"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => toggleProduct(product.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                              isSelected
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-muted-foreground"
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>

                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.category?.name}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-medium">
                            {formatPrice(product.priceCents)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Résumé de la sélection */}
            {tempSelectedIds.length > 0 && (
              <div className="border-t pt-3">
                <div className="text-sm font-medium">
                  Sélection actuelle: {tempSelectedIds.length} produit
                  {tempSelectedIds.length > 1 ? "s" : ""}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total:{" "}
                  {formatPrice(
                    products
                      .filter((p) => tempSelectedIds.includes(p.id))
                      .reduce((sum, p) => sum + p.priceCents, 0)
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Annuler
            </Button>
            <Button onClick={handleConfirm}>Confirmer la sélection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
