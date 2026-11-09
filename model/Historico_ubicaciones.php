<?php
    class Historico_ubicaciones {
        private int $id_historico;
        private int $id_equipamiento;
        private int $id_ubicacion;
        private string $fecha_inicio;
        private ?string $fecha_fin; // Permite null porque la ubicación actual podría no tener fecha de fin todavía

        public function __construct(
            int $id_historico,
            int $id_equipamiento,
            int $id_ubicacion,
            string $fecha_inicio,
            ?string $fecha_fin = null
        ){
            $this->id_historico = $id_historico;
            $this->id_equipamiento = $id_equipamiento;
            $this->id_ubicacion = $id_ubicacion;
            $this->fecha_inicio = $fecha_inicio;
            $this->fecha_fin = $fecha_fin;
        }

        // --- GETTERS ---

        public function getIdHistorico(): int {
            return $this->id_historico;
        }

        public function getIdEquipamiento(): int {
            return $this->id_equipamiento;
        }

        public function getIdUbicacion(): int {
            return $this->id_ubicacion;
        }

        public function getFechaInicio(): string {
            return $this->fecha_inicio;
        }

        public function getFechaFin(): ?string {
            return $this->fecha_fin;
        }

        // --- SETTERS ---

        public function setIdHistorico(int $id_historico): void {
            $this->id_historico = $id_historico;
        }

        public function setIdEquipamiento(int $id_equipamiento): void {
            $this->id_equipamiento = $id_equipamiento;
        }

        public function setIdUbicacion(int $id_ubicacion): void {
            $this->id_ubicacion = $id_ubicacion;
        }

        public function setFechaInicio(string $fecha_inicio): void {
            $this->fecha_inicio = $fecha_inicio;
        }

        public function setFechaFin(?string $fecha_fin): void {
            $this->fecha_fin = $fecha_fin;
        }
    }
?>