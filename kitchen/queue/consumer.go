// kitchen/queue/consumer.go - Enhanced version
package queue

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
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
		rabbitmqURL = "amqp://guest:guest@localhost:5672/"
	}

	// Retry connection logic
	var conn *amqp.Connection
	var err error
	maxRetries := 10
	retryDelay := 5 * time.Second

	for i := 0; i < maxRetries; i++ {
		log.Printf("🔄 Attempting to connect to RabbitMQ (attempt %d/%d)...", i+1, maxRetries)
		conn, err = amqp.Dial(rabbitmqURL)
		if err == nil {
			log.Println("✅ Successfully connected to RabbitMQ")
			break
		}
		log.Printf("❌ Failed to connect to RabbitMQ: %v", err)
		if i < maxRetries-1 {
			log.Printf("⏳ Retrying in %v...", retryDelay)
			time.Sleep(retryDelay)
		}
	}

	if err != nil {
		log.Fatalf("❌ Failed to connect to RabbitMQ after %d attempts: %v", maxRetries, err)
	}

	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("❌ Failed to open channel: %v", err)
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
		log.Fatalf("❌ Failed to declare kitchen_orders queue: %v", err)
	}

	msgs, err := ch.Consume(
		"kitchen_orders", // queue
		"",              // consumer
		false,           // auto-ack (set to false for manual ack)
		false,           // exclusive
		false,           // no-local
		false,           // no-wait
		nil,             // args
	)
	if err != nil {
		log.Fatalf("❌ Failed to register consumer: %v", err)
	}

	log.Println("📡 Kitchen service waiting for orders from 'kitchen_orders' queue...")

	go func() {
		for msg := range msgs {
			log.Printf("📦 Kitchen received: %s", msg.Body)

			var orderMsg OrderMessage
			if err := json.Unmarshal(msg.Body, &orderMsg); err != nil {
				log.Printf("❌ Invalid message format: %v", err)
				msg.Nack(false, false) // Reject and don't requeue
				continue
			}

			// Process the order in kitchen
			if err := processKitchenOrder(orderMsg); err != nil {
				log.Printf("❌ Failed to process kitchen order: %v", err)
				msg.Nack(false, true) // Reject and requeue for retry
				continue
			}

			// Acknowledge the message
			msg.Ack(false)
			log.Printf("✅ Kitchen order %s processed successfully", orderMsg.ID)
		}
	}()
}

// processKitchenOrder handles the order processing in kitchen
func processKitchenOrder(orderMsg OrderMessage) error {
	// Create order in kitchen service
	kitchenOrder := service.CreateOrder(orderMsg.Product)
	log.Printf("🍳 Kitchen order created: %+v", kitchenOrder)

	// Simulate some processing time
	time.Sleep(2 * time.Second)

	// Auto-confirm the order (kitchen accepts it)
	confirmedOrder, err := service.UpdateOrderStatus(kitchenOrder.ID, "confirmed")
	if err != nil {
		return fmt.Errorf("failed to confirm kitchen order: %v", err)
	}

	log.Printf("✅ Kitchen confirmed order: %+v", confirmedOrder)

	// Notify the order service that kitchen confirmed the order
	if err := notifyOrderServiceConfirmed(orderMsg.ID, "confirmed"); err != nil {
		log.Printf("⚠️ Failed to notify order service: %v", err)
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
		"order_id":   orderID,
		"status":     status,
		"confirmed_at": time.Now(),
		"event_type": "kitchen_confirmed",
		"service":    "kitchen",
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

	log.Printf("📤 Kitchen confirmation sent for order %s", orderID)
	return nil
}

// Also add a consumer for kitchen confirmations in the order service
func ConsumeKitchenConfirmations() {
	rabbitmqURL := os.Getenv("RABBITMQ_URL")
	if rabbitmqURL == "" {
		rabbitmqURL = "amqp://guest:guest@localhost:5672/"
	}

	conn, err := amqp.Dial(rabbitmqURL)
	if err != nil {
		log.Printf("❌ Failed to connect to RabbitMQ for confirmations: %v", err)
		return
	}

	ch, err := conn.Channel()
	if err != nil {
		log.Printf("❌ Failed to open channel for confirmations: %v", err)
		return
	}

	// Declare kitchen_confirmations queue
	_, err = ch.QueueDeclare(
		"kitchen_confirmations", // name
		true,                   // durable
		false,                  // delete when unused
		false,                  // exclusive
		false,                  // no-wait
		nil,                    // arguments
	)
	if err != nil {
		log.Printf("❌ Failed to declare kitchen_confirmations queue: %v", err)
		return
	}

	msgs, err := ch.Consume(
		"kitchen_confirmations", // queue
		"",                     // consumer
		false,                  // auto-ack
		false,                  // exclusive
		false,                  // no-local
		false,                  // no-wait
		nil,                    // args
	)
	if err != nil {
		log.Printf("❌ Failed to register confirmations consumer: %v", err)
		return
	}

	log.Println("📡 Order service listening for kitchen confirmations...")

	go func() {
		for msg := range msgs {
			log.Printf("📦 Order service received confirmation: %s", msg.Body)

			var confirmation map[string]interface{}
			if err := json.Unmarshal(msg.Body, &confirmation); err != nil {
				log.Printf("❌ Invalid confirmation format: %v", err)
				msg.Nack(false, false)
				continue
			}

			orderID, ok := confirmation["order_id"].(string)
			if !ok {
				log.Printf("❌ Invalid order_id in confirmation")
				msg.Nack(false, false)
				continue
			}

			// Update order status via HTTP call to order service
			if err := updateOrderStatusViaHTTP(orderID, "confirmed"); err != nil {
				log.Printf("❌ Failed to update order status: %v", err)
				msg.Nack(false, true) // Requeue for retry
				continue
			}

			msg.Ack(false)
			log.Printf("✅ Order %s confirmed by kitchen", orderID)
		}
	}()
}

// updateOrderStatusViaHTTP updates order status via HTTP call
func updateOrderStatusViaHTTP(orderID, status string) error {
	// This should be called from the order service, not kitchen
	// You'll need to implement this in the order service
	return nil
}