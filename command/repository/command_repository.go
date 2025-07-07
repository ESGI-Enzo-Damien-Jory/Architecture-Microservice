package repository

import (
	"command/config"
	"command/model"
)

func InsertCommand(cmd model.Command) error {
	query := `INSERT INTO commands (id, user_id, product, quantity, created_at) VALUES ($1, $2, $3, $4, $5)`
	_, err := config.DB.Exec(query, cmd.ID, cmd.UserID, cmd.Product, cmd.Quantity, cmd.CreatedAt)
	return err
}

func GetCommandsByUser(userID string) ([]model.Command, error) {
	query := `SELECT id, user_id, product, quantity, created_at FROM commands WHERE user_id = $1`
	rows, err := config.DB.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var commands []model.Command
	for rows.Next() {
		var c model.Command
		err := rows.Scan(&c.ID, &c.UserID, &c.Product, &c.Quantity, &c.CreatedAt)
		if err != nil {
			return nil, err
		}
		commands = append(commands, c)
	}
	return commands, nil
}
