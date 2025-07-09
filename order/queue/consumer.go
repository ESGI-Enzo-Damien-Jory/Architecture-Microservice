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

type KitchenStatusUpdate struct {
	OrderID   string    `json:"order_id"`
	Status    string    `json:"status"`
	UpdatedAt time.Time `json:"updated_at"`
	EventType string    `json:"event_type"`
	Service   string    `json:"service"`
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
		log.Printf("🔄 [ORDER] Connecting to RabbitMQ for kitchen messages (attempt %d/%d)...", i+1, maxRetries)
		conn, err = amqp091.Dial(rabbitmqURL)
		if err == nil {
			log.Println("✅ [ORDER] Connected to RabbitMQ for kitchen messages")
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
		log.Fatalf("❌ [ORDER] Failed to open channel for kitchen messages: %v", err)
	}

	// Start both consumers
	go consumeKitchenConfirmations(ch)
	go consumeKitchenStatusUpdates(ch)
}

func consumeKitchenConfirmations(ch *amqp091.Channel) {
	// Declare kitchen_confirmations queue
	_, err := ch.QueueDeclare(
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
		"order-confirmations",  // consumer tag
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
}

func consumeKitchenStatusUpdates(ch *amqp091.Channel) {
	// Declare kitchen_status_updates queue
	_, err := ch.QueueDeclare(
		"kitchen_status_updates", // name
		true,                    // durable
		false,                   // delete when unused
		false,                   // exclusive
		false,                   // no-wait
		nil,                     // arguments
	)
	if err != nil {
		log.Fatalf("❌ [ORDER] Failed to declare kitchen_status_updates queue: %v", err)
	}

	msgs, err := ch.Consume(
		"kitchen_status_updates", // queue
		"order-status-updates",   // consumer tag
		false,                   // auto-ack
		false,                   // exclusive
		false,                   // no-local
		false,                   // no-wait
		nil,                     // args
	)
	if err != nil {
		log.Fatalf("❌ [ORDER] Failed to register kitchen status updates consumer: %v", err)
	}

	log.Println("📡 [ORDER] Listening for kitchen status updates...")

	for msg := range msgs {
		log.Printf("📦 [ORDER] Received kitchen status update: %s", msg.Body)

		var statusUpdate KitchenStatusUpdate
		if err := json.Unmarshal(msg.Body, &statusUpdate); err != nil {
			log.Printf("❌ [ORDER] Invalid status update format: %v", err)
			msg.Nack(false, false) // Reject and don't requeue
			continue
		}

		// Verify this is a kitchen status update
		if statusUpdate.EventType != "kitchen_status_updated" || statusUpdate.Service != "kitchen" {
			log.Printf("❌ [ORDER] Invalid status update event type or service: %s/%s", statusUpdate.EventType, statusUpdate.Service)
			msg.Nack(false, false)
			continue
		}

		// Update order status
		if err := processKitchenStatusUpdate(statusUpdate); err != nil {
			log.Printf("❌ [ORDER] Failed to process kitchen status update: %v", err)
			msg.Nack(false, true) // Reject and requeue for retry
			continue
		}

		msg.Ack(false)
		log.Printf("✅ [ORDER] Kitchen status update processed for order %s: %s", statusUpdate.OrderID, statusUpdate.Status)
	}
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

func processKitchenStatusUpdate(statusUpdate KitchenStatusUpdate) error {
	log.Printf("[ORDER] Processing kitchen status update for order %s: %s", statusUpdate.OrderID, statusUpdate.Status)
	
	// Check if order exists
	order, err := repository.GetOrderById(statusUpdate.OrderID)
	if err != nil {
		log.Printf("❌ [ORDER] Order %s not found for kitchen status update: %v", statusUpdate.OrderID, err)
		return err
	}

	log.Printf("[ORDER] Order %s found with current status: %s", statusUpdate.OrderID, order.Status)

	// Map kitchen status to order status
	var orderStatus model.OrderStatus
	switch statusUpdate.Status {
	case "preparing":
		orderStatus = model.StatusPreparing
	case "ready":
		orderStatus = model.StatusReady
	default:
		log.Printf("[ORDER] Unknown kitchen status: %s", statusUpdate.Status)
		return nil
	}

	// Update order status
	err = service.UpdateOrderStatus(statusUpdate.OrderID, orderStatus)
	if err != nil {
		log.Printf("❌ [ORDER] Failed to update order %s status to %s: %v", statusUpdate.OrderID, orderStatus, err)
		return err
	}

	log.Printf("✅ [ORDER] Order %s status updated to %s", statusUpdate.OrderID, orderStatus)
	return nil
}