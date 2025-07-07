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

const HealthController = () => import('#controllers/health_controller')
const DeliveriesController = () => import('#controllers/deliveries_controller')

router.get('/health', [HealthController, 'index'])

router
  .group(() => {
    router.get('/', [DeliveriesController, 'index'])
    router.post('/', [DeliveriesController, 'store']) 
    router.get('/:id', [DeliveriesController, 'show'])
    router.put('/:id', [DeliveriesController, 'update'])
    router.delete('/:id', [DeliveriesController, 'destroy'])
  })
  .prefix('/deliveries')
  .use(middleware.verifyToken())