package service

import (
	"errors"
	"kitchen/model"
	"log"

	"github.com/google/uuid"
)

var orders = make(map[string]model.Order)

func CreateOrder(item string) model.Order {
	id := uuid.New().String()
	order := model.Order{
		ID:     id,
		Item:   item,
		Status: "received",
	}
	orders[id] = order
	log.Printf("[SERVICE] Order created: %+v", order)
	return order
}

func GetOrder(id string) (model.Order, error) {
	order, exists := orders[id]
	if !exists {
		log.Printf("[SERVICE] Order %s not found", id)
		return model.Order{}, errors.New("order not found")
	}
	log.Printf("[SERVICE] Order found: %+v", order)
	return order, nil
}

func UpdateOrderStatus(id, status string) (model.Order, error) {
	order, exists := orders[id]
	if !exists {
		log.Printf("[SERVICE] Order %s not found for status update", id)
		return model.Order{}, errors.New("order not found")
	}
	
	log.Printf("[SERVICE] Updating order %s from status %s to %s", id, order.Status, status)
	order.Status = status
	orders[id] = order
	log.Printf("[SERVICE] Order updated: %+v", order)
	
	return order, nil
}

func ListOrders() []model.Order {
	orderList := []model.Order{}
	for _, order := range orders {
		orderList = append(orderList, order)
	}
	log.Printf("[SERVICE] Listed %d orders", len(orderList))
	return orderList
}