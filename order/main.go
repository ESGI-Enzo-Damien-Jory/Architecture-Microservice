package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"

	"order/config"
	"order/queue"
	"order/routes"
)

func main() {
	// Load environment variables
	_ = godotenv.Load()

	// Initialize database and RabbitMQ connections
	config.InitPostgres()
	defer config.DB.Close()
	
	config.InitRabbitMQ()
	defer config.RabbitMQConn.Close()
	defer config.RabbitMQChannel.Close()

	// Start kitchen confirmation consumer
	go queue.StartKitchenConfirmationConsumer()

	// Create Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			log.Printf("[ERROR] %v", err)
			return c.Status(code).JSON(fiber.Map{"error": err.Error()})
		},
	})

	// Add CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000,http://localhost:3002",
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: true,
	}))

	// Setup routes
	routes.SetupRoutes(app)

	// Get port from environment
	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}

	log.Printf("🚀 Order service starting on port %s", port)
	log.Printf("📡 Kitchen confirmation consumer started")
	log.Fatal(app.Listen(":" + port))
}