import { getConnection } from "../database/connection.js"

export const getProducts = async(req,res)=> {

   const pool  = await getConnection();

   /*El await hace que espere a terminar la consulta */

   const result=  await pool.request().query("select COD_ARTICULO,DESCRIP_CORTA,DESCRIP_LARGA from STARTICULO WHERE ESTADO='A'");

   res.json(result.recordset);

}