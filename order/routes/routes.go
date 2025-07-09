package routes

import (
	"order/handler"
	"order/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	app.Get("/health", handler.HealthCheck)

	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"service": "order",
			"status":  "running",
			"version": "2.0.0",
		})
	})

	api := app.Group("/api", middleware.VerifyJWT)

	orders := api.Group("/orders")

	// 🛒 Client : créer une commande avec plusieurs items
	orders.Post("/", middleware.RequireClientRole(), handler.CreateOrder)

	// 📦 Tous les rôles accèdent à leurs commandes selon leur scope
	orders.Get("/", handler.GetOrdersByUser)

	// 🔎 Accès à une commande spécifique
	orders.Get("/:id", handler.GetOrderById)

	// 🛠️ Modifier le statut d'une commande (cuisine/admin)
	orders.Patch("/:id/status", middleware.RequireRole("cook", "admin"), handler.UpdateOrderStatus)

	// 👑 Admin routes
	admin := api.Group("/admin", middleware.RequireAdminRole())

	admin.Get("/orders", handler.GetAllOrders)
	admin.Get("/stats", handler.GetOrderStats)
}
