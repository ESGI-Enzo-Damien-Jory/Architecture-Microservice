/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import DeliveriesController from '#controllers/deliveries_controller'
import { middleware } from '#start/kernel'

router
  .group(() => {
    router.get('/available', [DeliveriesController, 'available'])
    router.patch('/:id/reserve', [DeliveriesController, 'reserve'])
    router.patch('/:id/pickup', [DeliveriesController, 'pickup'])
    router.patch('/:id/deliver', [DeliveriesController, 'deliver'])
  })
  .prefix('/deliveries')
  .use(middleware.supabaseAuth())
