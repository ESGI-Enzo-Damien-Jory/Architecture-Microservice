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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
  FolderOpen,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { CategoryService } from "@/lib/category-service";
import { ProductCategory } from "@/types/category";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);

  // States pour les modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<ProductCategory | null>(null);

  // States pour les formulaires
  const [formData, setFormData] = useState({ name: "", position: 0 });
  const [submitting, setSubmitting] = useState(false);

  // Charger les catégories
  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await CategoryService.getCategories();
      setCategories(data);
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
    loadCategories();
  }, []);

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
      const newCategories = [...categories];
      const draggedItem = newCategories[draggedIndex];

      newCategories.splice(draggedIndex, 1);
      newCategories.splice(dropIndex, 0, draggedItem);

      const updatedCategories = newCategories.map((cat, index) => ({
        ...cat,
        position: index,
      }));

      setCategories(updatedCategories);

      await Promise.all(
        updatedCategories.map((cat, index) =>
          CategoryService.updateCategory(cat.id, { position: index })
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la réorganisation"
      );
      await loadCategories();
    } finally {
      setDraggedIndex(null);
      setReordering(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) return;

    setSubmitting(true);
    try {
      await CategoryService.createCategory({
        name: formData.name.trim(),
        position: formData.position || categories.length,
      });

      setIsCreateOpen(false);
      setFormData({ name: "", position: 0 });
      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la création"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedCategory || !formData.name.trim()) return;

    setSubmitting(true);
    try {
      await CategoryService.updateCategory(selectedCategory.id, {
        name: formData.name.trim(),
        position: formData.position,
      });

      setIsEditOpen(false);
      setSelectedCategory(null);
      setFormData({ name: "", position: 0 });
      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la modification"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    setSubmitting(true);
    try {
      await CategoryService.deleteCategory(selectedCategory.id);

      setIsDeleteOpen(false);
      setSelectedCategory(null);
      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la suppression"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Ouvrir la modale d'édition
  const openEditModal = (category: ProductCategory) => {
    setSelectedCategory(category);
    setFormData({ name: category.name, position: category.position });
    setIsEditOpen(true);
  };

  // Ouvrir la modale de suppression
  const openDeleteModal = (category: ProductCategory) => {
    setSelectedCategory(category);
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
          <h1 className="text-3xl font-bold">Catégories</h1>
          <p className="text-muted-foreground">
            Gérez les catégories de vos produits. Glissez-déposez pour
            réorganiser.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle catégorie
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une catégorie</DialogTitle>
              <DialogDescription>
                Ajoutez une nouvelle catégorie de produits
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nom de la catégorie</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex: Entrées, Plats, Desserts..."
                />
              </div>

              <div>
                <Label htmlFor="position">Position (optionnel)</Label>
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
                  placeholder={categories.length.toString()}
                />
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
                disabled={submitting || !formData.name.trim()}
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

      {/* Liste des catégories */}
      <div className="grid gap-4">
        {categories.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune catégorie</h3>
              <p className="text-muted-foreground text-center mb-4">
                Commencez par créer votre première catégorie de produits
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Créer une catégorie
              </Button>
            </CardContent>
          </Card>
        ) : (
          categories.map((category, index) => (
            <Card
              key={category.id}
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
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col space-y-1">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <CardDescription>
                      Position: {category.position}
                      {category.products && (
                        <span className="ml-3">
                          {category.products.length} produit(s)
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    Position {category.position}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(category)}
                    disabled={reordering}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteModal(category)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la catégorie</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la catégorie
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nom de la catégorie</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
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
              disabled={submitting || !formData.name.trim()}
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
            <DialogTitle>Supprimer la catégorie</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer la catégorie &quot;
              {selectedCategory?.name}&quot; ? Cette action est irréversible.
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
