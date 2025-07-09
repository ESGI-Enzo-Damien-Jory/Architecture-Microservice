package handler

import (
	"kitchen/service"
	"log"

	"github.com/gofiber/fiber/v2"
)

type CreateOrderRequest struct {
	Item string `json:"item"`
}

type UpdateStatusRequest struct {
	Status string `json:"status"`
}

func CreateOrder(c *fiber.Ctx) error {
	var body CreateOrderRequest
	if err := c.BodyParser(&body); err != nil {
		log.Printf("[KITCHEN] Invalid request body: %v", err)
		return c.Status(400).JSON(fiber.Map{"error": "invalid request"})
	}
	
	if body.Item == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Item is required"})
	}
	
	log.Printf("[KITCHEN] Creating order with item: %s", body.Item)
	order := service.CreateOrder(body.Item)
	log.Printf("[KITCHEN] Order created: %+v", order)
	
	return c.Status(201).JSON(order)
}

func GetOrder(c *fiber.Ctx) error {
	id := c.Params("id")
	log.Printf("[KITCHEN] Getting order with ID: %s", id)
	
	order, err := service.GetOrder(id)
	if err != nil {
		log.Printf("[KITCHEN] Order %s not found: %v", id, err)
		return c.Status(404).JSON(fiber.Map{"error": err.Error()})
	}
	
	return c.JSON(order)
}

func UpdateOrderStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	log.Printf("[KITCHEN] Updating status for order ID: %s", id)
	
	var body UpdateStatusRequest
	if err := c.BodyParser(&body); err != nil {
		log.Printf("[KITCHEN] Invalid request body: %v", err)
		return c.Status(400).JSON(fiber.Map{"error": "invalid request"})
	}
	
	// Validate status
	validStatuses := []string{"received", "preparing", "ready", "completed"}
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
			"error": "Invalid status. Valid statuses: received, preparing, ready, completed",
		})
	}
	
	log.Printf("[KITCHEN] Updating order %s to status: %s", id, body.Status)
	
	order, err := service.UpdateOrderStatus(id, body.Status)
	if err != nil {
		log.Printf("[KITCHEN] Failed to update order %s: %v", id, err)
		return c.Status(404).JSON(fiber.Map{"error": err.Error()})
	}
	
	log.Printf("[KITCHEN] Order %s updated successfully to status: %s", id, body.Status)
	return c.JSON(order)
}

func ListOrders(c *fiber.Ctx) error {
	log.Printf("[KITCHEN] Listing all orders")
	orders := service.ListOrders()
	log.Printf("[KITCHEN] Found %d orders", len(orders))
	return c.JSON(fiber.Map{
		"orders": orders,
		"count":  len(orders),
	})
}