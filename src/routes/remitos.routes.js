import {Router} from 'express'
import { crearRemito, getRemitos, getRemitoByCodigo, calculoRemito } from '../controllers/remitos.controllers.js'


const router= Router();


router.get('/remitos', getRemitos);
router.get('/remitos/:codigo', getRemitoByCodigo);

router.post('/calcularremito', calculoRemito);
router.post('/crearremito', crearRemito);

export default router;