/* Se declaran fuera de las funciones para que estén disponibles en todo el archivo. */
// Guarda el array con todos los equipos traídos de la API
let todosLosEquipos = []; 
 // Guarda la categoría seleccionada actualmente para filtrar
let currentCategoryFilter = "";
// Guarda el array de ubicaciones/aulas disponibles
let listaUbicaciones = []; 

/* CARGA INICIAL Y CONFIGURACIÓN DE LA PÁGINA */
async function iniciarEquipamientos() {
    // Obtenemos el rol del usuario desde una variable global 
    const rolUsuario = window.ROL ? window.ROL.toUpperCase() : 'USER';
    const btnCreate = document.getElementById('btn-crear-equipamiento');
    const esAdmin = rolUsuario === 'ADMIN';
    
    // CONTROL DEL BUSCADOR Y CONTROLES DE ADMIN
    const adminControls = document.getElementById('eq-admin-controls');
    if (adminControls) {
        // Si es admin, se muestra siempre. Si es user, se oculta al principio
        adminControls.hidden = !esAdmin; 
        
        // Ocultamos el filtro de ubicación y el botón crear si no es admin
        const filterSelect = document.querySelector('.eq-select');
        if (filterSelect) filterSelect.style.display = esAdmin ? 'block' : 'none';
        if (btnCreate) btnCreate.style.display = esAdmin ? 'flex' : 'none';
    }

    // Añadimos clases al body para aplicar estilos CSS dependiendo del rol
    if (esAdmin) {
        document.body.classList.add('role-admin');
        document.body.classList.remove('role-user');
    } else {
        document.body.classList.add('role-user');
        document.body.classList.remove('role-admin');
    }

    // Mostramos u ocultamos secciones según el rol
    currentCategoryFilter = '';
    document.getElementById('eq-admin-tabs').hidden = !esAdmin;
    document.getElementById('eq-category-browser').hidden = esAdmin;
    document.getElementById('eq-table-section').hidden = !esAdmin;
    if (btnCreate) btnCreate.style.display = (rolUsuario === 'ADMIN') ? 'flex' : 'none';

    // CARGAR UBICACIONES async/await sirve para esperar a que el servidor responda
    try {
        const resUbi = await fetch('api/UbicacionesAPI.php'); 
        if (resUbi.ok) listaUbicaciones = await resUbi.json();
    } catch (e) { console.error("Error ubicaciones:", e); }

    // CARGAR EQUIPOS
    try {
        const res = await fetch('api/Equipamiento.php');
        
        // Leemos como texto primero para ver si PHP devolvió un error en HTML
        const textoRespuesta = await res.text();
        
        let data;
        try {
            data = JSON.parse(textoRespuesta); // Convertimos el texto a un objeto/array de JS
        } catch (e) {
            alert("La API no devolvió JSON. Revisa la consola. El servidor dijo: " + textoRespuesta.substring(0, 100));
            return; 
        }

        if (data.error) {
            alert("Error de la API: " + data.error);
            return;
        }

        if (!Array.isArray(data)) {
            alert("La API devolvió algo, pero no es una lista de equipos.");
            console.log("Lo que devolvió:", data);
            return;
        }

        // SI TODO ESTÁ BIEN, GUARDAMOS LOS DATOS Y ACTUALIZAMOS LA VISTA. XD
        todosLosEquipos = data;
        actualizarEstadisticas();
        if (esAdmin) renderizarTabla();

        // Lógica para enlazar desde otra página con un ID específico
        const idEquipoSolicitado = new URLSearchParams(window.location.search).get('id');
        const equipoSolicitado = todosLosEquipos.find(e => String(e.id_equipamiento) === idEquipoSolicitado);
        
        if (equipoSolicitado) {
            if (!esAdmin) {
                // Tarjeta de categoría correspondiente para simular el clic
                const tarjetaCategoria = [...document.querySelectorAll('.eq-category-card')]
                    .find(tarjeta => tarjeta.dataset.category === equipoSolicitado.categoria);
                seleccionarCategoria(
                    equipoSolicitado.categoria,
                    tarjetaCategoria ? tarjetaCategoria.dataset.label : equipoSolicitado.categoria
                );
            }
            resaltarEquipoDesdeUbicacion(idEquipoSolicitado);
        }

    } catch (err) {
        alert("Error de red al intentar cargar equipos.");
        console.error(err);
    }
}

