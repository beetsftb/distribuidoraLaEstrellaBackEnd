import sql from 'mssql'

const dbSettings = {
    user:"sa",
    password:"3strell@",
    server:"201.182.16.96",
    database:"DCORDATO",
    port:42167,
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

