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
const DeliveriesController = () => import('#controllers/deliveries_controller')

router
  .group(() => {
    router.get('index', [DeliveriesController, 'index']).use(middleware.verifyToken())
  })
  .prefix('/deliveries')