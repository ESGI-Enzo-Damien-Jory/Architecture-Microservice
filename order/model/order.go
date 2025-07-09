package model

import "time"

type Order struct {
	ID        string    `json:"id" db:"id"`
	UserID    string    `json:"user_id" db:"user_id"`
	Product   string    `json:"product" db:"product"`
	Quantity  int       `json:"quantity" db:"quantity"`
	Status    string    `json:"status" db:"status"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type OrderStatus string

const (
	StatusPending    OrderStatus = "pending"
	StatusConfirmed  OrderStatus = "confirmed"
	StatusPreparing  OrderStatus = "preparing"
	StatusReady      OrderStatus = "ready"
	StatusDelivered  OrderStatus = "delivered"
	StatusCancelled  OrderStatus = "cancelled"
)

func IsValidStatus(status string) bool {
	validStatuses := []OrderStatus{
		StatusPending,
		StatusConfirmed,
		StatusPreparing,
		StatusReady,
		StatusDelivered,
		StatusCancelled,
	}
	
	for _, validStatus := range validStatuses {
		if OrderStatus(status) == validStatus {
			return true
		}
	}
	return false
}

func GetValidStatuses() []string {
	return []string{
		string(StatusPending),
		string(StatusConfirmed),
		string(StatusPreparing),
		string(StatusReady),
		string(StatusDelivered),
		string(StatusCancelled),
	}
}