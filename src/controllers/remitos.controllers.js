import { transcode } from "buffer";
import { getConnectionDATO } from "../database/connection.js"
import  http2 from 'http2'
import sql from 'mssql'


export  const calculoRemito = async (req,res)=> {
    let pool;
    let cab_sub_total = 0;
    let cab_imp_resp = 0;
    let cab_imp_total = 0;
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

           
            console.log(req.body.ARTICULOS[x].DET_COD_ARTICULO);
            const result = await pool.request()
                                     .input("Codigo", req.body.ARTICULOS[x].DET_COD_ARTICULO)
                                     .query("SELECT * from STARTICULO WHERE COD_ARTICULO = @Codigo");
        
            
            // preuni viene con impuesto incluido de la bbdd
            preuni = result.recordset[0].PREUNI;

            // prevta  = preuni / 1.21 en caso que la alicuota sea 21% (le quito el iva)
            prevta = Number(result.recordset[0].PREUNI / ((result.recordset[0].ALIC/100) + 1));
        
            //sub_total = prevta *cantidad 
            art_sub_total =  Number((Number(prevta).toFixed(2) * req.body.ARTICULOS[x].DET_CANTIDAD).toFixed(2));
 
            // calculo la parte del precio que sea IVA. (precio con iva - precio sin iva)
            //impuesto = Number((preuni - prevta).toFixed(2));
            impuesto = Number((preuni - prevta));
 

            req.body.ARTICULOS[x].DET_NROREP = result.recordset[0].NROREP;
            req.body.ARTICULOS[x].DET_DESCRIPCION = result.recordset[0].DESCRIP_CORTA;
            req.body.ARTICULOS[x].DET_MARCA = result.recordset[0].MARCA;

            
            req.body.ARTICULOS[x].DET_PREUNI = preuni;
            req.body.ARTICULOS[x].DET_PREVTA = Number(prevta).toFixed(2);
            req.body.ARTICULOS[x].DET_SUB_TOTAL = art_sub_total;
            req.body.ARTICULOS[x].DET_ALIC = result.recordset[0].ALIC;
            
            req.body.ARTICULOS[x].DET_IMP_RESP =  Number((impuesto *
                                                  req.body.ARTICULOS[x].DET_CANTIDAD).toFixed(2)); 

            req.body.ARTICULOS[x].DET_IMP_TOTAL = req.body.ARTICULOS[x].DET_SUB_TOTAL +
                                                  req.body.ARTICULOS[x].DET_IMP_RESP;
            
            cab_sub_total = req.body.ARTICULOS[x].DET_SUB_TOTAL + cab_sub_total;
            cab_imp_resp  = req.body.ARTICULOS[x].DET_IMP_RESP  + cab_imp_resp;
            cab_imp_total = req.body.ARTICULOS[x].DET_IMP_TOTAL + cab_imp_total;
        }
        
        req.body.SUB_TOTAL = Number(cab_sub_total).toFixed(2);
        req.body.IMP_RESP  = Number(cab_imp_resp).toFixed(2);
        req.body.IMP_TOTAL = Number(cab_imp_total).toFixed(2);
        
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
    try {
        const resultado = await insertarRemito(req);
        res.status(200)
           .json(resultado);
      } catch (error) {
        res.status(500)
           .json(resultado);
      }

}

