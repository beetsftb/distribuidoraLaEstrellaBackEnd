import {config} from 'dotenv'
import sql from 'mssql'

config();

/*const dbSettings = {
    user:"sa",
    password:"3strell@",
    server:"201.182.16.96",
    database:"DCORDATO",
    port:42167,
    options: {
        encrypt:false
    }
};
*/

const dbSettings = {
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    server:process.env.DB_SERVER,
    database:process.env.DB_NAME,
    port:42167,//process.env.DB_PORT,
    options: {
        encrypt:false
    }
};


export async function getConnection(){
    try{
    const pool= await sql.connect(dbSettings)
    return pool;
}catch(error){
    console.error(error);

}

}

