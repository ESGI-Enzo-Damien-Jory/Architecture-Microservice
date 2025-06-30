package handler

import (
	"kitchen/service"

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
		return c.Status(400).JSON(fiber.Map{"error": "invalid request"})
	}
	order := service.CreateOrder(body.Item)
	return c.Status(201).JSON(order)
}

func GetOrder(c *fiber.Ctx) error {
	id := c.Params("id")
	order, err := service.GetOrder(id)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(order)
}

func UpdateOrderStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	var body UpdateStatusRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request"})
	}
	order, err := service.UpdateOrderStatus(id, body.Status)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(order)
}

func ListOrders(c *fiber.Ctx) error {
	orders := service.ListOrders()
	return c.JSON(orders)
}