/* SELECCIÓN DE CATEGORÍA USUARIO */
function seleccionarCategoria(categoria, etiqueta) {
    currentCategoryFilter = categoria; 
    // Ocultamos el menú de tarjetas y mostramos la tabla
    document.getElementById('eq-category-browser').hidden = true;
    document.getElementById('eq-user-results-header').hidden = false;
    document.getElementById('eq-table-section').hidden = false;
    document.getElementById('eq-selected-category').textContent = etiqueta; 
    document.getElementById('eq-admin-controls').hidden = false; 

    // Limpiamos el filtro de ubicación por si venía de otra vista
    const filterLocation = document.getElementById('filter-location');
    if (filterLocation) filterLocation.value = '';

    renderizarTabla(); // Volvemos a dibujar la tabla con el filtro
}

/* RENDERIZAR TABLA Y BOTONES */
function renderizarTabla() {
    const tbody = document.getElementById('eq-table-body');
    if (!tbody) return;

    // Obtenemos los valores de los filtros actuales
    const searchInput = document.getElementById('search-input');
    const search = searchInput ? normalizarTexto(searchInput.value) : '';
    const filterLocElement = document.getElementById('filter-location');
    const filterLoc = filterLocElement ? filterLocElement.value : '';

    // .filter() recorre el array y devuelve solo los que cumplen la condición
    const filtrados = todosLosEquipos.filter(e => {
        const matchSearch = normalizarTexto(e.nombre).includes(search) || 
                            normalizarTexto(e.marca).includes(search) || 
                            normalizarTexto(e.modelo).includes(search) ||
                            normalizarTexto(e.id_equipamiento).includes(search);
        
        const matchCat = currentCategoryFilter === '' || e.categoria === currentCategoryFilter;
        const matchLoc = filterLoc === '' || e.ubicacion === filterLoc;

        return matchSearch && matchCat && matchLoc; 
    });

    // Mostramos texto de resultados
    const showingText = document.getElementById('eq-showing-text');
    if (showingText) showingText.textContent = `Mostrando ${filtrados.length} de ${todosLosEquipos.length} equipamientos`;

    // Si no hay resultados, mensajito
    if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px;">No se encontraron resultados.</td></tr>';
        return;
    }

    let html = '';
    const rolUsuario = window.ROL ? window.ROL.toUpperCase() : 'USER';

    // .forEach() recorre cada elemento del array filtrado para crear una fila (<tr>).
    filtrados.forEach(e => {
        let btns = `<div class="eq-actions-wrapper" id="actions-${e.id_equipamiento}">`;
        
        // ACCESIBILIDAD: Añadimos aria-label a los botones para que los lectores de pantalla sepan qué hacen
        if (rolUsuario === 'ADMIN') {
            btns += `<button class="eq-action-btn eq-btn-edit" onclick="toggleEdit(${e.id_equipamiento})" aria-label="Editar equipo ${e.nombre}"><i class="fa-solid fa-pen" aria-hidden="true"></i></button>`;
            btns += `<button class="eq-action-btn eq-btn-delete" onclick="borrarEquipo(${e.id_equipamiento})" aria-label="Eliminar equipo ${e.nombre}"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button>`;
        } else {
            // Botón Asignar (Conserje)
            const safeUbi = (e.ubicacion || 'Almacén').replace(/'/g, "\\'");
             btns += `<button class="eq-action-btn btn-asignar-user" onclick="abrirModalAsignar(${e.id_equipamiento}, '${safeUbi}')" aria-label="Asignar ubicación a ${e.nombre}"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> Asignar</button>`;
        }
        btns += '</div>';

        const safeDesc = (e.descripcion || 'Sin descripción').replace(/'/g, "\\'");
        
        // ACCESIBILIDAD: Añadimos aria-label a los inputs de edición. 
        // Cambiamos el <div> de la descripción por un <button> para que sea accesible con el teclado.
        html += `
            <tr id="row-${e.id_equipamiento}">
                <td>${e.id_equipamiento}</td>
                <td>
                    <div class="eq-item-name">
                        <span class="eq-item-icon" id="icon-${e.id_equipamiento}">${obtenerIconoHTML(e.categoria)}</span>
                        <input type="text" id="edit-nombre-${e.id_equipamiento}" class="inline-edit" value="${e.nombre}" disabled aria-label="Editar nombre">
                    </div>
                </td>
                <td><input type="text" id="edit-marca-${e.id_equipamiento}" class="inline-edit" value="${e.marca}" disabled aria-label="Editar marca"></td>
                <td><input type="text" id="edit-modelo-${e.id_equipamiento}" class="inline-edit" value="${e.modelo}" disabled aria-label="Editar modelo"></td>
                <td>
                    <span class="eq-badge" id="cat-span-${e.id_equipamiento}">${e.categoria}</span>
                    <select id="edit-cat-${e.id_equipamiento}" class="inline-edit eq-badge category-select" disabled style="display: none;" aria-label="Editar categoría">
                        <option value="PORTATIL" ${e.categoria === 'PORTATIL' ? 'selected' : ''}>Portátil</option>
                        <option value="SOBREMESA" ${e.categoria === 'SOBREMESA' ? 'selected' : ''}>Sobremesa</option>
                        <option value="PERIFERICO" ${e.categoria === 'PERIFERICO' ? 'selected' : ''}>Periférico</option>
                        <option value="AUDIOVISUAL" ${e.categoria === 'AUDIOVISUAL' ? 'selected' : ''}>Audiovisual</option>
                        <option value="OTROS" ${e.categoria === 'OTROS' ? 'selected' : ''}>Otros</option>
                    </select>
                </td>
                <td>
                    <a href="index.html?page=historico&id=${e.id_equipamiento}" class="eq-location-link">
                        <i class="fa-solid fa-location-dot" aria-hidden="true"></i> ${e.ubicacion || 'Almacén'}
                    </a>
                </td>
                <td>
                    <button type="button" class="desc-truncate" id="desc-div-${e.id_equipamiento}" onclick="verDescripcion('${safeDesc}')" aria-label="Ver descripción completa de ${e.nombre}">
                        ${e.descripcion || 'Sin descripción'}
                    </button>
                    <input type="text" id="edit-desc-${e.id_equipamiento}" class="inline-edit" value="${e.descripcion || ''}" disabled style="display: none;" aria-label="Editar descripción">
                </td>
                <td>${btns}</td>
            </tr>
        `;
    });
    
    // Insertamos todo el HTML generado de golpe.
    tbody.innerHTML = html;
}

/* LOGICA DEL MODAL ASIGNAR CONSERJE */
window.abrirModalAsignar = function(idEquipo, ubicacionActual) {
    document.getElementById('asignar-id-eq').value = idEquipo;
    
    const select = document.getElementById('asignar-ubicacion-select');
    select.innerHTML = '<option value="">Selecciona una ubicación...</option>';
    
    // Si hay ubicaciones cargadas, las agregamos al <select>.
    if (listaUbicaciones && listaUbicaciones.length > 0) {
        listaUbicaciones.forEach(ubi => {
            const option = document.createElement('option');
            option.value = ubi.id_ubicacion; 
            option.textContent = ubi.nombre;
            if (ubi.nombre === ubicacionActual) option.selected = true; // Marcamos la actual.
            select.appendChild(option);
        });
    } else {
        select.innerHTML = '<option value="">Error: No hay aulas cargadas</option>';
    }

    // ACCESIBILIDAD: showModal() del elemento <dialog>
    document.getElementById('modal-asignar-ubicacion').showModal();
}

window.cerrarModalAsignar = function() {
    // ACCESIBILIDAD: Usamos close() del elemento <dialog>
    document.getElementById('modal-asignar-ubicacion').close();
}

// Escuchar el submit del modal para guardar la nueva ubicación
document.addEventListener('submit', async (e) => {
    if (e.target && e.target.id === 'form-asignar-ubicacion') {
        e.preventDefault(); // Evita que la página se recargue
        
        const idEquipo = document.getElementById('asignar-id-eq').value;
        const nuevaUbicacionId = document.getElementById('asignar-ubicacion-select').value;
        
        try {
            // Petición PUT a la API para actualizar
            const res = await fetch(`api/Equipamiento.php?id=${idEquipo}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_ubicacion_actual: nuevaUbicacionId })
            });

            if (res.ok) {
                cerrarModalAsignar();
                const equipo = todosLosEquipos.find(e => e.id_equipamiento == idEquipo);
                if (equipo) {
                    const select = document.getElementById('asignar-ubicacion-select');
                    const nuevoNombreUbi = select.options[select.selectedIndex].text;
                    
                    // Actualizamos los datos en la memoria para no tener que recargar
                    equipo.ubicacion = nuevoNombreUbi;
                    equipo.id_ubicacion_actual = nuevaUbicacionId;
                }
                renderizarTabla(); // Volvemos a dibujar la tabla.
            } else {
                const err = await res.json();
                alert("Error al guardar: " + (err.error || "Desconocido"));
            }
        } catch (error) {
            alert("Error de conexión.");
        }
    }
});

/* FUNCIONES DE UTILIDAD */
// Quita acentos y pasa a minúsculas para que la búsqueda sea más fácil
function normalizarTexto(texto) {
    if (!texto) return '';
    return texto.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Devuelve un string con el HTML del icono según la categoría
function obtenerIconoHTML(categoria) {
    if (categoria === 'PORTATIL' || categoria === 'SOBREMESA') return '<i class="fa-solid fa-laptop" aria-hidden="true"></i>';
    if (categoria === 'PERIFERICO') return '<i class="fa-solid fa-computer-mouse" aria-hidden="true"></i>';
    if (categoria === 'AUDIOVISUAL') return '<i class="fa-solid fa-video" aria-hidden="true"></i>';
    return '<i class="fa-solid fa-box" aria-hidden="true"></i>';
}

// Cuenta equipos, categorías y ubicaciones únicas para mostrarlas arriba
function actualizarEstadisticas() {
    document.getElementById('stat-total').textContent = todosLosEquipos.length;
    
    // Set() crea una colección sin duplicados
    const categoriasUnicas = new Set(todosLosEquipos.map(e => e.categoria));
    document.getElementById('stat-categories').textContent = categoriasUnicas.size;
    
    const ubicacionesUnicas = new Set(todosLosEquipos.map(e => e.ubicacion));
    document.getElementById('stat-locations').textContent = ubicacionesUnicas.size;

    // Llenamos el <select> de filtro de ubicación
    const locSelect = document.getElementById('filter-location');
    if(locSelect) {
        locSelect.innerHTML = '<option value="">Ubicación: Todas</option>';
        ubicacionesUnicas.forEach(loc => {
            if(loc) locSelect.innerHTML += `<option value="${loc}">${loc}</option>`;
        });
    }
}

/* MODALES DE DESCRIPCIÓN Y ELIMINACIÓN */
function verDescripcion(texto) {
    document.getElementById('desc-text-content').textContent = texto;
    // ACCESIBILIDAD: showModal() maneja el foco y bloquea el fondo
    document.getElementById('modal-desc').showModal();
}

function cerrarModalDesc() {
    document.getElementById('modal-desc').close();
}

function borrarEquipo(id) {
    document.getElementById('delete-id-eq').value = id;
    document.getElementById('modal-eliminar-eq').showModal();
}

function cerrarModalEliminar() {
    document.getElementById('modal-eliminar-eq').close();
}

function confirmarEliminar() {
    const id = document.getElementById('delete-id-eq').value;
    fetch(`api/Equipamiento.php?id=${id}`, { method: 'DELETE' })
        .then(res => {
            if (res.ok) { 
                cerrarModalEliminar(); 
                location.reload(); // Recargamos para ver los cambios.
            } 
            else alert("Error al intentar eliminar el equipo.");
        })
        .catch(err => alert("Error de conexión."));
}

/* LÓGICA DE EDICIÓN ADMIN */
function toggleEdit(id) {
    // Obtenemos todos los elementos de la fila
    const row = document.getElementById(`row-${id}`);
    const nombreInput = document.getElementById(`edit-nombre-${id}`);
    const marcaInput = document.getElementById(`edit-marca-${id}`);
    const modeloInput = document.getElementById(`edit-modelo-${id}`);
    const catSpan = document.getElementById(`cat-span-${id}`);
    const catSelect = document.getElementById(`edit-cat-${id}`);
    const descDiv = document.getElementById(`desc-div-${id}`);
    const descInput = document.getElementById(`edit-desc-${id}`);
    const actionsWrapper = document.getElementById(`actions-${id}`);

    // Habilitamos inputs y mostramos selects/inputs ocultos
    nombreInput.disabled = false;
    marcaInput.disabled = false;
    modeloInput.disabled = false;
    catSpan.style.display = 'none';
    catSelect.style.display = 'inline-block';
    catSelect.disabled = false;
    descDiv.style.display = 'none';
    descInput.style.display = 'block';
    descInput.disabled = false;
    row.classList.add('row-editing'); // Clase para pintar el fondo de amarillo
    
    // ACCESIBILIDAD: Añadimos aria-label a los botones de guardar y cancelar
    actionsWrapper.innerHTML = `
        <button class="eq-action-btn eq-btn-save" onclick="guardarEdicion(${id})" aria-label="Guardar cambios"><i class="fa-solid fa-check" aria-hidden="true"></i></button>
        <button class="eq-action-btn eq-btn-cancel" onclick="cancelarEdicion(${id})" aria-label="Cancelar edición"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
    `;
    nombreInput.focus(); // Ponemos el cursor automáticamente en el primer campo.
}

async function guardarEdicion(id) {
    // Obtención de elementos igual que en toggleEdit
    const row = document.getElementById(`row-${id}`);
    const nombreInput = document.getElementById(`edit-nombre-${id}`);
    const marcaInput = document.getElementById(`edit-marca-${id}`);
    const modeloInput = document.getElementById(`edit-modelo-${id}`);
    const catSpan = document.getElementById(`cat-span-${id}`);
    const catSelect = document.getElementById(`edit-cat-${id}`);
    const descDiv = document.getElementById(`desc-div-${id}`);
    const descInput = document.getElementById(`edit-desc-${id}`);
    const actionsWrapper = document.getElementById(`actions-${id}`);
    const iconSpan = document.getElementById(`icon-${id}`);

    if (nombreInput.value.trim() === '') return alert("El nombre no puede estar vacío");

    actionsWrapper.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-label="Guardando..."></i>';
    const equipoOriginal = todosLosEquipos.find(e => e.id_equipamiento == id);

    const body = {
        nombre: nombreInput.value, marca: marcaInput.value, modelo: modeloInput.value,
        categoria: catSelect.value || 'OTROS', descripcion: descInput.value
    };

    try {
        const res = await fetch(`api/Equipamiento.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error("Error al guardar");

        // Actualizamos los datos en la memoria local
        equipoOriginal.nombre = body.nombre;
        equipoOriginal.marca = body.marca;
        equipoOriginal.modelo = body.modelo;
        equipoOriginal.categoria = body.categoria;
        equipoOriginal.descripcion = body.descripcion;

        // Restauramos el estado visual deshabilitamos inputs, mostramos textos
        nombreInput.disabled = true; marcaInput.disabled = true; modeloInput.disabled = true;
        catSelect.style.display = 'none'; catSelect.disabled = true; catSpan.style.display = 'inline-block'; catSpan.textContent = body.categoria; 
        descInput.disabled = true; descInput.style.display = 'none'; descDiv.style.display = 'block'; descDiv.textContent = body.descripcion || 'Sin descripción';
        
        // Actualizamos el onclick de la descripción con el nuevo texto
        const newSafeDesc = (body.descripcion || 'Sin descripción').replace(/'/g, "\\'");
        descDiv.setAttribute('onclick', `verDescripcion('${newSafeDesc}')`);
        iconSpan.innerHTML = obtenerIconoHTML(body.categoria);
        row.classList.remove('row-editing'); 
        
        // ACCESIBILIDAD: Devolvemos los aria-label a los botones de editar/eliminar
        actionsWrapper.innerHTML = `
            <button class="eq-action-btn eq-btn-edit" onclick="toggleEdit(${id})" aria-label="Editar equipo ${body.nombre}"><i class="fa-solid fa-pen" aria-hidden="true"></i></button>
            <button class="eq-action-btn eq-btn-delete" onclick="borrarEquipo(${id})" aria-label="Eliminar equipo ${body.nombre}"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button>
        `;
    } catch (error) {
        alert("ERROR: " + error.message);
        cancelarEdicion(id); // Si falla, volvemos atrás
    }
}

function cancelarEdicion(id) {
    // Obtenemos elementoss
    const row = document.getElementById(`row-${id}`);
    const nombreInput = document.getElementById(`edit-nombre-${id}`);
    const marcaInput = document.getElementById(`edit-marca-${id}`);
    const modeloInput = document.getElementById(`edit-modelo-${id}`);
    const catSpan = document.getElementById(`cat-span-${id}`);
    const catSelect = document.getElementById(`edit-cat-${id}`);
    const descDiv = document.getElementById(`desc-div-${id}`);
    const descInput = document.getElementById(`edit-desc-${id}`);
    const actionsWrapper = document.getElementById(`actions-${id}`);

    // Recuperamos los datos originales del array para no guardar los cambios
    const equipoOriginal = todosLosEquipos.find(e => e.id_equipamiento == id);
    nombreInput.value = equipoOriginal.nombre; marcaInput.value = equipoOriginal.marca; modeloInput.value = equipoOriginal.modelo;
    catSelect.value = equipoOriginal.categoria; descInput.value = equipoOriginal.descripcion || '';

    // Restauramos estado visual
    nombreInput.disabled = true; marcaInput.disabled = true; modeloInput.disabled = true;
    catSelect.style.display = 'none'; catSelect.disabled = true; catSpan.style.display = 'inline-block';
    descInput.disabled = true; descInput.style.display = 'none'; descDiv.style.display = 'block';
    row.classList.remove('row-editing');

    // ACCESIBILIDAD: Añadimos aria-label
    actionsWrapper.innerHTML = `
        <button class="eq-action-btn eq-btn-edit" onclick="toggleEdit(${id})" aria-label="Editar equipo ${equipoOriginal.nombre}"><i class="fa-solid fa-pen" aria-hidden="true"></i></button>
        <button class="eq-action-btn eq-btn-delete" onclick="borrarEquipo(${id})" aria-label="Eliminar equipo ${equipoOriginal.nombre}"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button>
    `;
}

/* MODAL DE CREACIÓN PARA NUEVO EQUIPO */
function abrirModalCrear() { document.getElementById('modal-crear').showModal(); }
function cerrarModalCrear() { document.getElementById('modal-crear').close(); }

// Cierra el modal si haces clic fuera del contenido
const modalCrear = document.getElementById('modal-crear');
if (modalCrear) {
    modalCrear.addEventListener('click', evento => {
        const contenido = modalCrear.querySelector('.eq-modal-content');
        if (contenido && !contenido.contains(evento.target)) cerrarModalCrear();
    });
}

const formCrear = document.getElementById('form-crear-eq');
if (formCrear) {
    formCrear.addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
            nombre: document.getElementById('new-nombre').value, marca: document.getElementById('new-marca').value,
            modelo: document.getElementById('new-modelo').value, descripcion: document.getElementById('new-desc').value,
            categoria: document.getElementById('new-categoria').value
        };
        try {
            const res = await fetch('api/Equipamiento.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            if (!res.ok) return alert("Error del servidor al crear.");
            cerrarModalCrear(); 
            location.reload(); // Recargamos para ver el nuevo equipo.
        } catch (error) { alert("Error de conexión."); }
    });
}

/* INICIALIZACIÓN Y EVENTOS */
iniciarEquipamientos(); // Arranca todo al cargar el script

// Buscador (se ejecuta cada vez que el usuario escribe)
const searchInput = document.getElementById('search-input');
if (searchInput) searchInput.addEventListener('input', renderizarTabla);

// Filtro de ubicación (se ejecuta al cambiar la opción)
const filterLoc = document.getElementById('filter-location');
if (filterLoc) filterLoc.addEventListener('change', renderizarTabla);

// Clic en las tarjetas de categoría (vista usuario)
document.querySelectorAll('.eq-category-card').forEach(tarjeta => {
    tarjeta.addEventListener('click', () => {
        seleccionarCategoria(tarjeta.dataset.category, tarjeta.dataset.label);
    });
});

//Botón Volver a categorías vista usuario
const btnVolverCategorias = document.getElementById('eq-back-categories');
if (btnVolverCategorias) {
    btnVolverCategorias.addEventListener('click', () => {
        currentCategoryFilter = '';
        document.getElementById('eq-user-results-header').hidden = true;
        document.getElementById('eq-table-section').hidden = true;
        document.getElementById('eq-category-browser').hidden = false;
        document.getElementById('eq-admin-controls').hidden = true; // Ocultar buscador
        
        // Limpiamos el buscador al volver
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
            const clearSearchBtn = document.getElementById('clear-search-eq');
            if (clearSearchBtn) clearSearchBtn.classList.remove('visible');
        }
    });
}

// Pestañas de categoría vista admin
document.querySelectorAll('#eq-admin-tabs .eq-tab').forEach(tab => {
    tab.addEventListener('click', event => {
        // Quitamos la clase active a todas las pestañas
        document.querySelectorAll('#eq-admin-tabs .eq-tab').forEach(item => item.classList.remove('active'));
        // Añadimos active solo a la clickeada
        event.currentTarget.classList.add('active');
        currentCategoryFilter = event.currentTarget.getAttribute('data-category') || '';
        renderizarTabla();
    });
});

// Botón de limpiar búsqueda X
const clearSearchBtn = document.getElementById('clear-search-eq');
if (searchInput && clearSearchBtn) {
    searchInput.addEventListener('input', () => {
        // Muestra u oculta la X dependiendo de si hay texto
        if (searchInput.value.length > 0) clearSearchBtn.classList.add('visible');
        else clearSearchBtn.classList.remove('visible');
    });
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.classList.remove('visible');
        searchInput.dispatchEvent(new Event('input')); // Forzamos el evento para que la tabla se actualice
        searchInput.focus(); // Devolvemos el foco al inputs
    });
}

// Se ejecuta después de abrir la categoría para que el equipo enlazado desde Ubicaciones ya esté en el DOM
function resaltarEquipoDesdeUbicacion(idEquipo) {
    setTimeout(() => {
        const fila = document.getElementById(`row-${idEquipo}`);

        if (fila) {
            fila.classList.add('row-highlight');
            fila.scrollIntoView({ behavior: 'smooth', block: 'center' });

            setTimeout(() => {
                fila.classList.remove('row-highlight');
                window.history.replaceState({}, document.title, "index.html?page=equipamientos");
            }, 3000);
        }
    }, 100);
}