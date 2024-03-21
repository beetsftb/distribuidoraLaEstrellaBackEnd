import {Router} from 'express'
import { crearRemito, getRemitos, getRemitoByNumero, calculoRemito } from '../controllers/remitos.controllers.js'


const router= Router();


router.get('/remitos', getRemitos);
router.get('/remitos/:numero', getRemitoByNumero);

router.post('/calcularremito', calculoRemito);
router.post('/crearremito', crearRemito);

export default router;