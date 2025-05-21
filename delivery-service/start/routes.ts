/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// Lazy-loaded controllers
const DeliveriesController = () => import('#controllers/deliveries_controller')
const HealthController = () => import('#controllers/health_controller')

/*
|--------------------------------------------------------------------------
| Deliveries Routes
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('/available', [DeliveriesController, 'available'])
    router.patch('/:id/reserve', [DeliveriesController, 'reserve'])
    router.patch('/:id/pickup', [DeliveriesController, 'pickup'])
    router.patch('/:id/deliver', [DeliveriesController, 'deliver'])
  })
  .prefix('/deliveries')
  .use(middleware.supabaseAuth())

/*
|--------------------------------------------------------------------------
| Health Routes
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('health', [HealthController, 'check'])
  })
  .prefix('/deliveries')
