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

const dbSettingsDATO = {
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    server:process.env.DB_SERVER,
    database:'DCORDATO',
    port:42167,//process.env.DB_PORT,
    options: {
        encrypt: false,
        schema: 'DCORDATO'
    }
};

const dbSettingsSEGU = {
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    server:process.env.DB_SERVER,
    database:'DCORSEGU',
    port:42167,//process.env.DB_PORT,
    options: {
        encrypt: false,
        schema:'DCORSEGU'
    }
};


export async function getConnectionDATO(){
    try{
        const pool= await sql.connect(dbSettingsDATO)
        return pool;
    }catch(error){
        console.error(error);
    }
};

export async function getConnectionSEGU(){
    try{
    const pool= await sql.connect(dbSettingsSEGU)
    return pool;
    }catch(error){
        console.error(error);
    }
};