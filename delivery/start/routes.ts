import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const HealthController = () => import('#controllers/health_controller')
const DeliveriesController = () => import('#controllers/deliveries_controller')

router.get('/health', [HealthController, 'index'])

router
  .group(() => {
    // Get deliveries (filtered by role)
    router.get('/', [DeliveriesController, 'index'])
    
    // Create delivery (admin/system use)
    router.post('/', [DeliveriesController, 'store']) 
    
    // Get specific delivery
    router.get('/:id', [DeliveriesController, 'show'])
    
    // General update (admin use)
    router.put('/:id', [DeliveriesController, 'update'])
    
    // Delete delivery (admin use)
    router.delete('/:id', [DeliveriesController, 'destroy'])
    
    // Delivery person specific actions
    router.post('/:id/accept', [DeliveriesController, 'acceptDelivery'])
    router.post('/:id/start', [DeliveriesController, 'startDelivery'])
    router.post('/:id/complete', [DeliveriesController, 'completeDelivery'])
  })
  .prefix('/deliveries')
  .use(middleware.verifyToken())