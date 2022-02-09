const express = require('express');
const cors = require('cors');
const fs = require('fs');
const dbMysql = require('../config/MysqlDB');

const {getAsistencia} = require('../sockets/controller');

class server {

    constructor() {
        this.conexion;
        this.libPath = 'C:\\instantclient_12_1';
        this.app    = express();
        this.port   = process.env.PORT;
        
        // Middlewares
        this.middlewares();


        // recursividad
        this.recursividad();

        //conexion mysql
        this.conexionMysql();
    }
    middlewares() {
        // CORS
        this.app.use( cors() );
        // Directorio Público
        this.app.use( express.static('public') );
    }
    
    async conexionMysql(){
        try {
            await dbMysql.sync();
            console.log('Conectado correctamente a MYSQL.');
          } catch (error) {
            console.error('Unable to connect to the database:', error);
          }
    }
 
    recursividad() {
        getAsistencia()
    }
    listen() {
        this.app.listen( this.port, () => {
            console.log('Servidor corriendo en puerto', this.port );
        });
    }
}

module.exports = server;