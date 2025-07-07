package main

import (
	"log"

	"kitchen/config"
	"kitchen/queue"

	"github.com/gofiber/fiber/v2"
)

func main() {
	app := fiber.New()

	queue.ConsumeOrders()

	config.SetupRoutes(app)

	log.Fatal(app.Listen(":5000"))
}
