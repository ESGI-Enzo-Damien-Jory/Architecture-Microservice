// order/handler/order_handler.go
package handler

import (
	"log"
	"order/model"
	"order/repository"
	"order/service"
	"time"

	"github.com/gofiber/fiber/v2"
)

func HealthCheck(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":    "healthy",
		"service":   "order",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

func CreateOrder(c *fiber.Ctx) error {
	type itemReq struct {
		Type     string `json:"type"`     // "product" | "menu"
		ID       string `json:"id"`
		Quantity int    `json:"quantity"`
		Price    int    `json:"price"` // cents
	}
	var body struct {
		Items []itemReq `json:"items"`
		Notes *string   `json:"notes"`
	}
	if err := c.BodyParser(&body); err != nil {
		log.Printf("[HANDLER] Failed to parse request body: %v", err)
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	if len(body.Items) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "At least one item required"})
	}

	log.Printf("[HANDLER] Received order creation request with %d items", len(body.Items))

	var items []service.CreateItem
	for _, it := range body.Items {
		if it.Quantity <= 0 || it.Price < 0 || (it.Type != "product" && it.Type != "menu") || it.ID == "" {
			log.Printf("[HANDLER] Invalid item data: %+v", it)
			return c.Status(400).JSON(fiber.Map{"error": "Invalid item data"})
		}
		items = append(items, service.CreateItem{
			ItemType: it.Type,
			ItemID:   it.ID,
			Quantity: it.Quantity,
			Price:    it.Price,
		})
	}

	// Get user ID from context with proper type assertion
	userIDInterface := c.Locals("userID")
	if userIDInterface == nil {
		log.Printf("[HANDLER] No userID found in context")
		return c.Status(401).JSON(fiber.Map{"error": "User not authenticated"})
	}
	
	userID, ok := userIDInterface.(string)
	if !ok {
		log.Printf("[HANDLER] userID is not a string: %T", userIDInterface)
		return c.Status(500).JSON(fiber.Map{"error": "Internal server error"})
	}

	log.Printf("[HANDLER] Creating order for user: %s with %d items", userID, len(items))

	orderID, err := service.CreateOrder(userID, items, body.Notes)
	if err != nil {
		log.Printf("[HANDLER] CreateOrder failed: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create order"})
	}

	log.Printf("[HANDLER] Order created successfully: %s", orderID)
	return c.Status(201).JSON(fiber.Map{"order_id": orderID, "status": model.StatusPending})
}

func GetOrdersByUser(c *fiber.Ctx) error {
	// Get user info from context with proper type assertions
	userIDInterface := c.Locals("userID")
	userRoleInterface := c.Locals("userRole")
	
	if userIDInterface == nil || userRoleInterface == nil {
		log.Printf("[HANDLER] Missing user info in context")
		return c.Status(401).JSON(fiber.Map{"error": "User not authenticated"})
	}

	userID, ok := userIDInterface.(string)
	if !ok {
		log.Printf("[HANDLER] userID is not a string: %T", userIDInterface)
		return c.Status(500).JSON(fiber.Map{"error": "Internal server error"})
	}

	role, ok := userRoleInterface.(string)
	if !ok {
		log.Printf("[HANDLER] userRole is not a string: %T", userRoleInterface)
		return c.Status(500).JSON(fiber.Map{"error": "Internal server error"})
	}

	log.Printf("[HANDLER] Getting orders for user: %s with role: %s", userID, role)

	var result []interface{}
	switch role {
	case "client":
		o, err := repository.GetOrdersByUser(userID)
		if err != nil {
			log.Printf("[HANDLER] Failed to get orders for user %s: %v", userID, err)
			return c.Status(500).JSON(fiber.Map{"error": "Could not fetch orders"})
		}
		for _, v := range o {
			result = append(result, v)
		}
	case "cook", "admin":
		o, err := repository.GetAllOrders()
		if err != nil {
			log.Printf("[HANDLER] Failed to get all orders: %v", err)
			return c.Status(500).JSON(fiber.Map{"error": "Could not fetch orders"})
		}
		for _, v := range o {
			result = append(result, v)
		}
	case "delivery":
		for _, s := range []model.OrderStatus{model.StatusConfirmed, model.StatusPreparing, model.StatusReady} {
			o, err := repository.GetOrdersByStatus(string(s))
			if err != nil {
				log.Printf("[HANDLER] Failed to get orders by status %s: %v", s, err)
				return c.Status(500).JSON(fiber.Map{"error": "Could not fetch orders"})
			}
			for _, v := range o {
				result = append(result, v)
			}
		}
	default:
		log.Printf("[HANDLER] Invalid user role: %s", role)
		return c.Status(403).JSON(fiber.Map{"error": "Invalid user role"})
	}

	log.Printf("[HANDLER] Returning %d orders for user %s", len(result), userID)
	return c.JSON(fiber.Map{"orders": result, "count": len(result)})
}

