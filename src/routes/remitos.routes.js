import {Router} from 'express'
import { crearRemito, getRemitos, getRemitoByCodigo } from '../controllers/remitos.controllers.js'


const router= Router()

router.post('/remitos', crearRemito)
router.get('/remitos', getRemitos)
router.get('/remitos/:codigo', getRemitoByCodigo)

export default router