<?php

use rolUsuario\RolUsuario;

    class Usuarios {

        private int $id_usuario;
        private string $nombre;
        private string $apellidos;
        private string $nombre_usuario;
        private string $password_hash;
        private RolUsuario $rol; //enum

        public function __construct(
            int $id_usuario,
            string $nombre,
            string $apellidos,
            string $nombre_usuario,
            string $password_hash,
            RolUsuario $rol
        ){

            $this -> id_usuario = $id_usuario;
            $this -> nombre = $nombre;
            $this -> apellidos = $apellidos;
            $this -> nombre_usuario = $nombre_usuario;
            $this -> password_hash = $password_hash;
            $this -> rol = $rol;
        }
        // --- GETTERS ---

        public function getIdUsuario(): int {
            return $this->id_usuario;
        }

        public function getNombre(): string {
            return $this->nombre;
        }

        public function getApellidos(): string {
            return $this->apellidos;
        }

        public function getNombreUsuario(): string {
            return $this->nombre_usuario;
        }

        public function getPasswordHash(): string {
            return $this->password_hash;
        }

        public function getCategoria(): RolUsuario {
            return $this->rol;
        }

        // --- SETTERS ---

        public function setIdUsuario(int $id_usuario): void {
            $this->id_usuario = $id_usuario;
        }

        public function setNombre(string $nombre): void {
            $this->nombre = $nombre;
        }

        public function setApellidos(string $apellidos): void {
            $this->apellidos = $apellidos;
        }

        public function setNombreUsuario(string $nombre_usuario): void {
            $this->nombre_usuario = $nombre_usuario;
        }

        public function setPasswordHash(string $password_hash): void {
            $this->password_hash = $password_hash;
        }

        public function setCategoria(RolUsuario $rol): void {
            $this->rol = $rol;
        }
    }
?>