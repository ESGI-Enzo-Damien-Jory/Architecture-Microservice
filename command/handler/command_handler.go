package handler

import (
	"command/repository"
	"command/service"

	"github.com/gofiber/fiber/v2"
)

func HealthCheck(c *fiber.Ctx) error {
	return c.SendString("Command service is alive")
}

func CreateOrder(c *fiber.Ctx) error {
	type request struct {
		Product  string `json:"product"`
		Quantity int    `json:"quantity"`
	}

	var body request
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	userID := c.Locals("userID").(string)
	err := service.CreateCommand(userID, body.Product, body.Quantity)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create command"})
	}

	return c.SendStatus(fiber.StatusCreated)
}

func GetOrdersByUser(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	commands, err := repository.GetCommandsByUser(userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not fetch orders"})
	}
	return c.JSON(commands)
}
