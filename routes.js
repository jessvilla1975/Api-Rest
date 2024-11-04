const express = require('express');
const routes = express.Router();
const nodemailer = require("nodemailer");
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

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

// Ruta para actualizar un usuario
routes.put('/updateUser/:id', (req, res) => {
    const userId = req.params.id;
    const { genero, nombre, apellido, correo, telefono, direccion, fecha_nacimiento, contraseña } = req.body;

    // Validar que se reciban todos los campos necesarios
    if (!genero || !nombre || !apellido || !correo || !telefono || !direccion || !fecha_nacimiento || !contraseña) {
        return res.status(400).json({ error: 'Por favor, complete todos los campos obligatorios.' });
    }

    // Consulta SQL para actualizar el usuario
    const query = `
        UPDATE usuarios SET 
            genero = ?, 
            nombre = ?, 
            apellido = ?, 
            correo = ?, 
            telefono = ?, 
            direccion = ?, 
            fecha_nacimiento = ?, 
            contraseña = ? 
        WHERE id = ?
    `;

    // Ejecutar la consulta usando req.connection
    req.connection.query(query, [genero, nombre, apellido, correo, telefono, direccion, fecha_nacimiento, contraseña, userId], (err, result) => {
        if (err) {
            console.error('Error al actualizar el usuario:', err);
            return res.status(500).json({ error: 'Error al actualizar el usuario' });
        }

        // Verificar si se actualizó algún registro
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Devolver una respuesta de éxito
        res.status(200).json({ message: 'Usuario actualizado exitosamente' });
    });
});

// Ruta para actualizar un conductor
routes.put('/updateConductor/:id', (req, res) => {
    const id_conductor = req.params.id; // Obtener el ID del conductor desde la URL
    const { numero_licencia, fecha_vencimiento } = req.body; // Obtener los datos del cuerpo de la solicitud

    // Validar que se reciban todos los campos necesarios
    if (!numero_licencia || !fecha_vencimiento) {
        return res.status(400).json({ error: 'Por favor, complete todos los campos obligatorios: numero_licencia, fecha_vencimiento.' });
    }

    // Consulta SQL para actualizar el conductor
    const query = `
        UPDATE conductor
        SET numero_licencia = ?, fecha_vencimiento = ?
        WHERE id_conductor = ?
    `;

    // Ejecutar la consulta usando req.connection
    req.connection.query(query, [numero_licencia, fecha_vencimiento, id_conductor], (err, result) => {
        if (err) {
            console.error('Error al actualizar el conductor:', err);
            return res.status(500).json({ error: 'Error al actualizar el conductor' });
        }

        // Verificar si se actualizó algún registro
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Conductor no encontrado' });
        }

        // Devolver una respuesta de éxito
        res.status(200).json({ message: 'Conductor actualizado exitosamente.' });
    });
});

// Función para leer y preparar el template
async function getEmailTemplate(templateData) {
    try {
        let template = await fs.readFile(path.join(__dirname, 'emailTemplates/helpDesk.html'), 'utf8');
        
        // Reemplazar las variables en el template
        Object.keys(templateData).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            template = template.replace(regex, templateData[key]);
        });
        
        return template;
    } catch (error) {
        console.error('Error al leer el template:', error);
        throw error;
    }
}

// Ruta POST para la mesa de ayuda
routes.post('/helpDesk', async (req, res) => {
    const { nombre, correo, telefono, comentario } = req.body;

    // Validar campos requeridos
    if (!nombre || !correo || !comentario) {
        return res.status(400).json({ 
            error: 'Por favor, complete los campos obligatorios (nombre, correo y comentario).' 
        });
    }

    // Insertar en la base de datos
    const query = `
        INSERT INTO mesa_ayuda (nombre, correo, telefono, comentario)
        VALUES (?, ?, ?, ?)
    `;

    req.connection.query(query, [nombre, correo, telefono, comentario], async (err, result) => {
        if (err) {
            console.error('Error al crear la solicitud:', err);
            return res.status(500).json({ error: 'Error al crear la solicitud' });
        }

        const id_solicitud = result.insertId;
        const fecha = new Date().toLocaleString();

        try {
            // Preparar datos para el template
            const templateData = {
                nombre,
                id_solicitud,
                estado: 'Pendiente',
                fecha,
                comentario
            };

            // Obtener el HTML del correo
            const htmlContent = await getEmailTemplate(templateData);

            // Configurar el correo
            const mailOptions = {
                from: "campusrideapps@gmail.com",
                to: correo,
                subject: `Ticket #${id_solicitud} - Mesa de Ayuda CampusRide`,
                html: htmlContent
            };

            // Enviar el correo
            await transporter.sendMail(mailOptions);

            // Respuesta exitosa
            res.status(201).json({ 
                message: 'Solicitud creada exitosamente', 
                id_solicitud,
                estado: 'Pendiente'
            });

        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ 
                error: 'Error al procesar la solicitud',
                details: error.message 
            });
        }
    });
});



module.exports = routes;
