import { Router} from 'express'
import { loginUser } from '../controllers/usuarios.controllers.js'

const router= Router()

router.post('/login', loginUser)

export default router