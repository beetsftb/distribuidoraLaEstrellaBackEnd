import { getConnectionSEGU } from "../database/connection.js"
import  http2 from 'http2'


/*export const getUsuario = async(req,res)=> {

   const pool  = await getConnectionSEGU();

   const result=  await pool.request().query("select COD_CLIENTE, NOMBRE, CUIT, DIRECCION, POSTAL,TELEFONO,CELULAR,EMAIL from FUCLIENTES");

   res.json(result.recordset);

}*/


export const loginUser = async (req, res) => {

    let pool;

    try {
        const { usuario, password } = req.body;

        pool = await getConnectionSEGU();

        const respQuery = await pool.request()
            .input("Usuario", usuario)
            .query('SELECT * FROM ORGANICLAVES WHERE AUD_USR_CLAVE = @Usuario ');


        console.log(respQuery);

        // Si no encuentra un usuasrio con esa direccion de correo, retorno Mensaje a FrontEnd.
        if (respQuery.rowsAffected == 0) {
            res.status(http2.constants.HTTP_STATUS_OK)
            res.json({
                IsSuccess: "false",
                Message: "Usuario Inexistente."
            })
        }
        else {


            // Si la password no es valida, retorno Mensaje a FrontEnd.
            if ([password] != respQuery.recordset[0].ID_CLAVE) {
                res.status(http2.constants.HTTP_STATUS_OK)
                res.json({
                    IsSuccess: "false",
                    Message: "Contraseña Inválida."
                })
            } else {
                const user = respQuery.recordset[0].AUD_USR_CLAVE;
                const nombre = respQuery.recordset[0].ID_NOMBRE;
                const fecalta = respQuery.recordset[0].ID_FECALT;

                /* descomentar cuando tenga autenticacion por token 
                
                const token = jwt.sign(
                    {
                    user: user,
                    nombre: nombre,
                    fecalta: fecalta
                    },
                    process.env.TOKEN_SECRET,
                    {expiresIn:'1d'}
                );
                */

                res.status(http2.constants.HTTP_STATUS_OK)
                    //.header("auth-token", token)   <-- descomentar cuando tenga autenticacion por token 
                    .json({
                        result: {
                            user,
                            nombre,
                            fecalta
                        },
                        //,token}, <-- descomentar cuando tenga autenticacion por token
                        IsSuccess: "true",
                        Message: "Login OK."
                    });
            }
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


