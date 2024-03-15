import { getConnectionDATO } from "../database/connection.js"
import  http2 from 'http2'


export  const calculoRemito = async (req,res)=> {
    let pool;
    let sub_total = 0;
    let imp_resp = 0;
    let imp_total = 0;
    let preuni = 0;
    let prevta = 0;
    let art_sub_total= 0;
    let impuesto=0;
    let x=0;
    
    const {
        SUB_TOTAL,          // suma de los subtotales de las lineas de detalle - se puede calcular en la api
        IMP_RESP,           // suma de los IMP_REST del detalle, se puede calcular.
        IMP_TOTAL,          // sub_total + imp_resp
        ARTICULOS:[
            DET_COD_ARTICULO,   // codigo de articulo
            DET_NROREP,         // sale de la tabla de articulo, mismo nombre de campo en tabla articulo, en la propuesta comercial dice que va valor fijo "1"
            DET_MARCA,          // sale de la tabla de articulo, mismo nombre de campo en tabla articulo, en la propuesta comercial dice que va valor fijo "1"
            DET_CANTIDAD,       // cantidad de unidades del articulo
            DET_DESCRIPCION,    // descripcion del articulo
            DET_PREUNI,         // precio unitario, sale de la tabla de articulo, mismo nombre de campo
            DET_PREVTA,         // en la propuesta indica que enviemos null.  el calculo debiera ser algo asi: PREUNI % ALIC/100+1
            DET_SUB_TOTAL,      // en la propuesta dice PREUNI*CANTIDAD, pero segun los datos que hay ne las tablas el calculo que esta haciendo es pvta * cantidad
            DET_ALIC,           // alicuota del articulo
            DET_IMP_RESP,       // SUB_TOTAL * ALIC
            DET_IMP_TOTAL      // SUB_TOTAL + IMP_RESP
        ]
    } = req.body;


    try{
        pool  = await getConnectionDATO();

        // recorro todos los articulos del array.
        for(x in req.body.ARTICULOS){
            preuni = 0;
            prevta = 0;
            art_sub_total= 0;
            impuesto=0;

            console.log(x);
            console.log(req.body.ARTICULOS[x].DET_COD_ARTICULO);
            const result = await pool.request()
                                     .input("Codigo", req.body.ARTICULOS[x].DET_COD_ARTICULO)
                                     .query("SELECT * from STARTICULO WHERE COD_ARTICULO = @Codigo");
        
            
            // preuni viene con impuesto incluido de la bbdd
            preuni = result.recordset[0].PREUNI;

            // prevta  = preuni / 1.21 en caso que la alicuota sea 21% (le quito el iva)
            prevta = Number((result.recordset[0].PREUNI / ((result.recordset[0].ALIC/100) + 1)).toFixed(2));
            
            //sub_total = prevta *cantidad 
            art_sub_total =  Number((prevta * req.body.ARTICULOS[x].DET_CANTIDAD).toFixed(2));

            // calculo la parte del precio que sea IVA. (precio con iva - precio sin iva)
            impuesto = Number((preuni - prevta).toFixed(2));

            req.body.ARTICULOS[x].DET_NROREP = result.recordset[0].NROREP;
            req.body.ARTICULOS[x].DET_DESCRIPCION = result.recordset[0].DESCRIP_CORTA;
            req.body.ARTICULOS[x].DET_MARCA = result.recordset[0].MARCA;

            
            req.body.ARTICULOS[x].DET_PREUNI = preuni;
            req.body.ARTICULOS[x].DET_PREVTA = prevta;
            req.body.ARTICULOS[x].DET_SUB_TOTAL = art_sub_total;
            req.body.ARTICULOS[x].DET_ALIC = result.recordset[0].ALIC;
            
            req.body.ARTICULOS[x].DET_IMP_RESP =  Number((impuesto *
                                                  req.body.ARTICULOS[x].DET_CANTIDAD).toFixed(2)); 

            req.body.ARTICULOS[x].DET_IMP_TOTAL = req.body.ARTICULOS[x].DET_SUB_TOTAL +
                                                  req.body.ARTICULOS[x].DET_IMP_RESP;
            
            sub_total = req.body.ARTICULOS[x].DET_SUB_TOTAL + sub_total;
            imp_resp  = req.body.ARTICULOS[x].DET_IMP_RESP  + imp_resp;
            imp_total = req.body.ARTICULOS[x].DET_IMP_TOTAL + imp_total;
        }
        
        req.body.SUB_TOTAL = sub_total;
        req.body.IMP_RESP  = imp_resp;
        req.body.IMP_TOTAL = imp_total;
        
        console.log("calculoRemito");
        res.status(http2.constants.HTTP_STATUS_OK)
           .json(req.body);
    }
    catch(Exception ){
        res.status(http2.constants.HTTP_STATUS_INTERNAL_SERVER_ERROR)
            .json("Error al Calcular Importes de Remito.");
    }

}


