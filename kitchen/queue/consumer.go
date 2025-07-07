package queue

import (
	"encoding/json"
	"log"
	"os"
	"time"

	"kitchen/service"

	"github.com/streadway/amqp"
)

type OrderMessage struct {
	Item string `json:"item"`
}

func ConsumeOrders() {
	// Use environment variable from docker-compose
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

	_, err = ch.QueueDeclare(
		"orders",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatalf("❌ Failed to declare queue: %v", err)
	}

	msgs, err := ch.Consume(
		"orders",
		"",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatalf("❌ Failed to register consumer: %v", err)
	}

	log.Println("📡 Waiting for messages from 'orders' queue...")

	go func() {
		for msg := range msgs {
			log.Printf("📦 Received: %s", msg.Body)

			var order OrderMessage
			if err := json.Unmarshal(msg.Body, &order); err != nil {
				log.Printf("❌ Invalid message format: %v", err)
				continue
			}

			created := service.CreateOrder(order.Item)
			log.Printf("✅ Order created from RabbitMQ: %+v", created)
		}
	}()
}