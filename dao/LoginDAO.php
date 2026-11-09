<?php
class LoginDAO
{
    private PDO $dbConnection;

    public function __construct(PDO $db)
    {
        
        $this->dbConnection = $db;
    }
    public function buscarPorNombreUsuario(string $nombreUsuario): ?array
    {
        $queryText = '
            SELECT id_usuario, nombre, apellidos, password_hash, rol
            FROM usuarios
            WHERE nombre_usuario = :nombre_usuario
            LIMIT 1
        ';

        $stmt = $this->dbConnection->prepare($queryText);

        $stmt->execute([
            'nombre_usuario' => $nombreUsuario
        ]);
        
        $resultRow = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($resultRow !== false) {
            return $resultRow;
        } else {
            return null;
        }
    }
}