export const crearRemito = async(req,res)=> {

    let pool; 
    let x = 0;

    // variables fijas en el insert
    let organizacion = 1;
    let pref  = 8;
    let remito = 1;
    let cod_vend = 1;
    let observa = ".";
    let estado = "R";
    let fecha, aud_fec, aud_hor, aud_usr = null;
    let tipo_remito = "VE";
    let destino = "DEP";
    let lista = 1;
    let det_fecmov = null;
    let det_cantidev =0;
    let det_nroped = 0;
    let det_faccon = 1;
    let det_unimed = "Uni";
     let det_stock = "Sí";

    // ESTRUCTURA QUE ESPERA RECIBIR EN EL JSON DESDE EL FRONT. los valores fijos o nulos no vienen informados del front.
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
        ARTICULOS:[
            DET_ORGANIZACION,   // "1"
            DET_PREF,           // "8"
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

        fecha = 20240101;
        aud_fec= 20240101;
        aud_hor=110000;
        aud_usr="MIGUEL";

        req.body.ORGANIZACION = organizacion;       // "1"
        req.body.PREF = pref;               // "8"
        req.body.REMITO = remito;            //numero de remito secuencial d
        req.body.COD_VEND = cod_vend;           // "1"
        req.body.OBSERVA = observa;            // "."
        req.body.ESTADO = estado;             // "R" (estado remitado)
        req.body.FECHA  =  fecha;             // today -> yyyymmdd es un integer en la bbdd
        req.body.AUD_FEC=aud_fec;            // today-> yyyymmdd es un integer en la bbdd
        req.body.AUD_HOR= aud_hor ;           // now ->hhmmss es un integer en la bbdd 
        req.body.AUD_USR= aud_usr ;           // nombre de usuario de creacion de remito
        req.body.TIPO_REMITO = tipo_remito;       // "VE"
        req.body.DESTINO =destino;            // "DEP"
        req.body.CODBARRA = null;           // null
        req.body.COD_ARTICULO= null;       //null
        req.body.NROREP= null;             //null
        req.body.MARCA= null;              // null
        req.body.DESCRIPCION= null;        // null
        req.body.CANTIDAD= null;           // null
        req.body.PREUNI= null;             // null
        req.body.ALIC= null;               // null
        req.body.ALICE= null;              // null
        req.body.RUBSTK= null;             // null
        req.body.LISTA = lista;              // "1"
        req.body.COD_CLIENTE = 1904;
    
        for (x  in req.body.ARTICULOS){
            req.body.ARTICULOS[x].DET_ORGANIZACION= organizacion;  // "1"
            req.body.ARTICULOS[x].DET_PREF=      pref;     // "8"
            req.body.ARTICULOS[x].DET_REMITO=    remito;     // codigo de remito de cabecera
            req.body.ARTICULOS[x].DET_FECMOV=    det_fecmov;     // fecha de remito yyyymmdd es un integer en la bbdd
            req.body.ARTICULOS[x]. DET_CANTIDEV= det_cantidev;      // "0"
            req.body.ARTICULOS[x].DET_OBSERVA=  null;      // null
            req.body.ARTICULOS[x].DET_ESTADO=   estado;      // "R" - remitado
            req.body.ARTICULOS[x].DET_FACTURA=  null;      // null 
            req.body.ARTICULOS[x].DET_AUD_FEC=  aud_fec      // today con formato yyymmdd
            req.body.ARTICULOS[x].DET_AUD_HOR=  aud_hor      // now con formato hhmmss
            req.body.ARTICULOS[x].DET_AUD_USR=  aud_usr;      // nombre de usuario
            req.body.ARTICULOS[x].DET_NROPED=   det_nroped;      // "0"
            req.body.ARTICULOS[x].DET_FACCON=   det_faccon;      // "1"
            req.body.ARTICULOS[x].ET_UNIMED=   det_unimed;      // "Uni"
            req.body.ARTICULOS[x].DET_TIPO_REMITO=  tipo_remito  // "VE"
            req.body.ARTICULOS[x].DET_STOCK= det_stock;           // "Sí"

            // ARMO DATOS PARA EL INSERT
            const datosInsert = {
                ORGANIZACION: organizacion,
                PREF: pref,
                REMITO: remito,
                COD_CLIENTE: req.body.COD_CLIENTE,
                COD_ARTICULO: req.body.ARTICULOS[x].DET_COD_ARTICULO,
                NROREP: req.body.ARTICULOS[x].DET_NROREP,
                MARCA: req.body.ARTICULOS[x].DET_MARCA,
                FECMOV: det_fecmov,
                CANTIDAD: req.body.ARTICULOS[x].DET_CANTIDAD,
                DESCRIPCION: req.body.ARTICULOS[x].DET_DESCRIPCION,
                CANTIDEV: det_cantidev,
                PREUNI: req.body.ARTICULOS[x].DET_PREUNI,
                PREVTA: req.body.ARTICULOS[x].DET_PREVTA,
                SUB_TOTAL: req.body.ARTICULOS[x].DET_SUB_TOTAL,
                ALIC: req.body.ARTICULOS[x].DET_ALIC,
                IMP_RESP: req.body.ARTICULOS[x].DET_IMP_RESP,
                IMP_TOTAL: req.body.ARTICULOS[x].DET_IMP_TOTAL,
                OBSERVA: null,
                ESTADO: estado,
                FACTURA: null,
                AUD_FEC: aud_fec,
                AUD_HOR: aud_hor,
                AUD_USR: aud_usr,
                NROPED: det_nroped,
                FACCON: det_faccon,
                UNIMED: det_unimed,
                TIPO_REMITO: tipo,
                STOCK: det_stock
              };

            // ARMO INSERT            
            const consultaInsert = `INSERT INTO DCORDATO.dbo.XTREMITOSDET
                            (ORGANIZACION, PREF, REMITO, COD_CLIENTE, COD_ARTICULO, NROREP, MARCA, FECMOV, CANTIDAD, DESCRIPCION, CANTIDEV, PREUNI, PREVTA, SUB_TOTAL, ALIC, IMP_RESP, IMP_TOTAL, OBSERVA, ESTADO, FACTURA, AUD_FEC, AUD_HOR, AUD_USR, NROPED, FACCON, UNIMED, TIPO_REMITO, STOCK)
                            VALUES(
                            @ORGANIZACION, @PREF, @REMITO, @COD_CLIENTE, @COD_ARTICULO, @NROREP, @MARCA, @FECMOV, @CANTIDAD, @DESCRIPCION, @CANTIDEV, @PREUNI, @PREVTA, @SUB_TOTAL, @ALIC, @IMP_RESP, @IMP_TOTAL, @OBSERVA, @ESTADO, @FACTURA, @AUD_FEC, @AUD_HOR, @AUD_USR, @NROPED, @FACCON, @UNIMED, @TIPO_REMITO, @STOCK
                            );`;

            // Ejecuto la consulta de insert de registros de detalle
            const result = await sql.query(consultaInsert, datosInsert);
            console.log('Datos insertados correctamente:', result);
                    
        }
        
        // una vez que grabe todas las líneas del remito, procedo a insertar la cabecera
        // INSERT INTO...I
        console.log(req.body);
        res.status(http2.constants.HTTP_STATUS_OK)
        .json(req.body);
    }
    catch(Exception ){
        res.status(http2.constants.HTTP_STATUS_INTERNAL_SERVER_ERROR)
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