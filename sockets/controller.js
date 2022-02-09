
const {Asistencia} = require('../models')
const fs = require('fs');
const oracledb = require('oracledb');
const dbOracle = require('../config/oracleDB');

let connectionsArray = [];
let POLLING_INTERVAL = 1000;
let pollingTimer;

let conexion;

const libPath='C:\\instantclient_12_1';


const moment = require('moment');

moment.locale('es'); 
const customFormatter = (date) =>{
    return moment(date).format('DD-MM-YYYY');
}

const socketController = async(socket) => {

    if (!connectionsArray.length) {
        getAsistencia();
        // console.log('esta llamando al socket')
     }
    socket.on('disconnect', () => {
        let socketIndex = connectionsArray.indexOf(socket);
        console.log('socketID = %s got disconnected', socketIndex);
        if (~socketIndex) {
          connectionsArray.splice(socketIndex, 1);
        }
    });
    
    console.log('A new socket is connected!');
    connectionsArray.push(socket);

}
const conectaOracle = async(connection) => {
  
    if (libPath && fs.existsSync(libPath)) {
      oracledb.initOracleClient({ libDir: libPath });
      try {
          conexion = await oracledb.getConnection(dbOracle);
          console.log('Oracle conectado correctamente')
        
      } catch (err) {
          console.error(err.message);
      }
      
    }
}

// let contador = 0;
const getAsistencia = async()=>{
    try{
        let asistencias =[];
        const asistencia = await Asistencia.findAll({
          where: {estado : true}
        });
        // asistencias.push(asistencia);
        // console.log('hola esta entrando');

        if (connectionsArray.length) {
            // console.log('hola esta entrando al intervalo')
          
            pollingTimer = setTimeout(getAsistencia, POLLING_INTERVAL);
            // console.log('recursividad', contador++);
            // updateSockets({
            //     asistencias: asistencias
            // });
            if(asistencia.length >0){
                const fecha_hora = asistencia[0].fecha_aut + ' ' + asistencia[0].hora_aut;
                
                const usuario = await conexion.execute("select user from dual",{}, { outFormat: oracledb.OBJECT });
                const fecha_registro = await conexion.execute("select sysdate from dual");
                const user = usuario.rows[0].USER;
                const fecha_db = fecha_registro.rows[0][0];
                
                await conexion.execute("INSERT INTO "+'planilla.arplmarcas'+" VALUES "+
                "(:NUMERO, :NO_EMPLE, TO_DATE(:FECHA_HORA_AUT,'RRRR/MM/DD hh24:mi:ss'), TO_DATE(:FECHA_AUT,'RRRR/MM/DD'), :HORA_AUT, :DIRECCION, :ENTRADA, :SERIE, :NOMBRE, :NO_TARJETA, :INGRESO, :SALIDA, :USUARIO, :FECHA_CREACION)",
                [asistencia[0].id,  asistencia[0].no_emple,fecha_hora, 
                asistencia[0].fecha_aut,asistencia[0].hora_aut, asistencia[0].direccion, asistencia[0].entrada, asistencia[0].serie
                ,asistencia[0].nombre, asistencia[0].no_tarjeta, asistencia[0].ingreso, asistencia[0].salida, user, fecha_db],{ autoCommit: true }); 
                await Asistencia.update({estado: false},{where : {id : asistencia[0].id}});
            }
          } else {
    
            console.log('The server timer was stopped because there are no more socket connections on the app')
    
          }
    }catch(err){
        // updateSockets(err);
        console.log(err);
    }
}

// const updateSockets = async(data)=> {
//     // adding the time of the last update
//     data.time = new Date();
//     // console.log('Pushing new data to the clients connected ( connections amount = %s ) - %s', connectionsArray.length , data.time);
//     // sending new data to all the sockets connected
    
//     connectionsArray.forEach(function(tmpSocket) {
//       tmpSocket.volatile.emit('notification', data);
//     });
// };

conectaOracle();
module.exports = {
    socketController
}

