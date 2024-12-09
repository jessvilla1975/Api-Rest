-- Elimina las tablas en el orden correcto si ya existen
DROP TABLE IF EXISTS historial_viajes_pasajero;
DROP TABLE IF EXISTS calificaciones;
DROP TABLE IF EXISTS mesa_ayuda;
DROP TABLE IF EXISTS ubicacion;
DROP TABLE IF EXISTS vehiculo;
DROP TABLE IF EXISTS viaje;
DROP TABLE IF EXISTS conductor;
DROP TABLE IF EXISTS pasajero;



DROP TABLE IF EXISTS usuarios;


-- Tabla usuarios
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    genero VARCHAR(10),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(15),
    direccion VARCHAR(255) DEFAULT NULL,
    fecha_nacimiento DATE,
    contraseña VARCHAR(255) NOT NULL,
    codigo_verificacion VARCHAR(100) DEFAULT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'pasajero'
);

-- Tabla conductor
CREATE TABLE conductor (
    id_conductor INT PRIMARY KEY,
    calificacion_conductor INT DEFAULT NULL,
    estado_disponibilidad BOOLEAN DEFAULT NULL,
    numero_licencia VARCHAR(100) NOT NULL,
    fecha_vencimiento DATE,
    foto_perfil VARCHAR(100) DEFAULT NULL,
    documento_verificacion VARCHAR(100) DEFAULT NULL,
    FOREIGN KEY (id_conductor) REFERENCES usuarios (id)
);

-- Tabla pasajero
CREATE TABLE pasajero (
    id_pasajero INT PRIMARY KEY,
    calificacion_pasajero INT DEFAULT NULL,
    FOREIGN KEY (id_pasajero) REFERENCES usuarios (id)
);

-- Tabla vehiculo
CREATE TABLE vehiculo (
    id_placa VARCHAR(20) PRIMARY KEY,
    id_conductor INT NOT NULL,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    ano VARCHAR(4) NOT NULL,
    color VARCHAR(100) NOT NULL,
    capacidad_pasajeros VARCHAR(4) NOT NULL,
    FOREIGN KEY (id_conductor) REFERENCES conductor (id_conductor)
);

-- Tabla viaje
CREATE TABLE viaje (
    id_viaje INT PRIMARY KEY AUTO_INCREMENT,
    id_conductor INT DEFAULT NULL,
    id_usuario INT NOT NULL,
    origen VARCHAR(255) NOT NULL,
    destino VARCHAR(255) NOT NULL,
    fecha DATE NOT NULL,
    horaviaje TIME NOT NULL,
    distancia_recorrido FLOAT NOT NULL,
    duracionViaje FLOAT NOT NULL,
    costo_viaje FLOAT,
    estado_viaje VARCHAR(100) NOT NULL DEFAULT 'En proceso',
    FOREIGN KEY (id_conductor) REFERENCES conductor (id_conductor),
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id)
);

-- Tabla calificaciones
CREATE TABLE calificaciones (
    id_calificacion INT PRIMARY KEY AUTO_INCREMENT,
    id_viaje INT NOT NULL,
    puntuacion INT CHECK (puntuacion >= 1 AND puntuacion <= 5),
    comentario VARCHAR(100),
    FOREIGN KEY (id_viaje) REFERENCES viaje (id_viaje)
);

-- Tabla historial_viajes_pasajero
CREATE TABLE historial_viajes_pasajero (
    id_historial INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    id_viaje INT NOT NULL,
    id_conductor INT DEFAULT NULL,
    origen VARCHAR(255) NOT NULL,
    destino VARCHAR(255) NOT NULL,
    fecha DATE NOT NULL,
    hora_salida TIME NOT NULL,
    hora_llegada TIME DEFAULT NULL,
    costo_viaje FLOAT NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id),
    FOREIGN KEY (id_viaje) REFERENCES viaje (id_viaje),
    FOREIGN KEY (id_conductor) REFERENCES conductor (id_conductor)
);

-- Crear la tabla ubicacion
CREATE TABLE ubicacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_viaje INT DEFAULT NULL,
    origen_latitud DECIMAL(10, 8) NOT NULL,
    origen_longitud DECIMAL(11, 8) NOT NULL,
    destino_latitud DECIMAL(10, 8) NOT NULL,
    destino_longitud DECIMAL(11, 8) NOT NULL,
    nombre_origen VARCHAR(255),
    nombre_destino VARCHAR(255),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id),
    FOREIGN KEY (id_viaje) REFERENCES viaje (id_viaje)
);


