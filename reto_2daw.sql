-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 19-11-2026 a las 23:26:17
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `reto_2daw`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `equipamientos`
--

DROP TABLE IF EXISTS `equipamientos`;
CREATE TABLE `equipamientos` (
  `id_equipamiento` int(10) UNSIGNED NOT NULL,
  `nombre` varchar(120) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `marca` varchar(100) NOT NULL,
  `modelo` varchar(100) NOT NULL,
  `categoria` enum('PORTATIL','SOBREMESA','PERIFERICO','AUDIOVISUAL','OTROS') NOT NULL,
  `id_ubicacion_actual` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `equipamientos`
--

INSERT INTO `equipamientos` (`id_equipamiento`, `nombre`, `descripcion`, `marca`, `modelo`, `categoria`, `id_ubicacion_actual`) VALUES
(1, 'Portatil Profesor 01', 'Portatil utilizado por el profesorado', 'Lenovo', 'ThinkPad E15', 'PORTATIL', 6),
(2, 'Portatil Alumno 01', 'Portatil para uso de alumnado', 'HP', '250 G9', 'PORTATIL', 3),
(3, 'Ordenador Sobremesa 01', 'Equipo de sobremesa del aula', 'Dell', 'OptiPlex 7010', 'SOBREMESA', 2),
(4, 'Ordenador Sobremesa 02', 'Equipo de sobremesa del aula', 'Dell', 'OptiPlex 7010', 'SOBREMESA', 3),
(5, 'Monitor 24 Pulgadas 01', 'Monitor externo para puesto informatico', 'LG', '24MP400', 'PERIFERICO', 4),
(6, 'Teclado USB 01', 'Teclado USB para ordenador', 'Logitech', 'K120', 'PERIFERICO', 1),
(7, 'Proyector Aula 101', 'Proyector utilizado para las clases', 'Epson', 'EB-E01', 'AUDIOVISUAL', 8),
(8, 'Altavoces Salon Actos', 'Sistema de altavoces para eventos', 'Logitech', 'Z333', 'AUDIOVISUAL', 8),
(9, 'Webcam Aula', 'Camara web para videoconferencias', 'Logitech', 'C920', 'PERIFERICO', 7),
(10, 'Material Electronico', 'Material diverso para mantenimiento', 'Varios', 'Lote 01', 'OTROS', 10);

--
-- Disparadores `equipamientos`
--
DROP TRIGGER IF EXISTS `trg_equipamiento_crear_historico`;
DELIMITER $$
CREATE TRIGGER `trg_equipamiento_crear_historico` AFTER INSERT ON `equipamientos` FOR EACH ROW BEGIN
    INSERT INTO historico_ubicaciones
        (id_equipamiento, id_ubicacion, fecha_inicio, fecha_fin)
    VALUES
        (NEW.id_equipamiento, NEW.id_ubicacion_actual, CURRENT_TIMESTAMP, NULL);
END
$$
DELIMITER ;
DROP TRIGGER IF EXISTS `trg_equipamiento_traslado`;
DELIMITER $$
CREATE TRIGGER `trg_equipamiento_traslado` BEFORE UPDATE ON `equipamientos` FOR EACH ROW BEGIN
    IF NEW.id_ubicacion_actual <> OLD.id_ubicacion_actual THEN
        UPDATE historico_ubicaciones
           SET fecha_fin = CURRENT_TIMESTAMP
         WHERE id_equipamiento = OLD.id_equipamiento
           AND fecha_fin IS NULL;

        INSERT INTO historico_ubicaciones
            (id_equipamiento, id_ubicacion, fecha_inicio, fecha_fin)
        VALUES
            (OLD.id_equipamiento, NEW.id_ubicacion_actual, CURRENT_TIMESTAMP, NULL);
    END IF;
END
$$
DELIMITER ;
DROP TRIGGER IF EXISTS `trg_equipamiento_ubicacion_inicial`;
DELIMITER $$
CREATE TRIGGER `trg_equipamiento_ubicacion_inicial` BEFORE INSERT ON `equipamientos` FOR EACH ROW BEGIN
    DECLARE v_id_almacen INT UNSIGNED;

    SELECT id_ubicacion
      INTO v_id_almacen
      FROM ubicaciones
     WHERE nombre = 'Almacén'
     LIMIT 1;

    IF v_id_almacen IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No existe la ubicación obligatoria Almacén';
    END IF;

    SET NEW.id_ubicacion_actual = v_id_almacen;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historico_ubicaciones`
--

DROP TABLE IF EXISTS `historico_ubicaciones`;
CREATE TABLE `historico_ubicaciones` (
  `id_historico` bigint(20) UNSIGNED NOT NULL,
  `id_equipamiento` int(10) UNSIGNED NOT NULL,
  `id_ubicacion` int(10) UNSIGNED NOT NULL,
  `fecha_inicio` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_fin` datetime DEFAULT NULL
) ;

