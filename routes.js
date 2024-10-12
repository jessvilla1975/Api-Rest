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

// vehiculos
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

// ruta para agregar conductor------------------------------

routes.post('/newConductor', (req, res) => {
    const { id_conductor, numero_licencia, fecha_vencimiento } = req.body;

    // Validar que se reciban los campos obligatorios
    if (!id_conductor || !numero_licencia || !fecha_vencimiento) {
        return res.status(400).json({ error: 'Por favor, complete todos los campos obligatorios: id_conductor, numero_licencia, fecha_vencimiento.' });
    }

    // Consulta SQL para insertar un nuevo conductor
    const query = `
        INSERT INTO conductor (id_conductor, calificacion_conductor, estado_disponibilidad, numero_licencia, fecha_vencimiento)
        VALUES (?, NULL, NULL, ?, ?)
    `;

    // Ejecutar la consulta usando req.connection
    req.connection.query(query, [id_conductor, numero_licencia, fecha_vencimiento], (err, result) => {
        if (err) {
            console.error('Error al insertar el conductor:', err);
            return res.status(500).json({ error: 'Error al crear el conductor' });
        }

        // Devolver una respuesta de éxito
        res.status(201).json({ message: 'Conductor creado exitosamente.', conductorId: id_conductor });
    });
});

// ruta para agregar vehiculo------------------------------

routes.post('/newVehiculo', (req, res) => {
    const { id_placa, id_conductor, marca, modelo, ano, color, capacidad_pasajeros } = req.body;

    // Validar que se reciban todos los campos necesarios
    if (!id_placa || !id_conductor || !marca || !modelo || !ano || !color || !capacidad_pasajeros) {
        return res.status(400).json({ error: 'Por favor, complete todos los campos obligatorios.' });
    }

    // Consulta SQL para insertar un nuevo vehículo
    const query = `
        INSERT INTO vehiculo (id_placa, id_conductor, marca, modelo, ano, color, capacidad_pasajeros)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    // Ejecutar la consulta usando req.connection
    req.connection.query(query, [id_placa, id_conductor, marca, modelo, ano, color, capacidad_pasajeros], (err, result) => {
        if (err) {
            console.error('Error al insertar el vehículo:', err);
            return res.status(500).json({ error: 'Error al crear el vehículo' });
        }

        // Devolver una respuesta de éxito
        res.status(201).json({ message: 'Vehículo creado exitosamente.', vehiculoId: id_placa });
    });
});


// Ruta para enviar código de verificación------------------------------
routes.post('/sendVerificationCode', (req, res) => {
    const { correo } = req.body;

    // Validar que se reciba el correo
    if (!correo) {
        return res.status(400).json({ error: 'Por favor, proporcione un correo electrónico.' });
    }

    // Generar un código de verificación aleatorio
    const codigo_verificacion = crypto.randomInt(100000, 999999).toString(); // Código de 6 dígitos

    // Consulta SQL para verificar si el correo existe
    const query = 'SELECT * FROM usuarios WHERE correo = ?';

    // Ejecutar la consulta usando req.connection
    req.connection.query(query, [correo], (err, result) => {
        if (err) {
            console.error('Error al consultar el correo:', err);
            return res.status(500).json({ error: 'Error al consultar el correo' });
        }

        if (result.length > 0) {
            // Si el correo existe, actualizar el código de verificación en la base de datos
            const updateQuery = 'UPDATE usuarios SET codigo_verificacion = ? WHERE correo = ?';

            req.connection.query(updateQuery, [codigo_verificacion, correo], (updateErr) => {
                if (updateErr) {
                    console.error('Error al actualizar el código de verificación:', updateErr);
                    return res.status(500).json({ error: 'Error al actualizar el código de verificación' });
                }

                // Enviar correo de verificación
                const mailOptions = {
                    from: "campusrideapps@gmail.com",
                    to: correo,
                    subject: "Restablecimiento de contraseña de Campus Ride",
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
                            <p>Hola, ${result[0].nombre}</p>
                            <p>Tu código de verificación es:</p>
                            <p class="code">${codigo_verificacion}</p>
                            <p>¡Escribe el código para restablecer tu contraseña!</p>
                            <p>Saludos,<br/>El equipo de Campus Ride</p>
                          </div>
                        </body>
                      </html>
                    `,
                };

                transporter.sendMail(mailOptions, (error) => {
                    if (error) {
                        console.error('Error al enviar el correo:', error);
                        return res.status(500).json({ error: 'Error al enviar el correo de verificación' });
                    }

                    // Devolver una respuesta de éxito
                    res.status(200).json({ message: 'Se ha enviado un código de verificación a tu correo.' });
                });
            });
        } else {
            // El correo no existe
            res.status(404).json({ error: 'El correo electrónico no está registrado.' });
        }
    });
});

routes.post('/verifyCode', (req, res) => {
    const { correo, codigo_verificacion } = req.body;

    // Validar que se reciban ambos parámetros
    if (!correo || !codigo_verificacion) {
        return res.status(400).json({ error: 'Correo y código de verificación son requeridos.' });
    }

    // Consulta SQL para verificar si el código coincide
    const query = `
        SELECT * FROM usuarios WHERE correo = ? AND codigo_verificacion = ?
    `;

    req.connection.query(query, [correo, codigo_verificacion], (err, result) => {
        if (err) {
            console.error('Error al verificar el código:', err);
            return res.status(500).json({ error: 'Error al verificar el código' });
        }

        if (result.length > 0) {
            // El código de verificación es correcto
            res.status(200).json({ success: true, message: 'Código de verificación correcto.' });
        } else {
            // El código de verificación es incorrecto
            res.status(400).json({ success: false, message: 'Código de verificación incorrecto.' });
        }
    });
});

// Ruta para restablecer la contraseña sin encriptación
routes.post('/newPassword', (req, res) => {
    const { correo, contraseña } = req.body;

    // Validar que se reciban ambos parámetros
    if (!correo || !contraseña) {
        return res.status(400).json({ error: 'Correo y nueva contraseña son requeridos.' });
    }

    // Consulta SQL para actualizar la contraseña en la base de datos
    const query = 'UPDATE usuarios SET contraseña = ? WHERE correo = ?';

    req.connection.query(query, [contraseña, correo], (updateErr) => {
        if (updateErr) {
            console.error('Error al actualizar la contraseña:', updateErr);
            return res.status(500).json({ error: 'Error al actualizar la contraseña' });
        }

        // Devolver una respuesta de éxito
        res.status(200).json({ message: 'La contraseña ha sido actualizada exitosamente.' });
    });
});





module.exports = routes;
