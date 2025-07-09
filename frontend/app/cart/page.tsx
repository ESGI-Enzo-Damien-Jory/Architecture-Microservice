"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authStore";
import { useCartStore } from "@/lib/store/cartStore";
import { MenuService } from "@/lib/services/menuService";
import { UserService, UserProfile } from "@/lib/services/userService";
import { OrderService } from "@/lib/services/orderService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  User,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function CartPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const {
    items: cartItems,
    updateQuantity,
    removeItem,
    clearCart,
    getTotal,
    getItemCount,
  } = useCartStore();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"cart" | "info" | "payment" | "success">(
    "cart"
  );

  // Form data
  const [customerInfo, setCustomerInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
    notes: "",
  });

  useEffect(() => {
    if (!isLoading) {
      if (user?.role !== "client") {
        router.push("/menu");
        return;
      }
      loadData();
    }
  }, [isLoading, user, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const profile = await UserService.getUserProfile();
      setUserProfile(profile);

      // Pre-fill form with user data
      setCustomerInfo((prev) => ({
        ...prev,
        email: profile.email,
        firstName: profile.profile?.firstName || "",
        lastName: profile.profile?.lastName || "",
        phone: profile.profile?.phone || "",
        address: profile.profile?.address || "",
        city: profile.profile?.city || "",
        zipCode: profile.profile?.zipCode || "",
      }));
    } catch (err) {
      console.error("Error loading user data:", err);
      setError("Erreur lors du chargement des données utilisateur");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = (
    type: string,
    id: string,
    newQuantity: number
  ) => {
    updateQuantity(type, id, newQuantity);

    if (newQuantity === 0) {
      toast.success("Article retiré du panier");
    }
  };

  const handleRemoveItem = (type: string, id: string) => {
    removeItem(type, id);
    toast.success("Article supprimé du panier");
  };

  const handleClearCart = () => {
    clearCart();
    toast.success("Panier vidé");
  };

  const handleSubmitOrder = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // Valider les infos
      if (
        !customerInfo.firstName ||
        !customerInfo.lastName ||
        !customerInfo.phone ||
        !customerInfo.address
      ) {
        throw new Error("Veuillez remplir tous les champs obligatoires");
      }

      try {
        await UserService.updateProfile({
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          phone: customerInfo.phone,
          address: customerInfo.address,
          city: customerInfo.city,
          zipCode: customerInfo.zipCode,
        });
      } catch (err) {
        console.error("Error updating user profile:", err);
      }

      const orderItems = cartItems.map((item) => ({
        type: item.type, // "menu" | "product"
        id: item.id,
        quantity: item.quantity,
        price: item.price, // en centimes
      }));

      await OrderService.createOrder({
        items: orderItems,
        notes: customerInfo.notes || undefined,
      });

      // Simuler l'envoi
      await new Promise((resolve) => setTimeout(resolve, 2000));

      clearCart();
      setStep("success");
      toast.success("Commande confirmée avec succès !");
    } catch (err) {
      console.error("Error submitting order:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Erreur lors de la commande";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Commande confirmée !</CardTitle>
            <CardDescription>
              Votre commande a été envoyée avec succès. Vous recevrez une
              confirmation par email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={() => router.push("/menu")} className="w-full">
                Continuer mes achats
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="w-full"
              >
                Retour au tableau de bord
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Mon Panier</h1>
                <p className="text-sm text-gray-600">
                  {getItemCount()} article(s)
                </p>
              </div>
            </div>

            {/* Steps indicator */}
            <div className="hidden md:flex items-center space-x-4">
              <div
                className={`flex items-center ${
                  step === "cart" ? "text-primary" : "text-gray-400"
                }`}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Panier
              </div>
              <div
                className={`flex items-center ${
                  step === "info" ? "text-primary" : "text-gray-400"
                }`}
              >
                <User className="h-4 w-4 mr-2" />
                Informations
              </div>
              <div
                className={`flex items-center ${
                  step === "payment" ? "text-primary" : "text-gray-400"
                }`}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Confirmation
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Cart Step */}
        {step === "cart" && (
          <>
            {cartItems.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Votre panier est vide
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Ajoutez des produits pour commencer votre commande
                  </p>
                  <Button onClick={() => router.push("/menu")}>
                    Découvrir nos produits
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Items */}
                <div className="lg:col-span-2 space-y-4">
                  {cartItems.map((item) => (
                    <Card key={`${item.type}-${item.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {item.image && (
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          )}

                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{item.name}</h3>
                                <Badge
                                  variant={
                                    item.type === "menu" ? "default" : "outline"
                                  }
                                  className="mt-1"
                                >
                                  {item.type === "menu" ? "Menu" : "Produit"}
                                </Badge>
                                {item.menuProducts &&
                                  item.menuProducts.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-xs text-gray-600">
                                        Inclus :
                                      </p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {item.menuProducts.map((product) => (
                                          <Badge
                                            key={product.id}
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {product.name}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                              </div>

                              <div className="text-right">
                                <p className="font-medium">
                                  {MenuService.formatPrice(item.price)}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {MenuService.formatPrice(
                                    item.price * item.quantity
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateQuantity(
                                      item.type,
                                      item.id,
                                      item.quantity - 1
                                    )
                                  }
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center text-sm">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateQuantity(
                                      item.type,
                                      item.id,
                                      item.quantity + 1
                                    )
                                  }
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRemoveItem(item.type, item.id)
                                }
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                                Supprimer
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Summary */}
                <div>
                  <Card className="sticky top-24">
                    <CardHeader>
                      <CardTitle>Récapitulatif</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Sous-total ({getItemCount()} articles)</span>
                          <span>{MenuService.formatPrice(getTotal())}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Livraison</span>
                          <span className="text-green-600">Gratuite</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium text-lg">
                          <span>Total</span>
                          <span>{MenuService.formatPrice(getTotal())}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Button
                          className="w-full"
                          onClick={() => setStep("info")}
                          size="lg"
                        >
                          Continuer la commande
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => router.push("/menu")}
                        >
                          Continuer mes achats
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full text-red-500"
                          onClick={handleClearCart}
                        >
                          Vider le panier
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </>
        )}

        {/* Info Step */}
        {step === "info" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informations de livraison
                  </CardTitle>
                  <CardDescription>
                    Vérifiez et complétez vos informations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Prénom *</Label>
                      <Input
                        id="firstName"
                        value={customerInfo.firstName}
                        onChange={(e) =>
                          setCustomerInfo((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Nom *</Label>
                      <Input
                        id="lastName"
                        value={customerInfo.lastName}
                        onChange={(e) =>
                          setCustomerInfo((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerInfo.email}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Téléphone *</Label>
                      <Input
                        id="phone"
                        value={customerInfo.phone}
                        onChange={(e) =>
                          setCustomerInfo((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Adresse *</Label>
                    <Input
                      id="address"
                      value={customerInfo.address}
                      onChange={(e) =>
                        setCustomerInfo((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">Ville *</Label>
                      <Input
                        id="city"
                        value={customerInfo.city}
                        onChange={(e) =>
                          setCustomerInfo((prev) => ({
                            ...prev,
                            city: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">Code postal *</Label>
                      <Input
                        id="zipCode"
                        value={customerInfo.zipCode}
                        onChange={(e) =>
                          setCustomerInfo((prev) => ({
                            ...prev,
                            zipCode: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">
                      Instructions de livraison (optionnel)
                    </Label>
                    <Textarea
                      id="notes"
                      value={customerInfo.notes}
                      onChange={(e) =>
                        setCustomerInfo((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Appartement, étage, code d'accès..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep("cart")}
                      className="flex-1"
                    >
                      Retour au panier
                    </Button>
                    <Button
                      onClick={() => setStep("payment")}
                      className="flex-1"
                      disabled={
                        !customerInfo.firstName ||
                        !customerInfo.lastName ||
                        !customerInfo.phone ||
                        !customerInfo.address
                      }
                    >
                      Continuer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Récapitulatif</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {cartItems.map((item) => (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="flex justify-between"
                      >
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span>
                          {MenuService.formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      <span>{MenuService.formatPrice(getTotal())}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Payment/Confirmation Step */}
        {step === "payment" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Confirmation de commande
                  </CardTitle>
                  <CardDescription>
                    Vérifiez tous les détails avant de confirmer
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Customer Info */}
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Informations client
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                      <p>
                        <strong>
                          {customerInfo.firstName} {customerInfo.lastName}
                        </strong>
                      </p>
                      <p className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {customerInfo.email}
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {customerInfo.phone}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {customerInfo.address}, {customerInfo.city}{" "}
                        {customerInfo.zipCode}
                      </p>
                      {customerInfo.notes && (
                        <p className="text-gray-600">
                          Note: {customerInfo.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Articles commandés
                    </h3>
                    <div className="space-y-2">
                      {cartItems.map((item) => (
                        <div
                          key={`${item.type}-${item.id}`}
                          className="flex justify-between items-center py-2 border-b"
                        >
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-gray-600">
                              Quantité: {item.quantity}
                            </p>
                          </div>
                          <p className="font-medium">
                            {MenuService.formatPrice(
                              item.price * item.quantity
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep("info")}
                      className="flex-1"
                    >
                      Modifier les infos
                    </Button>
                    <Button
                      onClick={handleSubmitOrder}
                      className="flex-1"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Confirmation...
                        </>
                      ) : (
                        "Confirmer la commande"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Total final</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Sous-total</span>
                      <span>{MenuService.formatPrice(getTotal())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Livraison</span>
                      <span className="text-green-600">Gratuite</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TVA (20%)</span>
                      <span>
                        {MenuService.formatPrice(Math.round(getTotal() * 0.2))}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium text-lg">
                      <span>Total TTC</span>
                      <span>{MenuService.formatPrice(getTotal())}</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      🚚 Livraison gratuite - Délai estimé: 30-45 minutes
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
