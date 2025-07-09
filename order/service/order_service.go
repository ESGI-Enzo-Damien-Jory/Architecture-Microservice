package service

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"order/config"
	"order/model"
	"order/repository"

	"github.com/google/uuid"
	"github.com/rabbitmq/amqp091-go"
)

type CreateItem struct {
	ItemType string // "product" | "menu"
	ItemID   string
	Quantity int
	Price    int // cents
}

type OrderEvent struct {
	ID              string             `json:"id"`
	UserID          string             `json:"user_id"`
	Status          string             `json:"status"`
	Notes           *string            `json:"notes,omitempty"`
	TotalPriceCents int                `json:"total_price_cents"`
	CreatedAt       time.Time          `json:"created_at"`
	UpdatedAt       time.Time          `json:"updated_at"`
	Items           []model.OrderItem  `json:"items"`
	EventType       string             `json:"event_type"`
}

// CreateOrder persists a new order + items and publishes an event
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

	if err := publishOrderToKitchen(order); err != nil {
		log.Printf("[SERVICE] Failed to publish order to kitchen: %v", err)
	}

	return orderID, nil
}

// UpdateOrderStatus updates an order status and publishes appropriate events
func UpdateOrderStatus(orderID string, status string) error {
	if err := repository.UpdateOrderStatus(orderID, status); err != nil {
		return err
	}

	order, err := repository.GetOrderById(orderID)
	if err != nil {
		log.Printf("[SERVICE] Failed to fetch order after update: %v", err)
		return nil
	}

	if status == "confirmed" {
		if err := publishOrderToDelivery(order); err != nil {
			log.Printf("[SERVICE] Failed to publish to delivery: %v", err)
		}
	}

	if err := publishStatusUpdateEvent(order); err != nil {
		log.Printf("[SERVICE] Failed to publish status update: %v", err)
	}

	return nil
}

// publishOrderToKitchen sends the order to the kitchen queue
func publishOrderToKitchen(order model.Order) error {
	return publishOrderEvent(order, "kitchen_orders", "order_created")
}

// publishOrderToDelivery sends the order to the delivery queue
func publishOrderToDelivery(order model.Order) error {
	return publishOrderEvent(order, "delivery_orders", "order_confirmed")
}

// publishStatusUpdateEvent sends a generic status update
func publishStatusUpdateEvent(order model.Order) error {
	return publishOrderEvent(order, "order_updates", "order_status_updated")
}

func publishOrderEvent(order model.Order, queueName, eventType string) error {
	if config.RabbitMQChannel == nil {
		return fmt.Errorf("RabbitMQ channel not initialized")
	}

	_, err := config.RabbitMQChannel.QueueDeclare(
		queueName, true, false, false, false, nil,
	)
	if err != nil {
		return fmt.Errorf("failed to declare queue %s: %v", queueName, err)
	}

	event := OrderEvent{
		ID:              order.ID,
		UserID:          order.UserID,
		Status:          order.Status,
		Notes:           order.Notes,
		TotalPriceCents: order.TotalPriceCents,
		CreatedAt:       order.CreatedAt,
		UpdatedAt:       order.UpdatedAt,
		Items:           order.Items,
		EventType:       eventType,
	}

	payload, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal %s event: %v", eventType, err)
	}

	return config.RabbitMQChannel.Publish(
		"", queueName, false, false,
		amqp091.Publishing{
			ContentType: "application/json",
			Body:        payload,
			Timestamp:   time.Now(),
			Headers: amqp091.Table{
				"event_type": eventType,
				"service":    "order",
				"order_id":   order.ID,
			},
		},
	)
}
