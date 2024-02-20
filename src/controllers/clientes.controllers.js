import { getConnectionDATO } from "../database/connection.js"
import  http2 from 'http2'

export const getClientes = async(req,res)=> {

   try{
      const pool  = await getConnectionDATO();

      const result=  await pool.request().query("select COD_CLIENTE, NOMBRE, CUIT, DIRECCION, POSTAL,TELEFONO,CELULAR,EMAIL from FUCLIENTES");
   
      res.status(http2.constants.HTTP_STATUS_OK)
         .json(result.recordset);
   }
   catch(error){
      
      console.log(error);
      res.status(http2.constants.HTTP_STATUS_INTERNAL_SERVER_ERROR)  
         .send(error);
   }

}

export const getClienteByCodigo = async(req,res)=> {

   try{
          
      const pool  = await getConnectionDATO();

      const result=  await pool.request()
                               .input("Codigo", req.params.codigo)
                               .query("select * from FUCLIENTES where COD_CLIENTE = @Codigo");
   
      if(result.rowsAffected == 0 ){
         res.status(http2.constants.HTTP_STATUS_NO_CONTENT);
      }
      else{
         res.status(http2.constants.HTTP_STATUS_OK)
            .json(result.recordset);
      }
   }
   catch(error){
      
      console.log(error);
      res.status(http2.constants.HTTP_STATUS_INTERNAL_SERVER_ERROR)  
         .send(error);
   }

}