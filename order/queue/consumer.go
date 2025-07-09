// order/queue/consumer.go
package queue

import (
	"encoding/json"
	"log"
	"order/model"
	"order/repository"
	"order/service"
	"os"
	"time"

	"github.com/rabbitmq/amqp091-go"
)

type KitchenConfirmation struct {
	OrderID     string    `json:"order_id"`
	Status      string    `json:"status"`
	ConfirmedAt time.Time `json:"confirmed_at"`
	EventType   string    `json:"event_type"`
	Service     string    `json:"service"`
}

func StartKitchenConfirmationConsumer() {
	rabbitmqURL := os.Getenv("RABBITMQ_URL")
	if rabbitmqURL == "" {
		rabbitmqURL = "amqp://admin:supersecret@rabbitmq:5672/"
	}

	// Retry connection logic
	var conn *amqp091.Connection
	var err error
	maxRetries := 30
	retryDelay := 5 * time.Second

	for i := 0; i < maxRetries; i++ {
		log.Printf("🔄 [ORDER] Connecting to RabbitMQ for kitchen confirmations (attempt %d/%d)...", i+1, maxRetries)
		conn, err = amqp091.Dial(rabbitmqURL)
		if err == nil {
			log.Println("✅ [ORDER] Connected to RabbitMQ for kitchen confirmations")
			break
		}
		log.Printf("❌ [ORDER] Failed to connect: %v", err)
		if i < maxRetries-1 {
			log.Printf("⏳ [ORDER] Retrying in %v...", retryDelay)
			time.Sleep(retryDelay)
		}
	}

	if err != nil {
		log.Fatalf("❌ [ORDER] Failed to connect to RabbitMQ after %d attempts: %v", maxRetries, err)
	}

	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("❌ [ORDER] Failed to open channel for confirmations: %v", err)
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
		log.Fatalf("❌ [ORDER] Failed to declare kitchen_confirmations queue: %v", err)
	}

	msgs, err := ch.Consume(
		"kitchen_confirmations", // queue
		"order-service",        // consumer tag
		false,                  // auto-ack
		false,                  // exclusive
		false,                  // no-local
		false,                  // no-wait
		nil,                    // args
	)
	if err != nil {
		log.Fatalf("❌ [ORDER] Failed to register kitchen confirmations consumer: %v", err)
	}

	log.Println("📡 [ORDER] Listening for kitchen confirmations...")

	go func() {
		for msg := range msgs {
			log.Printf("📦 [ORDER] Received kitchen confirmation: %s", msg.Body)

			var confirmation KitchenConfirmation
			if err := json.Unmarshal(msg.Body, &confirmation); err != nil {
				log.Printf("❌ [ORDER] Invalid confirmation format: %v", err)
				msg.Nack(false, false) // Reject and don't requeue
				continue
			}

			// Verify this is a kitchen confirmation
			if confirmation.EventType != "kitchen_confirmed" || confirmation.Service != "kitchen" {
				log.Printf("❌ [ORDER] Invalid confirmation event type or service: %s/%s", confirmation.EventType, confirmation.Service)
				msg.Nack(false, false)
				continue
			}

			// Update order status to confirmed
			if err := processKitchenConfirmation(confirmation); err != nil {
				log.Printf("❌ [ORDER] Failed to process kitchen confirmation: %v", err)
				msg.Nack(false, true) // Reject and requeue for retry
				continue
			}

			msg.Ack(false)
			log.Printf("✅ [ORDER] Kitchen confirmation processed for order %s", confirmation.OrderID)
		}
	}()
}

func processKitchenConfirmation(confirmation KitchenConfirmation) error {
	log.Printf("[ORDER] Processing kitchen confirmation for order %s", confirmation.OrderID)
	
	// Check if order exists
	order, err := repository.GetOrderById(confirmation.OrderID)
	if err != nil {
		log.Printf("❌ [ORDER] Order %s not found for kitchen confirmation: %v", confirmation.OrderID, err)
		return err
	}

	log.Printf("[ORDER] Order %s found with current status: %s", confirmation.OrderID, order.Status)

	// Only update if order is still pending
	if order.Status != model.StatusPending {
		log.Printf("[ORDER] Order %s already has status %s, skipping confirmation", confirmation.OrderID, order.Status)
		return nil
	}

	// Update order status to confirmed
	// This will trigger the logic to send the order to delivery service
	err = service.UpdateOrderStatus(confirmation.OrderID, model.StatusConfirmed)
	if err != nil {
		log.Printf("❌ [ORDER] Failed to update order %s status to confirmed: %v", confirmation.OrderID, err)
		return err
	}

	log.Printf("✅ [ORDER] Order %s confirmed by kitchen and sent to delivery", confirmation.OrderID)
	return nil
}