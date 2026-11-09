<?php
require_once __DIR__ . '/../dao/HistoricoDAO.php';

class HistoricoController {
    private HistoricoDAO $dao;

    public function __construct(PDO $db) {
        $this->dao = new HistoricoDAO($db);
    }

    public function listar(int $idEquipamiento): array {
        return $this->dao->historialDeEquipamiento($idEquipamiento);
    }
}