import express from 'express'
import config from './config.js'

import productsRoutes from './routes/products.routes.js'
import clientsRoutes from './routes/clients.routes.js'
import remitosRoutes from './routes/remitos.routes.js'

const app= express()


//Settings
//Configurar puerto. Si existe variable tome puerto, sino use 3000
app.set('port',config.port)

//middlewares

app.use(express.json());
app.use(express.urlencoded({extended:false}));

app.use(productsRoutes);
app.use(clientsRoutes);
app.use(remitosRoutes);


export default app