-- Tabla mesa_ayuda
CREATE TABLE mesa_ayuda (
    id_solicitud INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL,
    telefono VARCHAR(15),
    comentario TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'Pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Inserción de datos
-- Inserción de datos
INSERT INTO usuarios (id, genero, nombre, apellido, correo, telefono, direccion, fecha_nacimiento, contraseña, rol)
VALUES
(1, 'Masculino', 'Juan', 'Pérez', 'juan.perez@example.com', '1234567890', 'Calle Falsa 123', '1990-01-01', 'contraseña123', 'conductor'),
(2, 'Femenino', 'Ana', 'López', 'ana.lopez@example.com', '0987654321', 'Avenida Siempre Viva 742', '1995-05-15', '123123', 'pasajero'),
(3, 'Masculino', 'Carlos', 'Martínez', 'carlos.martinez@example.com', '1122334455', 'Carrera 12 45-67', '1988-09-12', 'carlos123', 'conductor'),
(4, 'Femenino', 'Laura', 'Gómez', 'laura.gomez@example.com', '5566778899', 'Calle 8 # 12-34', '1997-02-25', 'laura123', 'pasajero');

INSERT INTO conductor (id_conductor, calificacion_conductor, estado_disponibilidad, numero_licencia, fecha_vencimiento)
VALUES
(1, 5, TRUE, 'LIC-123456', '2025-12-31'),
(3, 4, TRUE, 'LIC-789101', '2026-05-15');

INSERT INTO pasajero (id_pasajero, calificacion_pasajero)
VALUES
(2, 4),
(4, 3);

INSERT INTO vehiculo (id_placa, id_conductor, marca, modelo, ano, color, capacidad_pasajeros)
VALUES
('ABC123', 1, 'Toyota', 'Corolla', '2020', 'Rojo', '5'),
('GHI789', 3, 'Ford', 'Focus', '2022', 'Negro', '5');

-- Inserción de solicitudes de viaje (para los pasajeros)
INSERT INTO viaje (id_conductor, id_usuario, origen, destino, fecha, horaviaje, distancia_recorrido, duracionViaje, costo_viaje)
VALUES
(1, 2, 'Universidad del Valle Sede Buga', 'UCEVA', '2024-12-10', '08:00:00', 15.0, 30.0, 4000),
(1, 2, 'Universidad del Valle Sede Buga', 'Universidad Autónoma de Occidente', '2024-12-12', '10:30:00', 20.0, 40.0, 4500),
(3, 4, 'UCEVA', 'Universidad del Valle Sede Buga', '2024-12-14', '09:00:00', 15.0, 30.0, 4000),
(3, 4, 'Universidad del Valle Sede Buga', 'Universidad del Valle Sede Tuluá', '2024-12-16', '11:30:00', 12.0, 25.0, 3500);

-- Inserción de historial de viajes para los pasajeros
INSERT INTO historial_viajes_pasajero (id_usuario, id_viaje, id_conductor, origen, destino, fecha, hora_salida, costo_viaje)
VALUES
(2, 1, 1, 'Universidad del Valle Sede Buga', 'UCEVA', '2024-12-10', '08:00:00', 4000),
(2, 2, 1, 'Universidad del Valle Sede Buga', 'Universidad Autónoma de Occidente', '2024-12-12', '10:30:00', 4500),
(4, 3, 3, 'UCEVA', 'Universidad del Valle Sede Buga', '2024-12-14', '09:00:00', 4000),
(4, 4, 3, 'Universidad del Valle Sede Buga', 'Universidad del Valle Sede Tuluá', '2024-12-16', '11:30:00', 3500);

-- Inserción de datos en la tabla ubicacion
INSERT INTO ubicacion (id_usuario, id_viaje, origen_latitud, origen_longitud, destino_latitud, destino_longitud, nombre_origen, nombre_destino)
VALUES
(2, 1, 3.89816600, -76.30131500, 4.2214, -77.1098, 'Universidad del Valle Sede Buga', 'UCEVA'),
(2, 2, 3.89816600, -76.30131500, 3.7919, -76.2740, 'Universidad del Valle Sede Buga', 'Universidad Autónoma de Occidente'),
(4, 3, 4.06387300, -76.19986800, 4.2214, -77.1098, 'UCEVA', 'Universidad del Valle Sede Buga'),
(4, 4, 3.89816600, -76.30131500, 4.0921, -76.2021, 'Universidad del Valle Sede Buga', 'Universidad del Valle Sede Tuluá');
