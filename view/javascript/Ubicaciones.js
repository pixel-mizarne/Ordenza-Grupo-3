const apiUrl = 'api/UbicacionesAPI.php';
// Referencias al DOM
const contenedorUbicaciones = document.getElementById('contenedorUbicaciones');
const btnAnadir = document.getElementById('btnAnadir'); // ID sin 'ñ'
const dialogPopup = document.getElementById('popupUbicacion');
const formUbicacion = document.getElementById('formularioUbicacion');
const tituloPopup = document.getElementById('popupTitulo');
const btnCancelarUbicacion = document.getElementById('btnCancelarUbicacion');
const dialogEliminar = document.getElementById('popupEliminar');
const btnCancelarEliminar = document.getElementById('btnCancelarEliminar');
const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');
const inputEliminarId = document.getElementById('eliminarUbiId');
const inputBuscador = document.getElementById('buscarUbicacion');

// GET
async function cargarUbicaciones() {
    try {
        const respuesta = await fetch(apiUrl);
        if (!respuesta.ok) throw new Error("Error en la respuesta del servidor");
        
        const ubicaciones = await respuesta.json();
        contenedorUbicaciones.innerHTML = ''; 

        ubicaciones.forEach(ubicacion => {
            const details = document.createElement('details');
            details.className = 'desplegable-planta';
            details.ontoggle = () => {
                if (details.open) {
                    cargarEquiposUbicacion(ubicacion.id_ubicacion);
                }
            };
            details.innerHTML = `
                <summary>
                    <span class="titulo-alineado">
                        <span class="nombre-aula">${ubicacion.nombre} |</span>
                        <span class="descripcion-aula">${ubicacion.descripcion}</span>
                    </span>
                    <div class="ubi-boton-editar-eliminar">
                        <button class="ubi-boton-editar" type="button" aria-label="Editar ubicación" title="Editar ubicación" onclick="abrirEditar(${ubicacion.id_ubicacion}, '${ubicacion.nombre}', '${ubicacion.descripcion}')"><i class="fa-solid fa-pen" aria-hidden="true"></i></button>
                        <button class="ubi-boton-eliminar" type="button" aria-label="Eliminar ubicación" title="Eliminar ubicación" onclick="borrarUbicacion(${ubicacion.id_ubicacion})"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button>
                    </div>
                </summary>
                <div class="contenido-desplegable" id="lista-equipos-${ubicacion.id_ubicacion}" data-cargado="false">
                    <p class="ubi-mensaje-cargando">Cargando equipos...</p>
                </div>
            `;
            contenedorUbicaciones.appendChild(details);
        });
    } catch (error) {
        console.error("Fallo al cargar ubicaciones. Revisa XAMPP y la URL:", error);
    }
}

// ABRIR POPUP PARA CREAR
if (btnAnadir) {
    btnAnadir.addEventListener('click', () => {
        formUbicacion.reset();
        document.getElementById('ubiId').value = '';
        tituloPopup.textContent = 'Añadir Nueva Ubicación';
        dialogPopup.showModal();
    });
} else {
    console.error("No se encontró el botón btnAnadir en el HTML.");
}
btnCancelarUbicacion.addEventListener('click', () => {
    dialogPopup.close(); // Cierra el pop-up de añadir/editar
});

btnCancelarEliminar.addEventListener('click', () => {
    dialogEliminar.close(); // Cierra el pop-up de eliminar
});



// ABRIR POPUP PARA EDITAR
window.abrirEditar = function(id, nombre, descripcion) {
    document.getElementById('ubiId').value = id;
    document.getElementById('nombre').value = nombre;
    document.getElementById('descripcion').value = descripcion;
    tituloPopup.textContent = 'Editar Ubicación';
    dialogPopup.showModal();
}

// POST - PUT
formUbicacion.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const id = document.getElementById('ubiId').value;
    const metodo = id ? 'PUT' : 'POST';
    const datos = {
        nombre: document.getElementById('nombre').value,
        descripcion: document.getElementById('descripcion').value
    };

    if (id) datos.id_ubicacion = id;

    try {
        const respuesta = await fetch(apiUrl, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (respuesta.ok) {
            dialogPopup.close();
            cargarUbicaciones();
        } else {
            console.error("El servidor devolvió un error al intentar guardar.");
            alert("Error al guardar la ubicación en la base de datos.");
        }
    } catch (error) {
        console.error("Error al enviar los datos al servidor:", error);
    }
});

