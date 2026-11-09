<?php
require_once 'Usuarios.php';

class UsuariosDAO
{
    private PDO $conexion;

    // Guarda la conexión para utilizarla en las operaciones de acceso a datos.
    public function __construct(PDO $conexion){
            $this->conexion = $conexion;
    }

    // Comprueba las credenciales comparando la contraseña con el hash almacenado.
    public function login(string $nombre_usuario, string $password): bool
    {
        $sql = "SELECT password_hash FROM usuarios WHERE nombre_usuario = ?";

        // La consulta preparada separa los datos recibidos de la instrucción SQL.
        $stmt = $this->conexion->prepare($sql);
        $stmt->execute([$nombre_usuario]);

        $password_hash = $stmt->fetchColumn();

        return $password_hash !== false && password_verify($password, $password_hash);
    }

    // Busca un usuario por su ID y devuelve el objeto correspondiente o null si no existe.
    public function buscarPorId(int $id){
        $sql = "SELECT * FROM usuarios WHERE id_usuario = ?";

        $stmt = $this->conexion->prepare($sql);
        $stmt->execute([$id]);

        $fila = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($fila) {
            return new Usuarios(
                $fila['id_usuario'],
                $fila['nombre'],
                $fila['apellidos'],
                $fila['nombre_usuario'],
                $fila['password_hash'],
                $fila['rol']
            );
        }

        return null;
    }

    // Recupera todos los usuarios y convierte cada fila en un objeto Usuarios.
    public function buscarTodos(){
        $sql = "SELECT * FROM usuarios";

        $stmt = $this->conexion->prepare($sql);
        $stmt->execute();

        $fila = $stmt->fetchAll(PDO::FETCH_OBJ);

        // Acumula los objetos creados a partir de las filas obtenidas.
        $usuarios=[];

        foreach($fila as $filaUsuarios){
            $usuario= new usuarios(
                $filaUsuarios->id_usuario,
                $filaUsuarios->nombre,
                $filaUsuarios->apellido,
                $filaUsuarios->nombre_usuario,
                $filaUsuarios->password_hash,
                $filaUsuarios->rol
            );
            $usuarios[] = $usuario;
        }
        return $usuarios;
    }

    // Inserta un usuario nuevo usando sus datos y devuelve si la ejecución tuvo éxito.
    public function crear(Usuarios $usuario): bool{
        $sql = "INSERT INTO usuarios (nombre, apellidos, nombre_usuario, password_hash) VALUES (?, ?, ?, ?)";

        $stmt = $this->conexion->prepare($sql);
        return $stmt->execute([
            $usuario->getNombre(),
            $usuario->getApellidos(),
            $usuario->getNombreUsuario(),
            $usuario->getPasswordHash()
        ]);
    }

    // Actualiza los datos del usuario identificado por su ID.
    public function actualizar(Usuarios $usuario): bool{
        $sql = "UPDATE usuarios SET nombre = ?, apellidos = ?, nombre_usuario = ?, password_hash = ? WHERE id_usuario = ?";

        $stmt = $this->conexion->prepare($sql);
        return $stmt->execute([
            $usuario->getNombre(),
            $usuario->getApellidos(),
            $usuario->getNombreUsuario(),
            $usuario->getPasswordHash(),
            $usuario->getIdUsuario()
        ]);
    }

    // Genera un hash para la nueva contraseña y lo guarda para el usuario.
    public function actualizar_password(Usuarios $usuario, string $nuevaPassword): bool
    {
        $hashed_password = password_hash($nuevaPassword, PASSWORD_DEFAULT);
        $sql = "UPDATE usuarios SET password_hash = ? WHERE id_usuario = ?";

        $stmt = $this->conexion->prepare($sql);

        return $stmt->execute([
            $hashed_password,
            $usuario->getIdUsuario()
        ]);
    }

    // Elimina el usuario que tenga el ID indicado.
    public function borrar(int $id): bool{
        $sql = "DELETE FROM usuarios WHERE id_usuario = ?";

        $stmt = $this->conexion->prepare($sql);
        return $stmt->execute([$id]);
    }
}
