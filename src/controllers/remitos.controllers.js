import { getConnection } from "../database/connection"

export const createNewRemito =(req,res)=> {

    const {descripcion} = req.body

    console.log(descripcion)
    res.json('new product')


}