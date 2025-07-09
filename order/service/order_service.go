package service

import (
	"order/config"
	"order/model"
	"order/repository"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/rabbitmq/amqp091-go"
)

func CreateOrder(userID, product string, quantity int) (string, error) {
	orderID := uuid.New().String()

	order := model.Order{
		ID:        orderID,
		UserID:    userID,
		Product:   product,
		Quantity:  quantity,
		Status:    "pending",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Save to database
	if err := repository.InsertOrder(order); err != nil {
		log.Printf("[SERVICE] Failed to save order to database: %v", err)
		return "", err
	}

	// Publish to RabbitMQ
	if err := publishOrderEvent(order); err != nil {
		log.Printf("[SERVICE] Failed to publish order event: %v", err)
		// Don't return error here - order is saved, just event publishing failed
	}

	log.Printf("[SERVICE] Order %s created successfully for user %s", orderID, userID)
	return orderID, nil
}

func publishOrderEvent(order model.Order) error {
	if config.RabbitMQChannel == nil {
		return fmt.Errorf("RabbitMQ channel not initialized")
	}

	// Create order event payload
	orderEvent := map[string]interface{}{
		"id":         order.ID,
		"user_id":    order.UserID,
		"product":    order.Product,
		"quantity":   order.Quantity,
		"status":     order.Status,
		"created_at": order.CreatedAt,
		"event_type": "order_created",
	}

	payload, err := json.Marshal(orderEvent)
	if err != nil {
		return fmt.Errorf("failed to marshal order event: %v", err)
	}

	err = config.RabbitMQChannel.Publish(
		"",       // exchange
		"orders", // routing key
		false,    // mandatory
		false,    // immediate
		amqp091.Publishing{
			ContentType: "application/json",
			Body:        payload,
			Timestamp:   time.Now(),
			Headers: amqp091.Table{
				"event_type": "order_created",
				"service":    "order",
			},
		},
	)

	if err != nil {
		return fmt.Errorf("failed to publish message to RabbitMQ: %v", err)
	}

	log.Printf("[SERVICE] Order event published to RabbitMQ for order %s", order.ID)
	return nil
}

// UpdateOrderStatus updates an order status and publishes an event
func UpdateOrderStatus(orderID, status string) error {
	// Update in database
	if err := repository.UpdateOrderStatus(orderID, status); err != nil {
		return err
	}

	// Get updated order for event
	updatedOrder, err := repository.GetOrderById(orderID)
	if err != nil {
		log.Printf("[SERVICE] Failed to get updated order for event: %v", err)
		return nil // Don't fail the status update if we can't publish event
	}

	// Publish status update event
	if err := publishStatusUpdateEvent(updatedOrder); err != nil {
		log.Printf("[SERVICE] Failed to publish status update event: %v", err)
		// Don't return error - status was updated successfully
	}

	return nil
}

func publishStatusUpdateEvent(order model.Order) error {
	if config.RabbitMQChannel == nil {
		return fmt.Errorf("RabbitMQ channel not initialized")
	}

	statusEvent := map[string]interface{}{
		"id":         order.ID,
		"user_id":    order.UserID,
		"product":    order.Product,
		"quantity":   order.Quantity,
		"status":     order.Status,
		"updated_at": order.UpdatedAt,
		"event_type": "order_status_updated",
	}

	payload, err := json.Marshal(statusEvent)
	if err != nil {
		return fmt.Errorf("failed to marshal status event: %v", err)
	}

	err = config.RabbitMQChannel.Publish(
		"",               // exchange
		"order_updates",  // routing key
		false,            // mandatory
		false,            // immediate
		amqp091.Publishing{
			ContentType: "application/json",
			Body:        payload,
			Timestamp:   time.Now(),
			Headers: amqp091.Table{
				"event_type": "order_status_updated",
				"service":    "order",
				"status":     order.Status,
			},
		},
	)

	if err != nil {
		return fmt.Errorf("failed to publish status update to RabbitMQ: %v", err)
	}

	log.Printf("[SERVICE] Status update event published for order %s (status: %s)", order.ID, order.Status)
	return nil
}