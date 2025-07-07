package service

import (
	"command/config"
	"command/model"
	"command/repository"
	"encoding/json"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/rabbitmq/amqp091-go"
)

func CreateCommand(userID, product string, quantity int) error {
	cmd := model.Command{
		ID:        uuid.New().String(),
		UserID:    userID,
		Product:   product,
		Quantity:  quantity,
		CreatedAt: time.Now(),
	}

	if err := repository.InsertCommand(cmd); err != nil {
		return err
	}

	payload, _ := json.Marshal(cmd)
	err := config.RabbitMQChannel.Publish(
		"", "orders", false, false,
		amqp091.Publishing{
			ContentType: "application/json",
			Body:        payload,
		},
	)

	if err != nil {
		log.Println("❌ Failed to publish message to RabbitMQ:", err)
	}

	return nil
}
