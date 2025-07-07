package service

import (
	"errors"
	"kitchen/model"

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
	return order
}

func GetOrder(id string) (model.Order, error) {
	order, exists := orders[id]
	if !exists {
		return model.Order{}, errors.New("order not found")
	}
	return order, nil
}

func UpdateOrderStatus(id, status string) (model.Order, error) {
	order, exists := orders[id]
	if !exists {
		return model.Order{}, errors.New("order not found")
	}
	order.Status = status
	orders[id] = order
	return order, nil
}

func ListOrders() []model.Order {
	orderList := []model.Order{}
	for _, order := range orders {
		orderList = append(orderList, order)
	}
	return orderList
}
