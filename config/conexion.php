<?php
class Database {
    private $host = "localhost";
    private $db_name = "reto_2daw";
    private $username = "root";
    private $password = "";

    // Guarda la conexion para reutilizarla mientras exista esta instancia.
    private $conexion = null;
    
    // Crea la conexion si aun no existe y devuelve el objeto PDO.
    public function getConnection() {
        // Evita abrir varias conexiones desde la misma instancia.
        if ($this->conexion !== null) return $this->conexion;

        try {
            // Se conecta a MySQL usando UTF-8 para admitir caracteres especiales.
            $this->conexion = new PDO("mysql:host={$this->host};dbname={$this->db_name};charset=utf8mb4", $this->username, $this->password);
            // Hace que PDO lance excepciones ante errores y devuelva filas asociativas.
            $this->conexion->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conexion->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            // Detiene la ejecucion e informa del error de conexion.
            die("Error de conexion: " . $e->getMessage());
        }

        return $this->conexion;
    }
}
?>