package config

import (
	handler "kitchen/handlers"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/streadway/amqp"
)

var startTime = time.Now()

func SetupRoutes(app *fiber.App) {
	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		healthData := fiber.Map{
			"status":    "healthy",
			"service":   "kitchen",
			"timestamp": time.Now().Format(time.RFC3339),
			"uptime":    time.Since(startTime).Seconds(),
			"version":   "1.0.0",
		}

		rabbitmqStatus := "disconnected"
		if testRabbitMQ() {
			rabbitmqStatus = "connected"
		}
		healthData["rabbitmq"] = rabbitmqStatus

		if rabbitmqStatus == "disconnected" {
			healthData["status"] = "unhealthy"
			return c.Status(503).JSON(healthData)
		}

		return c.JSON(healthData)
	})

	// API routes for kitchen operations
	api := app.Group("/api")

	// Kitchen order management (for cooks)
	orders := api.Group("/orders")
	
	// Get all kitchen orders
	orders.Get("/", handler.ListOrders)
	
	// Get pending orders (need cook action)
	orders.Get("/pending", handler.GetPendingOrders)
	
	// Get orders in preparation
	orders.Get("/preparing", handler.GetPreparingOrders)
	
	// Get specific order
	orders.Get("/:id", handler.GetOrder)
	
	// Update order status (general)
	orders.Patch("/:id/status", handler.UpdateOrderStatus)
	
	// Specific cook actions
	orders.Post("/:id/confirm", handler.ConfirmOrder)
	orders.Post("/:id/start-preparation", handler.StartPreparation)
	orders.Post("/:id/mark-ready", handler.MarkOrderReady)
}

func testRabbitMQ() bool {
	rabbitmqURL := os.Getenv("RABBITMQ_URL")
	if rabbitmqURL == "" {
		rabbitmqURL = "amqp://guest:guest@localhost:5672/"
	}

	conn, err := amqp.Dial(rabbitmqURL)
	if err != nil {
		return false
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		return false
	}
	defer ch.Close()

	return true
}