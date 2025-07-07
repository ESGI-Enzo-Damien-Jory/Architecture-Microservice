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
	api := app.Group("/api")

	api.Post("/orders", handler.CreateOrder)
	api.Get("/orders/:id", handler.GetOrder)
	api.Patch("/orders/:id/status", handler.UpdateOrderStatus)
	api.Get("/orders", handler.ListOrders)

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