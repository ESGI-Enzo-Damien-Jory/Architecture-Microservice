// delivery/app/controllers/deliveries_controller.ts
import { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { rabbitmqService } from '#services/rabbitmq_service'

export default class DeliveriesController {
  async index({ request, response, logger }: HttpContext) {
    try {
      const user = request.user
      
      if (!user) {
        logger.error('[DELIVERIES] No user found in request')
        return response.unauthorized({ error: 'User not authenticated' })
      }

      logger.info(`[DELIVERIES] User role: ${user.role}, ID: ${user.id}`)

      let deliveries

      if (user.role === 'client') {
        deliveries = await db
          .from('deliveries')
          .select('*')
          .where('client_id', user.id)
          .orderBy('created_at', 'desc')

      } else if (user.role === 'delivery') {
        // Show available deliveries + assigned deliveries
        deliveries = await db
          .from('deliveries')
          .select('*')
          .where((qb) => {
            qb.where('status', 'available')
              .orWhere('delivery_person_id', user.id)
          })
          .orderBy('created_at', 'desc')

      } else if (user.role === 'admin') {
        deliveries = await db
          .from('deliveries')
          .select('*')
          .orderBy('created_at', 'desc')

      } else {
        return response.forbidden({ error: 'Unauthorized role for delivery access' })
      }

      return response.ok({ deliveries, count: deliveries.length })

    } catch (error: any) {
      logger.error('[DELIVERIES] Error fetching deliveries:', error)
      return response.status(500).json({ error: 'Internal server error' })
    }
  }

  // Accept delivery (delivery person claims an available delivery)
  async acceptDelivery({ params, request, response, logger }: HttpContext) {
    try {
      const user = request.user
      
      if (!user) {
        logger.error('[DELIVERIES] No user found in request')
        return response.unauthorized({ error: 'User not authenticated' })
      }

      if (user.role !== 'delivery') {
        return response.forbidden({ error: 'Only delivery persons can accept deliveries' })
      }

      logger.info(`[DELIVERIES] Attempting to accept delivery ${params.id} for user ${user.id}`)

      // First, check if delivery exists and is available
      const existingDelivery = await db
        .from('deliveries')
        .where('id', params.id)
        .first()

      if (!existingDelivery) {
        logger.warn(`[DELIVERIES] Delivery ${params.id} not found`)
        return response.notFound({ error: 'Delivery not found' })
      }

      if (existingDelivery.status !== 'available') {
        logger.warn(`[DELIVERIES] Delivery ${params.id} is not available (status: ${existingDelivery.status})`)
        return response.badRequest({ error: 'Delivery is not available for acceptance' })
      }

      if (existingDelivery.delivery_person_id) {
        logger.warn(`[DELIVERIES] Delivery ${params.id} already assigned to ${existingDelivery.delivery_person_id}`)
        return response.badRequest({ error: 'Delivery is already assigned' })
      }

      // Now update the delivery
      const affectedRows = await db
        .from('deliveries')
        .where('id', params.id)
        .where('status', 'available')
        .whereNull('delivery_person_id')
        .update({
          status: 'reserved',
          delivery_person_id: user.id,
          reserved_at: new Date(),
          updated_at: new Date()
        })

      if (!affectedRows || (Array.isArray(affectedRows) ? affectedRows.length === 0 : affectedRows === 0)) {
        logger.warn(`[DELIVERIES] No rows updated for delivery ${params.id}`)
        return response.badRequest({ error: 'Delivery could not be accepted - it may have been claimed by another delivery person' })
      }
      

      // Fetch the updated delivery
      const updatedDelivery = await db
        .from('deliveries')
        .where('id', params.id)
        .first()

      // Publish delivery acceptance event
      await rabbitmqService.publishDeliveryStatusUpdate(
        updatedDelivery.id,
        updatedDelivery.order_id,
        'reserved'
      )

      logger.info(`[DELIVERIES] Delivery ${params.id} accepted by delivery person ${user.id}`)

      return response.ok({ 
        message: 'Delivery accepted successfully',
        delivery: updatedDelivery 
      })

    } catch (error: any) {
      logger.error('[DELIVERIES] Error accepting delivery:', error)
      return response.status(500).json({ error: 'Internal server error', details: error.message })
    }
  }

  // Start delivery (delivery person starts delivering)
  async startDelivery({ params, request, response, logger }: HttpContext) {
    try {
      const user = request.user
      
      if (!user) {
        return response.unauthorized({ error: 'User not authenticated' })
      }

      if (user.role !== 'delivery') {
        return response.forbidden({ error: 'Only delivery persons can start deliveries' })
      }

      logger.info(`[DELIVERIES] Attempting to start delivery ${params.id} for user ${user.id}`)

      // Check if delivery exists and is reserved by this user
      const existingDelivery = await db
        .from('deliveries')
        .where('id', params.id)
        .where('delivery_person_id', user.id)
        .first()

      if (!existingDelivery) {
        return response.notFound({ error: 'Delivery not found or not assigned to you' })
      }

      if (existingDelivery.status !== 'reserved') {
        return response.badRequest({ error: `Delivery cannot be started from status: ${existingDelivery.status}` })
      }

      const affectedRows = await db
        .from('deliveries')
        .where('id', params.id)
        .where('delivery_person_id', user.id)
        .where('status', 'reserved')
        .update({
          status: 'picked_up',
          picked_up_at: new Date(),
          updated_at: new Date()
        })

      if (!affectedRows || affectedRows.length === 0) {
        return response.badRequest({ error: 'Delivery could not be started' })
      }

      const updatedDelivery = await db
        .from('deliveries')
        .where('id', params.id)
        .first()

      // Publish delivery start event
      await rabbitmqService.publishDeliveryStatusUpdate(
        updatedDelivery.id,
        updatedDelivery.order_id,
        'picked_up'
      )

      logger.info(`[DELIVERIES] Delivery ${params.id} started by delivery person ${user.id}`)

      return response.ok({ 
        message: 'Delivery started successfully',
        delivery: updatedDelivery 
      })

    } catch (error: any) {
      logger.error('[DELIVERIES] Error starting delivery:', error)
      return response.status(500).json({ error: 'Internal server error', details: error.message })
    }
  }

  // Complete delivery (delivery person completes delivery)
  async completeDelivery({ params, request, response, logger }: HttpContext) {
    try {
      const user = request.user
      
      if (!user) {
        return response.unauthorized({ error: 'User not authenticated' })
      }

      if (user.role !== 'delivery') {
        return response.forbidden({ error: 'Only delivery persons can complete deliveries' })
      }

      logger.info(`[DELIVERIES] Attempting to complete delivery ${params.id} for user ${user.id}`)

      // Check if delivery exists and is picked up by this user
      const existingDelivery = await db
        .from('deliveries')
        .where('id', params.id)
        .where('delivery_person_id', user.id)
        .first()

      if (!existingDelivery) {
        return response.notFound({ error: 'Delivery not found or not assigned to you' })
      }

      if (existingDelivery.status !== 'picked_up') {
        return response.badRequest({ error: `Delivery cannot be completed from status: ${existingDelivery.status}` })
      }

      const affectedRows = await db
        .from('deliveries')
        .where('id', params.id)
        .where('delivery_person_id', user.id)
        .where('status', 'picked_up')
        .update({
          status: 'delivered',
          delivered_at: new Date(),
          updated_at: new Date()
        })

      if (!affectedRows || affectedRows.length === 0) {
        return response.badRequest({ error: 'Delivery could not be completed' })
      }

      const updatedDelivery = await db
        .from('deliveries')
        .where('id', params.id)
        .first()

      // Publish delivery completion event
      await rabbitmqService.publishDeliveryStatusUpdate(
        updatedDelivery.id,
        updatedDelivery.order_id,
        'delivered'
      )

      logger.info(`[DELIVERIES] Delivery ${params.id} completed by delivery person ${user.id}`)

      return response.ok({ 
        message: 'Delivery completed successfully',
        delivery: updatedDelivery 
      })

    } catch (error: any) {
      logger.error('[DELIVERIES] Error completing delivery:', error)
      return response.status(500).json({ error: 'Internal server error', details: error.message })
    }
  }
  
  async store({ request, response, logger }: HttpContext) {
    const { order_id, client_id } = request.body()

    if (!order_id) {
      return response.badRequest({ error: 'Missing order_id' })
    }

    let finalClientId = client_id

    if (!finalClientId) {
      const user = request.user
      
      if (!user) {
        return response.unauthorized({ error: 'User not authenticated' })
      }

      if (user.role === 'client') {
        finalClientId = user.id
      } else {
        return response.badRequest({ error: 'client_id required for non-client users' })
      }
    }

    try {
      const [delivery] = await db
        .table('deliveries')
        .insert({
          order_id,
          client_id: finalClientId,
          status: 'available',
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning('*')

      // Publish delivery created event
      await rabbitmqService.publishDeliveryCreated(delivery)

      logger.info(`[DELIVERIES] Delivery created: ${delivery.id} for order ${order_id}`)

      return response.created(delivery)
    } catch (err: any) {
      logger.error('[DELIVERIES] Error creating delivery:', err)
      return response.badRequest({
        error: 'Could not create delivery',
        details: err.detail ?? err.message,
      })
    }
  }

  async show({ params, request, response, logger }: HttpContext) {
    try {
      const user = request.user
      
      if (!user) {
        return response.unauthorized({ error: 'User not authenticated' })
      }

      let query = db.from('deliveries').where('id', params.id)

      if (user.role === 'client') {
        query = query.andWhere('client_id', user.id)
      } else if (user.role === 'delivery') {
        query = query.andWhere((qb) => {
          qb.whereNull('delivery_person_id')
            .orWhere('delivery_person_id', user.id)
        })
      }

      const delivery = await query.first()

      if (!delivery) {
        return response.notFound({ error: 'Delivery not found or not accessible' })
      }

      return response.ok(delivery)

    } catch (error: any) {
      logger.error('[DELIVERIES] Error fetching delivery:', error)
      return response.status(500).json({ error: 'Internal server error' })
    }
  }

  async update({ params, request, response, logger }: HttpContext) {
    const { status } = request.body()
    const validStatuses = ['available', 'reserved', 'picked_up', 'delivered']

    if (!validStatuses.includes(status)) {
      return response.badRequest({ error: 'Invalid status' })
    }

    try {
      const user = request.user
      
      if (!user) {
        return response.unauthorized({ error: 'User not authenticated' })
      }

      if (user.role !== 'delivery' && user.role !== 'admin') {
        return response.forbidden({ error: 'Only delivery persons can update delivery status' })
      }

      const timestamps: Record<string, string> = {
        reserved: 'reserved_at',
        picked_up: 'picked_up_at',
        delivered: 'delivered_at',
      }

      const updateData: Record<string, any> = { 
        status,
        updated_at: new Date()
      }

      if (status in timestamps) {
        updateData[timestamps[status]] = new Date()
      }

      if (status === 'reserved' && user.role === 'delivery') {
        updateData.delivery_person_id = user.id
      }

      let query = db
        .from('deliveries')
        .where('id', params.id)

      if (user.role === 'delivery') {
        query = query.where((qb) => {
          qb.where('delivery_person_id', user.id)
            .orWhereNull('delivery_person_id')
        })
      }

      const affectedRows = await query.update(updateData)

      if (!affectedRows || affectedRows.length === 0) {
        return response.notFound({ error: 'Delivery not found or not accessible' })
      }

      const updated = await db
        .from('deliveries')
        .where('id', params.id)
        .first()

      // Publish delivery status update event
      await rabbitmqService.publishDeliveryStatusUpdate(
        updated.id,
        updated.order_id,
        status
      )

      logger.info(`[DELIVERIES] Delivery ${updated.id} status updated to ${status} by user ${user.id}`)

      return response.ok(updated)

    } catch (error: any) {
      logger.error('[DELIVERIES] Error updating delivery:', error)
      return response.status(500).json({ error: 'Internal server error', details: error.message })
    }
  }

  async destroy({ params, request, response, logger }: HttpContext) {
    try {
      const user = request.user
      
      if (!user) {
        return response.unauthorized({ error: 'User not authenticated' })
      }

      if (user.role !== 'admin') {
        return response.forbidden({ error: 'Only admins can delete deliveries' })
      }

      const deleted = await db.from('deliveries').where('id', params.id).delete()

      return response.ok({ deleted })

    } catch (error: any) {
      logger.error('[DELIVERIES] Error deleting delivery:', error)
      return response.status(500).json({ error: 'Internal server error' })
    }
  }
}