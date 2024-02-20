import {Router} from 'express'
import { getArticulos, getArticuloByCodigo } from '../controllers/articulos.controllers.js'

const router= Router()

router.get('/articulos', getArticulos);

router.get('/articulos/:codigo', getArticuloByCodigo);

export default router