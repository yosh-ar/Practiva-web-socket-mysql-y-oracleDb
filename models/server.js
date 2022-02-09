const express = require('express');
const cors = require('cors');
const fs = require('fs');
const oracledb = require('oracledb');


const dbOracle = require('../config/oracleDB');
const dbMysql = require('../config/MysqlDB');

const {socketController} = require('../sockets/controller');

class server {

    constructor() {
        this.conexion;
        this.libPath = 'C:\\instantclient_12_1';
        this.app    = express();
        this.port   = process.env.PORT;
        this.server = require('http').createServer( this.app );
        this.io     = require('socket.io')( this.server );
        
        // this.paths = {
        //     asistencia : '/api/asistencias'
        // }
        // Middlewares
        this.middlewares();

        // Rutas de mi aplicación
        // this.routes();

        // Sockets
        this.sockets();

        //conexion mysql
        this.conexionMysql();
    }
    middlewares() {
        // CORS
        this.app.use( cors() );
        // Directorio Público
        this.app.use( express.static('public') );
    }
    
    // routes() {
    //     this.app.use( this.paths.asistencia, require('../routers/asistencia.routes'));
    // }
    async conexionMysql(){
        try {
            await dbMysql.sync();
            console.log('Conectado correctamente a MYSQL.');
          } catch (error) {
            console.error('Unable to connect to the database:', error);
          }
    }
 
    sockets() {
        socketController();
        // console.log('esta entrando a la funcion')
        this.io.on('connection', socketController );
        // this.io.on('connection', ()=>{
        //     console.log('esta llamando al socket')
        // });
    }
    listen() {
        this.server.listen( this.port, () => {
            console.log('Servidor corriendo en puerto', this.port );
        });
    }
}

module.exports = server;