// DELETE
window.borrarUbicacion = function(id) {
    inputEliminarId.value = id;
    dialogEliminar.showModal();
}

btnConfirmarEliminar.addEventListener('click', async () => {
    const id = inputEliminarId.value;
    
    try {
        const respuesta = await fetch(`${apiUrl}?id=${id}`, { method: 'DELETE' });
        
        if (respuesta.ok) {
            dialogEliminar.close(); // Cerramos la ventana si ha ido bien
            cargarUbicaciones();    // Refrescamos la tabla
        } else {
            console.error("Error al borrar en la base de datos.");
        }
    } catch (error) {
        console.error("Fallo de conexión al borrar:", error);
    }
});

// BUSCADOR
inputBuscador.addEventListener('input', (evento) => {
    // Comprobamos si el usuario está escribiendo exactamente en nuestra barra de búsqueda
    if (evento.target.id === 'buscarUbicacion') {
        const textoBuscado = evento.target.value.toLowerCase();
        const contenedor = document.getElementById('contenedorUbicaciones');

        if (!contenedor) return; // Si no encontramos el contenedor, salimos de la función
    
        //buscamos todas las cajas que estan dentro del contenedor de ubicaciones
        const cajasUbicaciones = contenedor.querySelectorAll('.desplegable-planta');

        //revisamos una por una
        cajasUbicaciones.forEach(caja => {
            //extraemos el nombre del aula y usamos trim para quitar los espacios en blanco
            const nombreAula = caja.querySelector('.nombre-aula').textContent.trim().toLowerCase();

            //comprobamos si el nombre empieza por lo que se ha escrito en el buscador
            if (nombreAula.startsWith(textoBuscado)) { //si luego en el futuro queremos que busque en cualquier parte del nombre, podemos cambiar startsWith por includes
                caja.style.display = ''; //mostramos la caja
            } else {
                caja.style.display = 'none'; //ocultamos la caja
            }
        });
    }
});

// EQUIPOS DENTRO DE UBIS
async function cargarEquiposUbicacion(idUbicacion) {
    const contenedorEquipos = document.getElementById(`lista-equipos-${idUbicacion}`);
    
    // si ya los hemos cargado antes, no volvemos a hacer la petición a la base de datos
    if (contenedorEquipos.getAttribute('data-cargado') === 'true') return;

    try {
        
        const respuesta = await fetch(`api/Equipamiento.php?id_ubicacion=${idUbicacion}`);
        
        if (!respuesta.ok) throw new Error("Error al traer equipos");
        
        const equipos = await respuesta.json();
        
        // Limpiamos el texto de "Cargando..."
        contenedorEquipos.innerHTML = '';

        if (equipos.length === 0) {
            contenedorEquipos.innerHTML = '<p class="ubi-mensaje-vacio">No hay equipos registrados en esta ubicación.</p>';
        } else {
            // Dibujamos cada equipo encontrado
            equipos.forEach(equipo => {
            contenedorEquipos.innerHTML += `
                <div class="item-equipo">
                    <!-- Convertimos el nombre en un enlace que pasa el ID por la URL -->
                    <a href="index.html?page=equipamientos&highlight=${equipo.id_equipamiento}" class="nombre-equipo" style="text-decoration: none; color: #0d1b2a;">
                        <strong>${equipo.nombre}</strong>
                        <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 12px; margin-left: 5px; color: #6b7280;"></i>
                    </a>
                    <span class="ubi-estado-equipo">${equipo.estado || ''}</span>
                </div>
            `;
        });
        }

        // Marcamos como cargado para que si el usuario cierra y abre el desplegable no vuelva a cargar
        contenedorEquipos.setAttribute('data-cargado', 'true');

    } catch (error) {
        console.error("Error cargando equipos:", error);
        contenedorEquipos.innerHTML = '<p class="ubi-mensaje-error">Error al cargar los equipos.</p>';
    }
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargarUbicaciones, { once: true });
} else {
    cargarUbicaciones();
}