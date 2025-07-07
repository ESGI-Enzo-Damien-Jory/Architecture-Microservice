package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"

	"command/config"
	"command/routes"
)

func main() {
	_ = godotenv.Load()
	config.InitPostgres()
	config.InitRabbitMQ()

	app := fiber.New()
	routes.SetupRoutes(app)

	log.Fatal(app.Listen(":5000"))
}
