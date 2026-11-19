Proyecto: Ordenza - Grupo 3

Aplicación web diseñada para gestionar de forma sencilla las distintas
ubicaciones (aulas y espacios), los equipamientos asignados a cada una
y los usuarios del sistema con sus respectivos permisos.

Esta guía está pensada para cualquier persona, sin necesidad de tener
conocimientos de programación, explicando paso a paso cómo poner en
marcha y utilizar la aplicación.

¿QUÉ NECESITAS ANTES DE EMPEZAR?

Para que la aplicación funcione en tu ordenador solo necesitas dos cosas:

Un navegador web habitual (Google Chrome, Microsoft Edge, Firefox, etc.).

XAMPP instalado en tu ordenador (es un programa gratuito que simula
un servidor para que la web y la base de datos funcionen en local).
Si no lo tienes, puedes descargarlo en: https://www.apachefriends.org/

INSTALACIÓN PASO A PASO

Sigue estos 4 pasos en orden para dejar la aplicación lista:

PASO 1: Colocar la carpeta del proyecto

Localiza la carpeta del proyecto llamada: Ordenza-Grupo-3

Copia esa carpeta entera.

Ve al disco local de tu ordenador y entra en la carpeta de XAMPP,
normalmente en la ruta: C:\xampp\htdocs\

Pega la carpeta "Ordenza-Grupo-3" ahí dentro.

PASO 2: Encender los motores en XAMPP

Abre el programa "XAMPP Control Panel" desde el menú de inicio.

Verás una lista de módulos. Pulsa el botón "Start" en los dos primeros:

Apache (encargado de mostrar la página web).

MySQL (encargado de la base de datos).

Espera unos segundos hasta que ambos nombres aparezcan en color VERDE.

PASO 3: Cargar la base de datos

En el mismo panel de XAMPP, pulsa el botón "Admin" que está en la
fila de MySQL. Esto abrirá en tu navegador la herramienta phpMyAdmin.

En el menú de la izquierda, haz clic en "Nueva" (o "New").

En el campo de nombre de la base de datos escribe exactamente:
reto_2daw
(todo en minúsculas) y pulsa el botón "Crear".

Con la base de datos "reto_2daw" seleccionada a la izquierda, haz clic
en la pestaña "Importar" en la barra superior.

Pulsa en "Seleccionar archivo" y busca el archivo .sql que se incluye
dentro de la carpeta del proyecto Ordenza-Grupo-3.

Baja hasta el final de la página y pulsa "Importar" (o "Continuar").
Si todo va bien, saldrá un mensaje en verde confirmando la importación.

PASO 4: Abrir la aplicación
IMPORTANTE: No abras la página haciendo doble clic directamente sobre
los archivos .html de la carpeta, ya que así la conexión con la base
de datos no funcionará.

Abre tu navegador web.

En la barra de direcciones de arriba, escribe exactamente:
http://localhost/Ordenza-Grupo-3/

Pulsa Enter y ya estarás dentro de la aplicación.

ACCESO DE PRUEBA (CREDENCIALES)

Para probar todas las funciones de administración puedes iniciar sesión
con la siguiente cuenta de prueba:

Usuario: [admin]

Contraseña: [Admin-1234]

GUÍA RÁPIDA DE USO

Una vez dentro, podrás moverte por las distintas secciones desde la
barra de navegación superior:

GESTIÓN DE UBICACIONES

Ver aulas y equipos: Haz clic sobre cualquier fila de la lista para
desplegarla y ver los equipos registrados en esa ubicación. Si haces
clic en un equipo, te llevará directamente a su ficha.

Buscar: Usa la barra de búsqueda superior para filtrar las aulas
escribiendo su nombre.

Añadir, editar o eliminar: Pulsa el botón "Añadir Ubicación" para
crear un espacio nuevo, o usa los botones de lápiz (naranja) y
papelera (rojo) en cada fila para modificar o borrar una ubicación.

GESTIÓN DE USUARIOS

Panel de control: En la parte superior verás el contador total de
usuarios y administradores, divididos en dos columnas diferenciadas
por colores según su rol.

Buscador: Permite filtrar rápidamente escribiendo el nombre o el ID.

Crear o editar usuarios: Al pulsar en "Añadir Usuario" o en el botón
de editar de una tarjeta se abrirá una ventana emergente.

Nota sobre contraseñas: Por seguridad, la contraseña debe tener al
menos 8 caracteres, una mayúscula, una minúscula, un número y uno
de estos símbolos: . - _
Al editar un usuario, puedes dejar la contraseña vacía si no
deseas cambiarla.

Seguridad de sesión: Para evitar bloqueos por accidente, el sistema
no permite editar ni eliminar tu propia cuenta mientras tengas la
sesión iniciada con ella.

OPCIONES DE ACCESIBILIDAD

La aplicación cuenta con soporte para Modo Oscuro y Modo Daltónico,
adaptando los colores y contrastes para facilitar la lectura.

SOLUCIÓN DE PROBLEMAS FRECUENTES

La página no carga o da error de conexión:
Comprueba en el panel de XAMPP que tanto Apache como MySQL siguen
encendidos en color verde.

No aparecen datos en las listas:
Asegúrate de haber escrito http://localhost/Ordenza-Grupo-3/ en el
navegador y no haber abierto el archivo desde la carpeta de Windows.
Revisa también que la base de datos se llame exactamente "reto_2daw"
y que importaste correctamente el archivo .sql en el Paso 3.