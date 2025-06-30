package main

import (
	"kitchen/config"

	"github.com/gofiber/fiber/v2"
)

func main() {
	app := fiber.New()

	config.SetupRoutes(app)

	app.Listen(":3000")
}
