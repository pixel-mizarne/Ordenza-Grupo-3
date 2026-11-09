<?php
require_once __DIR__ . '/../dao/EquipamientoDAO.php';
require_once __DIR__ . '/../model/CategoriaEquipamiento.php';

use enumCategoria\CategoriaEquipamiento;

class EquipamientoController {
    private EquipamientoDAO $dao;

    public function __construct(PDO $db) {
        $this->dao = new EquipamientoDAO($db);
    }

    public function listar(): array {
        return array_map([$this, 'normalizarEquipo'], $this->dao->listar());
    }

    public function listarPorUbicacion(int $idUbicacion): array {
        return array_map([$this, 'normalizarEquipo'], $this->dao->listarPorUbicacion($idUbicacion));
    }

    public function crear($datos): bool {
        if (!is_array($datos)) {
            throw new Exception('Los datos no son válidos', 400);
        }
        
        $nombre = trim($datos['nombre'] ?? '');
        if ($nombre === '') {
            throw new Exception('El nombre es obligatorio', 400);
        }

        $categoriaTexto = $datos['categoria'] ?? 'OTROS';
        $categoriaEnum = CategoriaEquipamiento::tryFrom($categoriaTexto);
        if ($categoriaEnum === null) {
            throw new Exception('La categoría no es válida: ' . $categoriaTexto, 400);
        }

        $creado = $this->dao->crear(
            $nombre,
            trim($datos['descripcion'] ?? ''),
            trim($datos['marca'] ?? ''),
            trim($datos['modelo'] ?? ''),
            $categoriaEnum->value
        );

        if (!$creado) {
            throw new Exception('No se pudo crear el equipamiento en la base de datos', 500);
        }
        return true;
    }

      public function actualizar($id, $datos): bool {
        $id = (int)$id;
        if ($id <= 0) throw new Exception('ID inválido', 400);
        
        $existente = $this->dao->buscarPorId($id);
        if ($existente === null) throw new Exception('Equipamiento no encontrado', 404);

        $categoriaTexto = $datos['categoria'] ?? $existente['categoria'];
        $categoriaEnum = CategoriaEquipamiento::tryFrom($categoriaTexto);
        if ($categoriaEnum === null) $categoriaEnum = CategoriaEquipamiento::OTROS;

        $idUbicacion = isset($datos['id_ubicacion_actual']) ? (int)$datos['id_ubicacion_actual'] : null;

        $actualizado = $this->dao->actualizar(
            $id,
            trim($datos['nombre'] ?? $existente['nombre']),
            trim($datos['descripcion'] ?? $existente['descripcion']),
            trim($datos['marca'] ?? $existente['marca']),
            trim($datos['modelo'] ?? $existente['modelo']),
            $categoriaEnum->value,
            $idUbicacion 
        );

        if (!$actualizado) throw new Exception('No se pudo actualizar', 500);
        return true;
    }

    public function eliminar($id): bool {
        $id = (int)$id;
        if ($id <= 0) throw new Exception('ID inválido', 400);
        if (!$this->dao->eliminar($id)) throw new Exception('No se pudo eliminar', 500);
        return true;
    }

    private function normalizarEquipo(array $e): array {
        return [
            'id_equipamiento' => (int) $e['id_equipamiento'],
            'nombre' => $e['nombre'],
            'descripcion' => $e['descripcion'],
            'marca' => $e['marca'],
            'modelo' => $e['modelo'],
            'categoria' => $e['categoria'],
            'id_ubicacion_actual' => (int) $e['id_ubicacion_actual'],
            'ubicacion' => $e['ubicacion'] ?? null,
        ];
    }
}