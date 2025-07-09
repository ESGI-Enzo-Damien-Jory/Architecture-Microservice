package handler

import (
	"command/repository"
	"command/service"
	"log"

	"github.com/gofiber/fiber/v2"
)

func HealthCheck(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":    "healthy",
		"service":   "command",
		"timestamp": "2025-01-01T00:00:00Z",
	})
}

func CreateOrder(c *fiber.Ctx) error {
	type request struct {
		Product  string `json:"product"`
		Quantity int    `json:"quantity"`
	}

	var body request
	if err := c.BodyParser(&body); err != nil {
		log.Printf("[ORDER] Invalid request body: %v", err)
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	if body.Product == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Product is required"})
	}
	if body.Quantity <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Quantity must be greater than 0"})
	}

	userID := c.Locals("userID").(string)
	userRole := c.Locals("userRole").(string)

	log.Printf("[ORDER] Creating order for user %s (role: %s): %s x%d", userID, userRole, body.Product, body.Quantity)

	err := service.CreateCommand(userID, body.Product, body.Quantity)
	if err != nil {
		log.Printf("[ORDER] Failed to create order: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create order"})
	}

	log.Printf("[ORDER] Order created successfully for user %s", userID)
	return c.Status(201).JSON(fiber.Map{
		"message": "Order created successfully",
		"product": body.Product,
		"quantity": body.Quantity,
	})
}

func GetOrdersByUser(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	userRole := c.Locals("userRole").(string)

	log.Printf("[ORDER] Fetching orders for user %s (role: %s)", userID, userRole)

	var commands []interface{}

	switch userRole {
	case "client":
		clientCommands, err := repository.GetCommandsByUser(userID)
		if err != nil {
			log.Printf("[ORDER] Failed to fetch client orders: %v", err)
			return c.Status(500).JSON(fiber.Map{"error": "Could not fetch orders"})
		}
		commands = make([]interface{}, len(clientCommands))
		for i, cmd := range clientCommands {
			commands[i] = cmd
		}

	case "admin":
		allCommands, err := repository.GetAllCommands()
		if err != nil {
			log.Printf("[ORDER] Failed to fetch all orders for admin: %v", err)
			return c.Status(500).JSON(fiber.Map{"error": "Could not fetch orders"})
		}
		commands = make([]interface{}, len(allCommands))
		for i, cmd := range allCommands {
			commands[i] = cmd
		}

	case "cook":
		cookCommands, err := repository.GetAllCommands()
		if err != nil {
			log.Printf("[ORDER] Failed to fetch orders for cook: %v", err)
			return c.Status(500).JSON(fiber.Map{"error": "Could not fetch orders"})
		}
		commands = make([]interface{}, len(cookCommands))
		for i, cmd := range cookCommands {
			commands[i] = cmd
		}

	default:
		log.Printf("[ORDER] Invalid user role: %s", userRole)
		return c.Status(403).JSON(fiber.Map{"error": "Invalid user role"})
	}

	log.Printf("[ORDER] Found %d orders for user %s", len(commands), userID)
	return c.JSON(fiber.Map{
		"orders": commands,
		"count":  len(commands),
	})
}

func GetOrderById(c *fiber.Ctx) error {
	orderID := c.Params("id")
	userID := c.Locals("userID").(string)
	userRole := c.Locals("userRole").(string)

	log.Printf("[ORDER] User %s (role: %s) requesting order %s", userID, userRole, orderID)

	command, err := repository.GetCommandById(orderID)
	if err != nil {
		log.Printf("[ORDER] Order %s not found: %v", orderID, err)
		return c.Status(404).JSON(fiber.Map{"error": "Order not found"})
	}

	switch userRole {
	case "client":
		if command.UserID != userID {
			log.Printf("[ORDER] Client %s attempted to access order %s belonging to %s", userID, orderID, command.UserID)
			return c.Status(403).JSON(fiber.Map{"error": "Access denied"})
		}
	case "admin", "cook":
		break
	default:
		return c.Status(403).JSON(fiber.Map{"error": "Invalid user role"})
	}

	return c.JSON(command)
}