<?php       
    use enumNotificaciones\EstadoNotificaciones;

    require_once __DIR__ . '/../model/Notificaciones.php';
    require_once __DIR__ . '/../model/EstadoNotificaciones.php';
    

    class NotificacionesDAO {
        private PDO $conexion; // llave del almacen

        public function __construct(PDO $conexion){
            $this->conexion = $conexion;
        }

        // CREAR
        public function crear(Notificaciones $notificacion): bool {
            // ponemos todas las columnas de la tabla menos el id_autoincrement
            $sql = "INSERT INTO notificaciones (titulo, descripcion, fecha_creacion, estado, id_usuario)
                    VALUES (:titulo, :descripcion, :fecha_creacion, :estado, :id_usuario)";

            // avisa al almacen
            $stmt = $this->conexion->prepare($sql);

            $stmt->bindValue(':titulo', $notificacion->getTitulo());
            $stmt->bindValue(':descripcion', $notificacion->getDescripcion());
            $stmt->bindValue(':fecha_creacion', $notificacion->getFechaCreacion());
            
            // en vez de pasar el enum directamente le pedimos su texto con ->value
            $stmt->bindValue(':estado', $notificacion->getEstado()->value);
            $stmt->bindValue(':id_usuario', $notificacion->getIdUsuario());

            // boton verde
            return $stmt->execute();
        }

        // READ TODAS
        public function obtenerTodas(): array {
            $sql = "SELECT * FROM notificaciones";
            $stmt = $this->conexion->query($sql);
            $listaNotificaciones = [];

            while ($fila = $stmt->fetch(PDO::FETCH_ASSOC)){
                $notificacion = new Notificaciones(
                    $fila['id_notificacion'],
                    $fila['titulo'],
                    $fila['descripcion'],
                    $fila['fecha_creacion'],
                    EstadoNotificaciones::from($fila['estado']), // aqui se transforma en el enum el dato
                    $fila['id_usuario']
                );
                $listaNotificaciones[] = $notificacion;
            }
            return $listaNotificaciones;
        }

        // READ POR USUARIO
        public function obtenerPorUsuario(int $idUsuario): array {
            $sql = "SELECT * FROM notificaciones WHERE id_usuario = :id_usuario ORDER BY fecha_creacion DESC";
            $stmt = $this->conexion->prepare($sql);
            $stmt->bindValue(':id_usuario', $idUsuario, PDO::PARAM_INT);
            $stmt->execute();

            $listaNotificaciones = [];
            while ($fila = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $listaNotificaciones[] = new Notificaciones(
                    $fila['id_notificacion'],
                    $fila['titulo'],
                    $fila['descripcion'],
                    $fila['fecha_creacion'],
                    EstadoNotificaciones::from($fila['estado']),
                    $fila['id_usuario']
                );
            }
            return $listaNotificaciones;
        }

        // READ POR ID
        public function obtenerPorId(int $id): ?Notificaciones {
            $sql = "SELECT * FROM notificaciones WHERE id_notificacion = :id";
            $stmt = $this->conexion->prepare($sql);
            $stmt->bindValue(':id', $id);
            $stmt->execute();

            $fila = $stmt->fetch(PDO::FETCH_ASSOC);

            if($fila){
                return new Notificaciones(
                    $fila['id_notificacion'],
                    $fila['titulo'],
                    $fila['descripcion'],
                    $fila['fecha_creacion'],
                    EstadoNotificaciones::from($fila['estado']),
                    $fila['id_usuario']
                );
            } else {
                return null;
            }
        }

        // UPDATE
        public function actualizar(Notificaciones $notificacion): bool {
            $sql = "UPDATE notificaciones
                    SET titulo = :titulo, descripcion = :descripcion, 
                        fecha_creacion = :fecha_creacion, estado = :estado,
                        id_usuario = :id_usuario
                    WHERE id_notificacion = :id";

            $stmt = $this->conexion->prepare($sql);

            $stmt->bindValue(':titulo', $notificacion->getTitulo());
            $stmt->bindValue(':descripcion', $notificacion->getDescripcion());
            $stmt->bindValue(':fecha_creacion', $notificacion->getFechaCreacion());
            $stmt->bindValue(':estado', $notificacion->getEstado()->value);
            $stmt->bindValue(':id_usuario', $notificacion->getIdUsuario());
            $stmt->bindValue(':id', $notificacion->getIdNotificacion());

            return $stmt->execute();
        }

        public function actualizarEstado(int $id, EstadoNotificaciones $estado): bool {
            $sql = "UPDATE notificaciones
                    SET estado = :estado
                    WHERE id_notificacion = :id";

            $stmt = $this->conexion->prepare($sql);
            $stmt->bindValue(':estado', $estado->value);
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);

            return $stmt->execute();
        }

        // DELETE
        public function borrar(int $id): bool {
            $sql = "DELETE FROM notificaciones WHERE id_notificacion = :id";
            $stmt = $this->conexion->prepare($sql);
            $stmt->bindValue(':id', $id);

            return $stmt->execute();
        }
    }
?>