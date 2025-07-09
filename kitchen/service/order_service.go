// kitchen/service/order_service.go
package service

import (
	"errors"
	"kitchen/model"
	"log"

	"github.com/google/uuid"
)


func CreateOrder(item string) model.Order {
	return CreateOrderWithID("", item)
}

func CreateOrderWithID(id, item string) model.Order {
	if id == "" {
		id = uuid.New().String()
	}
	
	order := model.Order{
		ID:     id,
		Item:   item,
		Status: "received",
	}
	
	log.Printf("[SERVICE] Kitchen order created with ID %s: %+v", id, order)
	return order
}

// These functions now delegate to the queue package to avoid import cycles
func GetOrder(id string) (model.Order, error) {
	log.Printf("[SERVICE] GetOrder called for ID: %s", id)
	return model.Order{}, errors.New("use queue.GetOrder instead")
}

func UpdateOrderStatus(id, status string) (model.Order, error) {
	log.Printf("[SERVICE] UpdateOrderStatus called for ID: %s, status: %s", id, status)
	return model.Order{}, errors.New("use queue.UpdateOrderStatus instead")
}

func ListOrders() []model.Order {
	log.Printf("[SERVICE] ListOrders called")
	return []model.Order{}
}

func GetOrdersByStatus(status string) []model.Order {
	log.Printf("[SERVICE] GetOrdersByStatus called for status: %s", status)
	return []model.Order{}
}