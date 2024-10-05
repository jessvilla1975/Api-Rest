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
    const { nombre, apellido, correo, telefono, direccion, fecha_nacimiento, contraseña } = req.body;

    // Validar que se reciban todos los campos necesarios
    if (!nombre || !apellido || !correo || !contraseña) {
        return res.status(400).json({ error: 'Por favor, complete todos los campos obligatorios.' });
    }

    // Generar un código de verificación aleatorio
    const codigo_verificacion = crypto.randomInt(100000, 999999).toString(); // Código de 6 dígitos

    // Consulta SQL para insertar un nuevo usuario
    const query = `
        INSERT INTO usuarios (nombre, apellido, correo, telefono, direccion, fecha_nacimiento, contraseña, codigo_verificacion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Ejecutar la consulta usando req.connection
    req.connection.query(query, [nombre, apellido, correo, telefono, direccion, fecha_nacimiento, contraseña, codigo_verificacion], (err, result) => {
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
            res.status(201).json({ message: 'Usuario creado exitosamente. Se ha enviado un código de verificación a tu correo.', userId: result.insertId });
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

module.exports = routes;
