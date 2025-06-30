package model

type Order struct {
	ID     string `json:"id"`
	Item   string `json:"item"`
	Status string `json:"status"`
}
