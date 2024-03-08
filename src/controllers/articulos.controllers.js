import { getConnectionDATO } from "../database/connection.js"
import http2 from 'http2'

export const getArticulos = async(req,res)=> {
    let pool;
    try {
         pool = await getConnectionDATO();

        const result = await pool.request().query("select COD_ARTICULO,DESCRIP_CORTA,DESCRIP_LARGA from STARTICULO WHERE ESTADO='A'");

        res.status(http2.constants.HTTP_STATUS_OK)
            .json(result.recordset);

    }
    catch (error) {
        console.log(error);
        res.status(http2.constants.HTTP_STATUS_INTERNAL_SERVER_ERROR)
            .send(error);
    } finally {
        if (pool) {
            try {
                await pool.close();
            } catch (err) {
                console.err("Error al cerrar la conexión", err);
            }
        }
    }
}

export const getArticuloByCodigo = async(req,res)=> {
    let pool;
    try {
        pool = await getConnectionDATO();

        const result = await pool.request()
            .input("Codigo", req.params.codigo)
            .query("select * from STARTICULO where COD_ARTICULO = @Codigo and ESTADO = 'A'");

        if (result.rowsAffected == 0) {
            res.status(http2.constants.HTTP_STATUS_NO_CONTENT);
        }
        else {
            res.status(http2.constants.HTTP_STATUS_OK)
                .json(result.recordset);
        }

    }
    catch (error) {
        console.log(error);
        res.status(http2.constants.HTTP_STATUS_INTERNAL_SERVER_ERROR)
            .send(error);
    } finally {
        if (pool) {
            try {
                await pool.close();
            } catch (err) {
                console.error("Error al cerrar la conexión", err);
            }
        }
    }


}