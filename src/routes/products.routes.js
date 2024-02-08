import {Router} from 'express'
import { getProducts } from '../controllers/products.controllers'

const router= Router()

router.get('/products', getProducts)

router.get('/productId',)

export default router