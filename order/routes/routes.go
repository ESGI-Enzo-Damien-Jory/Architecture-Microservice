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
			"version": "1.0.0",
		})
	})

	api := app.Group("/api", middleware.VerifyJWT)
	
	orders := api.Group("/orders")
	
	orders.Post("/", middleware.RequireClientRole(), handler.CreateOrder)
	
	orders.Get("/", handler.GetOrdersByUser)
	
	orders.Get("/:id", handler.GetOrderById)
	
	orders.Patch("/:id/status", middleware.RequireRole("cook", "admin"), handler.UpdateOrderStatus)

	admin := api.Group("/admin", middleware.RequireAdminRole())
	
	admin.Get("/orders", handler.GetAllOrders)
	
	admin.Get("/stats", handler.GetOrderStats)
}