--
-- Volcado de datos para la tabla `historico_ubicaciones`
--

INSERT INTO `historico_ubicaciones` (`id_historico`, `id_equipamiento`, `id_ubicacion`, `fecha_inicio`, `fecha_fin`) VALUES
(1, 1, 1, '2026-11-10 20:25:42', '2026-11-10 20:25:42'),
(2, 2, 1, '2026-11-10 20:25:42', '2026-11-10 20:25:42'),
(3, 3, 1, '2026-11-10 20:25:42', '2026-11-10 20:25:43'),
(4, 4, 1, '2026-11-10 20:25:42', '2026-11-10 20:25:43'),
(5, 5, 1, '2026-11-10 20:25:42', '2026-11-10 20:25:43'),
(6, 6, 1, '2026-11-10 20:25:42', NULL),
(7, 7, 1, '2026-11-10 20:25:42', '2026-11-10 20:25:43'),
(8, 8, 1, '2026-11-10 20:25:42', '2026-11-10 20:25:43'),
(9, 9, 1, '2026-11-10 20:25:42', '2026-11-10 20:25:43'),
(10, 10, 1, '2026-11-10 20:25:42', '2026-11-15 14:28:36'),
(11, 1, 5, '2026-11-10 20:25:42', '2026-11-10 20:25:43'),
(12, 2, 2, '2026-11-10 20:25:42', '2026-11-10 20:25:43'),
(13, 3, 2, '2026-11-10 20:25:43', NULL),
(14, 4, 3, '2026-11-10 20:25:43', NULL),
(15, 5, 4, '2026-11-10 20:25:43', NULL),
(16, 7, 2, '2026-11-10 20:25:43', '2026-11-10 20:25:43'),
(17, 8, 8, '2026-11-10 20:25:43', NULL),
(18, 9, 7, '2026-11-10 20:25:43', NULL),
(19, 1, 6, '2026-11-10 20:25:43', NULL),
(20, 2, 3, '2026-11-10 20:25:43', NULL),
(21, 7, 8, '2026-11-10 20:25:43', NULL),
(31, 10, 10, '2026-11-15 14:28:36', NULL);

