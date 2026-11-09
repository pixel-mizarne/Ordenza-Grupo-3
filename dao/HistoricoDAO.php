<?php
class HistoricoDAO {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    public function historialDeEquipamiento(int $idEquipamiento): array {
        $sql = "SELECT h.id_historico, u.nombre AS ubicacion,
                       h.fecha_inicio, h.fecha_fin
                FROM historico_ubicaciones h
                JOIN ubicaciones u ON u.id_ubicacion = h.id_ubicacion
                WHERE h.id_equipamiento = :id
                ORDER BY h.fecha_inicio ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $idEquipamiento]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}