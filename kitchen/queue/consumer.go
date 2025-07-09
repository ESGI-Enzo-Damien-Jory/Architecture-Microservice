// kitchen/queue/consumer.go
package queue

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"kitchen/service"

	"github.com/streadway/amqp"
)

type OrderMessage struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Status    string    `json:"status"`
	Notes     *string   `json:"notes"`
	Items     []OrderItem `json:"items"`
	CreatedAt time.Time `json:"created_at"`
	EventType string    `json:"event_type"`
	Service   string    `json:"service"`
}

type OrderItem struct {
	ID             string    `json:"id"`
	OrderID        string    `json:"order_id"`
	ItemType       string    `json:"item_type"`
	ItemID         string    `json:"item_id"`
	Quantity       int       `json:"quantity"`
	UnitPriceCents int       `json:"unit_price_cents"`
	CreatedAt      time.Time `json:"created_at"`
}

var globalChannel *amqp.Channel

func ConsumeOrders() {
	rabbitmqURL := os.Getenv("RABBITMQ_URL")
	if rabbitmqURL == "" {
		rabbitmqURL = "amqp://admin:supersecret@rabbitmq:5672/"
	}

	// Retry connection logic
	var conn *amqp.Connection
	var err error
	maxRetries := 30
	retryDelay := 5 * time.Second

	for i := 0; i < maxRetries; i++ {
		log.Printf("🔄 [KITCHEN] Attempting to connect to RabbitMQ (attempt %d/%d)...", i+1, maxRetries)
		conn, err = amqp.Dial(rabbitmqURL)
		if err == nil {
			log.Println("✅ [KITCHEN] Successfully connected to RabbitMQ")
			break
		}
		log.Printf("❌ [KITCHEN] Failed to connect to RabbitMQ: %v", err)
		if i < maxRetries-1 {
			log.Printf("⏳ [KITCHEN] Retrying in %v...", retryDelay)
			time.Sleep(retryDelay)
		}
	}

	if err != nil {
		log.Fatalf("❌ [KITCHEN] Failed to connect to RabbitMQ after %d attempts: %v", maxRetries, err)
	}

	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("❌ [KITCHEN] Failed to open channel: %v", err)
	}

	// Store channel globally for publishing
	globalChannel = ch

	// Declare kitchen_orders queue
	_, err = ch.QueueDeclare(
		"kitchen_orders", // name
		true,            // durable
		false,           // delete when unused
		false,           // exclusive
		false,           // no-wait
		nil,             // arguments
	)
	if err != nil {
		log.Fatalf("❌ [KITCHEN] Failed to declare kitchen_orders queue: %v", err)
	}

	msgs, err := ch.Consume(
		"kitchen_orders", // queue
		"kitchen-service", // consumer tag
		false,           // auto-ack (set to false for manual ack)
		false,           // exclusive
		false,           // no-local
		false,           // no-wait
		nil,             // args
	)
	if err != nil {
		log.Fatalf("❌ [KITCHEN] Failed to register consumer: %v", err)
	}

	log.Println("📡 [KITCHEN] Kitchen service waiting for orders from 'kitchen_orders' queue...")

	go func() {
		for msg := range msgs {
			log.Printf("📦 [KITCHEN] Kitchen received: %s", msg.Body)

			var orderMsg OrderMessage
			if err := json.Unmarshal(msg.Body, &orderMsg); err != nil {
				log.Printf("❌ [KITCHEN] Invalid message format: %v", err)
				msg.Nack(false, false) // Reject and don't requeue
				continue
			}

			// Process the order in kitchen with the SAME ID
			if err := processKitchenOrder(orderMsg); err != nil {
				log.Printf("❌ [KITCHEN] Failed to process kitchen order: %v", err)
				msg.Nack(false, true) // Reject and requeue for retry
				continue
			}

			// Acknowledge the message
			msg.Ack(false)
			log.Printf("✅ [KITCHEN] Kitchen order %s processed successfully", orderMsg.ID)
		}
	}()
}

// processKitchenOrder creates a kitchen order with the SAME ID as the original order
func processKitchenOrder(orderMsg OrderMessage) error {
	// Create kitchen order with the SAME ID
	kitchenOrder := service.CreateOrderWithID(orderMsg.ID, formatItemsForKitchen(orderMsg.Items))
	log.Printf("🍳 [KITCHEN] Kitchen order created with ID: %s", kitchenOrder.ID)

	// The kitchen order now waits for cook action
	// The cook will use /api/orders/:id/confirm to confirm it
	log.Printf("⏳ [KITCHEN] Kitchen order %s waiting for cook confirmation", kitchenOrder.ID)

	return nil
}

// formatItemsForKitchen creates a description of items for kitchen
func formatItemsForKitchen(items []OrderItem) string {
	if len(items) == 0 {
		return "No items"
	}

	description := fmt.Sprintf("%d items: ", len(items))
	for i, item := range items {
		if i > 0 {
			description += ", "
		}
		description += fmt.Sprintf("%dx %s", item.Quantity, item.ItemType)
	}
	
	return description
}

// notifyOrderServiceConfirmed notifies the order service that kitchen confirmed the order
func notifyOrderServiceConfirmed(orderID, status string) error {
	if globalChannel == nil {
		return fmt.Errorf("RabbitMQ channel not available")
	}

	// Declare queue for kitchen confirmations
	_, err := globalChannel.QueueDeclare(
		"kitchen_confirmations", // name
		true,                   // durable
		false,                  // delete when unused
		false,                  // exclusive
		false,                  // no-wait
		nil,                    // arguments
	)
	if err != nil {
		return fmt.Errorf("failed to declare kitchen_confirmations queue: %v", err)
	}

	confirmation := map[string]interface{}{
		"order_id":     orderID,
		"status":       status,
		"confirmed_at": time.Now(),
		"event_type":   "kitchen_confirmed",
		"service":      "kitchen",
	}

	payload, err := json.Marshal(confirmation)
	if err != nil {
		return fmt.Errorf("failed to marshal confirmation: %v", err)
	}

	err = globalChannel.Publish(
		"",                      // exchange
		"kitchen_confirmations", // routing key
		false,                   // mandatory
		false,                   // immediate
		amqp.Publishing{
			ContentType: "application/json",
			Body:        payload,
			Timestamp:   time.Now(),
			Headers: amqp.Table{
				"event_type": "kitchen_confirmed",
				"service":    "kitchen",
				"order_id":   orderID,
			},
		},
	)

	if err != nil {
		return fmt.Errorf("failed to publish confirmation: %v", err)
	}

	log.Printf("📤 [KITCHEN] Kitchen confirmation sent for order %s", orderID)
	return nil
}

// PublishKitchenConfirmation is called when cook confirms an order
func PublishKitchenConfirmation(orderID string) error {
	return notifyOrderServiceConfirmed(orderID, "confirmed")
}