import { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import env from '#start/env'
import axios from 'axios'

export default class DeliveriesController {
  async index({ request, response, logger }: HttpContext) {
    try {
      const authServiceUrl = env.get('AUTH_SERVICE_URL')
      const token = request.header('Authorization')
      
      const { data } = await axios.get(`${authServiceUrl}/me`, {
        headers: { Authorization: token },
      })

      const user = data.user
      logger.info(`[DELIVERIES] User role: ${user.role}, ID: ${user.id}`)

      let deliveries

      if (user.role === 'client') {
        deliveries = await db
          .from('deliveries')
          .select('*')
          .where('client_id', user.id)
          .orderBy('created_at', 'desc')

      } else if (user.role === 'delivery') {
        deliveries = await db
          .from('deliveries')
          .select('*')
          .where((qb) => {
            qb.whereNull('delivery_person_id')
              .andWhere('status', 'available')
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

      return response.ok(deliveries)

    } catch (error: any) {
      logger.error('[DELIVERIES] Error fetching user info or deliveries:', error.message)
      return response.unauthorized({ error: 'Failed to verify user permissions' })
    }
  }

  async store({ request, response, logger }: HttpContext) {
    const { order_id, client_id } = request.body()

    if (!order_id) {
      return response.badRequest({ error: 'Missing order_id' })
    }

    let finalClientId = client_id

    if (!finalClientId) {
      try {
        const authServiceUrl = env.get('AUTH_SERVICE_URL')
        const token = request.header('Authorization')
        
        const { data } = await axios.get(`${authServiceUrl}/me`, {
          headers: { Authorization: token },
        })

        const user = data.user

        if (user.role === 'client') {
          finalClientId = user.id
        } else {
          return response.badRequest({ error: 'client_id required for non-client users' })
        }
      } catch (error: any) {
        logger.error('[DELIVERIES] Error fetching user info:', error.message)
        return response.badRequest({ error: 'Missing client_id and failed to get user info' })
      }
    }

    try {
      const [delivery] = await db
        .insertQuery()
        .table('deliveries')
        .insert({
          order_id,
          client_id: finalClientId,
          status: 'available',
        })
        .returning('*')

      return response.created(delivery)
    } catch (err: any) {
      return response.badRequest({
        error: 'Could not create delivery',
        details: err.detail ?? err.message,
      })
    }
  }

  async show({ params, request, response, logger }: HttpContext) {
    try {
      const authServiceUrl = env.get('AUTH_SERVICE_URL')
      const token = request.header('Authorization')
      
      const { data } = await axios.get(`${authServiceUrl}/me`, {
        headers: { Authorization: token },
      })

      const user = data.user

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
      logger.error('[DELIVERIES] Error fetching user info:', error.message)
      return response.unauthorized({ error: 'Failed to verify user permissions' })
    }
  }

  async update({ params, request, response, logger }: HttpContext) {
    const { status } = request.body()
    const validStatuses = ['available', 'reserved', 'picked_up', 'delivered']

    if (!validStatuses.includes(status)) {
      return response.badRequest({ error: 'Invalid status' })
    }

    try {
      const authServiceUrl = env.get('AUTH_SERVICE_URL')
      const token = request.header('Authorization')
      
      const { data } = await axios.get(`${authServiceUrl}/me`, {
        headers: { Authorization: token },
      })

      const user = data.user

      if (user.role !== 'delivery' && user.role !== 'admin') {
        return response.forbidden({ error: 'Only delivery persons can update delivery status' })
      }

      const timestamps: Record<string, string> = {
        reserved: 'reserved_at',
        picked_up: 'picked_up_at',
        delivered: 'delivered_at',
      }

      const updateData: Record<string, any> = { status }

      if (status in timestamps) {
        updateData[timestamps[status]] = new Date()
      }

      if (status === 'reserved') {
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

      const [updated] = await query
        .update(updateData)
        .returning('*')

      if (!updated) {
        return response.notFound({ error: 'Delivery not found or not accessible' })
      }

      return response.ok(updated)

    } catch (error: any) {
      logger.error('[DELIVERIES] Error fetching user info:', error.message)
      return response.unauthorized({ error: 'Failed to verify user permissions' })
    }
  }

  async destroy({ params, request, response, logger }: HttpContext) {
    try {
      const authServiceUrl = env.get('AUTH_SERVICE_URL')
      const token = request.header('Authorization')
      
      const { data } = await axios.get(`${authServiceUrl}/me`, {
        headers: { Authorization: token },
      })

      const user = data.user

      if (user.role !== 'admin') {
        return response.forbidden({ error: 'Only admins can delete deliveries' })
      }

      const deleted = await db.from('deliveries').where('id', params.id).delete()

      return response.ok({ deleted })

    } catch (error: any) {
      logger.error('[DELIVERIES] Error fetching user info:', error.message)
      return response.unauthorized({ error: 'Failed to verify user permissions' })
    }
  }
}