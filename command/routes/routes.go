package routes

import (
	"command/handler"
	"command/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	app.Get("/health", handler.HealthCheck)

	order := app.Group("/order", middleware.VerifyJWT)
	order.Post("/", handler.CreateOrder)
	order.Get("/", handler.GetOrdersByUser)
}
