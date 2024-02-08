import {Router} from 'express'
import { getClients } from '../controllers/clients.controllers'

const router= Router()

router.get('/clients', getClients)

router.get('/clientId',)

export default router