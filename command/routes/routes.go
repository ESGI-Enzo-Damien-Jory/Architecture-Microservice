package routes

import (
	"command/handler"
	"command/middleware"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	
	app.Get("/health", handler.HealthCheck)
	
	app.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"service": "command",
			"status":  "running",
			"version": "1.0.0",
		})
	})
	
	order := app.Group("/order", middleware.VerifyJWT)
	
	order.Post("/", middleware.RequireClientRole(), handler.CreateOrder)

	order.Get("/", handler.GetOrdersByUser)
	
	order.Get("/:id", handler.GetOrderById)
	
	admin := app.Group("/admin", middleware.VerifyJWT, middleware.RequireAdminRole())
	admin.Get("/orders", handler.GetOrdersByUser) 
}