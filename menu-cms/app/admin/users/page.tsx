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
  Users,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  Shield,
  Key,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

enum Role {
  client = "client",
  cook = "cook",
  delivery = "delivery",
  admin = "admin",
}

interface User {
  id: string;
  email: string;
  role: Role;
}

export default function UsersPage() {
  const {
    user: currentUser,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuthStore();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("all");

  // States pour les modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // States pour les formulaires
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: Role.client,
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Vérification des permissions
  const canManageUsers = currentUser?.role === "admin";

  // Charger les données (VRAIES cette fois !)
  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3001/users", {
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const usersData = await response.json();
      setUsers(usersData);
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
    if (canManageUsers) {
      loadData();
    }
  }, [canManageUsers]);

  // Utilisateurs filtrés
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.email
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesRole =
      selectedRoleFilter === "all" || user.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Actions VRAIES (plus de simulation !)
  const handleCreate = async () => {
    if (!formData.email.trim() || !formData.password.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch("http://localhost:3001/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la création");
      }

      setIsCreateOpen(false);
      setFormData({ email: "", password: "", role: Role.client });
      await loadData(); // Recharger la liste
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la création"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser || !formData.email.trim()) return;

    setSubmitting(true);
    try {
      const updateData: { email: string; role: Role; password?: string } = {
        email: formData.email.trim(),
        role: formData.role,
      };

      if (formData.password.trim()) {
        updateData.password = formData.password;
      }

      const response = await fetch(
        `http://localhost:3001/users/${selectedUser.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la modification");
      }

      setIsEditOpen(false);
      setSelectedUser(null);
      setFormData({ email: "", password: "", role: Role.client });
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la modification"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `http://localhost:3001/users/${selectedUser.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la suppression");
      }

      setIsDeleteOpen(false);
      setSelectedUser(null);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la suppression"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordChange = async () => {
    if (
      !selectedUser ||
      !passwordData.newPassword ||
      passwordData.newPassword !== passwordData.confirmPassword
    )
      return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `http://localhost:3001/users/${selectedUser.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: passwordData.newPassword,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors du changement de mot de passe"
        );
      }

      setIsPasswordOpen(false);
      setSelectedUser(null);
      setPasswordData({ newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du changement de mot de passe"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Utilitaires
  const getRoleLabel = (role: Role): string => {
    const labels = {
      [Role.admin]: "Administrateur",
      [Role.cook]: "Cuisinier",
      [Role.delivery]: "Livreur",
      [Role.client]: "Client",
    };
    return labels[role] || role;
  };

  const getRoleBadgeVariant = (
    role: Role
  ): "default" | "secondary" | "destructive" | "outline" => {
    const variants = {
      [Role.admin]: "destructive" as const,
      [Role.cook]: "default" as const,
      [Role.delivery]: "secondary" as const,
      [Role.client]: "outline" as const,
    };
    return variants[role] || "default";
  };

  // Chargement initial
  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Pas les permissions
  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Accès refusé</h3>
            <p className="text-muted-foreground text-center">
              Vous n&apos;avez pas les permissions nécessaires pour gérer les
              utilisateurs.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground">
            Gérez les comptes utilisateurs et leurs permissions.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvel utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Créer un utilisateur</DialogTitle>
              <DialogDescription>
                Créez un nouveau compte utilisateur
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="utilisateur@example.com"
                />
              </div>

              <div>
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder="••••••••"
                />
              </div>

              <div>
                <Label htmlFor="role">Rôle</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: Role) =>
                    setFormData((prev) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Role.client}>Client</SelectItem>
                    <SelectItem value={Role.cook}>Cuisinier</SelectItem>
                    <SelectItem value={Role.delivery}>Livreur</SelectItem>
                    <SelectItem value={Role.admin}>Administrateur</SelectItem>
                  </SelectContent>
                </Select>
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
                  !formData.email.trim() ||
                  !formData.password.trim()
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Email..."
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="roleFilter">Rôle</Label>
              <Select
                value={selectedRoleFilter}
                onValueChange={setSelectedRoleFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value={Role.admin}>Administrateur</SelectItem>
                  <SelectItem value={Role.cook}>Cuisinier</SelectItem>
                  <SelectItem value={Role.delivery}>Livreur</SelectItem>
                  <SelectItem value={Role.client}>Client</SelectItem>
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
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">Total utilisateurs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {users.filter((u) => u.role === Role.admin).length}
            </div>
            <p className="text-xs text-muted-foreground">Administrateurs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {users.filter((u) => u.role === Role.cook).length}
            </div>
            <p className="text-xs text-muted-foreground">Cuisiniers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.role === Role.client).length}
            </div>
            <p className="text-xs text-muted-foreground">Clients</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des utilisateurs */}
      <div className="grid gap-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun résultat</h3>
              <p className="text-muted-foreground text-center">
                Essayez de modifier vos filtres de recherche
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card
              key={user.id}
              className="hover:shadow-md transition-all duration-200"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>

                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {user.email}
                      {user.id === currentUser?.id && (
                        <Badge variant="outline" className="text-xs">
                          Vous
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        ID: {user.id}
                      </div>
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user);
                      setPasswordData({ newPassword: "", confirmPassword: "" });
                      setIsPasswordOpen(true);
                    }}
                    title="Changer le mot de passe"
                  >
                    <Key className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user);
                      setFormData({
                        email: user.email,
                        password: "",
                        role: user.role,
                      });
                      setIsEditOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user);
                      setIsDeleteOpen(true);
                    }}
                    disabled={user.id === currentUser?.id}
                    title={
                      user.id === currentUser?.id
                        ? "Vous ne pouvez pas vous supprimer"
                        : "Supprimer l'utilisateur"
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {/* Modales identiques mais sans les bugs de state */}
      {/* Modale d'édition */}
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setSelectedUser(null);
            setFormData({ email: "", password: "", role: Role.client });
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l&apos;utilisateur
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="edit-role">Rôle</Label>
              <Select
                value={formData.role}
                onValueChange={(value: Role) =>
                  setFormData((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Role.client}>Client</SelectItem>
                  <SelectItem value={Role.cook}>Cuisinier</SelectItem>
                  <SelectItem value={Role.delivery}>Livreur</SelectItem>
                  <SelectItem value={Role.admin}>Administrateur</SelectItem>
                </SelectContent>
              </Select>
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
              disabled={submitting || !formData.email.trim()}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Autres modales... (password, delete) */}
      <Dialog
        open={isPasswordOpen}
        onOpenChange={(open) => {
          setIsPasswordOpen(open);
          if (!open) {
            setSelectedUser(null);
            setPasswordData({ newPassword: "", confirmPassword: "" });
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Changer le mot de passe</DialogTitle>
            <DialogDescription>
              Définissez un nouveau mot de passe pour {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password">Nouveau mot de passe *</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                placeholder="••••••••"
              />
            </div>

            <div>
              <Label htmlFor="confirm-password">
                Confirmer le mot de passe *
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                placeholder="••••••••"
              />
            </div>

            {passwordData.newPassword &&
              passwordData.confirmPassword &&
              passwordData.newPassword !== passwordData.confirmPassword && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Les mots de passe ne correspondent pas
                  </AlertDescription>
                </Alert>
              )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPasswordOpen(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handlePasswordChange}
              disabled={
                submitting ||
                !passwordData.newPassword ||
                passwordData.newPassword !== passwordData.confirmPassword
              }
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Changer le mot de passe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) setSelectedUser(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;utilisateur</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l&apos;utilisateur &quot;
              {selectedUser?.email}&quot; ? Cette action est irréversible.
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
