import type { HttpContext } from '@adonisjs/core/http'
import { supabase } from '#start/supabase'

export default class DeliveriesController {
  public async available({ response }: HttpContext) {
    const { data, error } = await supabase
      .from('orders')
      .select('id, status')
      .in('status', ['preparing', 'ready'])
      .eq('is_reserved', false)

    if (error) {
      return response.internalServerError({ error: error.message })
    }

    return response.ok({ availableOrders: data })
  }

  public async reserve({ params, request, response }: HttpContext) {
    const deliveryPersonId = request.user.id
    const orderId = params.id

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, is_reserved, status')
      .eq('id', orderId)
      .single()

    if (orderError || !order || order.is_reserved) {
      return response.badRequest({ error: 'Order is already reserved or not found.' })
    }

    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .insert({
        order_id: orderId,
        delivery_person_id: deliveryPersonId,
        status: 'reserved',
        reserved_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (deliveryError) {
      return response.internalServerError({ error: 'Failed to create delivery.' })
    }

    await supabase.from('orders').update({ is_reserved: true }).eq('id', orderId)

    return response.ok({ delivery })
  }

  public async pickup({ params, request, response }: HttpContext) {
    const deliveryPersonId = request.user.id
    const orderId = params.id

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single()

    if (orderError || !order || order.status !== 'ready') {
      return response.badRequest({ error: 'Order not ready for pickup.' })
    }

    const { data, error } = await supabase
      .from('deliveries')
      .update({
        status: 'picked_up',
        picked_up_at: new Date().toISOString(),
      })
      .eq('order_id', orderId)
      .eq('delivery_person_id', deliveryPersonId)
      .eq('status', 'reserved')
      .select()
      .single()

    if (error || !data) {
      return response.badRequest({ error: 'Pickup failed. Check status or reservation.' })
    }

    return response.ok({ delivery: data })
  }

  public async deliver({ params, request, response }: HttpContext) {
    const deliveryPersonId = request.user.id
    const orderId = params.id

    const { data, error } = await supabase
      .from('deliveries')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
      })
      .eq('order_id', orderId)
      .eq('delivery_person_id', deliveryPersonId)
      .eq('status', 'picked_up')
      .select()
      .single()

    if (error || !data) {
      return response.badRequest({ error: 'Delivery failed. Must be picked up first.' })
    }

    return response.ok({ delivery: data })
  }
}
