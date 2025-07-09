// handler/order.go
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
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	if len(body.Items) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "At least one item required"})
	}

	var items []service.CreateItem
	for _, it := range body.Items {
		if it.Quantity <= 0 || it.Price < 0 || (it.Type != "product" && it.Type != "menu") || it.ID == "" {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid item data"})
		}
		items = append(items, service.CreateItem{
			ItemType: it.Type,
			ItemID:   it.ID,
			Quantity: it.Quantity,
			Price:    it.Price,
		})
	}

	userID := c.Locals("userID").(string)
	orderID, err := service.CreateOrder(userID, items, body.Notes)
	if err != nil {
		log.Printf("[HANDLER] CreateOrder failed: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create order"})
	}
	return c.Status(201).JSON(fiber.Map{"order_id": orderID, "status": model.StatusPending})
}

func GetOrdersByUser(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	role := c.Locals("userRole").(string)

	var result []interface{}
	switch role {
	case "client":
		o, err := repository.GetOrdersByUser(userID)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Could not fetch orders"})
		}
		for _, v := range o {
			result = append(result, v)
		}
	case "cook", "admin":
		o, err := repository.GetAllOrders()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Could not fetch orders"})
		}
		for _, v := range o {
			result = append(result, v)
		}
	case "delivery":
		for _, s := range []model.OrderStatus{model.StatusConfirmed, model.StatusPreparing, model.StatusReady} {
			o, err := repository.GetOrdersByStatus(string(s))
			if err != nil {
				return c.Status(500).JSON(fiber.Map{"error": "Could not fetch orders"})
			}
			for _, v := range o {
				result = append(result, v)
			}
		}
	default:
		return c.Status(403).JSON(fiber.Map{"error": "Invalid user role"})
	}
	return c.JSON(fiber.Map{"orders": result, "count": len(result)})
}

func GetOrderById(c *fiber.Ctx) error {
	id := c.Params("id")
	userID := c.Locals("userID").(string)
	role := c.Locals("userRole").(string)

	o, err := repository.GetOrderById(id)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Order not found"})
	}
	if role == "client" && o.UserID != userID {
		return c.Status(403).JSON(fiber.Map{"error": "Access denied"})
	}
	return c.JSON(o)
}

func UpdateOrderStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	var body struct{ Status string `json:"status"` }
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}
	if !model.IsValidStatus(body.Status) {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid status"})
	}
	if _, err := repository.GetOrderById(id); err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Order not found"})
	}
	if err := service.UpdateOrderStatus(id, model.OrderStatus(body.Status)); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update status"})
	}
	return c.JSON(fiber.Map{"order_id": id, "status": body.Status})
}

func GetAllOrders(c *fiber.Ctx) error {
	o, err := repository.GetAllOrders()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not fetch orders"})
	}
	return c.JSON(fiber.Map{"orders": o, "count": len(o)})
}

func GetOrderStats(c *fiber.Ctx) error {
	stats, err := repository.GetOrderStatistics()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not fetch statistics"})
	}
	return c.JSON(stats)
}
