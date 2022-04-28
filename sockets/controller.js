
const {Asistencia} = require('../models')
const fs = require('fs');
const oracledb = require('oracledb');
const dbOracle = require('../config/oracleDB');
const dbOracleProd = require('../config/oracleDBProd');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const moment = require('moment');

let connectionsArray = [];
let POLLING_INTERVAL = 60000;
// let POLLING_INTERVAL = 5000;

let pollingTimer;

let conexion;
let conexion_prod;

const libPath='C:\\instantclient_12_1';


const customFormatter = (date) =>{
    return moment.tz(date,'America/Guatemala').format('YYYY-MM-DD');
}

const conectaOracle = async(connection) => {
    if (libPath && fs.existsSync(libPath)) {
      oracledb.initOracleClient({ libDir: libPath });
      try {
            await oracledb.createPool(dbOracleProd);
            await oracledb.createPool(dbOracle);
            console.log('Oracle conectado correctamente')
      } catch (err) {
          console.error(err.message);
      }
    }
}
conectaOracle();
const getAsistencia = async()=>{
    try{
        const asistencia = await Asistencia.findAll({
          where: {estado : true}
        });
        let ruta;
            pollingTimer = setTimeout(getAsistencia, POLLING_INTERVAL);
            let cambio_jornada = false;
            let e_s = '';
            if(asistencia.length >0){
                for(let i = 0; i<asistencia.length-1; i++){
                    const posicion_siguiente = i+1;
                    if(asistencia[i].no_tarjeta == asistencia[posicion_siguiente].no_tarjeta){
                        await Asistencia.update({repit: false, estado:false},{where : {id : asistencia[posicion_siguiente].id}});
                    }
                }
                const asistencia1 = await Asistencia.findAll({
                    where: {estado : true, repit: true},
                    order : [['id', 'ASC']]
                  });
                  conexion = await oracledb.getConnection('qa');
                  const usuario = await conexion.execute("select user from dual",{}, { outFormat: oracledb.OBJECT }); 
                  const fecha_registro = await conexion.execute("select sysdate from dual");
                //   console.log(usuario, fecha_registro)
                  const user = usuario.rows[0].USER;
                  const fecha_db = fecha_registro.rows[0][0];

                  
                  await conexion.close();
                  let jornada;
                  for(let j =0; j<asistencia1.length; j++){
                    const fecha_hora = asistencia1[j].fecha_aut + ' ' + asistencia1[j].hora_aut;
                    
                    const no_cia  = asistencia1[j].no_tarjeta.substring(0,2);
                    // const no_cia  = '03';
                    const codpla =  asistencia1[j].no_tarjeta.substring(2,4); 
                    // const codpla =  '256366598'; 
                    const no_emple = Number(asistencia1[j].no_tarjeta.substring(9));
                    
                    conexion_prod = await oracledb.getConnection('prod');
                    const empleado =  await conexion_prod.execute(`SELECT a.nombre, a.no_cia, b.jornada, a.no_emple, a.codpla , a.no_hora,
                        b.entra_l lunes, b.entra_m martes, b.entra_k miercoles, b.entra_j jueves, b.entra_v viernes, b.entra_s sabado, b.entra_d domingo,
                        b.sale_l lunes_sale, b.sale_m martes_sale, b.sale_k miercoles_sale, b.sale_j jueves_sale, b.sale_v viernes_sale, b.sale_s sabado_sale, b.sale_d domingo_sale
                        FROM arplme a INNER JOIN ARPLTH b
                            ON a.NO_CIA = b.NO_CIA 
                            and a.CODPLA = b.CODPLA
                            and a.NO_HORA	= b.NO_HORA
                            where a.NO_EMPLE = '${no_emple}' and a.no_cia = '${no_cia}' and a.codpla = ${codpla}
                    `);
                    
                    await conexion_prod.close();
                    // console.log(empleado);
                    if(empleado.rows.length>0){
                        const hora_string = asistencia1[j].hora_aut.toString();
                        // console.log(hora_string);
                        const hora_number = Number(hora_string.substring(0,2));
                        const minutos_number = Number(hora_string.substring(3,5));

                        const minutos_reales = (minutos_number == 1) ? 00 : 
                                                (minutos_number == 2) ? 00 : 
                                                (minutos_number == 3) ? 00 : 
                                                (minutos_number == 4) ? 00 : 
                                                (minutos_number == 5) ? 00 : 
                                                (minutos_number == 6) ? 00 :
                                                (minutos_number == 7) ? 00 : 
                                                (minutos_number == 8) ? 00 :
                                                (minutos_number == 9) ? 00 : 
                                                minutos_number

                        const hora_real = hora_number.toString() + '.' + minutos_reales.toString();
                        
                        const hora_entrada = parseFloat(hora_real) * 3600;
                        
                        const dia_actual = new Date(customFormatter(asistencia1[j].fecha_aut)).getDay()+1;
                        
                        const dia = Hora(dia_actual, 1);
                        const dia1 =Hora(dia_actual,2);
                                    
                        const entrada_laboral = empleado.rows[0][dia];
                        const salida_laboral = empleado.rows[0][dia1];
                        // console.log(entrada_laboral);

                        if(empleado.rows[0][2] === '1'){
                            ruta = EntradaSalida(hora_entrada,entrada_laboral, salida_laboral);
                            cambio_jornada =  (ruta == 'SALIDA') ? true :false;
                            e_s =  (ruta == 'SALIDA') ? 'S' : (ruta == 'ENTRADA') ? 'E' : 'O';
                        }else{
                            ruta = EntradaSalida(hora_entrada,entrada_laboral, salida_laboral);
                            // console.log(hora_entrada,entrada_laboral, salida_laboral)
                            e_s =  (ruta == 'SALIDA') ? 'S' : (ruta == 'ENTRADA') ? 'E' : 'O';
                            cambio_jornada = false;
                        } 
                    }else{
                        cambio_jornada = false;
                    }
                    // console.log(e_s);
                    jornada = new Date(fecha_hora);
                    jornada.setDate(jornada.getDate() -1);
                    
                    
                    const jornada_actual = (cambio_jornada == true) ?customFormatter(jornada):customFormatter(asistencia1[j].fecha_aut);

                    // console.log(jornada_actual,  jornada);
                    conexion = await oracledb.getConnection('prod');
                    await conexion.execute("INSERT INTO "+'planilla.arplmarcas'+" VALUES "+
                    "(:NUMERO, :NO_EMPLE, TO_DATE(:FECHA_HORA_AUT,'RRRR/MM/DD hh24:mi:ss'), TO_DATE(:FECHA_AUT,'RRRR/MM/DD'), :HORA_AUT, :DIRECCION, :ENTRADA, :SERIE, :NOMBRE, :NO_TARJETA, :INGRESO, :SALIDA, :USUARIO, :FECHA_CREACION, :ESTADO, TO_DATE(:JORNADA,'RRRR/MM/DD'), :NO_EMPLE_ID)",
                    [asistencia1[j].id,  asistencia1[j].no_emple,fecha_hora, 
                    asistencia1[j].fecha_aut,asistencia1[j].hora_aut, e_s, asistencia1[j].entrada, asistencia1[j].serie
                    ,asistencia1[j].nombre, asistencia1[j].no_tarjeta, asistencia1[j].ingreso, asistencia1[j].salida, user, fecha_db, '1',jornada_actual,
                    no_emple ],{ autoCommit: true }); 
                    await Asistencia.update({estado: false},{where : {id : asistencia1[j].id}});
                    await conexion.close();

                }
            }
          
    }catch(err){
        console.log(err);
    }
}

