package queue

import (
	"encoding/json"
	"log"

	"kitchen/service"

	"github.com/streadway/amqp"
)

type OrderMessage struct {
	Item string `json:"item"`
}

func ConsumeOrders() {
	conn, err := amqp.Dial("amqp://guest:guest@localhost:5672/")
	if err != nil {
		log.Fatalf("❌ Failed to connect to RabbitMQ: %v", err)
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