--
-- Disparadores `historico_ubicaciones`
--
DROP TRIGGER IF EXISTS `trg_historico_unico_abierto_insert`;
DELIMITER $$
CREATE TRIGGER `trg_historico_unico_abierto_insert` BEFORE INSERT ON `historico_ubicaciones` FOR EACH ROW BEGIN
    IF NEW.fecha_fin IS NULL
       AND EXISTS (
            SELECT 1
              FROM historico_ubicaciones
             WHERE id_equipamiento = NEW.id_equipamiento
               AND fecha_fin IS NULL
       ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El equipamiento ya tiene una ubicación actual abierta';
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificaciones`
--

DROP TABLE IF EXISTS `notificaciones`;
CREATE TABLE `notificaciones` (
  `id_notificacion` int(10) UNSIGNED NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `descripcion` text NOT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `estado` enum('PENDIENTE','EN_PROCESO','REALIZADA') NOT NULL DEFAULT 'PENDIENTE',
  `id_usuario` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `notificaciones`
--

INSERT INTO `notificaciones` (`id_notificacion`, `titulo`, `descripcion`, `fecha_creacion`, `estado`, `id_usuario`) VALUES
(1, 'Ordenador no enciende', 'El ordenador del Aula 101 no se enciende correctamente.', '2026-09-15 09:15:00', 'REALIZADA', 2),
(2, 'Proyector con problemas', 'El proyector del Aula 101 muestra una imagen con poca luminosidad.', '2026-09-16 10:30:00', 'EN_PROCESO', 3),
(3, 'Teclado defectuoso', 'El teclado del puesto 05 no responde correctamente.', '2026-09-17 11:00:00', 'REALIZADA', 4),
(4, 'Cambio de monitor', 'Se solicita sustituir el monitor del puesto 08.', '2026-09-18 12:15:00', 'PENDIENTE', 5),
(5, 'Problema de red', 'El equipo del Aula 102 no tiene conexion a Internet.', '2026-09-19 08:45:00', 'EN_PROCESO', 2),
(7, 'as', 'a', '2026-11-10 20:42:23', 'REALIZADA', 7),
(8, 'a', 'a', '2026-11-11 11:47:47', 'PENDIENTE', 7),
(9, 'pene', 'aa', '2026-11-15 14:29:02', 'PENDIENTE', 7);

--
-- Disparadores `notificaciones`
--
DROP TRIGGER IF EXISTS `trg_notificacion_no_borrar_realizada`;
DELIMITER $$
CREATE TRIGGER `trg_notificacion_no_borrar_realizada` BEFORE DELETE ON `notificaciones` FOR EACH ROW BEGIN
    IF OLD.estado = 'REALIZADA' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Una notificación REALIZADA no puede eliminarse';
    END IF;
END
$$
DELIMITER ;
DROP TRIGGER IF EXISTS `trg_notificacion_solo_user`;
DELIMITER $$
CREATE TRIGGER `trg_notificacion_solo_user` BEFORE INSERT ON `notificaciones` FOR EACH ROW BEGIN
    DECLARE v_rol VARCHAR(10);

    SELECT rol
      INTO v_rol
      FROM usuarios
     WHERE id_usuario = NEW.id_usuario
     LIMIT 1;

    IF v_rol IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El usuario indicado no existe';
    END IF;

    IF v_rol <> 'USER' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Solo los usuarios USER pueden crear notificaciones';
    END IF;

    SET NEW.estado = 'PENDIENTE';
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ubicaciones`
--

DROP TABLE IF EXISTS `ubicaciones`;
CREATE TABLE `ubicaciones` (
  `id_ubicacion` int(10) UNSIGNED NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `ubicaciones`
--

INSERT INTO `ubicaciones` (`id_ubicacion`, `nombre`, `descripcion`) VALUES
(1, 'Almacén', 'Ubicación inicial de todos los equipamientos'),
(2, 'Aula 101', 'Aula de informatica de primer curso'),
(3, 'Aula 102', 'Aula de informatica de segundo curso'),
(4, 'Aula 103', 'Aula de informatica para proyectos'),
(5, 'Sala de Profesores', 'Sala destinada al personal docente'),
(6, 'Despacho Direccion', 'Despacho de direccion'),
(7, 'Laboratorio', 'Laboratorio de pruebas y sistemas'),
(8, 'Salon de Actos', 'Espacio para presentaciones y eventos'),
(10, 'Adrián', 'gaizkatonto');

--
-- Disparadores `ubicaciones`
--
DROP TRIGGER IF EXISTS `trg_no_borrar_almacen`;
DELIMITER $$
CREATE TRIGGER `trg_no_borrar_almacen` BEFORE DELETE ON `ubicaciones` FOR EACH ROW BEGIN
    IF OLD.nombre = 'Almacén' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La ubicación Almacén es obligatoria y no puede eliminarse';
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id_usuario` int(10) UNSIGNED NOT NULL,
  `nombre` varchar(80) NOT NULL,
  `apellidos` varchar(120) NOT NULL,
  `nombre_usuario` varchar(60) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol` enum('ADMIN','USER') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `nombre`, `apellidos`, `nombre_usuario`, `password_hash`, `rol`) VALUES
(2, 'Iker', 'Martinez Gomezaa', 'imartinez', '$2y$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ123457', 'ADMIN'),
(3, 'Maitee', 'Rodriguez Perez', 'mrodriguez', '$2y$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ123458', 'USER'),
(4, 'Jon', 'Sanchez Ruiz', 'jsanchez', '$2y$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ123459', 'USER'),
(5, 'Laura', 'Fernandez Martin', 'lfernandez', '$2y$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ123450', 'USER'),
(6, 'adrian', 'adrian', 'adrian', '$2y$10$u6qpDMdrzclgLTUT2RdLvOpgFqcOgvJ3/JEdtyM7P1SONXEiNgfUC', 'ADMIN'),
(7, 'gaizka', 'gaizka', 'gaizka', '$2y$10$O8c1NUV4AMbezMqPdGkhz.bb26kipS256LE93DhjZuhS8nKbBpdKy', 'USER'),
(11, 'admin', 'admin', 'admin', '$2y$10$yJ3uJ3SBFrb1/wrscmkqLu8WUqBnCE7IRGb/E2BPflVhJ6hXaeQgG', 'ADMIN');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `equipamientos`
--
ALTER TABLE `equipamientos`
  ADD PRIMARY KEY (`id_equipamiento`),
  ADD KEY `idx_equipamientos_categoria` (`categoria`),
  ADD KEY `idx_equipamientos_ubicacion_actual` (`id_ubicacion_actual`);

--
-- Indices de la tabla `historico_ubicaciones`
--
ALTER TABLE `historico_ubicaciones`
  ADD PRIMARY KEY (`id_historico`),
  ADD KEY `idx_historico_equipamiento` (`id_equipamiento`),
  ADD KEY `idx_historico_ubicacion` (`id_ubicacion`),
  ADD KEY `idx_historico_abierto` (`id_equipamiento`,`fecha_fin`);

--
-- Indices de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD PRIMARY KEY (`id_notificacion`),
  ADD KEY `idx_notificaciones_usuario` (`id_usuario`),
  ADD KEY `idx_notificaciones_estado` (`estado`);

--
-- Indices de la tabla `ubicaciones`
--
ALTER TABLE `ubicaciones`
  ADD PRIMARY KEY (`id_ubicacion`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `nombre_usuario` (`nombre_usuario`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `equipamientos`
--
ALTER TABLE `equipamientos`
  MODIFY `id_equipamiento` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `historico_ubicaciones`
--
ALTER TABLE `historico_ubicaciones`
  MODIFY `id_historico` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  MODIFY `id_notificacion` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `ubicaciones`
--
ALTER TABLE `ubicaciones`
  MODIFY `id_ubicacion` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `equipamientos`
--
ALTER TABLE `equipamientos`
  ADD CONSTRAINT `fk_equipamientos_ubicacion_actual` FOREIGN KEY (`id_ubicacion_actual`) REFERENCES `ubicaciones` (`id_ubicacion`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `historico_ubicaciones`
--
ALTER TABLE `historico_ubicaciones`
  ADD CONSTRAINT `fk_historico_equipamiento` FOREIGN KEY (`id_equipamiento`) REFERENCES `equipamientos` (`id_equipamiento`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_historico_ubicacion` FOREIGN KEY (`id_ubicacion`) REFERENCES `ubicaciones` (`id_ubicacion`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD CONSTRAINT `fk_notificaciones_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
