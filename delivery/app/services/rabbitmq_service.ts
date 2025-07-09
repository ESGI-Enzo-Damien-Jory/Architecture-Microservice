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
      // Using amqplib with your Docker setup
      const amqp = await import('amqplib')
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://admin:supersecret@rabbitmq:5672/'
      
      console.log('[DELIVERY] Attempting to connect to RabbitMQ:', rabbitmqUrl.replace(/\/\/.*@/, '//***@'))
      
      // Retry logic
      let connected = false
      const maxRetries = 30
      
      for (let i = 0; i < maxRetries; i++) {
        try {
          this.connection = await amqp.connect(rabbitmqUrl)
          this.channel = await this.connection.createChannel()
          connected = true
          break
        } catch (err) {
          console.log(`[DELIVERY] Connection attempt ${i + 1}/${maxRetries} failed:`, err.message)
          if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 5000))
          }
        }
      }
      
      if (!connected) {
        throw new Error('Failed to connect after retries')
      }
      
      console.log('✅ [DELIVERY] Successfully connected to RabbitMQ')
      
      // Start consuming confirmed orders
      await this.consumeConfirmedOrders()
      
    } catch (error) {
      console.error('❌ [DELIVERY] Failed to connect to RabbitMQ:', error)
      // Retry connection after 10 seconds
      setTimeout(() => this.connect(), 10000)
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

    console.log('📡 [DELIVERY] Delivery service waiting for confirmed orders from delivery_orders queue...')

    // Consume messages
    await this.channel.consume('delivery_orders', async (msg: any) => {
      if (!msg) return

      try {
        const orderData: OrderMessage = JSON.parse(msg.content.toString())
        console.log('📦 [DELIVERY] Delivery received confirmed order:', orderData)

        // Process the confirmed order
        await this.processConfirmedOrder(orderData)

        // Acknowledge the message
        this.channel.ack(msg)
        console.log(`✅ [DELIVERY] Delivery processed order ${orderData.id}`)

      } catch (error) {
        console.error('❌ [DELIVERY] Failed to process delivery order:', error)
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
        console.log(`📋 [DELIVERY] Delivery already exists for order ${orderData.id}`)
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

      console.log(`🚚 [DELIVERY] Delivery created for order ${orderData.id}:`, delivery[0])

      // Optionally notify other services that delivery is available
      await this.publishDeliveryCreated(delivery[0])

    } catch (error) {
      console.error(`❌ [DELIVERY] Failed to create delivery for order ${orderData.id}:`, error)
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

      console.log(`📤 [DELIVERY] Delivery created event published for order ${delivery.order_id}`)

    } catch (error) {
      console.error('❌ [DELIVERY] Failed to publish delivery created event:', error)
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

      console.log(`📤 [DELIVERY] Delivery status update published: ${orderId} -> ${status}`)

    } catch (error) {
      console.error('❌ [DELIVERY] Failed to publish delivery status update:', error)
    }
  }

  async close() {
    try {
      if (this.channel) await this.channel.close()
      if (this.connection) await this.connection.close()
      console.log('🔌 [DELIVERY] RabbitMQ connection closed')
    } catch (error) {
      console.error('❌ [DELIVERY] Error closing RabbitMQ connection:', error)
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