import {Router} from 'express'
import { createNewRemito } from '../controllers/remitos.controllers.js'


const router= Router()

router.post('/remitos', createNewRemito)

export default router