<?php
    require_once __DIR__ . '/../model/Ubicaciones.php';
    require_once __DIR__ . '/../dao/UbicacionesDAO.php';

    class UbicacionesController {
        private UbicacionesDAO $ubicacionesDAO;

        public function __construct(PDO $conexion) {
            $this->ubicacionesDAO = new UbicacionesDAO($conexion);
        }

        // READ TODAS
        public function obtenerTodas() {
            $lista = $this->ubicacionesDAO->obtenerTodas();
            $resultado = [];
            
            foreach ($lista as $ubicacion) {
                $resultado[] = $ubicacion->toArray();
            }
            
            return $resultado; // Devuelve el array limpio
        }

        // READ POR ID
        public function obtenerPorId(int $id) { 
            $ubicacion = $this->ubicacionesDAO->obtenerPorId($id);
            
            if ($ubicacion !== null) {
                return $ubicacion->toArray();
            } else {
                return null;
            }
        }

        // CREAR
        public function crear(array $datos) { 
            if (isset($datos['nombre']) && isset($datos['descripcion'])) {
                $nuevaUbicacion = new Ubicaciones(0, $datos['nombre'], $datos['descripcion']);
                return $this->ubicacionesDAO->crear($nuevaUbicacion); // Devuelve true o false
            }
            return false;
        }

        // ACTUALIZAR
        public function actualizar(array $datos) {
            if (isset($datos['id_ubicacion']) && isset($datos['nombre']) && isset($datos['descripcion'])) {
                $ubicacionModificada = new Ubicaciones(
                    intval($datos['id_ubicacion']), 
                    $datos['nombre'], 
                    $datos['descripcion']
                );
                return $this->ubicacionesDAO->actualizar($ubicacionModificada); // Devuelve true o false
            }
            return false;
        }

        // ELIMINAR
        public function eliminar(int $id) {
            return $this->ubicacionesDAO->borrar($id); // Devuelve true o false
        }
    }
?>