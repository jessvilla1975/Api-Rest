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

async function getVerification(templateData) {
    try {
        let template = await fs.readFile(path.join(__dirname, 'emailTemplates/verification.html'), 'utf8');
        
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


// Ruta para nuevo usuario--------------------------------
routes.post('/newUser', async (req, res) => {
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
        rol
    } = req.body;

    // Validar que se reciban todos los campos necesarios
    if (!id || !nombre || !apellido || !correo || !contraseña || !genero) {
        return res.status(400).json({ error: 'Por favor, complete todos los campos obligatorios.' });
    }

    // Verificar si el correo ya existe
    const checkEmailQuery = 'SELECT correo FROM usuarios WHERE correo = ?';
    req.connection.query(checkEmailQuery, [correo], (checkErr, checkResult) => {
        if (checkErr) {
            console.error('Error al verificar el correo:', checkErr);
            return res.status(500).json({ error: 'Error al verificar el correo' });
        }

        // Si el correo ya está registrado
        if (checkResult.length > 0) {
            return res.status(400).json({ 
                error: 'Este correo electrónico ya está registrado',
                code: 'EMAIL_EXISTS'
            });
        }

        // Continuar con el registro
        const codigo_verificacion = crypto.randomInt(1000, 10000).toString();
        const userRole = rol || 'pasajero';

        const insertQuery = `
            INSERT INTO usuarios (
                id, 
                genero, 
                nombre, 
                apellido, 
                correo, 
                telefono, 
                direccion, 
                fecha_nacimiento, 
                contraseña, 
                codigo_verificacion,
                rol
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        req.connection.query(
            insertQuery, 
            [
                id, 
                genero, 
                nombre, 
                apellido, 
                correo, 
                telefono, 
                direccion, 
                fecha_nacimiento, 
                contraseña, 
                codigo_verificacion,
                userRole
            ], 
            async (insertErr, result) => {
                if (insertErr) {
                    console.error('Error al insertar el usuario:', insertErr);
                    return res.status(500).json({ error: 'Error al crear el usuario' });
                }

                try {
                    // Preparar datos para el template
                    const templateData = {
                        nombre,
                        codigo_verificacion,
                        correo
                    };

                    // Obtener el HTML del correo
                    const htmlContent = await getVerification(templateData);

                    // Configurar el correo
                    const mailOptions = {
                        from: "campusrideapps@gmail.com",
                        to: correo,
                        subject: 'Código de Verificación - CampusRide',
                        html: htmlContent
                    };

                    // Enviar el correo
                    await transporter.sendMail(mailOptions);

                    // Respuesta exitosa
                    res.status(201).json({ 
                        message: 'Usuario creado exitosamente. Se ha enviado un código de verificación a tu correo.', 
                        userId: id,
                        rol: userRole
                    });

                } catch (mailErr) {
                    console.error('Error al enviar el correo:', mailErr);
                    res.status(500).json({ 
                        error: 'Usuario creado, pero ocurrió un problema al enviar el correo de verificación.' 
                    });
                }
            }
        );
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

    if (!correo || !contraseña) {
        return res.status(400).json({ error: 'Por favor, complete todos los campos obligatorios.' });
    }

    const query = `
        SELECT id, rol FROM usuarios WHERE correo = ? AND contraseña = ?
    `;

    req.connection.query(query, [correo, contraseña], (err, result) => {
        if (err) {
            console.error('Error al validar el usuario:', err);
            return res.status(500).json({ error: 'Error al validar el usuario' });
        }

        if (result.length > 0) {
            const { id, rol } = result[0];
            return res.status(200).json({ message: 'Usuario validado', id, rol });
        } else {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
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

async function getRecoveryTemplate(templateData) {
    try {
        let template = await fs.readFile(path.join(__dirname, 'emailTemplates/recoveryPassword.html'), 'utf8');
        
        // Reemplazar las variables en el template
        Object.keys(templateData).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            template = template.replace(regex, templateData[key]);
        });
        
        return template;
    } catch (error) {
        console.error('Error al leer el template recoveryPassword:', error);
        throw error;
    }
}

// Ruta para enviar código de verificación con recoveryPassword.html
routes.post('/sendVerificationCode', async (req, res) => {
    const { correo } = req.body;

    // Validar que se reciba el correo
    if (!correo) {
        return res.status(400).json({ error: 'Por favor, proporcione un correo electrónico.' });
    }

    // Generar un código de verificación aleatorio
    const codigo_verificacion = crypto.randomInt(1000, 10000).toString(); // Código de 4 dígitos

    // Consulta SQL para verificar si el correo existe
    const query = 'SELECT * FROM usuarios WHERE correo = ?';

    try {
        req.connection.query(query, [correo], async (err, result) => {
            if (err) {
                console.error('Error al consultar el correo:', err);
                return res.status(500).json({ error: 'Error al consultar el correo' });
            }

            if (result.length > 0) {
                // Si el correo existe, actualizar el código de verificación en la base de datos
                const updateQuery = 'UPDATE usuarios SET codigo_verificacion = ? WHERE correo = ?';

                req.connection.query(updateQuery, [codigo_verificacion, correo], async (updateErr) => {
                    if (updateErr) {
                        console.error('Error al actualizar el código de verificación:', updateErr);
                        return res.status(500).json({ error: 'Error al actualizar el código de verificación' });
                    }

                    try {
                        // Preparar datos para el template
                        const templateData = {
                            nombre: result[0].nombre,
                            codigo_verificacion
                        };

                        // Obtener el HTML del correo desde recoveryPassword.html
                        const htmlContent = await getRecoveryTemplate(templateData);

                        // Configurar el correo
                        const mailOptions = {
                            from: "campusrideapps@gmail.com",
                            to: correo,
                            subject: "Restablecimiento de contraseña de Campus Ride",
                            html: htmlContent
                        };

                        // Enviar el correo
                        await transporter.sendMail(mailOptions);

                        // Devolver una respuesta de éxito
                        res.status(200).json({ 
                            message: 'Se ha enviado un código de verificación a tu correo.' 
                        });

                    } catch (mailErr) {
                        console.error('Error al enviar el correo:', mailErr);
                        res.status(500).json({ 
                            error: 'Código de verificación actualizado, pero ocurrió un problema al enviar el correo.' 
                        });
                    }
                });
            } else {
                // El correo no existe
                res.status(404).json({ error: 'El correo electrónico no está registrado.' });
            }
        });
    } catch (error) {
        console.error('Error en el proceso:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
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
    const {
        nombre,
        apellido,
        genero,
        correo,
        telefono,
        direccion,
        fechaNacimiento,
        contraseña
    } = req.body;

    // Verificar que los campos requeridos estén presentes
    if (!nombre || !apellido || !genero || !correo) {
        return res.status(400).json({ error: 'Por favor, complete todos los campos obligatorios.' });
    }

    const updateQuery = `
        UPDATE usuarios
        SET 
            nombre = ?, 
            apellido = ?, 
            genero = ?, 
            correo = ?, 
            telefono = ?, 
            direccion = ?, 
            fecha_nacimiento = ?, 
            contraseña = ?
        WHERE id = ?
    `;

    req.connection.query(
        updateQuery,
        [nombre, apellido, genero, correo, telefono, direccion, fechaNacimiento, contraseña, userId],
        (err, result) => {
            if (err) {
                console.error('Error al actualizar el usuario:', err);
                return res.status(500).json({ error: 'Error al actualizar el usuario' });
            }

            res.status(200).json({ message: 'Usuario actualizado correctamente.' });
        }
    );
});

// Ruta para actualizar conductor
routes.put('/updateConductor/:id', (req, res) => {
    const userId = req.params.id;
    const {
        nombre,
        apellido,
        genero,
        correo,
        telefono,
        direccion,
        fechaNacimiento,
        contraseña,
        numeroLicencia,
        idPlaca,
        color,
        marca,
        modelo,
        ano,
        capacidadPasajeros,
        fechaVencimiento
    } = req.body;

    // Verificar que los campos requeridos estén presentes
    if (!nombre || !apellido || !genero || !correo || !numeroLicencia || !idPlaca) {
        return res.status(400).json({ error: 'Por favor, complete todos los campos obligatorios.' });
    }

    // Consulta SQL para actualizar datos del conductor, vehículo y usuario
    const updateQuery = `
        UPDATE usuarios u
        JOIN conductor c ON u.id = c.id_conductor
        JOIN vehiculo v ON v.id_conductor = c.id_conductor
        SET 
            u.nombre = ?, 
            u.apellido = ?, 
            u.genero = ?, 
            u.correo = ?, 
            u.telefono = ?, 
            u.direccion = ?, 
            u.fecha_nacimiento = ?, 
            u.contraseña = ?, 
            c.numero_licencia = ?, 
            c.fecha_vencimiento = ?, 
            v.id_placa = ?, 
            v.color = ?, 
            v.marca = ?, 
            v.modelo = ?, 
            v.ano = ?, 
            v.capacidad_pasajeros = ?
        WHERE u.id = ? AND c.id_conductor = ? AND v.id_conductor = ?
    `;

    req.connection.query(
        updateQuery,
        [
            nombre, 
            apellido, 
            genero, 
            correo, 
            telefono, 
            direccion, 
            fechaNacimiento, 
            contraseña, 
            numeroLicencia, 
            fechaVencimiento, 
            idPlaca, 
            color, 
            marca, 
            modelo, 
            ano, 
            capacidadPasajeros, 
            userId, 
            userId, 
            userId
        ],
        (err, result) => {
            if (err) {
                console.error('Error al actualizar el conductor:', err);
                return res.status(500).json({ error: 'Error al actualizar el conductor' });
            }

            res.status(200).json({ message: 'Conductor actualizado correctamente.' });
        }
    );
});


// Ruta para obtener los datos de un pasajero por su ID
routes.get('/getPassengerById/:id', (req, res) => {
    const passengerId = req.params.id;

    // Consulta SQL para obtener los datos del pasajero
    const query = 'SELECT * FROM pasajeros WHERE id = ?';

    // Ejecutar la consulta usando req.connection
    req.connection.query(query, [passengerId], (err, result) => {
        if (err) {
            console.error('Error al obtener el pasajero:', err);
            return res.status(500).json({ error: 'Error al obtener los datos del pasajero' });
        }

        // Verificar si se encontró el pasajero
        if (result.length === 0) {
            return res.status(404).json({ error: 'Pasajero no encontrado' });
        }

        // Devolver los datos del pasajero
        res.status(200).json(result[0]);  // Devuelve el primer registro (suponiendo que solo hay uno con ese ID)
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


// Ruta para obtener usuarios por ID (Para el edit)
routes.get('/usuariosid/:id', async (req, res) => {
    const userId = req.params.id;
    const connection = req.connection;

    try {
        // Query principal que obtiene datos de usuario, conductor y vehículo
        const query = `
            SELECT 
                u.id,
                u.genero,
                u.nombre,
                u.apellido,
                u.correo,
                u.telefono,
                u.direccion,
                u.fecha_nacimiento as fechaNacimiento,
                u.contraseña,
                c.numero_licencia,
                c.fecha_vencimiento,
                v.id_placa,
                v.marca,
                v.modelo,
                v.ano,
                v.color,
                v.capacidad_pasajeros,
                CASE 
                    WHEN c.id_conductor IS NOT NULL THEN 'conductor'
                    WHEN p.id_pasajero IS NOT NULL THEN 'pasajero'
                    ELSE 'usuario'
                END as tipo_usuario
            FROM usuarios u
            LEFT JOIN conductor c ON u.id = c.id_conductor
            LEFT JOIN pasajero p ON u.id = p.id_pasajero
            LEFT JOIN vehiculo v ON c.id_conductor = v.id_conductor
            WHERE u.id = ?
        `;

        const [results] = await connection.promise().query(query, [userId]);

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const user = results[0];
        let response = {
            success: true,
            data: {
                tipo_usuario: user.tipo_usuario,
                usuario: {
                    id: user.id,
                    genero: user.genero,
                    nombre: user.nombre,
                    apellido: user.apellido,
                    correo: user.correo,
                    telefono: user.telefono,
                    direccion: user.direccion,
                    fechaNacimiento: user.fechaNacimiento,
                    contraseña: user.contraseña
                }
            }
        };

        // Si es conductor, agregamos la información adicional
        if (user.tipo_usuario === 'conductor') {
            response.data.informacion_conductor = {
                numero_licencia: user.numero_licencia,
                fecha_vencimiento: user.fecha_vencimiento,
                vehiculo: {
                    id_placa: user.id_placa,
                    marca: user.marca,
                    modelo: user.modelo,
                    ano: user.ano,
                    color: user.color,
                    capacidad_pasajeros: user.capacidad_pasajeros
                }
            };
        }

        res.json(response);

    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// Ruta para obtener todos los datos básicos de un conductor por ID
routes.get('/conductor/:id', async (req, res) => {
    const userId = req.params.id;
    const connection = req.connection;

    try {
        // Query que obtiene todos los datos básicos del conductor y su vehículo
        const query = `
            SELECT 
                u.id,
                u.genero,
                u.nombre,
                u.apellido,
                u.correo,
                u.telefono,
                u.direccion,
                u.fecha_nacimiento as fechaNacimiento,
                u.contraseña,
                c.numero_licencia,
                c.fecha_vencimiento,
                v.id_placa,
                v.marca,
                v.modelo,
                v.ano,
                v.color,
                v.capacidad_pasajeros
            FROM usuarios u
            LEFT JOIN conductor c ON u.id = c.id_conductor
            LEFT JOIN vehiculo v ON c.id_conductor = v.id_conductor
            WHERE u.id = ?
        `;

        const [results] = await connection.promise().query(query, [userId]);

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Conductor no encontrado'
            });
        }

        const driver = results[0];
        let response = {
            success: true,
            data: {
                id: driver.id,
                genero: driver.genero,
                nombre: driver.nombre,
                apellido: driver.apellido,
                correo: driver.correo,
                telefono: driver.telefono,
                direccion: driver.direccion,
                fechaNacimiento: driver.fechaNacimiento,
                contraseña: driver.contraseña,
                numero_licencia: driver.numero_licencia,
                fecha_vencimiento: driver.fecha_vencimiento,
                vehiculo: {
                    id_placa: driver.id_placa,
                    marca: driver.marca,
                    modelo: driver.modelo,
                    ano: driver.ano,
                    color: driver.color,
                    capacidad_pasajeros: driver.capacidad_pasajeros
                }
            }
        };

        res.json(response);

    } catch (error) {
        console.error('Error al obtener datos del conductor:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

routes.post('/viajes', (req, res) => {
    const { 
        id_conductor = null, // Default to null if not provided
        id_usuario, // Renombrado desde "id" a "id_usuario"
        origen, 
        destino, 
        fecha, 
        horaviaje, 
        distancia_recorrido, 
        duracionViaje, 
        costo_viaje 
    } = req.body;

    // Validar campos obligatorios
    if (!id_usuario || !origen || !destino || !fecha || !horaviaje) {
        return res.status(400).json({ 
            success: false, 
            error: 'Faltan campos obligatorios' 
        });
    }

    const query = `
        INSERT INTO viaje (
            id_conductor, 
            id_usuario, 
            origen, 
            destino, 
            fecha, 
            horaviaje, 
            distancia_recorrido, 
            duracionViaje, 
            costo_viaje, 
            estado_viaje
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    req.connection.query(
        query, 
        [
            id_conductor, 
            id_usuario, // Actualizado
            origen, 
            destino, 
            fecha, 
            horaviaje, 
            distancia_recorrido, 
            duracionViaje, 
            costo_viaje, 
            'En proceso' // Estado por defecto al crear un viaje
        ], 
        (err, result) => {
            if (err) {
                console.error('Error al crear el viaje:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Error al crear el viaje' 
                });
            }

            res.status(201).json({
                success: true,
                message: 'Viaje creado exitosamente',
                id_viaje: result.insertId
            });
        }
    );
});


// Ruta para obtener historial de viajes de un pasajero de la tabla de viajes

routes.get('/historialViajes/:id_usuario', (req, res) => {
    const userId = req.params.id_usuario;

    // Consulta SQL para obtener los viajes de un pasajero con información adicional
    const query = `
        SELECT 
            v.fecha, 
            v.horaviaje AS hora_salida, 
            ADDTIME(v.horaviaje, SEC_TO_TIME(v.duracionViaje * 60)) AS hora_llegada, 
            v.origen, 
            v.destino, 
            CONCAT(u.nombre, ' ', u.apellido) AS conductor, 
            v.costo_viaje AS costo 
        FROM viaje v
        LEFT JOIN usuarios u ON v.id_conductor = u.id
        WHERE v.id_usuario = ?
        ORDER BY v.fecha DESC, v.horaviaje DESC
    `;

    req.connection.query(query, [userId], (err, result) => {
        if (err) {
            console.error('Error al obtener los viajes:', err);
            return res.status(500).json({ error: 'Error al obtener los viajes' });
        }

        // Devuelve los resultados en formato JSON
        res.json(result);
    });
});


// Ruta para obtener historial de viajes del conductor
routes.get('/historialViajesConductor/:id_conductor', (req, res) => {
    const conductorId = req.params.id_conductor;

    // Consulta SQL para obtener el historial de viajes de un conductor con información adicional
    const query = `
        SELECT 
            v.fecha, 
            v.horaviaje AS hora_salida, 
            ADDTIME(v.horaviaje, SEC_TO_TIME(v.duracionViaje * 60)) AS hora_llegada, 
            v.origen, 
            v.destino, 
            CONCAT(u.nombre, ' ', u.apellido) AS pasajero, 
            v.costo_viaje AS costo 
        FROM viaje v
        LEFT JOIN usuarios u ON v.id_usuario = u.id
        WHERE v.id_conductor = ?
        ORDER BY v.fecha DESC, v.horaviaje DESC
    `;

    req.connection.query(query, [conductorId], (err, result) => {
        if (err) {
            console.error('Error al obtener el historial de viajes:', err);
            return res.status(500).json({ error: 'Error al obtener el historial de viajes' });
        }

        // Devuelve los resultados en formato JSON
        res.json(result);
    });
});

// Ruta para obtener las solicitudes de viajes en estado "En proceso"
routes.get('/solicitudViajes', (req, res) => {
    // Consulta SQL para obtener las solicitudes en estado "En proceso" y el nombre del usuario
    const query = `
        SELECT 
            v.id_viaje,
            CONCAT(u.nombre, ' ', u.apellido) AS usuario,
            v.origen,
            v.destino,
            v.fecha,
            v.horaviaje AS hora_salida,
            v.estado_viaje,
            v.costo_viaje
        FROM viaje v
        JOIN usuarios u ON v.id_usuario = u.id
        WHERE v.estado_viaje = 'En proceso'
        ORDER BY v.fecha DESC, v.horaviaje DESC
    `;

    req.connection.query(query, (err, result) => {
        if (err) {
            console.error('Error al obtener las solicitudes de viajes:', err);
            return res.status(500).json({ error: 'Error al obtener las solicitudes de viajes' });
        }

        // Devuelve los resultados en formato JSON
        res.json(result);
    });
});


//Ruta para aceptar solicitud de viaje donde se actualiza el estado del viaje a "Aceptado" y en viajes id:conductor tambien se envia

routes.put('/aceptarViaje/:id_viaje', (req, res) => {
    const idViaje = req.params.id_viaje; // ID del viaje desde la URL
    const { id_conductor } = req.body; // ID del conductor desde el cuerpo de la solicitud

    if (!id_conductor) {
        return res.status(400).json({ error: 'Se requiere el id_conductor para aceptar el viaje.' });
    }

    // Consulta SQL para actualizar el estado del viaje y asignar el id_conductor
    const query = `
        UPDATE viaje
        SET estado_viaje = 'Aceptado', id_conductor = ?
        WHERE id_viaje = ? AND estado_viaje = 'En proceso'
    `;

    req.connection.query(query, [id_conductor, idViaje], (err, result) => {
        if (err) {
            console.error('Error al aceptar el viaje:', err);
            return res.status(500).json({ error: 'Error al aceptar el viaje.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Viaje no encontrado o ya no está en estado "En proceso".' });
        }

        res.json({ message: 'Viaje aceptado exitosamente.' });
    });
});

// Add this to your existing routes file

routes.post('/ubicacion', async (req, res) => {
    const { 
        id_usuario,
        id_viaje, // Campo opcional
        origen_latitud, 
        origen_longitud, 
        destino_latitud, 
        destino_longitud,
        nombre_origen,
        nombre_destino
    } = req.body;

    // Validaciones
    if (!id_usuario || 
        origen_latitud === undefined || 
        origen_longitud === undefined || 
        destino_latitud === undefined || 
        destino_longitud === undefined) {
        return res.status(400).json({ error: 'Por favor, proporcione todos los datos de ubicación necesarios.' });
    }

    const insertQuery = `
        INSERT INTO ubicacion (
            id_usuario, 
            id_viaje, 
            origen_latitud, 
            origen_longitud, 
            destino_latitud, 
            destino_longitud,
            nombre_origen,
            nombre_destino,
            fecha_registro
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    req.connection.query(
        insertQuery, 
        [
            id_usuario, 
            id_viaje || null, // Usar NULL si no se proporciona id_viaje
            origen_latitud, 
            origen_longitud, 
            destino_latitud, 
            destino_longitud,
            nombre_origen,
            nombre_destino
        ], 
        (insertErr, result) => {
            if (insertErr) {
                return res.status(500).json({ error: 'Error al insertar los datos.', details: insertErr });
            }
            res.status(201).json({ message: 'Ubicación registrada exitosamente.', id: result.insertId });
        }
    );
});



// Ruta para obtener el último ID de viaje
routes.get('/ultimo-viaje/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;

    const query = `
        SELECT id_viaje 
        FROM viaje 
        WHERE id_usuario = ? 
        ORDER BY id_viaje DESC 
        LIMIT 1
    `;

    req.connection.query(query, [id_usuario], (err, results) => {
        if (err) {
            console.error('Error al obtener el último viaje:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Error al recuperar el último viaje' 
            });
        }

        if (results.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'No se encontraron viajes para este usuario' 
            });
        }

        res.status(200).json({ 
            success: true, 
            id_viaje: results[0].id_viaje 
        });
    });
});


// Ruta para obtener las coordenadas de un viaje por ID
routes.get('/coordenadas-viaje/:id_viaje', async (req, res) => {
    const { id_viaje } = req.params;

    const query = `
        SELECT 
            id_usuario,
            id_viaje,
            origen_latitud,
            origen_longitud,
            destino_latitud,
            destino_longitud,
            nombre_origen,
            nombre_destino,
            fecha_registro
        FROM ubicacion
        WHERE id_viaje = ?
    `;

    req.connection.query(query, [id_viaje], (err, results) => {
        if (err) {
            console.error('Error al obtener las coordenadas del viaje:', err);
            return res.status(500).json({
                success: false,
                error: 'Error al recuperar las coordenadas del viaje'
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No se encontraron coordenadas para este viaje'
            });
        }

        // Wrap the first result in a 'data' object to match the expected structure
        res.status(200).json({
            success: true,
            data: results[0]  // This ensures the coordinates are under a 'data' key
        });
    });
});



module.exports = routes;
