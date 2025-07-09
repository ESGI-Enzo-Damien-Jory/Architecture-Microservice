// repository/order_repository.go
package repository

import (
	"database/sql"
	"log"
	"order/config"
	"order/model"
)

// InsertOrderWithItems inserts an order and its items in a transaction.
func InsertOrderWithItems(o model.Order) error {
	tx, err := config.DB.Begin()
	if err != nil {
		return err
	}
	if _, err := tx.Exec(
		`INSERT INTO orders (id, user_id, status, notes, total_price_cents, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6)`,
		o.ID, o.UserID, o.Status, o.Notes, o.TotalPriceCents, o.CreatedAt,
	); err != nil {
		tx.Rollback()
		return err
	}
	for _, it := range o.Items {
		if _, err := tx.Exec(
			`INSERT INTO order_items
			 (id, order_id, item_type, item_id, quantity, unit_price_cents, created_at)
			 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
			it.ID, it.OrderID, it.ItemType, it.ItemID,
			it.Quantity, it.UnitPriceCents, it.CreatedAt,
		); err != nil {
			tx.Rollback()
			return err
		}
	}
	return tx.Commit()
}

func GetOrdersByUser(uid string) ([]model.Order, error) {
	return scanOrders(
		`SELECT id, user_id, status, notes, total_price_cents, created_at, updated_at
		 FROM orders WHERE user_id=$1 ORDER BY created_at DESC`, uid,
	)
}

func GetAllOrders() ([]model.Order, error) {
	return scanOrders(
		`SELECT id, user_id, status, notes, total_price_cents, created_at, updated_at
		 FROM orders ORDER BY created_at DESC`,
	)
}

func GetOrdersByStatus(status string) ([]model.Order, error) {
	return scanOrders(
		`SELECT id, user_id, status, notes, total_price_cents, created_at, updated_at
		 FROM orders WHERE status=$1 ORDER BY created_at DESC`, status,
	)
}

func scanOrders(query string, args ...interface{}) ([]model.Order, error) {
	rows, err := config.DB.Query(query, args...)
	if err != nil {
		log.Printf("[DB] Query failed: %v", err)
		return nil, err
	}
	defer rows.Close()

	var out []model.Order
	for rows.Next() {
		var o model.Order
		if err := rows.Scan(
			&o.ID, &o.UserID, &o.Status,
			&o.Notes, &o.TotalPriceCents,
			&o.CreatedAt, &o.UpdatedAt,
		); err != nil {
			log.Printf("[DB] Scan order failed: %v", err)
			return nil, err
		}
		items, err := GetItemsByOrder(o.ID)
		if err != nil {
			log.Printf("[DB] Fetch items failed for %s: %v", o.ID, err)
			return nil, err
		}
		o.Items = items
		out = append(out, o)
	}
	if err := rows.Err(); err != nil {
		log.Printf("[DB] Rows iteration error: %v", err)
		return nil, err
	}
	return out, nil
}

func GetItemsByOrder(orderID string) ([]model.OrderItem, error) {
	rows, err := config.DB.Query(
		`SELECT id, order_id, item_type, item_id,
		        quantity, unit_price_cents, created_at, updated_at
		 FROM order_items WHERE order_id=$1`, orderID,
	)
	if err != nil {
		log.Printf("[DB] Query items failed: %v", err)
		return nil, err
	}
	defer rows.Close()

	var items []model.OrderItem
	for rows.Next() {
		var it model.OrderItem
		if err := rows.Scan(
			&it.ID, &it.OrderID,
			&it.ItemType, &it.ItemID,
			&it.Quantity, &it.UnitPriceCents,
			&it.CreatedAt, &it.UpdatedAt,
		); err != nil {
			log.Printf("[DB] Scan item failed: %v", err)
			return nil, err
		}
		items = append(items, it)
	}
	if err := rows.Err(); err != nil {
		log.Printf("[DB] Items rows error: %v", err)
		return nil, err
	}
	return items, nil
}

func GetOrderById(id string) (model.Order, error) {
	var o model.Order
	if err := config.DB.QueryRow(
		`SELECT id, user_id, status, notes, total_price_cents, created_at, updated_at
		 FROM orders WHERE id=$1`, id,
	).Scan(
		&o.ID, &o.UserID, &o.Status,
		&o.Notes, &o.TotalPriceCents,
		&o.CreatedAt, &o.UpdatedAt,
	); err != nil {
		return o, err
	}
	items, err := GetItemsByOrder(o.ID)
	if err != nil {
		return o, err
	}
	o.Items = items
	return o, nil
}

func UpdateOrderStatus(id string, status model.OrderStatus) error {
	res, err := config.DB.Exec(
		`UPDATE orders SET status=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2`,
		status, id,
	)
	if err != nil {
		return err
	}
	if aff, _ := res.RowsAffected(); aff == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func GetOrderStatistics() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	var total int
	if err := config.DB.QueryRow(`SELECT COUNT(*) FROM orders`).Scan(&total); err != nil {
		return nil, err
	}
	stats["total_orders"] = total

	rows, err := config.DB.Query(`SELECT status, COUNT(*) FROM orders GROUP BY status`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	byStatus := make(map[string]int)
	for rows.Next() {
		var s string; var c int
		if err := rows.Scan(&s, &c); err != nil {
			return nil, err
		}
		byStatus[s] = c
	}
	stats["orders_by_status"] = byStatus

	var today int
	if err := config.DB.QueryRow(
		`SELECT COUNT(*) FROM orders WHERE DATE(created_at)=CURRENT_DATE`,
	).Scan(&today); err != nil {
		return nil, err
	}
	stats["orders_today"] = today

	popR, err := config.DB.Query(`
		SELECT item_type||':'||item_id AS ref, SUM(quantity) AS cnt
		FROM order_items GROUP BY ref ORDER BY cnt DESC LIMIT 5`)
	if err != nil {
		return nil, err
	}
	defer popR.Close()
	pop := make([]map[string]interface{}, 0, 5)
	for popR.Next() {
		var ref string; var cnt int
		if err := popR.Scan(&ref, &cnt); err != nil {
			return nil, err
		}
		pop = append(pop, map[string]interface{}{"ref": ref, "count": cnt})
	}
	stats["popular"] = pop

	return stats, nil
}
