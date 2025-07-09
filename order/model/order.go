package model

import "time"

type OrderStatus string

const (
	StatusPending   OrderStatus = "pending"
	StatusConfirmed OrderStatus = "confirmed"
	StatusPreparing OrderStatus = "preparing"
	StatusReady     OrderStatus = "ready"
	StatusDelivered OrderStatus = "delivered"
	StatusCancelled OrderStatus = "cancelled"
)

type Order struct {
	ID              string       `json:"id"`
	UserID          string       `json:"user_id"`
	Status          OrderStatus  `json:"status"`
	Notes           *string      `json:"notes,omitempty"`
	TotalPriceCents int          `json:"total_price_cents"`
	CreatedAt       time.Time    `json:"created_at"`
	UpdatedAt       time.Time    `json:"updated_at"`
	Items           []OrderItem  `json:"items,omitempty"`
}

type OrderItem struct {
    ID             string    `json:"id"`
    OrderID        string    `json:"order_id"`
    ItemType       string    `json:"item_type"`        // "product" | "menu"
    ItemID         string    `json:"item_id"`          // uuid de l'item
    Quantity       int       `json:"quantity"`
    UnitPriceCents int       `json:"unit_price_cents"`
    CreatedAt      time.Time `json:"created_at"`
    UpdatedAt      time.Time `json:"updated_at"`
}

func IsValidStatus(s string) bool {
	switch OrderStatus(s) {
	case StatusPending, StatusConfirmed, StatusPreparing, StatusReady, StatusDelivered, StatusCancelled:
		return true
	default:
		return false
	}
}
