/*const mysql = require('mysql');
const database = {
    host : 'localhost',
    user : 'root',
    password : '',
    database : 'telemedicina26_27'
};

const conexion = mysql.createConnection(database);

conexion.connect(function (err) {
    if (err) {
        console.error('Error en la conexión de la base de datos:',err);
        process.exit();
    }
});

module.exports = conexion;*/
const { Pool } = require('pg');

const conexion = new Pool({
    // Usa la variable de entorno DATABASE_URL (que pondremos en Render) o tu URI directa de Supabase
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:[TU-PASSWORD]@db.[TU-PROYECTO].supabase.co:5432/postgres',
    ssl: {
        rejectUnauthorized: false // Obligatorio para conexiones externas seguras a Supabase
    }
});

module.exports = conexion;