func GetOrderById(c *fiber.Ctx) error {
	id := c.Params("id")
	
	// Get user info from context
	userIDInterface := c.Locals("userID")
	userRoleInterface := c.Locals("userRole")
	
	if userIDInterface == nil || userRoleInterface == nil {
		return c.Status(401).JSON(fiber.Map{"error": "User not authenticated"})
	}

	userID, ok := userIDInterface.(string)
	if !ok {
		return c.Status(500).JSON(fiber.Map{"error": "Internal server error"})
	}

	role, ok := userRoleInterface.(string)
	if !ok {
		return c.Status(500).JSON(fiber.Map{"error": "Internal server error"})
	}

	log.Printf("[HANDLER] Getting order %s for user %s (role: %s)", id, userID, role)

	o, err := repository.GetOrderById(id)
	if err != nil {
		log.Printf("[HANDLER] Order %s not found: %v", id, err)
		return c.Status(404).JSON(fiber.Map{"error": "Order not found"})
	}
	
	if role == "client" && o.UserID != userID {
		log.Printf("[HANDLER] Access denied: user %s cannot access order %s (owner: %s)", userID, id, o.UserID)
		return c.Status(403).JSON(fiber.Map{"error": "Access denied"})
	}
	
	return c.JSON(o)
}

func UpdateOrderStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	var body struct{ Status string `json:"status"` }
	if err := c.BodyParser(&body); err != nil {
		log.Printf("[HANDLER] Failed to parse status update body: %v", err)
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	
	if !model.IsValidStatus(body.Status) {
		log.Printf("[HANDLER] Invalid status: %s", body.Status)
		return c.Status(400).JSON(fiber.Map{"error": "Invalid status"})
	}
	
	if _, err := repository.GetOrderById(id); err != nil {
		log.Printf("[HANDLER] Order %s not found for status update: %v", id, err)
		return c.Status(404).JSON(fiber.Map{"error": "Order not found"})
	}
	
	log.Printf("[HANDLER] Updating order %s status to %s", id, body.Status)
	
	if err := service.UpdateOrderStatus(id, model.OrderStatus(body.Status)); err != nil {
		log.Printf("[HANDLER] Failed to update order %s status: %v", id, err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update status"})
	}
	
	log.Printf("[HANDLER] Order %s status updated successfully to %s", id, body.Status)
	return c.JSON(fiber.Map{"order_id": id, "status": body.Status})
}

func GetAllOrders(c *fiber.Ctx) error {
	log.Printf("[HANDLER] Getting all orders (admin)")
	
	o, err := repository.GetAllOrders()
	if err != nil {
		log.Printf("[HANDLER] Failed to get all orders: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Could not fetch orders"})
	}
	
	log.Printf("[HANDLER] Returning %d orders", len(o))
	return c.JSON(fiber.Map{"orders": o, "count": len(o)})
}

func GetOrderStats(c *fiber.Ctx) error {
	log.Printf("[HANDLER] Getting order statistics")
	
	stats, err := repository.GetOrderStatistics()
	if err != nil {
		log.Printf("[HANDLER] Failed to get order statistics: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Could not fetch statistics"})
	}
	
	return c.JSON(stats)
}