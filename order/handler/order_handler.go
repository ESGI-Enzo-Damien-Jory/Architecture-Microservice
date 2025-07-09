package handler

import (
	"order/repository"
	"order/service"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
)

func HealthCheck(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":    "healthy",
		"service":   "order",
		"timestamp": time.Now().Format(time.RFC3339),
		"database":  "connected",
		"rabbitmq":  "connected",
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

	// Validation
	if body.Product == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Product is required"})
	}
	if body.Quantity <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Quantity must be greater than 0"})
	}

	userID := c.Locals("userID").(string)
	userRole := c.Locals("userRole").(string)

	log.Printf("[ORDER] Creating order for user %s (role: %s): %s x%d", userID, userRole, body.Product, body.Quantity)

	orderID, err := service.CreateOrder(userID, body.Product, body.Quantity)
	if err != nil {
		log.Printf("[ORDER] Failed to create order: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create order"})
	}

	log.Printf("[ORDER] Order %s created successfully for user %s", orderID, userID)
	return c.Status(201).JSON(fiber.Map{
		"message":  "Order created successfully",
		"order_id": orderID,
		"product":  body.Product,
		"quantity": body.Quantity,
		"status":   "pending",
	})
}

func GetOrdersByUser(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	userRole := c.Locals("userRole").(string)

	log.Printf("[ORDER] Fetching orders for user %s (role: %s)", userID, userRole)

	var orders []interface{}

	switch userRole {
	case "client":
		clientOrders, fetchErr := repository.GetOrdersByUser(userID)
		if fetchErr != nil {
			log.Printf("[ORDER] Failed to fetch client orders: %v", fetchErr)
			return c.Status(500).JSON(fiber.Map{"error": "Could not fetch orders"})
		}
		orders = make([]interface{}, len(clientOrders))
		for i, order := range clientOrders {
			orders[i] = order
		}

	case "cook":
		// Cooks can see all orders to prepare them
		allOrders, fetchErr := repository.GetAllOrders()
		if fetchErr != nil {
			log.Printf("[ORDER] Failed to fetch orders for cook: %v", fetchErr)
			return c.Status(500).JSON(fiber.Map{"error": "Could not fetch orders"})
		}
		orders = make([]interface{}, len(allOrders))
		for i, order := range allOrders {
			orders[i] = order
		}

	case "delivery":
		// Delivery can see orders that are ready for delivery
		readyOrders, fetchErr := repository.GetOrdersByStatus("ready")
		if fetchErr != nil {
			log.Printf("[ORDER] Failed to fetch ready orders for delivery: %v", fetchErr)
			return c.Status(500).JSON(fiber.Map{"error": "Could not fetch orders"})
		}
		orders = make([]interface{}, len(readyOrders))
		for i, order := range readyOrders {
			orders[i] = order
		}

	case "admin":
		allOrders, fetchErr := repository.GetAllOrders()
		if fetchErr != nil {
			log.Printf("[ORDER] Failed to fetch all orders for admin: %v", fetchErr)
			return c.Status(500).JSON(fiber.Map{"error": "Could not fetch orders"})
		}
		orders = make([]interface{}, len(allOrders))
		for i, order := range allOrders {
			orders[i] = order
		}

	default:
		log.Printf("[ORDER] Invalid user role: %s", userRole)
		return c.Status(403).JSON(fiber.Map{"error": "Invalid user role"})
	}

	log.Printf("[ORDER] Found %d orders for user %s", len(orders), userID)
	return c.JSON(fiber.Map{
		"orders": orders,
		"count":  len(orders),
	})
}

func GetOrderById(c *fiber.Ctx) error {
	orderID := c.Params("id")
	userID := c.Locals("userID").(string)
	userRole := c.Locals("userRole").(string)

	log.Printf("[ORDER] User %s (role: %s) requesting order %s", userID, userRole, orderID)

	order, err := repository.GetOrderById(orderID)
	if err != nil {
		log.Printf("[ORDER] Order %s not found: %v", orderID, err)
		return c.Status(404).JSON(fiber.Map{"error": "Order not found"})
	}

	// Authorization check
	switch userRole {
	case "client":
		if order.UserID != userID {
			log.Printf("[ORDER] Client %s attempted to access order %s belonging to %s", userID, orderID, order.UserID)
			return c.Status(403).JSON(fiber.Map{"error": "Access denied"})
		}
	case "admin", "cook", "delivery":
		// These roles can access any order
		break
	default:
		return c.Status(403).JSON(fiber.Map{"error": "Invalid user role"})
	}

	return c.JSON(order)
}

func UpdateOrderStatus(c *fiber.Ctx) error {
	orderID := c.Params("id")
	userID := c.Locals("userID").(string)
	userRole := c.Locals("userRole").(string)

	type request struct {
		Status string `json:"status"`
	}

	var body request
	if err := c.BodyParser(&body); err != nil {
		log.Printf("[ORDER] Invalid request body for status update: %v", err)
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	// Validate status
	validStatuses := []string{"pending", "confirmed", "preparing", "ready", "delivered", "cancelled"}
	isValidStatus := false
	for _, validStatus := range validStatuses {
		if body.Status == validStatus {
			isValidStatus = true
			break
		}
	}

	if !isValidStatus {
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid status. Valid statuses: pending, confirmed, preparing, ready, delivered, cancelled",
		})
	}

	log.Printf("[ORDER] User %s (role: %s) updating order %s status to %s", userID, userRole, orderID, body.Status)

	// Check if order exists first
	_, err := repository.GetOrderById(orderID)
	if err != nil {
		log.Printf("[ORDER] Order %s not found for status update: %v", orderID, err)
		return c.Status(404).JSON(fiber.Map{"error": "Order not found"})
	}

	// Update status using service (which will handle database + events)
	err = service.UpdateOrderStatus(orderID, body.Status)
	if err != nil {
		log.Printf("[ORDER] Failed to update order %s status: %v", orderID, err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update order status"})
	}

	log.Printf("[ORDER] Order %s status updated to %s by user %s", orderID, body.Status, userID)
	return c.JSON(fiber.Map{
		"message":  "Order status updated successfully",
		"order_id": orderID,
		"status":   body.Status,
	})
}

func GetAllOrders(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	log.Printf("[ADMIN] Admin %s requesting all orders", userID)

	orders, err := repository.GetAllOrders()
	if err != nil {
		log.Printf("[ADMIN] Failed to fetch all orders: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Could not fetch orders"})
	}

	log.Printf("[ADMIN] Retrieved %d orders for admin %s", len(orders), userID)
	return c.JSON(fiber.Map{
		"orders": orders,
		"count":  len(orders),
	})
}

func GetOrderStats(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	log.Printf("[ADMIN] Admin %s requesting order statistics", userID)

	stats, err := repository.GetOrderStatistics()
	if err != nil {
		log.Printf("[ADMIN] Failed to fetch order statistics: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Could not fetch statistics"})
	}

	return c.JSON(stats)
}