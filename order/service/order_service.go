// service/order_service.go
package service

import (
	"encoding/json"
	"log"
	"order/config"
	"order/model"
	"order/repository"
	"time"

	"github.com/google/uuid"
	"github.com/rabbitmq/amqp091-go"
)

// CreateItem describes one line in the new order.
type CreateItem struct {
	ItemType string // "product" | "menu"
	ItemID   string
	Quantity int
	Price    int // cents
}

// CreateOrder persists a new order + items then publishes to kitchen_orders.
func CreateOrder(userID string, items []CreateItem, notes *string) (string, error) {
	orderID := uuid.NewString()
	now := time.Now()

	var lines []model.OrderItem
	total := 0
	for _, it := range items {
		total += it.Price * it.Quantity
		lines = append(lines, model.OrderItem{
			ID:             uuid.NewString(),
			OrderID:        orderID,
			ItemType:       it.ItemType,
			ItemID:         it.ItemID,
			Quantity:       it.Quantity,
			UnitPriceCents: it.Price,
			CreatedAt:      now,
		})
	}

	order := model.Order{
		ID:              orderID,
		UserID:          userID,
		Status:          model.StatusPending,
		Notes:           notes,
		TotalPriceCents: total,
		CreatedAt:       now,
		Items:           lines,
	}

	if err := repository.InsertOrderWithItems(order); err != nil {
		return "", err
	}

	log.Printf("📦 [ORDER] Order created: %s, sending to kitchen", orderID)
	
	// Send to kitchen_orders queue
	if err := publishToKitchen(order); err != nil {
		log.Printf("❌ [ORDER] Failed to send order to kitchen: %v", err)
		// Don't fail the order creation if RabbitMQ fails
	}

	return orderID, nil
}

// UpdateOrderStatus updates status and handles the workflow.
func UpdateOrderStatus(id string, status model.OrderStatus) error {
	if err := repository.UpdateOrderStatus(id, status); err != nil {
		return err
	}
	
	order, err := repository.GetOrderById(id)
	if err != nil {
		return err
	}

	log.Printf("📊 [ORDER] Order %s status updated to: %s", id, status)

	// Handle status-specific logic
	switch status {
	case model.StatusConfirmed:
		log.Printf("✅ [ORDER] Order %s confirmed by kitchen, sending to delivery", id)
		if err := publishToDelivery(order); err != nil {
			log.Printf("❌ [ORDER] Failed to send order to delivery: %v", err)
		}
	}

	return nil
}

// publishToKitchen sends the order to kitchen_orders queue
func publishToKitchen(order model.Order) error {
	if config.RabbitMQChannel == nil {
		return nil
	}

	// Create a simplified message for kitchen
	kitchenMessage := map[string]interface{}{
		"id":         order.ID,
		"user_id":    order.UserID,
		"status":     string(order.Status),
		"notes":      order.Notes,
		"items":      order.Items,
		"created_at": order.CreatedAt,
		"event_type": "order_created",
		"service":    "order",
	}

	body, err := json.Marshal(kitchenMessage)
	if err != nil {
		return err
	}

	err = config.RabbitMQChannel.Publish(
		"",              // exchange
		"kitchen_orders", // routing key
		false,           // mandatory
		false,           // immediate
		amqp091.Publishing{
			ContentType: "application/json",
			Body:        body,
			Timestamp:   time.Now(),
			Headers: amqp091.Table{
				"event_type": "order_created",
				"service":    "order",
				"order_id":   order.ID,
			},
		},
	)

	if err != nil {
		return err
	}

	log.Printf("📤 [ORDER] Order %s sent to kitchen", order.ID)
	return nil
}

// publishToDelivery sends confirmed order to delivery_orders queue
func publishToDelivery(order model.Order) error {
	if config.RabbitMQChannel == nil {
		return nil
	}

	// Create delivery message
	deliveryMessage := map[string]interface{}{
		"id":         order.ID,
		"user_id":    order.UserID,
		"status":     string(order.Status),
		"notes":      order.Notes,
		"items":      order.Items,
		"created_at": order.CreatedAt,
		"updated_at": order.UpdatedAt,
		"event_type": "order_confirmed",
		"service":    "order",
	}

	body, err := json.Marshal(deliveryMessage)
	if err != nil {
		return err
	}

	err = config.RabbitMQChannel.Publish(
		"",               // exchange
		"delivery_orders", // routing key
		false,            // mandatory
		false,            // immediate
		amqp091.Publishing{
			ContentType: "application/json",
			Body:        body,
			Timestamp:   time.Now(),
			Headers: amqp091.Table{
				"event_type": "order_confirmed",
				"service":    "order",
				"order_id":   order.ID,
			},
		},
	)

	if err != nil {
		return err
	}

	log.Printf("📤 [ORDER] Order %s sent to delivery", order.ID)
	return nil
}