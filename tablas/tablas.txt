-- Primero elimina las tablas que tienen claves foráneas que referencian otras tablas
DROP TABLE IF EXISTS historial_viajes;
DROP TABLE IF EXISTS calificaciones;
DROP TABLE IF EXISTS viaje;
DROP TABLE IF EXISTS vehiculo;
DROP TABLE IF EXISTS pasajero;
DROP TABLE IF EXISTS conductor;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS mesa_ayuda;

CREATE TABLE usuarios (
    id INT PRIMARY KEY NOT NULL,
    genero VARCHAR(10),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(15),
    direccion VARCHAR(255) DEFAULT NULL,
    fecha_nacimiento DATE,
    contraseña VARCHAR(255) NOT NULL,
    codigo_verificacion VARCHAR(100) DEFAULT NULL
);

CREATE TABLE conductor (
  id_conductor INT PRIMARY KEY NOT NULL,
  calificacion_conductor INT DEFAULT NULL,
  estado_disponibilidad BOOLEAN DEFAULT NULL,
  numero_licencia VARCHAR(100) NOT NULL,
  fecha_vencimiento DATE,
  foto_perfil VARCHAR(100) DEFAULT NULL,
  documento_verificacion VARCHAR(100) DEFAULT NULL,
  FOREIGN KEY (id_conductor) REFERENCES usuarios (id)
);

CREATE TABLE pasajero (
  id_pasajero INT PRIMARY KEY NOT NULL,
  calificacion_pasajero INT,
  FOREIGN KEY (id_pasajero) REFERENCES usuarios (id)
);

CREATE TABLE vehiculo (
  id_placa INT PRIMARY KEY NOT NULL,
  id_conductor INT NOT NULL,
  marca VARCHAR(100) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  ano VARCHAR(4) NOT NULL,  -- Cambiado a VARCHAR para almacenar el año como string
  color VARCHAR(100) NOT NULL,
  capacidad_pasajeros VARCHAR(4) NOT NULL,
  FOREIGN KEY (id_conductor) REFERENCES conductor (id_conductor)
);

-- Eliminada la tabla ubicacion

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

CREATE TABLE calificaciones (
  id_calificacion INT PRIMARY KEY AUTO_INCREMENT,
  id_viaje INT NOT NULL,
  puntuacion INT CHECK (puntuacion >= 1 AND puntuacion <= 5),
  comentario VARCHAR(100),
  FOREIGN KEY (id_viaje) REFERENCES viaje (id_viaje)
);

CREATE TABLE historial_viajes (
  registro_viaje INT PRIMARY KEY AUTO_INCREMENT,
  id_pasajero INT NOT NULL,
  id_viaje INT NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_pasajero) REFERENCES pasajero (id_pasajero),
  FOREIGN KEY (id_viaje) REFERENCES viaje (id_viaje)
);

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

ALTER TABLE usuarios ADD COLUMN rol VARCHAR(50) NOT NULL DEFAULT 'pasajero';

-- Insertar en la tabla usuarios
INSERT INTO usuarios (id, genero, nombre, apellido, correo, telefono, direccion, fecha_nacimiento, contraseña, codigo_verificacion)
VALUES
(1, 'Masculino', 'Juan', 'Pérez', 'juan.perez@example.com', '1234567890', 'Calle Falsa 123', '1990-01-01', 'contraseña123', NULL),
(2, 'Femenino', 'Ana', 'López', 'ana.lopez@example.com', '0987654321', 'Avenida Siempre Viva 742', '1995-05-15', '123123', NULL);

-- Insertar en la tabla conductor
INSERT INTO conductor (id_conductor, calificacion_conductor, estado_disponibilidad, numero_licencia, fecha_vencimiento, foto_perfil, documento_verificacion)
VALUES
(1, 5, TRUE, 'LIC-123456', '2025-12-31', NULL, NULL),
(2, 4, TRUE, 'LIC-654321', '2026-06-30', NULL, NULL);

-- Insertar en la tabla pasajero
INSERT INTO pasajero (id_pasajero, calificacion_pasajero)
VALUES
(1, 5),
(2, 4);

-- Insertar en la tabla vehiculo
INSERT INTO vehiculo (id_placa, id_conductor, marca, modelo, ano, color, capacidad_pasajeros)
VALUES
(1, 1, 'Toyota', 'Corolla', '2020', 'Rojo', '5'),
(2, 2, 'Honda', 'Civic', '2021', 'Azul', '5');

-- Insertar en la tabla viaje
INSERT INTO viaje (id_viaje, id_conductor, id_usuario, origen, destino, fecha, horaviaje, distancia_recorrido, duracionViaje, costo_viaje, estado_viaje)
VALUES
(1, 1, 1, 'Buenos Aires', 'Santiago', '2024-10-01', '10:00:00', 5.0, 30, 10.0, 'Completo'),
(2, 2, 2, 'Santiago', 'Buenos Aires', '2024-10-02', '11:00:00', 10.0, 45, 15.0, 'Completo');

-- Insertar en la tabla calificaciones
INSERT INTO calificaciones (id_viaje, puntuacion, comentario)
VALUES
(1, 5, 'Excelente servicio'),
(2, 4, 'Buen viaje, pero con retraso');

-- Insertar en la tabla historial_viajes
INSERT INTO historial_viajes (id_pasajero, id_viaje)
VALUES
(1, 1),
(2, 2);

INSERT INTO mesa_ayuda (nombre, correo, telefono, comentario)
VALUES
    ('Juan Pérez', 'juan.perez@example.com', '1234567890', 'Necesito ayuda con mi cuenta'),
    ('Ana López', 'ana.lopez@example.com', '0987654321', 'Problemas con la aplicación');