async function insertarRemito(req) {
    let pool,  transaction; 
    let x = 0;
    let ahora;

    // variables fijas en el insert
    let organizacion = 1;
    let pref  = 8;
    let remito =0;
    let cod_vend = 1;
    let observa = ".";
    let estado = "R";
    let fecha, aud_fec, aud_hor = null;
    let tipo_remito = "VE";
    let destino = "DEP";
    let lista = 1;
    let det_cantidev =0;
    let det_nroped = 0;
    let det_faccon = 1;
    let det_unimed = "Uni";
    let det_stock = "Sí";

    // ESTRUCTURA QUE ESPERA RECIBIR EN EL JSON DESDE EL FRONT. los valores fijos o nulos no vienen informados del front.
    // Es un objeto que tiene los datos de cabecera del remito y un array llamado ARTICULOS con las líneas de articulos del remito.
 
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
    } = req.body;

    try{
        

        // obtengo el ultimo numero de remito que existe en la tabla.
        const ultimoRemito = await ultimoremito();

        if (ultimoRemito !== -1) {
            remito = ultimoRemito + 1;
        } else {
            console.error('Error al obtener número de remito');
        }

         ahora = new Date();

        aud_fec = obtenerFechaAAAAMMDD(ahora);
        fecha = aud_fec;
        aud_hor=obtenerHoraHHMMSS(ahora);

        //abro conexión
        pool  = await getConnectionDATO();
        //abro transaccion para que el insert de la cabecera y el detalle sea atómico
        transaction = new sql.Transaction(pool);
        await transaction.begin();
        //Completo el objeto request para luego devolverlo al front

        req.body.ORGANIZACION       = organizacion;      // "1"
        req.body.PREF               = pref;              // "8"
        req.body.REMITO             = remito;            //numero de remito secuencial d
        req.body.COD_VEND           = cod_vend;          // "1"
        req.body.OBSERVA            = observa;           // "."
        req.body.ESTADO             = estado;            // "R" (estado remitado)
        req.body.FECHA              = fecha;             // today -> yyyymmdd es un integer en la bbdd
        req.body.AUD_FEC            = aud_fec;           // today-> yyyymmdd es un integer en la bbdd
        req.body.AUD_HOR            = aud_hor ;          // now ->hhmmss es un integer en la bbdd 
        req.body.TIPO_REMITO        = tipo_remito;       // "VE"
        req.body.DESTINO            = destino;           // "DEP"
        req.body.CODBARRA           = null;              // null
        req.body.COD_ARTICULO       = null;              //null
        req.body.NROREP             = null;              //null
        req.body.MARCA              = null;              // null
        req.body.DESCRIPCION        = null;              // null
        req.body.CANTIDAD           = null;              // null
        req.body.PREUNI             = null;              // null
        req.body.ALIC               = null;              // null
        req.body.ALICE              = null;              // null
        req.body.RUBSTK             = null;              // null
        req.body.LISTA              = lista;             // "1"

        // ARMO OBJETO PARA COMPLETAR EL INSERT DE CABECERA
        const datosInsertCab = {
            ORGANIZACION:   req.body.ORGANIZACION,
            PREF:           req.body.PREF,
            REMITO:         req.body.REMITO,
            COD_CLIENTE:    req.body.COD_CLIENTE,
            COD_VEND:       req.body.COD_VEND,
            OBSERVA:        req.body.OBSERVA,
            ESTADO:         req.body.ESTADO,
            FECHA:          req.body.FECHA,
            SUB_TOTAL:      req.body.SUB_TOTAL,
            IMP_RESP:       req.body.IMP_RESP,
            IMP_TOTAL:      req.body.IMP_TOTAL,
            AUD_FEC:        req.body.AUD_FEC,
            AUD_HOR:        req.body.AUD_HOR,
            AUD_USR:        req.body.AUD_USR,
            TIPO_REMITO:    req.body.TIPO_REMITO,
            DESTINO:        req.body.DESTINO,
            CODBARRA:       req.body.CODBARRA,
            COD_ARTICULO:   req.body.COD_ARTICULO,
            NROREP:         req.body.NROREP,
            MARCA:          req.body.MARCA,
            DESCRIPCION:    req.body.DESCRIPCION,
            CANTIDAD:       req.body.CANTIDAD,
            PREUNI:         req.body.PREUNI,
            ALIC:           req.body.ALIC,
            ALICE:          req.body.ALICE,
            RUBSTK:         req.body.RUBSTK,
            LISTA:          req.body.LISTA
          };
        
            // Consulta de insert en la tabla XTREMITOS
        const consultaInsertCab = `
            INSERT INTO DCORDATO.dbo.XTREMITOS
            (ORGANIZACION, PREF, REMITO, COD_CLIENTE, COD_VEND, OBSERVA, ESTADO, FECHA, SUB_TOTAL, IMP_RESP, IMP_TOTAL, AUD_FEC, AUD_HOR, AUD_USR, TIPO_REMITO, DESTINO, CODBARRA, COD_ARTICULO, NROREP, MARCA, DESCRIPCION, CANTIDAD, PREUNI, ALIC, ALICE, RUBSTK, LISTA)
            VALUES(
            @ORGANIZACION, @PREF, @REMITO, @COD_CLIENTE, @COD_VEND, @OBSERVA, @ESTADO, @FECHA, @SUB_TOTAL, @IMP_RESP, @IMP_TOTAL, @AUD_FEC, @AUD_HOR, @AUD_USR, @TIPO_REMITO, @DESTINO, @CODBARRA, @COD_ARTICULO, @NROREP, @MARCA, @DESCRIPCION, @CANTIDAD, @PREUNI, @ALIC, @ALICE, @RUBSTK, @LISTA
            );
            `;

        const solicitudCab = new sql.Request(transaction);

        // agrego inputs a la consulta.
        for (let parametro in datosInsertCab) {
            console.log("CABECERA: ",parametro, "   ", datosInsertCab[parametro]);
            solicitudCab.input(parametro, datosInsertCab[parametro]);
        }

        // Ejecuto la consulta de insert de registros de cabecera
       const resultCabecera = await solicitudCab.query(consultaInsertCab);
       console.log('Datos CABECERA insertados correctamente:', resultCabecera);

       for (x  in req.body.ARTICULOS){
            
            //completo el objeto request para luego devolverlo al front
            req.body.ARTICULOS[x].DET_ORGANIZACION= organizacion;  // "1"
            req.body.ARTICULOS[x].DET_PREF=         pref;     // "8"
            req.body.ARTICULOS[x].DET_REMITO=       remito;     // codigo de remito de cabecera
            req.body.ARTICULOS[x].DET_FECMOV=       fecha;     // fecha de remito yyyymmdd es un integer en la bbdd
            req.body.ARTICULOS[x]. DET_CANTIDEV=    det_cantidev;      // "0"
            req.body.ARTICULOS[x].DET_OBSERVA=      null;      // null
            req.body.ARTICULOS[x].DET_ESTADO=       estado;      // "R" - remitado
            req.body.ARTICULOS[x].DET_FACTURA=      null;      // null 
            req.body.ARTICULOS[x].DET_AUD_FEC=      aud_fec      // today con formato yyymmdd
            req.body.ARTICULOS[x].DET_AUD_HOR=      aud_hor      // now con formato hhmmss
            req.body.ARTICULOS[x].DET_AUD_USR=      req.body.AUD_USR      // now con formato hhmmss            
            req.body.ARTICULOS[x].DET_NROPED=       det_nroped;      // "0"
            req.body.ARTICULOS[x].DET_FACCON=       det_faccon;      // "1"
            req.body.ARTICULOS[x].ET_UNIMED=        det_unimed;      // "Uni"
            req.body.ARTICULOS[x].DET_TIPO_REMITO=  tipo_remito  // "VE"
            req.body.ARTICULOS[x].DET_STOCK=        det_stock;           // "Sí"

            // ARMO OBJETO PARA EL INSERT DE LAS LINEAS EN LA BASE DE DATOS.
            const datosInsertDet = {
                        ORGANIZACION:   organizacion,
                        PREF:           pref,
                        REMITO:         remito,
                        COD_CLIENTE:    req.body.COD_CLIENTE,
                        COD_ARTICULO:   req.body.ARTICULOS[x].DET_COD_ARTICULO,
                        NROREP:         req.body.ARTICULOS[x].DET_NROREP,
                        MARCA:          req.body.ARTICULOS[x].DET_MARCA,
                        FECMOV:         fecha,
                        CANTIDAD:       req.body.ARTICULOS[x].DET_CANTIDAD,
                        DESCRIPCION:    req.body.ARTICULOS[x].DET_DESCRIPCION,
                        CANTIDEV:       det_cantidev,
                        PREUNI:         req.body.ARTICULOS[x].DET_PREUNI,
                        PREVTA:         req.body.ARTICULOS[x].DET_PREVTA,
                        SUB_TOTAL:      req.body.ARTICULOS[x].DET_SUB_TOTAL,
                        ALIC:           req.body.ARTICULOS[x].DET_ALIC,
                        IMP_RESP:       req.body.ARTICULOS[x].DET_IMP_RESP,
                        IMP_TOTAL:      req.body.ARTICULOS[x].DET_IMP_TOTAL,
                        OBSERVA:        null,
                        ESTADO:         estado,
                        FACTURA:        null,
                        AUD_FEC:        aud_fec,
                        AUD_HOR:        aud_hor,
                        AUD_USR:        req.body.AUD_USR,
                        NROPED:         det_nroped,
                        FACCON:         det_faccon,
                        UNIMED:         det_unimed,
                        TIPO_REMITO:    tipo_remito,
                        STOCK:          det_stock
                    };

            // ARMO INSERT            
            const consultaInsertDet = `INSERT XTREMITOSDET 
                                        (ORGANIZACION, PREF, REMITO, COD_CLIENTE, COD_ARTICULO, NROREP, MARCA, FECMOV, 
                                            CANTIDAD, DESCRIPCION, CANTIDEV, PREUNI, PREVTA, SUB_TOTAL, ALIC, IMP_RESP, 
                                            IMP_TOTAL, OBSERVA, ESTADO, FACTURA, AUD_FEC, AUD_HOR, AUD_USR, NROPED, FACCON, 
                                            UNIMED, TIPO_REMITO, STOCK)
                                        VALUES( @ORGANIZACION, @PREF, @REMITO, @COD_CLIENTE, @COD_ARTICULO, @NROREP, @MARCA, 
                                            @FECMOV, @CANTIDAD, @DESCRIPCION, @CANTIDEV, @PREUNI, @PREVTA, @SUB_TOTAL, @ALIC, @IMP_RESP, @IMP_TOTAL, @OBSERVA, @ESTADO, @FACTURA, @AUD_FEC, @AUD_HOR, @AUD_USR, @NROPED, @FACCON, @UNIMED, @TIPO_REMITO, @STOCK);`;
            
            const solicitudDet = new sql.Request(transaction);
            
            // agrego inputs a la consulta.
            for (let parametro in datosInsertDet) {
                console.log("PARAMETRO DET: ", parametro,"   ", datosInsertDet[parametro]);
                solicitudDet.input(parametro, datosInsertDet[parametro]);
            }

            // Ejecuto la consulta de insert de registros de detalle
            const resultDetalle = await solicitudDet.query(consultaInsertDet);
            console.log('Datos DETALLE insertados correctamente:', resultDetalle);                    
        }
        
        await transaction.commit();

        console.log(req.body);
        return { IsSuccess: true, Message: 'Remito Creado con éxito.', remito:req.body };

    }
    catch(Exception ){
        if (pool && pool.connected) {
            try{
                await transaction.rollback();
            }
            catch(rollbackError){
                console.error('Error al realizar RollBack de transaccion: ', rollbackError);
            }
        }
        console.error('Error al Crear Remito:', error);
        return { IsSuccess: "false", Message: 'Error al crear remito: ' + error.message };
    }finally {
        // Cierro la conexión
        if (pool && pool.connected) {
          await pool.close();
        }
    }
}

