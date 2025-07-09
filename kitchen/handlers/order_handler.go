// kitchen/handlers/order_handler.go
package handler

import (
	"kitchen/queue"
	"log"

	"github.com/gofiber/fiber/v2"
)

type UpdateStatusRequest struct {
	Status string `json:"status"`
}

// GetOrder - Get a specific kitchen order by ID
func GetOrder(c *fiber.Ctx) error {
	id := c.Params("id")
	log.Printf("[KITCHEN] Getting kitchen order with ID: %s", id)
	
	order, err := queue.GetOrder(id)
	if err != nil {
		log.Printf("[KITCHEN] Kitchen order %s not found: %v", id, err)
		return c.Status(404).JSON(fiber.Map{"error": err.Error()})
	}
	
	return c.JSON(order)
}

// UpdateOrderStatus - Cook confirms/updates kitchen order status
func UpdateOrderStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	log.Printf("[KITCHEN] Cook updating status for kitchen order ID: %s", id)
	
	var body UpdateStatusRequest
	if err := c.BodyParser(&body); err != nil {
		log.Printf("[KITCHEN] Invalid request body: %v", err)
		return c.Status(400).JSON(fiber.Map{"error": "invalid request"})
	}
	
	// Validate status - only allow kitchen-specific statuses
	validStatuses := []string{"received", "confirmed", "preparing", "ready", "completed"}
	isValid := false
	for _, status := range validStatuses {
		if body.Status == status {
			isValid = true
			break
		}
	}
	
	if !isValid {
		log.Printf("[KITCHEN] Invalid status: %s", body.Status)
		return c.Status(400).JSON(fiber.Map{
			"error": "Invalid status. Valid statuses: received, confirmed, preparing, ready, completed",
		})
	}
	
	log.Printf("[KITCHEN] Cook updating kitchen order %s to status: %s", id, body.Status)
	
	order, err := queue.UpdateOrderStatus(id, body.Status)
	if err != nil {
		log.Printf("[KITCHEN] Failed to update kitchen order %s: %v", id, err)
		return c.Status(404).JSON(fiber.Map{"error": err.Error()})
	}
	
	log.Printf("[KITCHEN] Kitchen order %s updated successfully to status: %s", id, body.Status)
	return c.JSON(order)
}

// ListOrders - Get all kitchen orders (for cooks to see what to prepare)
func ListOrders(c *fiber.Ctx) error {
	log.Printf("[KITCHEN] Cook listing all kitchen orders")
	orders := queue.ListOrders()
	log.Printf("[KITCHEN] Found %d kitchen orders", len(orders))
	return c.JSON(fiber.Map{
		"orders": orders,
		"count":  len(orders),
	})
}

// GetPendingOrders - Get orders that need cook action
func GetPendingOrders(c *fiber.Ctx) error {
	log.Printf("[KITCHEN] Cook getting pending kitchen orders")
	orders := queue.GetOrdersByStatus("received")
	log.Printf("[KITCHEN] Found %d pending kitchen orders", len(orders))
	return c.JSON(fiber.Map{
		"orders": orders,
		"count":  len(orders),
	})
}

// GetPreparingOrders - Get orders currently being prepared
func GetPreparingOrders(c *fiber.Ctx) error {
	log.Printf("[KITCHEN] Cook getting orders in preparation")
	orders := queue.GetOrdersByStatus("preparing")
	log.Printf("[KITCHEN] Found %d orders in preparation", len(orders))
	return c.JSON(fiber.Map{
		"orders": orders,
		"count":  len(orders),
	})
}

// ConfirmOrder - Shortcut endpoint for cooks to confirm orders
// This is the KEY endpoint that triggers the RabbitMQ message to order service
func ConfirmOrder(c *fiber.Ctx) error {
	id := c.Params("id")
	log.Printf("[KITCHEN] Cook confirming kitchen order: %s", id)
	
	// This will call queue.UpdateOrderStatus which will trigger RabbitMQ message
	order, err := queue.UpdateOrderStatus(id, "confirmed")
	if err != nil {
		log.Printf("[KITCHEN] Failed to confirm kitchen order %s: %v", id, err)
		return c.Status(404).JSON(fiber.Map{"error": err.Error()})
	}
	
	log.Printf("[KITCHEN] Kitchen order %s confirmed successfully - message sent to order service", id)
	return c.JSON(fiber.Map{
		"message": "Order confirmed successfully",
		"order":   order,
	})
}

// StartPreparation - Cook starts preparing confirmed order
func StartPreparation(c *fiber.Ctx) error {
	id := c.Params("id")
	log.Printf("[KITCHEN] Cook starting preparation for kitchen order: %s", id)
	
	order, err := queue.UpdateOrderStatus(id, "preparing")
	if err != nil {
		log.Printf("[KITCHEN] Failed to start preparation for kitchen order %s: %v", id, err)
		return c.Status(404).JSON(fiber.Map{"error": err.Error()})
	}
	
	log.Printf("[KITCHEN] Kitchen order %s preparation started", id)
	return c.JSON(fiber.Map{
		"message": "Order preparation started",
		"order":   order,
	})
}

// MarkOrderReady - Cook marks order as ready
func MarkOrderReady(c *fiber.Ctx) error {
	id := c.Params("id")
	log.Printf("[KITCHEN] Cook marking kitchen order as ready: %s", id)
	
	order, err := queue.UpdateOrderStatus(id, "ready")
	if err != nil {
		log.Printf("[KITCHEN] Failed to mark kitchen order %s as ready: %v", id, err)
		return c.Status(404).JSON(fiber.Map{"error": err.Error()})
	}
	
	log.Printf("[KITCHEN] Kitchen order %s marked as ready", id)
	return c.JSON(fiber.Map{
		"message": "Order marked as ready",
		"order":   order,
	})
}