const EntradaSalida = (horario_lectura, labora_entra, labora_salida)=>{
    const entrada_mas30mins = parseFloat(labora_entra/3600).toString() + '.' +'31';
    const entrada_menos30mins = parseFloat(labora_entra-3600)/3600 + '.' +'31';
    const entra_despues = parseFloat(entrada_mas30mins)*3600;
    const entra_antes = parseFloat(entrada_menos30mins)*3600;
    
    // console.log(entra_antes/3600, entra_despues/3600, horario_lectura/3600, labora_entra/3600);

    const salida_mas30mins = parseFloat(labora_salida/3600).toString() + '.' +'31';
    const salida_menos30mins = parseFloat(labora_salida-3600)/3600 + '.' +'31';

    const sale_despues = parseFloat(salida_mas30mins)*3600;
    const sale_antes = parseFloat(salida_menos30mins)*3600;
   
    if((horario_lectura == labora_entra ) || (horario_lectura <= entra_despues && horario_lectura >= entra_antes)){
        return 'ENTRADA';
    }
    else if((horario_lectura == labora_salida ) || (horario_lectura <= sale_despues && horario_lectura >= sale_antes)){
        return 'SALIDA';
    }else{
        return 'OTRO'
    }
    
}

const Hora= (dia_actual, E_S)=>{
    let resp = 0;
    if(E_S == 1){
       resp = (dia_actual == 1) ? 6 :
        (dia_actual == 2) ? 7 :
        (dia_actual == 3) ? 8 :
        (dia_actual == 4) ? 9 :
        (dia_actual == 5) ? 10 :
        (dia_actual == 6) ? 11 : 12;
    }
    else{
        resp = (dia_actual == 1) ? 13 :
        (dia_actual == 2) ? 14 :
        (dia_actual == 3) ? 15:
        (dia_actual == 4) ? 16:
        (dia_actual == 5) ? 17 :
        (dia_actual == 6) ? 18 : 19
    }
    return resp;
}

// conectaOracleProd();

module.exports = {
    getAsistencia
}



// switch(dia_actual)  {
//     case 1 : 
//         ruta = EntradaSalida(hora_entrada,entrada_laboral, salida_laboral);
//         cambio_jornada =  (ruta == 'SALIDA') ? true :false;
//         break;
//     case 2 : 
//         ruta = EntradaSalida(hora_entrada,entrada_laboral, salida_laboral);
//         cambio_jornada =  (ruta == 'SALIDA') ? true :false;
//     case 3 : 
//         ruta = EntradaSalida(hora_entrada,entrada_laboral, salida_laboral);
//         cambio_jornada =  (ruta == 'SALIDA') ? true :false;
//     case 4 :  
//         ruta = EntradaSalida(hora_entrada,entrada_laboral, salida_laboral);
//         cambio_jornada =  (ruta == 'SALIDA') ? true :false;
//         break;
//     case 5 : 
//         ruta = EntradaSalida(hora_entrada,entrada_laboral, salida_laboral);
//         cambio_jornada =  (ruta == 'SALIDA') ? true :false;
//         break;
//     case 6 : 
//         ruta = EntradaSalida(hora_entrada,entrada_laboral, salida_laboral);
//         cambio_jornada =  (ruta == 'SALIDA') ? true :false;
//         break;
//     case 7 : 
//         ruta = EntradaSalida(hora_entrada,entrada_laboral, salida_laboral);
//         cambio_jornada =  (ruta == 'SALIDA') ? true :false;
//         break;
// }