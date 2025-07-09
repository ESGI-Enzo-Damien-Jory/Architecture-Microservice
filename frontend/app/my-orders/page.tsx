"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authStore";
import { StatsService } from "@/lib/services/statsService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  ChefHat,
  AlertCircle,
  Search,
  Calendar,
  Euro,
  MoreHorizontal,
  Eye,
} from "lucide-react";

interface Order {
  id: string;
  status: string;
  total_price_cents: number;
  created_at: string;
  updated_at: string;
  notes?: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  item_type: string;
  item_id: string;
  quantity: number;
  unit_price_cents: number;
}

export default function MyOrdersPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Vérification d'accès
  useEffect(() => {
    if (!isLoading) {
      if (user?.role !== "client") {
        router.push("/unauthorized");
        return;
      }
      loadOrders();
    }
  }, [isLoading, user, router]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("[MY_ORDERS] Loading user orders...");
      const userOrders = await StatsService.getUserOrders();

      console.log("[MY_ORDERS] Orders loaded:", userOrders);
      setOrders(userOrders.orders || []);
    } catch (err) {
      console.error("[MY_ORDERS] Error loading orders:", err);
      setError("Erreur lors du chargement de vos commandes");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
        label: "En attente",
      },
      confirmed: {
        color: "bg-blue-100 text-blue-800",
        icon: CheckCircle,
        label: "Confirmée",
      },
      preparing: {
        color: "bg-orange-100 text-orange-800",
        icon: ChefHat,
        label: "En préparation",
      },
      ready: {
        color: "bg-purple-100 text-purple-800",
        icon: Package,
        label: "Prête",
      },
      delivered: {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        label: "Livrée",
      },
      cancelled: {
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        label: "Annulée",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} border-0`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getStatusProgress = (status: string) => {
    const statusOrder = [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "delivered",
    ];
    const currentIndex = statusOrder.indexOf(status);
    return currentIndex >= 0
      ? ((currentIndex + 1) / statusOrder.length) * 100
      : 0;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const closeOrderModal = () => {
    setSelectedOrder(null);
    setModalOpen(false);
  };

  // Loading state
  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Chargement de vos commandes...</p>
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
            <Button onClick={loadOrders} className="flex-1">
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Style identique au menu */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Mes Commandes
                </h1>
                <p className="text-sm text-gray-600">
                  {orders.length} commande{orders.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <Button onClick={loadOrders} variant="outline" size="sm">
              <Loader2 className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message d'accueil */}
        <div className="mb-8 bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Suivez vos commandes en temps réel
          </h2>
          <p className="text-gray-600">
            Retrouvez ici toutes vos commandes passées et leur statut de
            livraison.
          </p>
        </div>

        {/* Filtres */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  placeholder="Rechercher une commande..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48 h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmées</option>
              <option value="preparing">En préparation</option>
              <option value="ready">Prêtes</option>
              <option value="delivered">Livrées</option>
              <option value="cancelled">Annulées</option>
            </select>
          </div>
        </div>

        {/* Liste des commandes */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Vos Commandes
            </h2>
            <div className="h-1 w-16 bg-primary rounded"></div>
          </div>

          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {orders.length === 0 ? "Aucune commande" : "Aucun résultat"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {orders.length === 0
                    ? "Vous n'avez pas encore passé de commande"
                    : "Aucune commande ne correspond à vos critères"}
                </p>
                {orders.length === 0 && (
                  <Button onClick={() => router.push("/menu")}>
                    Découvrir notre menu
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card
                  key={order.id}
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/20"
                  onClick={() => openOrderModal(order)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <h3 className="font-semibold text-lg">
                            Commande #{order.id.slice(-8)}
                          </h3>
                          {getStatusBadge(order.status)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {formatDate(order.created_at)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            {order.items.length} article
                            {order.items.length > 1 ? "s" : ""}
                          </div>
                          <div className="flex items-center gap-2">
                            <Euro className="h-4 w-4" />
                            {StatsService.formatPrice(order.total_price_cents)}
                          </div>
                        </div>

                        {/* Barre de progression */}
                        {order.status !== "cancelled" && (
                          <div className="mt-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${getStatusProgress(order.status)}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {order.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <strong>Note :</strong> {order.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openOrderModal(order);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Détails
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modal de détail de commande */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Détails de la commande #{selectedOrder?.id.slice(-8)}
            </DialogTitle>
            <DialogDescription>
              Commande passée le{" "}
              {selectedOrder && formatDate(selectedOrder.created_at)}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Statut et progression */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Statut de la commande</h3>
                  {getStatusBadge(selectedOrder.status)}
                </div>

                {selectedOrder.status !== "cancelled" && (
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${getStatusProgress(selectedOrder.status)}%`,
                      }}
                    ></div>
                  </div>
                )}
              </div>

              {/* Informations générales */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">ID Commande</p>
                  <p className="font-medium">#{selectedOrder.id.slice(-8)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="font-medium text-green-600">
                    {StatsService.formatPrice(selectedOrder.total_price_cents)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date de commande</p>
                  <p className="font-medium">
                    {formatDate(selectedOrder.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dernière mise à jour</p>
                  <p className="font-medium">
                    {formatDate(selectedOrder.updated_at)}
                  </p>
                </div>
              </div>

              {/* Articles commandés */}
              <div>
                <h3 className="font-medium mb-3">Articles commandés</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {item.item_type === "menu" ? (
                            <Package className="h-4 w-4" />
                          ) : (
                            <Package className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {item.item_type === "menu" ? "Menu" : "Produit"} #
                            {item.item_id.slice(-8)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Quantité : {item.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {StatsService.formatPrice(item.unit_price_cents)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Total :{" "}
                          {StatsService.formatPrice(
                            item.unit_price_cents * item.quantity
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="font-medium mb-3">
                    Instructions de livraison
                  </h3>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-900">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={closeOrderModal}
                  className="flex-1"
                >
                  Fermer
                </Button>
                {selectedOrder.status === "pending" && (
                  <Button variant="destructive" className="flex-1">
                    Annuler la commande
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
