import { getConnection } from "../database/connection.js"

export const getClients = async(req,res)=> {

   const pool  = await getConnection();

   /*El await hace que espere a terminar la consulta */

   const result=  await pool.request().query("select COD_CLIENTE, NOMBRE, CUIT, DIRECCION, POSTAL,TELEFONO,CELULAR,EMAIL from FUCLIENTES");

   res.json(result.recordset);

}