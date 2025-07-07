import { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class DeliveriesController {
  async index({ request, response }: HttpContext) {
    const deliveries = await db
      .from('deliveries')
      .select('*')
      .where('delivery_person_id', request.user.id)

    return response.ok(deliveries)
  }

  async store({ request, response }: HttpContext) {
    const { order_id } = request.body()

    if (!order_id) {
      return response.badRequest({ error: 'Missing order_id' })
    }

    try {
      const [delivery] = await db
        .insertQuery()
        .table('deliveries')
        .insert({
          order_id,
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

  async show({ params, request, response }: HttpContext) {
    const delivery = await db
      .from('deliveries')
      .where('id', params.id)
      .andWhere('delivery_person_id', request.user.id)
      .first()

    if (!delivery) {
      return response.notFound({ error: 'Delivery not found or not assigned to you' })
    }

    return response.ok(delivery)
  }

  async update({ params, request, response }: HttpContext) {
    const { status } = request.body()
    const validStatuses = ['available', 'reserved', 'picked_up', 'delivered']

    if (!validStatuses.includes(status)) {
      return response.badRequest({ error: 'Invalid status' })
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
      updateData.delivery_person_id = request.user.id
    }

    const [updated] = await db
      .from('deliveries')
      .where('id', params.id)
      .where((qb) => {
        qb.where('delivery_person_id', request.user.id).orWhereNull('delivery_person_id')
      })
      .update(updateData)
      .returning('*')

    if (!updated) {
      return response.notFound({ error: 'Delivery not found or not accessible' })
    }

    return response.ok(updated)
  }

  async destroy({ params, response }: HttpContext) {
    const deleted = await db.from('deliveries').where('id', params.id).delete()

    return response.ok({ deleted })
  }
}
