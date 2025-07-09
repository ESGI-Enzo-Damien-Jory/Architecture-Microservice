// kitchen/queue/consumer.go
package queue

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

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

// KitchenOrder represents a kitchen order
type KitchenOrder struct {
	ID     string `json:"id"`
	Item   string `json:"item"`
	Status string `json:"status"`
}

var globalChannel *amqp.Channel
var orders = make(map[string]KitchenOrder) // Store orders locally

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

	// Declare all required queues
	declareQueues()

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

func declareQueues() {
	queues := []string{
		"kitchen_orders",        // Order service -> Kitchen service
		"kitchen_confirmations", // Kitchen service -> Order service
		"kitchen_status_updates", // Kitchen service -> Other services
	}

	for _, queueName := range queues {
		_, err := globalChannel.QueueDeclare(
			queueName, // name
			true,      // durable
			false,     // delete when unused
			false,     // exclusive
			false,     // no-wait
			nil,       // arguments
		)
		if err != nil {
			log.Fatalf("❌ [KITCHEN] Failed to declare queue %s: %v", queueName, err)
		}
		log.Printf("✅ [KITCHEN] Queue %s declared", queueName)
	}
}

// processKitchenOrder creates a kitchen order with the SAME ID as the original order
func processKitchenOrder(orderMsg OrderMessage) error {
	// Create kitchen order with the SAME ID - directly in queue package
	kitchenOrder := KitchenOrder{
		ID:     orderMsg.ID,
		Item:   formatItemsForKitchen(orderMsg.Items),
		Status: "received", // Start with received status
	}
	
	orders[orderMsg.ID] = kitchenOrder
	log.Printf("🍳 [KITCHEN] Kitchen order created with ID: %s", kitchenOrder.ID)

	// The kitchen order now waits for cook action
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

// Kitchen order management functions
func GetOrder(id string) (KitchenOrder, error) {
	order, exists := orders[id]
	if !exists {
		log.Printf("[QUEUE] Kitchen order %s not found", id)
		return KitchenOrder{}, fmt.Errorf("order not found")
	}
	log.Printf("[QUEUE] Kitchen order found: %+v", order)
	return order, nil
}

func UpdateOrderStatus(id, status string) (KitchenOrder, error) {
	order, exists := orders[id]
	if !exists {
		log.Printf("[QUEUE] Kitchen order %s not found for status update", id)
		return KitchenOrder{}, fmt.Errorf("order not found")
	}
	
	log.Printf("[QUEUE] Updating kitchen order %s from status %s to %s", id, order.Status, status)
	order.Status = status
	orders[id] = order
	log.Printf("[QUEUE] Kitchen order updated: %+v", order)
	
	// Publish status update for different events
	switch status {
	case "confirmed":
		log.Printf("[QUEUE] Kitchen order %s confirmed, notifying order service", id)
		if err := PublishKitchenConfirmation(id); err != nil {
			log.Printf("[QUEUE] Failed to publish kitchen confirmation: %v", err)
		}
	case "preparing":
		log.Printf("[QUEUE] Kitchen order %s started preparation", id)
		if err := PublishKitchenStatusUpdate(id, "preparing"); err != nil {
			log.Printf("[QUEUE] Failed to publish preparation status: %v", err)
		}
	case "ready":
		log.Printf("[QUEUE] Kitchen order %s ready for delivery", id)
		if err := PublishKitchenStatusUpdate(id, "ready"); err != nil {
			log.Printf("[QUEUE] Failed to publish ready status: %v", err)
		}
	}
	
	return order, nil
}

func ListOrders() []KitchenOrder {
	orderList := []KitchenOrder{}
	for _, order := range orders {
		orderList = append(orderList, order)
	}
	log.Printf("[QUEUE] Listed %d kitchen orders", len(orderList))
	return orderList
}

func GetOrdersByStatus(status string) []KitchenOrder {
	orderList := []KitchenOrder{}
	for _, order := range orders {
		if order.Status == status {
			orderList = append(orderList, order)
		}
	}
	log.Printf("[QUEUE] Found %d kitchen orders with status %s", len(orderList), status)
	return orderList
}

// PublishKitchenConfirmation sends confirmation to order service
func PublishKitchenConfirmation(orderID string) error {
	if globalChannel == nil {
		return fmt.Errorf("RabbitMQ channel not available")
	}

	confirmation := map[string]interface{}{
		"order_id":     orderID,
		"status":       "confirmed",
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

// PublishKitchenStatusUpdate sends status updates to other services
func PublishKitchenStatusUpdate(orderID, status string) error {
	if globalChannel == nil {
		return fmt.Errorf("RabbitMQ channel not available")
	}

	statusUpdate := map[string]interface{}{
		"order_id":     orderID,
		"status":       status,
		"updated_at":   time.Now(),
		"event_type":   "kitchen_status_updated",
		"service":      "kitchen",
	}

	payload, err := json.Marshal(statusUpdate)
	if err != nil {
		return fmt.Errorf("failed to marshal status update: %v", err)
	}

	err = globalChannel.Publish(
		"",                       // exchange
		"kitchen_status_updates", // routing key
		false,                    // mandatory
		false,                    // immediate
		amqp.Publishing{
			ContentType: "application/json",
			Body:        payload,
			Timestamp:   time.Now(),
			Headers: amqp.Table{
				"event_type": "kitchen_status_updated",
				"service":    "kitchen",
				"order_id":   orderID,
				"status":     status,
			},
		},
	)

	if err != nil {
		return fmt.Errorf("failed to publish status update: %v", err)
	}

	log.Printf("📤 [KITCHEN] Kitchen status update sent for order %s: %s", orderID, status)
	return nil
}