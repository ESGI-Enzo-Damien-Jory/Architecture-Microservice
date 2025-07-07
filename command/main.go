package main

import (
	"command/config"
	"command/route"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()
	config.InitPostgres()
	config.InitRabbitMQ()

	app := fiber.New()
	route.SetupRoutes(app)

	log.Fatal(app.Listen(":5000"))
}
