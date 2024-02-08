import {Router} from 'express'
import { createNewRemito } from '../controllers/remitos.controllers'


const router= Router()

router.post('/remitos', createNewRemito)

export default router