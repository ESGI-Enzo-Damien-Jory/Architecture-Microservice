package config

import (
	"log"
	"os"

	"github.com/rabbitmq/amqp091-go"
)

var RabbitMQConn *amqp091.Connection
var RabbitMQChannel *amqp091.Channel

func InitRabbitMQ() {
	var err error
	RabbitMQConn, err = amqp091.Dial(os.Getenv("RABBITMQ_URL"))
	if err != nil {
		log.Fatalf("❌ Failed to connect to RabbitMQ: %v", err)
	}

	RabbitMQChannel, err = RabbitMQConn.Channel()
	if err != nil {
		log.Fatalf("❌ Failed to open a channel: %v", err)
	}

	_, err = RabbitMQChannel.QueueDeclare(
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

	log.Println("✅ Connected to RabbitMQ & queue declared")
}
