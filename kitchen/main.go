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

    app.Use(cors.New(cors.Config{
        AllowOrigins:     "http://localhost:3000,http://localhost:3002,http://localhost:5003",
        AllowMethods:     "GET,PATCH",
        AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
        AllowCredentials: true,
        MaxAge:           3600,
    }))

    queue.ConsumeOrders()
    config.SetupRoutes(app)

    log.Fatal(app.Listen(":5000"))
}