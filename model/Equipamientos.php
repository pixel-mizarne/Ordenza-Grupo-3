<?php

    use enumCategoria\CategoriaEquipamiento;

    class Equipamientos {
        private int $id_equipamiento;
        private string $nombre;
        private string $descripcion;
        private string $marca;
        private string $modelo;
        private CategoriaEquipamiento $categoria; //enum
        private int $id_ubicacion_actual;

        public function __construct(
            int $id_equipamiento,
            string $nombre,
            string $descripcion,
            string $marca,
            string $modelo,
            CategoriaEquipamiento $categoria,
            int $id_ubicacion_actual
        ){
            $this -> id_equipamiento = $id_equipamiento;
            $this -> nombre = $nombre;
            $this -> descripcion = $descripcion;
            $this -> marca = $marca;
            $this -> modelo = $modelo;
            $this -> categoria = $categoria;
            $this -> id_ubicacion_actual = $id_ubicacion_actual;

        }

        // --- GETTERS ---


        public function getIdEquipamiento(): int {
            return $this->id_equipamiento;
        }

        public function getNombre(): string {
            return $this->nombre;
        }

        public function getDescripcion(): string {
            return $this->descripcion;
        }

        public function getMarca(): string {
            return $this->marca;
        }

        public function getModelo(): string {
            return $this->modelo;
        }

        public function getCategoria(): CategoriaEquipamiento {
            return $this->categoria;
        }

        public function getIdUbicacionActual(): int {
            return $this->id_ubicacion_actual;
        }

        // --- SETTERS ---

        public function setIdEquipamiento(int $id_equipamiento): void {
            $this->id_equipamiento = $id_equipamiento;
        }

        public function setNombre(string $nombre): void {
            $this->nombre = $nombre;
        }

        public function setDescripcion(string $descripcion): void {
            $this->descripcion = $descripcion;
        }

        public function setMarca(string $marca): void {
            $this->marca = $marca;
        }

        public function setModelo(string $modelo): void {
            $this->modelo = $modelo;
        }

        public function setCategoria(CategoriaEquipamiento $categoria): void {
            $this->categoria = $categoria;
        }

        public function setIdUbicacionActual(int $id_ubicacion_actual): void {
            $this->id_ubicacion_actual = $id_ubicacion_actual;
        }
    }

?>