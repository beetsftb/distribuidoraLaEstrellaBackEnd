import express from 'express'
import config from './config'

import productsRoutes from './routes/products.routes'
import clientsRoutes from './routes/clients.routes'
import remitosRoutes from './routes/remitos.routes'

const app= express()

//Settings
//Configurar puerto. Si existe variable tome puerto, sino use 3000
app.set('port',config.port)

//middlewares

app.use(express.json());
app.use(express.urlencoded({extended:false}));

app.use(productsRoutes)
app.use(clientsRoutes)
app.use(remitosRoutes)


export default app
