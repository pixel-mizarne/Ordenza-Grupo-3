<?php
class EquipamientoDAO {
    private PDO $dbConnection;

    public function __construct(PDO $db) {
        $this->dbConnection = $db;
    }

    public function listar(): array {
        $query = "SELECT e.*, u.nombre AS ubicacion FROM equipamientos e 
                  LEFT JOIN ubicaciones u ON e.id_ubicacion_actual = u.id_ubicacion 
                  ORDER BY e.id_equipamiento DESC";
        return $this->dbConnection->query($query)->fetchAll(PDO::FETCH_ASSOC);
    }

    public function listarPorUbicacion(int $idUbicacion): array {
        $query = "SELECT e.*, u.nombre AS ubicacion FROM equipamientos e 
                  JOIN ubicaciones u ON e.id_ubicacion_actual = u.id_ubicacion 
                  WHERE e.id_ubicacion_actual = :id_ubicacion
                  ORDER BY e.id_equipamiento DESC";
        $stmt = $this->dbConnection->prepare($query);
        $stmt->execute([':id_ubicacion' => $idUbicacion]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }


    public function buscarPorId(int $id): ?array {
        $stmt = $this->dbConnection->prepare("SELECT * FROM equipamientos WHERE id_equipamiento = :id");
        $stmt->execute([':id' => $id]);
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);
        return $fila ?: null;
    }
//(ADRIAN)
    public function crear(string $nombre, string $descripcion, string $marca, string $modelo, string $categoria): bool {
        // Reservamos el alta para que dos personas no reciban el mismo ID 
        $bloqueo = $this->dbConnection->query(
            "SELECT GET_LOCK('ordenza_reto2daw_equipamientos_id', 10)"
        )->fetchColumn();

        if ((int) $bloqueo !== 1) {
            throw new RuntimeException('No se pudo reservar el ID del equipamiento', 500);
        }

        try {
            $idsUsados = $this->dbConnection->query(
                'SELECT id_equipamiento FROM equipamientos
                 UNION
                 SELECT id_equipamiento FROM historico_ubicaciones
                 ORDER BY id_equipamiento'
            )->fetchAll(PDO::FETCH_COLUMN);

            // Saltamos IDs que aun tengan historial para no mezclar equipos
            $idNuevo = 1;
            foreach ($idsUsados as $idUsado) {
                $idUsado = (int) $idUsado;
                if ($idUsado < $idNuevo) {
                    continue;
                }
                if ($idUsado > $idNuevo) {
                    break;
                }
                $idNuevo++;
            }

            $query = "INSERT INTO equipamientos
                      (id_equipamiento, nombre, descripcion, marca, modelo, categoria, id_ubicacion_actual)
                      VALUES (:id, :nombre, :descripcion, :marca, :modelo, :categoria, 1)";
            $stmt = $this->dbConnection->prepare($query);
            return $stmt->execute([
                ':id' => $idNuevo,
                ':nombre' => $nombre,
                ':descripcion' => $descripcion,
                ':marca' => $marca,
                ':modelo' => $modelo,
                ':categoria' => $categoria
            ]);
        } finally {
            $bloqueoLiberado = $this->dbConnection->query(
                "SELECT RELEASE_LOCK('ordenza_reto2daw_equipamientos_id')"
            )->fetchColumn();

            if ((int) $bloqueoLiberado !== 1) {
                throw new RuntimeException('No se pudo liberar el turno para crear equipamientos', 500);
            }
        }
    }
//(ADRIAN)
    public function actualizar(int $id, string $nombre, string $descripcion, string $marca, string $modelo, string $categoria, ?int $id_ubicacion = null): bool {
        if ($id_ubicacion !== null) {
            $query = "UPDATE equipamientos SET nombre = :nombre, descripcion = :descripcion, 
                      marca = :marca, modelo = :modelo, categoria = :categoria, id_ubicacion_actual = :id_ubicacion 
                      WHERE id_equipamiento = :id";
        } else {
            $query = "UPDATE equipamientos SET nombre = :nombre, descripcion = :descripcion, 
                      marca = :marca, modelo = :modelo, categoria = :categoria WHERE id_equipamiento = :id";
        }
        
        $stmt = $this->dbConnection->prepare($query);
        
        $params = [
            ':id' => $id,
            ':nombre' => $nombre,
            ':descripcion' => $descripcion,
            ':marca' => $marca,
            ':modelo' => $modelo,
            ':categoria' => $categoria
        ];

        if ($id_ubicacion !== null) {
            $params[':id_ubicacion'] = $id_ubicacion;
        }

        return $stmt->execute($params);
    }

    public function eliminar(int $id): bool {
        $stmt = $this->dbConnection->prepare("DELETE FROM equipamientos WHERE id_equipamiento = :id");
        return $stmt->execute([':id' => $id]);
    }
}