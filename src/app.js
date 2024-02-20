import express from 'express'
import config from './config.js'

import usuariosRoutes from './routes/usuarios.routes.js'
import articulosRoutes from './routes/articulos.routes.js'
import clientesRoutes from './routes/clientes.routes.js'
import remitosRoutes from './routes/remitos.routes.js'

const app= express()


//Settings
//Configurar puerto. Si existe variable tome puerto, sino use 3000
app.set('port',config.port)

//middlewares

app.use(express.json());
app.use(express.urlencoded({extended:false}));

app.use(usuariosRoutes);
app.use(articulosRoutes);
app.use(clientesRoutes);
app.use(remitosRoutes);

export default app

