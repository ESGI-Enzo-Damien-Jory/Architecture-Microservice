import db from '@adonisjs/lucid/services/db'

interface OrderMessage {
  id: string
  user_id: string
  product: string
  quantity: number
  status: string
  created_at: string
  updated_at: string
  event_type: string
}

class RabbitMQService {
  private connection: any = null
  private channel: any = null

  async connect() {
    try {
      // Using amqp091-go compatible library
      const amqp = await import('amqplib')
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672/'
      
      this.connection = await amqp.connect(rabbitmqUrl)
      this.channel = await this.connection.createChannel()
      
      console.log('✅ Delivery service connected to RabbitMQ')
      
      // Start consuming confirmed orders
      await this.consumeConfirmedOrders()
      
    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ:', error)
      // Retry connection after 5 seconds
      setTimeout(() => this.connect(), 5000)
    }
  }

  async consumeConfirmedOrders() {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available')
    }

    // Declare delivery_orders queue
    await this.channel.assertQueue('delivery_orders', {
      durable: true
    })

    console.log('📡 Delivery service waiting for confirmed orders from delivery_orders queue...')

    // Consume messages
    await this.channel.consume('delivery_orders', async (msg: any) => {
      if (!msg) return

      try {
        const orderData: OrderMessage = JSON.parse(msg.content.toString())
        console.log('📦 Delivery received confirmed order:', orderData)

        // Process the confirmed order
        await this.processConfirmedOrder(orderData)

        // Acknowledge the message
        this.channel.ack(msg)
        console.log(`✅ Delivery processed order ${orderData.id}`)

      } catch (error) {
        console.error('❌ Failed to process delivery order:', error)
        // Reject and requeue for retry
        this.channel.nack(msg, false, true)
      }
    }, {
      noAck: false // Manual acknowledgment
    })
  }

  async processConfirmedOrder(orderData: OrderMessage) {
    try {
      // Check if delivery already exists for this order
      const existingDelivery = await db
        .from('deliveries')
        .where('order_id', orderData.id)
        .first()

      if (existingDelivery) {
        console.log(`📋 Delivery already exists for order ${orderData.id}`)
        return
      }

      // Create delivery record
      const delivery = await db
        .insertQuery()
        .table('deliveries')
        .insert({
          order_id: orderData.id,
          client_id: orderData.user_id,
          status: 'available',
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*')

      console.log(`🚚 Delivery created for order ${orderData.id}:`, delivery[0])

      // Optionally notify other services that delivery is available
      await this.publishDeliveryCreated(delivery[0])

    } catch (error) {
      console.error(`❌ Failed to create delivery for order ${orderData.id}:`, error)
      throw error
    }
  }

  async publishDeliveryCreated(delivery: any) {
    if (!this.channel) return

    try {
      // Declare delivery_updates queue
      await this.channel.assertQueue('delivery_updates', {
        durable: true
      })

      const deliveryEvent = {
        delivery_id: delivery.id,
        order_id: delivery.order_id,
        client_id: delivery.client_id,
        status: delivery.status,
        event_type: 'delivery_created',
        created_at: delivery.created_at,
        service: 'delivery'
      }

      await this.channel.sendToQueue(
        'delivery_updates',
        Buffer.from(JSON.stringify(deliveryEvent)),
        {
          persistent: true,
          headers: {
            event_type: 'delivery_created',
            service: 'delivery',
            order_id: delivery.order_id
          }
        }
      )

      console.log(`📤 Delivery created event published for order ${delivery.order_id}`)

    } catch (error) {
      console.error('❌ Failed to publish delivery created event:', error)
    }
  }

  async publishDeliveryStatusUpdate(deliveryId: string, orderId: string, status: string) {
    if (!this.channel) return

    try {
      await this.channel.assertQueue('delivery_updates', {
        durable: true
      })

      const statusEvent = {
        delivery_id: deliveryId,
        order_id: orderId,
        status: status,
        event_type: 'delivery_status_updated',
        updated_at: new Date(),
        service: 'delivery'
      }

      await this.channel.sendToQueue(
        'delivery_updates',
        Buffer.from(JSON.stringify(statusEvent)),
        {
          persistent: true,
          headers: {
            event_type: 'delivery_status_updated',
            service: 'delivery',
            status: status,
            order_id: orderId
          }
        }
      )

      console.log(`📤 Delivery status update published: ${orderId} -> ${status}`)

    } catch (error) {
      console.error('❌ Failed to publish delivery status update:', error)
    }
  }

  async close() {
    try {
      if (this.channel) await this.channel.close()
      if (this.connection) await this.connection.close()
      console.log('🔌 RabbitMQ connection closed')
    } catch (error) {
      console.error('❌ Error closing RabbitMQ connection:', error)
    }
  }
}

export const rabbitmqService = new RabbitMQService()

// Auto-start the service
rabbitmqService.connect().catch(console.error)

// Graceful shutdown
process.on('SIGINT', async () => {
  await rabbitmqService.close()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await rabbitmqService.close()
  process.exit(0)
})