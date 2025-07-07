package model

import "time"

type Command struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Product   string    `json:"product"`
	Quantity  int       `json:"quantity"`
	CreatedAt time.Time `json:"created_at"`
}
