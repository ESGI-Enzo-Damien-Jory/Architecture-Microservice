// kitchen/service/order_service.go
package service

import (
	"errors"
	"kitchen/model"
	"kitchen/queue"
	"log"
)

var orders = make(map[string]model.Order)

// CreateOrder creates a new kitchen order with auto-generated ID
func CreateOrder(item string) model.Order {
	return CreateOrderWithID("", item)
}

// CreateOrderWithID creates a kitchen order with a specific ID (for RabbitMQ messages)
func CreateOrderWithID(id, item string) model.Order {
	if id == "" {
		// Generate new ID if not provided (for backwards compatibility)
		id = generateID()
	}
	
	order := model.Order{
		ID:     id,
		Item:   item,
		Status: "received", // Start with received status
	}
	orders[id] = order
	log.Printf("[SERVICE] Kitchen order created with ID %s: %+v", id, order)
	return order
}

// generateID creates a simple UUID-like ID
func generateID() string {
	// Simple implementation - in real world, use proper UUID
	return "kitchen-" + string(rune(len(orders)))
}

func GetOrder(id string) (model.Order, error) {
	order, exists := orders[id]
	if !exists {
		log.Printf("[SERVICE] Kitchen order %s not found", id)
		return model.Order{}, errors.New("order not found")
	}
	log.Printf("[SERVICE] Kitchen order found: %+v", order)
	return order, nil
}

func UpdateOrderStatus(id, status string) (model.Order, error) {
	order, exists := orders[id]
	if !exists {
		log.Printf("[SERVICE] Kitchen order %s not found for status update", id)
		return model.Order{}, errors.New("order not found")
	}
	
	log.Printf("[SERVICE] Updating kitchen order %s from status %s to %s", id, order.Status, status)
	order.Status = status
	orders[id] = order
	log.Printf("[SERVICE] Kitchen order updated: %+v", order)
	
	// If the order is confirmed, notify the order service
	if status == "confirmed" {
		log.Printf("[SERVICE] Kitchen order %s confirmed, notifying order service", id)
		if err := queue.PublishKitchenConfirmation(id); err != nil {
			log.Printf("[SERVICE] Failed to publish kitchen confirmation: %v", err)
			// Don't fail the status update if RabbitMQ fails
		}
	}
	
	return order, nil
}

func ListOrders() []model.Order {
	orderList := []model.Order{}
	for _, order := range orders {
		orderList = append(orderList, order)
	}
	log.Printf("[SERVICE] Listed %d kitchen orders", len(orderList))
	return orderList
}

// GetOrdersByStatus - Get orders by specific status
func GetOrdersByStatus(status string) []model.Order {
	orderList := []model.Order{}
	for _, order := range orders {
		if order.Status == status {
			orderList = append(orderList, order)
		}
	}
	log.Printf("[SERVICE] Found %d kitchen orders with status %s", len(orderList), status)
	return orderList
}

// GetPendingOrders - Get orders that need cook action
func GetPendingOrders() []model.Order {
	return GetOrdersByStatus("received")
}

// GetPreparingOrders - Get orders currently being prepared
func GetPreparingOrders() []model.Order {
	return GetOrdersByStatus("preparing")
}

// GetReadyOrders - Get orders that are ready
func GetReadyOrders() []model.Order {
	return GetOrdersByStatus("ready")
}