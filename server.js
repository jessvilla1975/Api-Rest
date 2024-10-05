const express = require('express');
const mysql = require('mysql2');
const routes = require('./routes');
const app = express();
app.set('port', process.env.PORT || 9001);
const cors = require('cors');
app.use(cors()); // Permite solicitudes desde cualquier origen


// Middleware para analizar JSON
app.use(express.json());




// Crear una conexión a la base de datos usando mysql2
const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost', // Cambiado a la variable de entorno
    port: process.env.DB_PORT || 3306,         // Cambiado a la variable de entorno
    user: process.env.DB_USERNAME || 'root',   // Cambiado a la variable de entorno
    password: process.env.DB_PASSWORD || '1234',// Cambiado a la variable de entorno
    database: process.env.DB_NAME || 'bdcampus'// Cambiado a la variable de entorno
});

// Conectar a la base de datos
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Conexión exitosa a la BD');
});

// Usar rutas y pasar la conexión
app.use('/api', (req, res, next) => {
    req.connection = connection; // Agrega la conexión a la solicitud
    next();
}, routes);

// Iniciar el servidor
app.listen(app.get('port'), () => {
    console.log('Server running on port', app.get('port'));
});
