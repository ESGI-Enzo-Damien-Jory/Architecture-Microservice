package repository

import (
	"order/config"
	"order/model"
	"database/sql"
	"log"
)

func InsertOrder(cmd model.Order) error {
	query := `INSERT INTO orders (id, user_id, product, quantity, status, created_at) VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := config.DB.Exec(query, cmd.ID, cmd.UserID, cmd.Product, cmd.Quantity, cmd.Status, cmd.CreatedAt)
	if err != nil {
		log.Printf("[DB] Failed to insert order: %v", err)
	}
	return err
}

func GetOrdersByUser(userID string) ([]model.Order, error) {
	query := `SELECT id, user_id, product, quantity, status, created_at, updated_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC`
	rows, err := config.DB.Query(query, userID)
	if err != nil {
		log.Printf("[DB] Failed to query orders for user %s: %v", userID, err)
		return nil, err
	}
	defer rows.Close()

	var orders []model.Order
	for rows.Next() {
		var c model.Order
		err := rows.Scan(&c.ID, &c.UserID, &c.Product, &c.Quantity, &c.Status, &c.CreatedAt, &c.UpdatedAt)
		if err != nil {
			log.Printf("[DB] Failed to scan order row: %v", err)
			return nil, err
		}
		orders = append(orders, c)
	}

	if err = rows.Err(); err != nil {
		log.Printf("[DB] Error iterating through rows: %v", err)
		return nil, err
	}

	return orders, nil
}

func GetAllOrders() ([]model.Order, error) {
	query := `SELECT id, user_id, product, quantity, status, created_at, updated_at FROM orders ORDER BY created_at DESC`
	rows, err := config.DB.Query(query)
	if err != nil {
		log.Printf("[DB] Failed to query all orders: %v", err)
		return nil, err
	}
	defer rows.Close()

	var orders []model.Order
	for rows.Next() {
		var c model.Order
		err := rows.Scan(&c.ID, &c.UserID, &c.Product, &c.Quantity, &c.Status, &c.CreatedAt, &c.UpdatedAt)
		if err != nil {
			log.Printf("[DB] Failed to scan order row: %v", err)
			return nil, err
		}
		orders = append(orders, c)
	}

	if err = rows.Err(); err != nil {
		log.Printf("[DB] Error iterating through rows: %v", err)
		return nil, err
	}

	return orders, nil
}

func GetOrdersByStatus(status string) ([]model.Order, error) {
	query := `SELECT id, user_id, product, quantity, status, created_at, updated_at FROM orders WHERE status = $1 ORDER BY created_at DESC`
	rows, err := config.DB.Query(query, status)
	if err != nil {
		log.Printf("[DB] Failed to query orders by status %s: %v", status, err)
		return nil, err
	}
	defer rows.Close()

	var orders []model.Order
	for rows.Next() {
		var c model.Order
		err := rows.Scan(&c.ID, &c.UserID, &c.Product, &c.Quantity, &c.Status, &c.CreatedAt, &c.UpdatedAt)
		if err != nil {
			log.Printf("[DB] Failed to scan order row: %v", err)
			return nil, err
		}
		orders = append(orders, c)
	}

	if err = rows.Err(); err != nil {
		log.Printf("[DB] Error iterating through rows: %v", err)
		return nil, err
	}

	return orders, nil
}

func GetOrderById(orderID string) (model.Order, error) {
	query := `SELECT id, user_id, product, quantity, status, created_at, updated_at FROM orders WHERE id = $1`
	row := config.DB.QueryRow(query, orderID)

	var c model.Order
	err := row.Scan(&c.ID, &c.UserID, &c.Product, &c.Quantity, &c.Status, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("[DB] Order %s not found", orderID)
		} else {
			log.Printf("[DB] Failed to scan order %s: %v", orderID, err)
		}
		return model.Order{}, err
	}

	return c, nil
}

func UpdateOrderStatus(orderID string, status string) error {
	query := `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`
	result, err := config.DB.Exec(query, status, orderID)
	if err != nil {
		log.Printf("[DB] Failed to update order %s status: %v", orderID, err)
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("[DB] Failed to get rows affected for order %s: %v", orderID, err)
		return err
	}

	if rowsAffected == 0 {
		log.Printf("[DB] Order %s not found for status update", orderID)
		return sql.ErrNoRows
	}

	log.Printf("[DB] Updated order %s status to %s", orderID, status)
	return nil
}

func GetOrderStatistics() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	var totalOrders int
	err := config.DB.QueryRow("SELECT COUNT(*) FROM orders").Scan(&totalOrders)
	if err != nil {
		log.Printf("[DB] Failed to get total orders count: %v", err)
		return nil, err
	}
	stats["total_orders"] = totalOrders

	statusQuery := `SELECT status, COUNT(*) FROM orders GROUP BY status`
	rows, err := config.DB.Query(statusQuery)
	if err != nil {
		log.Printf("[DB] Failed to get orders by status: %v", err)
		return nil, err
	}
	defer rows.Close()

	ordersByStatus := make(map[string]int)
	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			log.Printf("[DB] Failed to scan status row: %v", err)
			continue
		}
		ordersByStatus[status] = count
	}
	stats["orders_by_status"] = ordersByStatus

	var ordersToday int
	err = config.DB.QueryRow("SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURRENT_DATE").Scan(&ordersToday)
	if err != nil {
		log.Printf("[DB] Failed to get today's orders count: %v", err)
		ordersToday = 0
	}
	stats["orders_today"] = ordersToday

	productQuery := `SELECT product, COUNT(*) as order_count FROM orders GROUP BY product ORDER BY order_count DESC LIMIT 5`
	productRows, err := config.DB.Query(productQuery)
	if err != nil {
		log.Printf("[DB] Failed to get popular products: %v", err)
	} else {
		defer productRows.Close()
		
		popularProducts := make([]map[string]interface{}, 0)
		for productRows.Next() {
			var product string
			var count int
			if err := productRows.Scan(&product, &count); err != nil {
				log.Printf("[DB] Failed to scan product row: %v", err)
				continue
			}
			popularProducts = append(popularProducts, map[string]interface{}{
				"product": product,
				"count":   count,
			})
		}
		stats["popular_products"] = popularProducts
	}

	return stats, nil
}