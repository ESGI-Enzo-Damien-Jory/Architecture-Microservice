package config

import (
	handler "kitchen/handlers"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	api := app.Group("/api")

	api.Post("/orders", handler.CreateOrder)
	api.Get("/orders/:id", handler.GetOrder)
	api.Put("/orders/:id/status", handler.UpdateOrderStatus)
	api.Get("/orders", handler.ListOrders)

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})
}
