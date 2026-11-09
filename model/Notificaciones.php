<?php
    use enumNotificaciones\EstadoNotificaciones;

    class Notificaciones {

        private int $id_notificacion;
        private string $titulo;
        private string $descripcion;
        private string $fecha_creacion;
        private EstadoNotificaciones $estado; //enum
        private int $id_usuario;

        public function __construct(
            int $id_notificacion,
            string $titulo,
            string $descripcion,
            string $fecha_creacion,
            EstadoNotificaciones $estado,
            int $id_usuario
        ){
            $this->id_notificacion = $id_notificacion;
            $this->titulo = $titulo;
            $this->descripcion = $descripcion;
            $this->fecha_creacion = $fecha_creacion;
            $this->estado = $estado;
            $this->id_usuario = $id_usuario;
        }

        // --- GETTERS ---

        public function getIdNotificacion(): int {
            return $this->id_notificacion;
        }

        public function getTitulo(): string {
            return $this->titulo;
        }

        public function getDescripcion(): string {
            return $this->descripcion;
        }

        public function getFechaCreacion(): string {
            return $this->fecha_creacion;
        }

        public function getEstado(): EstadoNotificaciones {
            return $this->estado;
        }

        public function getIdUsuario(): int {
            return $this->id_usuario;
        }

        // --- SETTERS ---

        public function setIdNotificacion(int $id_notificacion): void {
            $this->id_notificacion = $id_notificacion;
        }

        public function setTitulo(string $titulo): void {
            $this->titulo = $titulo;
        }

        public function setDescripcion(string $descripcion): void {
            $this->descripcion = $descripcion;
        }

        public function setFechaCreacion(string $fecha_creacion): void {
            $this->fecha_creacion = $fecha_creacion;
        }

        public function setEstado(EstadoNotificaciones $estado): void {
            $this->estado = $estado;
        }

        public function setIdUsuario(int $id_usuario): void {
            $this->id_usuario = $id_usuario;
        }
    }
?>