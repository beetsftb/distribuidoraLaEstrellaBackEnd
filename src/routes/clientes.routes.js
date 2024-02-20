import {Router} from 'express'
import { getClientes, getClienteByCodigo } from '../controllers/clientes.controllers.js'

const router= Router()

router.get('/clientes', getClientes)

router.get('/clientes/:codigo', getClienteByCodigo)

export default router