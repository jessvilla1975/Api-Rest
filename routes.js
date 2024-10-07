const express = require('express');
const routes = express.Router();
const nodemailer = require("nodemailer");
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
        user: "campusrideapps@gmail.com",
        pass: "jfsehisyfqxituaj", // contraseña de las apps contraseñas del correo
    },
});



// Ruta para nuevo usuario--------------------------------
routes.post('/newUser', (req, res) => {
    const { id, nombre, apellido, correo, telefono, direccion, fecha_nacimiento, contraseña, genero } = req.body;

    // Validar que se reciban todos los campos necesarios
    if (!id || !nombre || !apellido || !correo || !contraseña || !genero) {
        return res.status(400).json({ error: 'Por favor, complete todos los campos obligatorios.' });
    }

    // Generar un código de verificación aleatorio
    const codigo_verificacion = crypto.randomInt(100000, 999999).toString(); // Código de 6 dígitos

    // Consulta SQL para insertar un nuevo usuario
    const query = `
        INSERT INTO usuarios (id, genero, nombre, apellido, correo, telefono, direccion, fecha_nacimiento, contraseña, codigo_verificacion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Ejecutar la consulta usando req.connection
    req.connection.query(query, [id, genero, nombre, apellido, correo, telefono, direccion, fecha_nacimiento, contraseña, codigo_verificacion], (err, result) => {
        if (err) {
            console.error('Error al insertar el usuario:', err);
            return res.status(500).json({ error: 'Error al crear el usuario' });
        }

        // Enviar correo de verificación
        const mailOptions = {
            from: "campusrideapps@gmail.com",
            to: correo,
            subject: "Código de Verificación de Campus Ride",
            html: `
              <html>
                <head>
                  <style>
                    body {
                      font-family: Arial, sans-serif;
                      background-color: #f4f4f4;
                      padding: 20px;
                    }
                    .container {
                      background-color: #fff;
                      padding: 20px;
                      border-radius: 8px;
                      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    }
                    h1 {
                      color: #333;
                    }
                    .code {
                      font-size: 24px;
                      font-weight: bold;
                      color: #007BFF;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>Código de Verificación de Campus Ride</h1>
                    <p>Hola, ${nombre}</p>
                    <p>Tu código de verificación es:</p>
                    <p class="code">${codigo_verificacion}</p>
                    <p>¡Gracias por unirte a nosotros!</p>
                    <p>Saludos,<br/>El equipo de Campus Ride</p>
                  </div>
                </body>
              </html>
            `,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error al enviar el correo:', error);
                return res.status(500).json({ error: 'Error al enviar el correo de verificación' });
            }

            // Devolver una respuesta de éxito
            res.status(201).json({ message: 'Usuario creado exitosamente. Se ha enviado un código de verificación a tu correo.', userId: id });
        });
    });
});

// Ruta para la API --------------------------------
routes.get('/', (req, res) => {
    res.send('Bienvenido a mi API');
});

// usuarios
routes.get('/usuarios', (req, res) => {
    req.connection.query('SELECT * FROM usuarios', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.json(results);
    });
});

// conductores
routes.get('/conductores', (req, res) => {
    req.connection.query('SELECT * FROM conductor', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.json(results);
    });
});

// conductores
routes.get('/vehiculos', (req, res) => {
    req.connection.query('SELECT * FROM vehiculo', (err, results) => {
        if (err) {
            return res.status(500).json({ error: err });
        }
        res.json(results);
    });
});
// login--------------------------------
routes.post('/login', (req, res) => {
    const { correo, contraseña } = req.body;

    // Validar que se reciban todos los campos necesarios
    if (!correo || !contraseña) {
        return res.status(400).json({ error: 'Por favor, complete todos los campos obligatorios.' });
    }

    // Consulta SQL para verificar el usuario
    const query = `
        SELECT * FROM usuarios WHERE correo = ? AND contraseña = ?
    `;

    // Ejecutar la consulta usando req.connection
    req.connection.query(query, [correo, contraseña], (err, result) => {
        if (err) {
            console.error('Error al validar el usuario:', err);
            return res.status(500).json({ error: 'Error al validar el usuario' });
        }

        if (result.length > 0) {
            // El usuario existe
            res.status(200).json({ message: 'Usuario validado', user: result[0] });
        } else {
            // El usuario no existe
            res.status(401).json({ error: 'Correo o contraseña incorrectos' });
        }
    });
});



// Ruta para nuevo conductor
// Ruta para nuevo conductor
routes.post('/newConductor', (req, res) => {
    const { 
        id, 
        nombre, 
        apellido, 
        correo, 
        telefono, 
        direccion, 
        fecha_nacimiento, 
        contraseña, 
        genero, 
        numero_licencia, 
        fecha_vencimiento, 
        id_placa, 
        marca, 
        modelo, 
        ano, 
        color, 
        capacidad_pasajeros 
    } = req.body;

    // Validar que se reciban todos los campos necesarios
    if (!id || !nombre || !apellido || !correo || !contraseña || !genero || 
        !numero_licencia || !fecha_vencimiento || !id_placa || !marca || 
        !modelo || !ano || !color || !capacidad_pasajeros) {
        return res.status(400).json({ error: 'Por favor, complete todos los campos obligatorios.' });
    }

    // Generar un código de verificación aleatorio
    const codigo_verificacion = crypto.randomInt(100000, 999999).toString(); // Código de 6 dígitos

    // Consulta SQL para insertar un nuevo usuario
    const queryUsuario = `
        INSERT INTO usuarios (id, genero, nombre, apellido, correo, telefono, direccion, fecha_nacimiento, contraseña, codigo_verificacion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Consulta SQL para insertar un nuevo conductor
    const queryConductor = `
        INSERT INTO conductor (id_conductor, calificacion_conductor, estado_disponibilidad, numero_licencia, fecha_vencimiento, foto_perfil, documento_verificacion)
        VALUES (?, ?, ?)
    `;

    // Consulta SQL para insertar el vehículo
    const queryVehiculo = `
        INSERT INTO vehiculo (id_placa, id_conductor, marca, modelo, ano, color, capacidad_pasajeros)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    // Ejecutar las consultas en secuencia
    req.connection.query(queryUsuario, [id, genero, nombre, apellido, correo, telefono, direccion, fecha_nacimiento, contraseña, codigo_verificacion], (err, resultUsuario) => {
        if (err) {
            console.error('Error al insertar el usuario:', err);
            return res.status(500).json({ error: 'Error al crear el usuario' });
        }

        req.connection.query(queryConductor, [id, calificacion_conductor, estado_disponibilidad, numero_licencia, fecha_vencimiento, foto_perfil, documento_verificacion], (err, resultConductor) => {
            if (err) {
                console.error('Error al insertar el conductor:', err);
                return res.status(500).json({ error: 'Error al crear el conductor' });
            }

            req.connection.query(queryVehiculo, [id_placa, id, marca, modelo, ano, color, capacidad_pasajeros], (err, resultVehiculo) => {
                if (err) {
                    console.error('Error al insertar el vehículo:', err);
                    return res.status(500).json({ error: 'Error al crear el vehículo' });
                }

                // Enviar correo de verificación
                const mailOptions = {
                    from: "campusrideapps@gmail.com",
                    to: correo,
                    subject: "Código de Verificación de Campus Ride",
                    html: `
                      <html>
                        <head>
                          <style>
                            body {
                              font-family: Arial, sans-serif;
                              background-color: #f4f4f4;
                              padding: 20px;
                            }
                            .container {
                              background-color: #fff;
                              padding: 20px;
                              border-radius: 8px;
                              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                            }
                            h1 {
                              color: #333;
                            }
                            .code {
                              font-size: 24px;
                              font-weight: bold;
                              color: #007BFF;
                            }
                          </style>
                        </head>
                        <body>
                          <div class="container">
                            <h1>Código de Verificación de Campus Ride</h1>
                            <p>Hola, ${nombre}</p>
                            <p>Tu código de verificación es:</p>
                            <p class="code">${codigo_verificacion}</p>
                            <p>¡Gracias por unirte a nosotros!</p>
                            <p>Saludos,<br/>El equipo de Campus Ride</p>
                          </div>
                        </body>
                      </html>
                    `,
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Error al enviar el correo:', error);
                        return res.status(500).json({ error: 'Error al enviar el correo de verificación' });
                    }

                    // Devolver una respuesta de éxito
                    res.status(201).json({ message: 'Conductor y vehículo creados exitosamente. Se ha enviado un código de verificación a tu correo.', userId: id });
                });
            });
        });
    });
});




module.exports = routes;
