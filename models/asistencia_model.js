const { DataTypes} = require('sequelize');
const db = require('../config/MysqlDB');

const Asistencia = db.define('asistencia', {
    id:{
        type: DataTypes.INTEGER,
        primaryKey : true,
        autoIncrement : true
    },
    no_emple: {
        type: DataTypes.STRING(50),
    },
    fecha_hora_aut: {
        type: DataTypes.DATE
    },
    fecha_aut: {
        type: DataTypes.DATEONLY
    },
    hora_aut: {
        type: DataTypes.DATE,
    },
    direccion: {
        type: DataTypes.STRING(50),
    },
    entrada: {
        type: DataTypes.STRING(50),
    },
    serie: {
        type: DataTypes.STRING(50),
    },
    nombre: {
        type: DataTypes.STRING(50),
    },
    no_tarjeta: {
        type: DataTypes.STRING(50),
    },
    ingreso: {
        type: DataTypes.INTEGER,
    },
    salida: {
        type: DataTypes.INTEGER,
    },
    Traslado: {
        type: DataTypes.STRING(50),
    },
    dispositivo: {
        type: DataTypes.STRING(50),
    },
    estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },

});


module.exports = Asistencia;