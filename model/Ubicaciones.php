<?php
    class Ubicaciones {
        private int $id_ubicacion;
        private string $nombre;
        private string $descripcion;

        public function __construct(
            int $id_ubicacion,
            string $nombre,
            string $descripcion
        ){
            $this->id_ubicacion = $id_ubicacion;
            $this->nombre = $nombre;
            $this->descripcion = $descripcion;
        }

        public function toArray() {
            return [
                'id_ubicacion' => $this->id_ubicacion,
                'nombre'=>$this->nombre,
                'descripcion'=>$this->descripcion
            ];
        }

        // --- GETTERS ---

        public function getIdUbicacion(): int {
            return $this->id_ubicacion;
        }

        public function getNombre(): string {
            return $this->nombre;
        }

        public function getDescripcion(): string {
            return $this->descripcion;
        }

        // --- SETTERS ---

        public function setIdUbicacion(int $id_ubicacion): void {
            $this->id_ubicacion = $id_ubicacion;
        }

        public function setNombre(string $nombre): void {
            $this->nombre = $nombre;
        }

        public function setDescripcion(string $descripcion): void {
            $this->descripcion = $descripcion;
        }
    }
?>