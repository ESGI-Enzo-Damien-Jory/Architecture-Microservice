// service/order_service.go
package service

import (
	"encoding/json"
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

// CreateOrder persists a new order + items then publishes an event.
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

	_ = publishEvent(order, "order_created")
	return orderID, nil
}

// UpdateOrderStatus updates status and publishes an event.
func UpdateOrderStatus(id string, status model.OrderStatus) error {
	if err := repository.UpdateOrderStatus(id, status); err != nil {
		return err
	}
	o, err := repository.GetOrderById(id)
	if err == nil {
		_ = publishEvent(o, "order_status_updated")
	}
	return nil
}

func publishEvent(o model.Order, evt string) error {
	if config.RabbitMQChannel == nil {
		return nil
	}
	payload := map[string]interface{}{
		"id":                  o.ID,
		"user_id":             o.UserID,
		"status":              o.Status,
		"total_price_cents":   o.TotalPriceCents,
		"created_at":          o.CreatedAt,
		"updated_at":          o.UpdatedAt,
		"items":               o.Items,
		"event_type":          evt,
	}
	body, _ := json.Marshal(payload)
	return config.RabbitMQChannel.Publish(
		"", "orders", false, false,
		amqp091.Publishing{
			ContentType: "application/json",
			Body:        body,
			Timestamp:   time.Now(),
			Headers: amqp091.Table{
				"event_type": evt,
				"service":    "order",
			},
		},
	)
}