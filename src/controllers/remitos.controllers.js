import { getConnectionDATO } from "../database/connection.js"
import  http2 from 'http2'

export const crearRemito =(req,res)=> {

    let pool; 

    // ESTRUCTURA QUE ESPERA RECIBIR EN EL JSON DESDE EL FRONT.
    // Es un objeto que tiene los datos de cabecera del remito y un array llamado DETALLE con las líneas de articulos del remito.
 
    const {
        ORGANIZACION,       // "1"
        PREF,               // "8"
        REMITO,             //numero de remito secuencial d
        COD_CLIENTE,        //codigo de cliente
        COD_VEND,           // "1"
        OBSERVA,            // "."
        ESTADO,             // "R" (estado remitado)
        FECHA,              // today -> yyyymmdd es un integer en la bbdd
        SUB_TOTAL,          // suma de los subtotales de las lineas de detalle - se puede calcular en la api
        IMP_RESP,           // suma de los IMP_REST del detalle, se puede calcular.
        IMP_TOTAL,          // sub_total + imp_resp
        AUD_FEC,            // today-> yyyymmdd es un integer en la bbdd
        AUD_HOR,            // now ->hhmmss es un integer en la bbdd 
        AUD_USR,            // nombre de usuario de creacion de remito
        TIPO_REMITO,        // "VE"
        DESTINO,            // "DEP"
        CODBARRA,           // null
        COD_ARTICULO,       //null
        NROREP,             //null
        MARCA,              // null
        DESCRIPCION,        // null
        CANTIDAD,           // null
        PREUNI,             // null
        ALIC,               // null
        ALICE,              // null
        RUBSTK,             // null
        LISTA,              // "1"
        DETALLE:[
            DET_ORGANIZACION,   // "1"
            DET_PREF,           // "1"
            DET_REMITO,         // codigo de remito de cabecera
            DET_COD_CLIENTE,    // codigo de cliente de cabecera
            DET_COD_ARTICULO,   // codigo de articulo
            DET_NROREP,         // sale de la tabla de articulo, mismo nombre de campo en tabla articulo, en la propuesta comercial dice que va valor fijo "1"
            DET_MARCA,          // sale de la tabla de articulo, mismo nombre de campo en tabla articulo, en la propuesta comercial dice que va valor fijo "1"
            DET_FECMOV,         // fecha de remito yyyymmdd es un integer en la bbdd
            DET_CANTIDAD,       // cantidad de unidades del articulo
            DET_DESCRIPCION,    // descripcion del articulo
            DET_CANTIDEV,       // "0"
            DET_PREUNI,         // precio unitario, sale de la tabla de articulo, mismo nombre de campo
            DET_PREVTA,         // en la propuesta indica que enviemos null.  el calculo debiera ser algo asi: PREUNI % ALIC/100+1
            DET_SUB_TOTAL,      // en la propuesta dice PREUNI*CANTIDAD, pero segun los datos que hay ne las tablas el calculo que esta haciendo es pvta * cantidad
            DET_ALIC,           // alicuota del articulo
            DET_IMP_RESP,       // SUB_TOTAL * ALIC
            DET_IMP_TOTAL,      // SUB_TOTAL + IMP_RESP
            DET_OBSERVA,        // null
            DET_ESTADO,         // "R" - remitado
            DET_FACTURA,        // null 
            DET_AUD_FEC,        // today con formato yyymmdd
            DET_AUD_HOR,        // now con formato hhmmss
            DET_AUD_USR,        // nombre de usuario
            DET_NROPED,         // "0"
            DET_FACCON,         // "1"
            DET_UNIMED,         // "Uni"
            DET_TIPO_REMITO,    // "VE"
            DET_STOCK           // "Sí"
         ]
    } = req.body

    try{
        // recorro las lineas del objeto y grabo las lineas del remito
        let cab_sub_total = 0;
        let cab_imp_resp = 0;
        for (x  in req.body.DETALLE){
            // mientras recorro las líneas voy acumulando para grabar los subtotales en la cabecera
            cab_sub_total = req.body.DETALLE[x].DET_SUB_TOTAL + cab_sub_total;
            cab_imp_resp = req.body.DETALLE[x].IMP_RESP + cab_imp_resp;

            //INSERT de los registros de detalle

        }
        
        // una vez que grabe todas las líneas del remito, procedo a insertar la cabecera
        // INSERT INTO...I
    }
    catch(Exception ){
        res.status(httpConstants.HTTP_STATUS_INTERNAL_SERVER_ERROR)
            .json("Error Interno al grabar Remito.");
    }
}

export const getRemitos = (req,res)=>{
    console.log("GetRemitos");
    res.json('get remitos');
}

export const getRemitoByCodigo = (req,res)=>{
    console.log("GetRemitobyCodigo");
    res.json('get remito by codigo');
}