CREATE TABLE IF NOT EXISTS deliveries (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    delivery_person_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'available',
    reserved_at TIMESTAMP,
    picked_up_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deliveries_delivery_person_id ON deliveries(delivery_person_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_client_id ON deliveries(client_id);

INSERT INTO deliveries (order_id, client_id, status) VALUES 
    ('order-001', 'client-001', 'available'),
    ('order-002', 'client-002', 'available')
ON CONFLICT DO NOTHING;