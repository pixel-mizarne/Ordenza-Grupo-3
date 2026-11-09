<?php
    use enumNotificaciones\EstadoNotificaciones;

    require_once __DIR__ . '/../model/Notificaciones.php';
    require_once __DIR__ . '/../dao/NotificacionesDAO.php';
    require_once __DIR__ . '/../model/EstadoNotificaciones.php';

    
    class NotificacionesController {
        private NotificacionesDAO $notificacionesDAO;

        public function __construct(PDO $conexion) {
            $this->notificacionesDAO = new NotificacionesDAO($conexion);
        }

        // READ TODAS
        public function obtenerTodas(): array {
            $lista = $this->notificacionesDAO->obtenerTodas();
            $resultado = [];
            foreach ($lista as $notificacion) {
                $resultado[] = $this->formatearArray($notificacion);
            }
            return $resultado;
        }

        // READ POR USUARIO
        public function obtenerPorUsuario(int $idUsuario): array {
            $lista = $this->notificacionesDAO->obtenerPorUsuario($idUsuario);
            $resultado = [];
            foreach ($lista as $notificacion) {
                $resultado[] = $this->formatearArray($notificacion);
            }
            return $resultado;
        }

        // READ POR ID
        public function obtenerPorId(int $id): ?array {
            $notificacion = $this->notificacionesDAO->obtenerPorId($id);
            if ($notificacion !== null) {
                return $this->formatearArray($notificacion);
            }
            return null;
        }

        // CREAR
        public function crear(array $datos): bool {
            if (isset($datos['titulo'], $datos['descripcion'], $datos['fecha_creacion'], $datos['estado'], $datos['id_usuario'])) {
                try {
                    $estado_enum = EstadoNotificaciones::from($datos['estado']);
                    
                    $notificacionNueva = new Notificaciones( 
                        0, 
                        $datos['titulo'], 
                        $datos['descripcion'], 
                        $datos['fecha_creacion'], 
                        $estado_enum,
                        intval($datos['id_usuario'])
                    );
                    
                    return $this->notificacionesDAO->crear($notificacionNueva);
                } catch (ValueError $e) {
                    return false; // El estado no coincide con el enum
                }
            }
            return false;
        }

        // ACTUALIZAR
        public function actualizar(array $datos): bool {
            if (isset($datos['id_notificacion'], $datos['titulo'], $datos['descripcion'], $datos['fecha_creacion'], $datos['estado'], $datos['id_usuario'])) {
                try {
                    $estado_enum = EstadoNotificaciones::from($datos['estado']);
                    
                    $notificacionModificada = new Notificaciones(
                        intval($datos['id_notificacion']), 
                        $datos['titulo'], 
                        $datos['descripcion'], 
                        $datos['fecha_creacion'], 
                        $estado_enum, 
                        intval($datos['id_usuario'])
                    );
                    
                    // Forzamos la asignacion del id por seguridad
                    $notificacionModificada->setIdNotificacion(intval($datos['id_notificacion']));
                    
                    return $this->notificacionesDAO->actualizar($notificacionModificada);
                } catch (ValueError $e) {
                    return false;
                }
            }
            return false;
        }

        public function actualizarEstado(int $id, EstadoNotificaciones $estado): ?bool {
            if ($this->notificacionesDAO->obtenerPorId($id) === null) {
                return null;
            }

            return $this->notificacionesDAO->actualizarEstado($id, $estado);
        }

        public function actualizarContenidoPropio(int $id, int $idUsuario, string $titulo, string $descripcion): ?bool {
            if (!$this->notificacionesDAO->perteneceAUsuario($id, $idUsuario)) {
                return null;
            }

            return $this->notificacionesDAO->actualizarContenidoPropio($id, $idUsuario, $titulo, $descripcion);
        }

        public function eliminarPropia(int $id, int $idUsuario): ?bool {
            if (!$this->notificacionesDAO->perteneceAUsuario($id, $idUsuario)) {
                return null;
            }

            return $this->notificacionesDAO->borrarPropia($id, $idUsuario);
        }

        // DELETE
        public function eliminar(int $id): bool {
            return $this->notificacionesDAO->borrar($id);
        }

        // Helper para no repetir la creacion del array
        private function formatearArray(Notificaciones $notificacion): array {
            return [
                'id_notificacion' => $notificacion->getIdNotificacion(),
                'titulo'          => $notificacion->getTitulo(),
                'descripcion'     => $notificacion->getDescripcion(),
                'fecha_creacion'  => $notificacion->getFechaCreacion(),
                'estado'          => $notificacion->getEstado()->value ?? $notificacion->getEstado()->name,
                'id_usuario'      => $notificacion->getIdUsuario()
            ];
        }
    }
?>