async  function ultimoremito(){
    let poolR;

    try{
        poolR  = await getConnectionDATO();
        const result=  await poolR.request().query("select MAX(remito) ULTIMO from XTREMITOS where PREF=8");
        console.log(result.recordset[0].ULTIMO);
    
        if(result.recordset[0].ULTIMO == null)
            return 0;

        return result.recordset[0].ULTIMO;

    }catch(error){
        console.log(error);
        return -1;
    }finally {
        // Cierro la conexión
        if (poolR && poolR.connected) {
          try{
            await poolR.close();
          }catch(errorClose){
            console.error("Error al cerrar la conexion: ", errorClose);
          }

        }
    }

}

function obtenerFechaAAAAMMDD(ahora) {
    
    const year = ahora.getFullYear();
    const month = String(ahora.getMonth() + 1).padStart(2, '0'); // Se agrega 1 al mes ya que los meses van de 0 a 11
    const day = String(ahora.getDate()).padStart(2, '0');

    return `${year}${month}${day}`;
}

function obtenerHoraHHMMSS(ahora) {
    
    const hours = String(ahora.getHours()).padStart(2, '0');
    const minutes = String(ahora.getMinutes()).padStart(2, '0');
    const seconds = String(ahora.getSeconds()).padStart(2, '0');

    return `${hours}${minutes}${seconds}`;
}


export const getRemitos = (req,res)=>{
    console.log("GetRemitos");
    res.json('get remitos');
}

export const getRemitoByCodigo = (req,res)=>{
    console.log("GetRemitobyCodigo");
    res.json('get remito by codigo');
}