package queue

import (
	"log"

	"github.com/streadway/amqp"
)

func ConsumeOrders() {
	conn, err := amqp.Dial("amqp://guest:guest@localhost:5672/")
	if err != nil {
		log.Fatal("Failed to connect to RabbitMQ:", err)
	}
	ch, _ := conn.Channel()
	msgs, _ := ch.Consume("orders", "", true, false, false, false, nil)

	go func() {
		for msg := range msgs {
			log.Println("Received:", string(msg.Body))

		}
	}()
}
