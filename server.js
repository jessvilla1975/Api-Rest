const express = require('express');
const mysql = require('mysql2');
const routes = require('./routes');
const app = express();
app.set('port', process.env.PORT || 9001);

// Middleware para analizar JSON
app.use(express.json());

// Crear una conexión a la base de datos usando mysql2
const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '1234',
    database: 'bdcampus'
});

// Conectar a la base de datos
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Conexion exitosa a la BD');
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
