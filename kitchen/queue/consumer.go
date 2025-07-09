// kitchen/queue/consumer.go - Corrections pour votre setup
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
	Product   string    `json:"product"`
	Quantity  int       `json:"quantity"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	EventType string    `json:"event_type"`
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
	maxRetries := 30 // Plus d'essais pour attendre RabbitMQ
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

			// Process the order in kitchen
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

// processKitchenOrder handles the order processing in kitchen
func processKitchenOrder(orderMsg OrderMessage) error {
	// Create order in kitchen service
	kitchenOrder := service.CreateOrder(orderMsg.Product)
	log.Printf("🍳 [KITCHEN] Kitchen order created: %+v", kitchenOrder)

	// Simulate some processing time (3-5 seconds pour être réaliste)
	processingTime := 3 + time.Duration(time.Now().UnixNano()%3)*time.Second
	log.Printf("🍳 [KITCHEN] Processing order %s for %v...", orderMsg.ID, processingTime)
	time.Sleep(processingTime)

	// Auto-confirm the order (kitchen accepts it)
	confirmedOrder, err := service.UpdateOrderStatus(kitchenOrder.ID, "confirmed")
	if err != nil {
		return fmt.Errorf("failed to confirm kitchen order: %v", err)
	}

	log.Printf("✅ [KITCHEN] Kitchen confirmed order: %+v", confirmedOrder)

	// Notify the order service that kitchen confirmed the order
	if err := notifyOrderServiceConfirmed(orderMsg.ID, "confirmed"); err != nil {
		log.Printf("⚠️ [KITCHEN] Failed to notify order service: %v", err)
		// Don't return error - kitchen processing was successful
	}

	return nil
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