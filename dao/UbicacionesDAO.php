
<?php
    // 1. llamamos a la caja ubicaciones
    require_once __DIR__ . '/../model/Ubicaciones.php';

    class UbicacionesDAO {
        private PDO $conexion; //la llave del almacen


        public function __construct(PDO $conexion){
            $this -> conexion = $conexion;
        }


        //funcion CREAR, meter una caja nueva en la estanteria
        public function crear(Ubicaciones $ubicaciones): bool {


            //2. las pegatinas de las cajas con sql
            $sql = "INSERT INTO ubicaciones (nombre, descripcion)
                    VALUES (:nombre, :descripcion)";


            //3. avisar al almacen(prepare)
            $stmt = $this->conexion->prepare($sql);


            //4. pegar las etiquetas(saco de la caja -> pego en pegatina)
            //simetria, izquierda la pegatina, derecha el getter de la caja
            $stmt->bindValue(':nombre', $ubicaciones->getNombre());
            $stmt->bindValue(':descripcion', $ubicaciones->getDescripcion());


            //5. boton para probar que este bien
            return $stmt->execute();


        }


        //funcion READ, traer todas las cajas del almacen
        //el array del final significa que pormetemos devolver un pale, una lista, llena de cajas
        public function obtenerTodas(): array{
            //1. el papel(sin pegatina)
            //como lo queremos todo, por que es el read, no rellenamos espacios en blanco
            //solo decidmos, selecciona TODO de ubicaciones
            $sql = "SELECT * FROM ubicaciones";


            //2. pedir al almacen(directo)
            //como no hay datos que meter, hacemos la llamada por el walkye y le damos
            //al boton verde a la vez usando query
            $stmt = $this->conexion->query($sql);


            //3. preparar el pale(array vacio)
            //el pale vacio donde se iran apilando las cajas
            $listaUbicaciones = [];


            //4. la cinta transportadora (bucle while)
            //la estanteria empieza a dar filas sueltas($fila)
            //mientas siga dando piezas, el carretillero hace:
            while ($fila = $stmt->fetch(PDO::FETCH_ASSOC)){
                //4.1 nueva caja de carton y mete las piezas dentro
                $ubicacion = new Ubicaciones(
                    $fila['id_ubicacion'],
                    $fila['nombre'],
                    $fila['descripcion']
                );


                //4.2 sube la caja terminada al pale con el resto
                $listaUbicaciones[] = $ubicacion;
            }


            //5. entregar el pale. el carretillero lleva el pale lleno de cajas
            return $listaUbicaciones;
        }


        //READ: OBTENER POR ID
        //El ?ubicaciones es que si no la encuentra no peta, te devuelve null
        public function obtenerPorId(int $id): ?Ubicaciones{
           
            $sql = "SELECT * FROM ubicaciones WHERE id_ubicacion = :id";


            $stmt = $this->conexion->prepare($sql);


            $stmt->bindValue(':id', $id);


            $stmt->execute();


            //como solo queremos una caja, no hay while
            $fila = $stmt->fetch(PDO::FETCH_ASSOC);


            //5. hacer la caja o volver con las manos vacias null
            if ($fila){
                $ubicacion = new Ubicaciones(
                    $fila['id_ubicacion'],
                    $fila['nombre'],
                    $fila['descripcion']
                );
                return $ubicacion;
            } else {
                return null;
            }
        }


        //UPDATE. cambiar los datos de algo que ya existe
        public function actualizar(Ubicaciones $ubicacion): bool{


            //1. el papel. decimos, actualiza la tabla, pero SOLO donde el id sea tal
            //si nos olvidamos del where cambiamos toda la tabla
            $sql = "UPDATE ubicaciones
                    SET nombre = :nombre, descripcion = :descripcion
                    WHERE id_ubicacion = :id";


            //2. avisar al almacen
            $stmt = $this->conexion->prepare($sql);


            //3. pegamos las etiquetas, bindvalue. sacamos los datos de las cajas y los pegamos
            // importante, aqui pegamos los 3 datos
            $stmt->bindValue(':nombre', $ubicacion->getNombre());
            $stmt->bindValue(':descripcion', $ubicacion->getDescripcion());
            $stmt->bindValue(':id', $ubicacion->getIdUbicacion());


            return $stmt->execute();
        }
       


        //DELETE. en la parentesis no le pasamos la caja entera, le pasamos solo el id
        public function borrar(int $id): bool {
            //1. le decimos que borre donde el id sea el que tu quiieres
            //si te olvidas del where, borras todo
            $sql = "DELETE FROM ubicaciones WHERE id_ubicacion = :id";


            //2. avisar
            $stmt = $this->conexion->prepare($sql);


            //3. pegamos el unico id que nos han dado
            $stmt->bindValue(':id', $id);


            //4. boton rojo borrar
            return $stmt->execute();
        }
    }
?>

