// order/config/rabbitmq.go
package config

import (
	"log"
	"os"
	"time"

	"github.com/rabbitmq/amqp091-go"
)

var RabbitMQConn *amqp091.Connection
var RabbitMQChannel *amqp091.Channel

func InitRabbitMQ() {
	rabbitmqURL := os.Getenv("RABBITMQ_URL")
	if rabbitmqURL == "" {
		rabbitmqURL = "amqp://admin:supersecret@rabbitmq:5672/"
	}

	// Retry connection logic avec exponential backoff
	var err error
	maxRetries := 20
	retryDelay := 2 * time.Second

	for i := 0; i < maxRetries; i++ {
		log.Printf("🔄 [ORDER] Attempting to connect to RabbitMQ (attempt %d/%d)...", i+1, maxRetries)
		RabbitMQConn, err = amqp091.Dial(rabbitmqURL)
		if err == nil {
			log.Println("✅ [ORDER] Successfully connected to RabbitMQ")
			break
		}
		log.Printf("❌ [ORDER] Failed to connect to RabbitMQ: %v", err)
		if i < maxRetries-1 {
			log.Printf("⏳ [ORDER] Retrying in %v...", retryDelay)
			time.Sleep(retryDelay)
			retryDelay = time.Duration(float64(retryDelay) * 1.5) // Exponential backoff
		}
	}

	if err != nil {
		log.Fatalf("❌ [ORDER] Failed to connect to RabbitMQ after %d attempts: %v", maxRetries, err)
	}

	RabbitMQChannel, err = RabbitMQConn.Channel()
	if err != nil {
		log.Fatalf("❌ [ORDER] Failed to open a channel: %v", err)
	}

	// Declare all required queues
	declareQueues()

	log.Println("✅ [ORDER] Connected to RabbitMQ & queues declared")
}

func declareQueues() {
	queues := []string{
		"kitchen_orders",        // Order service -> Kitchen service
		"kitchen_confirmations", // Kitchen service -> Order service
		"delivery_orders",       // Order service -> Delivery service
		"delivery_updates",      // Delivery service -> Other services
	}

	for _, queueName := range queues {
		_, err := RabbitMQChannel.QueueDeclare(
			queueName, // name
			true,      // durable
			false,     // delete when unused
			false,     // exclusive
			false,     // no-wait
			nil,       // arguments
		)
		if err != nil {
			log.Fatalf("❌ [ORDER] Failed to declare queue %s: %v", queueName, err)
		}
		log.Printf("✅ [ORDER] Queue %s declared", queueName)
	}
}