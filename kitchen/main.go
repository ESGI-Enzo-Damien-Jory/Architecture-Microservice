package main

import (
    "log"
    "kitchen/config"
    "kitchen/queue"

    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
    app := fiber.New()

    // Updated CORS to include POST for cook actions
    app.Use(cors.New(cors.Config{
        AllowOrigins:     "http://localhost:3000,http://localhost:3002,http://localhost:5000,http://localhost:5003",
        AllowMethods:     "GET,POST,PATCH,PUT,DELETE,OPTIONS",
        AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
        AllowCredentials: true,
        MaxAge:           3600,
    }))

    // Start RabbitMQ consumer FIRST
    go queue.ConsumeOrders()
    
    // Setup routes
    config.SetupRoutes(app)

    log.Println("🚀 Kitchen service starting on port 5000")
    log.Println("📡 RabbitMQ consumer started - waiting for orders...")
    log.Fatal(app.Listen(":5000"))
}