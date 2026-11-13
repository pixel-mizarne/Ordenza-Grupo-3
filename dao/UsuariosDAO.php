<?php
require_once 'Usuarios.php';

class UsuariosDAO
{
    private PDO $conexion;

    // le damos al carretillero las llaves del almacen (conexion a bd) para que pueda entrar a trabajar
    public function __construct(PDO $conexion){
            $this->conexion = $conexion;
    }

    // el carretillero comprueba si el usuario es quien dice ser comparando el candado que tenemos con la llave que nos da
    public function login(string $nombre_usuario, string $password): bool
    {
        $sql = "SELECT password_hash FROM usuarios WHERE nombre_usuario = ?";

        $stmt = $this->conexion->prepare($sql);
        $stmt->execute([$nombre_usuario]);

        $password_hash = $stmt->fetchColumn();

        return $password_hash !== false && password_verify($password, $password_hash);
    }

    // el carretillero va a la estanteria busca la caja con este id exacto y te la trae
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

    // el carretillero se da una vuelta por todo el almacen y te trae una lista con todas las cajas que hay
    public function buscarTodos(){
        $sql = "SELECT * FROM usuarios";

        $stmt = $this->conexion->prepare($sql);
        $stmt->execute();

        $fila = $stmt->fetchAll(PDO::FETCH_OBJ);

        $usuarios=[];

        // desempaquetamos cada fila que saca de la estanteria y la metemos en la furgoneta de reparto (array)
        foreach($fila as $filaUsuarios){
            $usuario = new Usuarios(
                $filaUsuarios->id_usuario,
                $filaUsuarios->nombre,
                $filaUsuarios->apellidos, // corregido a plural
                $filaUsuarios->nombre_usuario,
                $filaUsuarios->password_hash,
                $filaUsuarios->rol
            );
            $usuarios[] = $usuario;
        }
        return $usuarios;
    }

    // el carretillero coge una caja nueva y la guarda en la estanteria con todos sus datos incluido el rol
    public function crear(Usuarios $usuario): bool{
        $sql = "INSERT INTO usuarios (nombre, apellidos, nombre_usuario, password_hash, rol) VALUES (?, ?, ?, ?, ?)";

        $stmt = $this->conexion->prepare($sql);
        return $stmt->execute([
            $usuario->getNombre(),
            $usuario->getApellidos(),
            $usuario->getNombreUsuario(),
            $usuario->getPasswordHash(),
            $usuario->getRol() // añadido el rol que faltaba
        ]);
    }

    // el carretillero busca una caja que ya existe y le cambia la pegatina con los datos nuevos
    public function actualizar(Usuarios $usuario): bool{
        $sql = "UPDATE usuarios SET nombre = ?, apellidos = ?, nombre_usuario = ?, password_hash = ?, rol = ? WHERE id_usuario = ?";

        $stmt = $this->conexion->prepare($sql);
        return $stmt->execute([
            $usuario->getNombre(),
            $usuario->getApellidos(),
            $usuario->getNombreUsuario(),
            $usuario->getPasswordHash(),
            $usuario->getRol(), 
            $usuario->getIdUsuario()
        ]);
    }

    // el carretillero le pone un candado nuevo a la caja sin tocar lo demas
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

    // el carretillero coge la caja de ese id y la tira al contenedor de basura
    public function borrar(int $id): bool{
        $sql = "DELETE FROM usuarios WHERE id_usuario = ?";

        $stmt = $this->conexion->prepare($sql);
        return $stmt->execute([$id]);
    }
}