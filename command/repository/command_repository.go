package repository

import (
	"command/config"
	"command/model"
	"database/sql"
	"log"
)

func InsertCommand(cmd model.Command) error {
	query := `INSERT INTO commands (id, user_id, product, quantity, created_at) VALUES ($1, $2, $3, $4, $5)`
	_, err := config.DB.Exec(query, cmd.ID, cmd.UserID, cmd.Product, cmd.Quantity, cmd.CreatedAt)
	if err != nil {
		log.Printf("[DB] Failed to insert command: %v", err)
	}
	return err
}

func GetCommandsByUser(userID string) ([]model.Command, error) {
	query := `SELECT id, user_id, product, quantity, created_at FROM commands WHERE user_id = $1 ORDER BY created_at DESC`
	rows, err := config.DB.Query(query, userID)
	if err != nil {
		log.Printf("[DB] Failed to query commands for user %s: %v", userID, err)
		return nil, err
	}
	defer rows.Close()

	var commands []model.Command
	for rows.Next() {
		var c model.Command
		err := rows.Scan(&c.ID, &c.UserID, &c.Product, &c.Quantity, &c.CreatedAt)
		if err != nil {
			log.Printf("[DB] Failed to scan command row: %v", err)
			return nil, err
		}
		commands = append(commands, c)
	}

	if err = rows.Err(); err != nil {
		log.Printf("[DB] Error iterating through rows: %v", err)
		return nil, err
	}

	return commands, nil
}

func GetAllCommands() ([]model.Command, error) {
	query := `SELECT id, user_id, product, quantity, created_at FROM commands ORDER BY created_at DESC`
	rows, err := config.DB.Query(query)
	if err != nil {
		log.Printf("[DB] Failed to query all commands: %v", err)
		return nil, err
	}
	defer rows.Close()

	var commands []model.Command
	for rows.Next() {
		var c model.Command
		err := rows.Scan(&c.ID, &c.UserID, &c.Product, &c.Quantity, &c.CreatedAt)
		if err != nil {
			log.Printf("[DB] Failed to scan command row: %v", err)
			return nil, err
		}
		commands = append(commands, c)
	}

	if err = rows.Err(); err != nil {
		log.Printf("[DB] Error iterating through rows: %v", err)
		return nil, err
	}

	return commands, nil
}

func GetCommandById(commandID string) (model.Command, error) {
	query := `SELECT id, user_id, product, quantity, created_at FROM commands WHERE id = $1`
	row := config.DB.QueryRow(query, commandID)

	var c model.Command
	err := row.Scan(&c.ID, &c.UserID, &c.Product, &c.Quantity, &c.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("[DB] Command %s not found", commandID)
		} else {
			log.Printf("[DB] Failed to scan command %s: %v", commandID, err)
		}
		return model.Command{}, err
	}

	return c, nil
}

func UpdateCommandStatus(commandID string, status string) error {
	query := `UPDATE commands SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`
	result, err := config.DB.Exec(query, status, commandID)
	if err != nil {
		log.Printf("[DB] Failed to update command %s status: %v", commandID, err)
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("[DB] Failed to get rows affected for command %s: %v", commandID, err)
		return err
	}

	if rowsAffected == 0 {
		log.Printf("[DB] Command %s not found for status update", commandID)
		return sql.ErrNoRows
	}

	log.Printf("[DB] Updated command %s status to %s", commandID, status)
	return nil
}