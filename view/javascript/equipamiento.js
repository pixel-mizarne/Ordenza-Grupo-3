let todosLosEquipos = [];
let currentCategoryFilter = ""; 
let listaUbicaciones = [];

// ==========================================
// 1. CARGA INICIAL Y BOTÓN CREAR
// ==========================================
async function iniciarEquipamientos() {
    const rolUsuario = window.ROL ? window.ROL.toUpperCase() : 'USER';
    const btnCreate = document.getElementById('btn-crear-equipamiento');
    const esAdmin = rolUsuario === 'ADMIN';

    // Separa la vista antigua de administración del nuevo selector exclusivo para usuarios.
    currentCategoryFilter = '';
    document.getElementById('eq-admin-controls').hidden = !esAdmin;
    document.getElementById('eq-admin-tabs').hidden = !esAdmin;
    document.getElementById('eq-category-browser').hidden = esAdmin;
    document.getElementById('eq-table-section').hidden = !esAdmin;
    if (btnCreate) btnCreate.style.display = (rolUsuario === 'ADMIN') ? 'flex' : 'none';

    // Cargar ubicaciones
    try {
        const resUbi = await fetch('api/UbicacionesAPI.php'); 
        if (resUbi.ok) listaUbicaciones = await resUbi.json();
    } catch (e) { console.error("Error ubicaciones:", e); }

    // Cargar equipos (VERSIÓN DE DIAGNÓSTICO)
    try {
        const res = await fetch('api/Equipamiento.php');
        
        // Leemos la respuesta como texto plano primero para ver si PHP está escupiendo HTML
        const textoRespuesta = await res.text();
        
        // Intentamos convertirlo a JSON
        let data;
        try {
            data = JSON.parse(textoRespuesta);
        } catch (e) {
            alert("La API no devolvió JSON. Revisa la consola. El servidor dijo: " + textoRespuesta.substring(0, 100));
            return;
        }

        // Si el JSON tiene un error, lo mostramos
        if (data.error) {
            alert("Error de la API: " + data.error);
            return;
        }

        // Si no es una lista, lo mostramos
        if (!Array.isArray(data)) {
            alert("La API devolvió algo, pero no es una lista de equipos.");
            console.log("Lo que devolvió:", data);
            return;
        }

        // Si llegamos aquí, todo está perfecto
        todosLosEquipos = data;
        actualizarEstadisticas();
        if (esAdmin) renderizarTabla();

        // Si el historial enlaza a un equipo concreto, abrimos directamente su categoría y lo resaltamos.
        const idEquipoSolicitado = new URLSearchParams(window.location.search).get('id');
        const equipoSolicitado = todosLosEquipos.find(e => String(e.id_equipamiento) === idEquipoSolicitado);
        if (equipoSolicitado) {
            if (!esAdmin) {
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

// Muestra únicamente los equipos de la categoría elegida y conserva accesible el regreso al selector.
function seleccionarCategoria(categoria, etiqueta) {
    currentCategoryFilter = categoria;
    document.getElementById('eq-category-browser').hidden = true;
    document.getElementById('eq-user-results-header').hidden = false;
    document.getElementById('eq-table-section').hidden = false;
    document.getElementById('eq-selected-category').textContent = etiqueta;

    const filterLocation = document.getElementById('filter-location');
    if (filterLocation) filterLocation.value = '';

    renderizarTabla();
}

// ==========================================
// 2. RENDERIZAR TABLA Y BOTONES
// ==========================================
function renderizarTabla() {
    const tbody = document.getElementById('eq-table-body');
    if (!tbody) return;

    const searchInput = document.getElementById('search-input');
    const search = searchInput ? normalizarTexto(searchInput.value) : '';
    const filterLocElement = document.getElementById('filter-location');
    const filterLoc = filterLocElement ? filterLocElement.value : '';

    const filtrados = todosLosEquipos.filter(e => {
        const matchSearch = normalizarTexto(e.nombre).includes(search) || 
                            normalizarTexto(e.marca).includes(search) || 
                            normalizarTexto(e.modelo).includes(search) ||
                            normalizarTexto(e.id_equipamiento).includes(search);
        
        const matchCat = currentCategoryFilter === '' || e.categoria === currentCategoryFilter;
        const matchLoc = filterLoc === '' || e.ubicacion === filterLoc;

        return matchSearch && matchCat && matchLoc;
    });

    const showingText = document.getElementById('eq-showing-text');
    if (showingText) showingText.textContent = `Mostrando ${filtrados.length} de ${todosLosEquipos.length} equipamientos`;

    if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px;">No se encontraron resultados.</td></tr>';
        return;
    }

    let html = '';
    const rolUsuario = window.ROL ? window.ROL.toUpperCase() : 'USER';

    filtrados.forEach(e => {
        let btns = `<div class="eq-actions-wrapper" id="actions-${e.id_equipamiento}">`;
        
        if (rolUsuario === 'ADMIN') {
            btns += `<button class="eq-action-btn eq-btn-edit" onclick="toggleEdit(${e.id_equipamiento})"><i class="fa-solid fa-pen"></i></button>`;
            btns += `<button class="eq-action-btn eq-btn-delete" onclick="borrarEquipo(${e.id_equipamiento})"><i class="fa-regular fa-trash-can"></i></button>`;
        } else {
            // Botón Asignar (Conserje)
            const safeUbi = (e.ubicacion || 'Almacén').replace(/'/g, "\\'");
            btns += `<button class="eq-action-btn" style="background-color: #2563eb; color: white; width: auto; padding: 0 12px; font-size: 13px;" onclick="abrirModalAsignar(${e.id_equipamiento}, '${safeUbi}')"><i class="fa-solid fa-location-dot"></i> Asignar</button>`;
        }
        btns += '</div>';

        const safeDesc = (e.descripcion || 'Sin descripción').replace(/'/g, "\\'");
        
        html += `
            <tr id="row-${e.id_equipamiento}">
                <td>${e.id_equipamiento}</td>
                <td>
                    <div class="eq-item-name">
                        <span class="eq-item-icon" id="icon-${e.id_equipamiento}">${obtenerIconoHTML(e.categoria)}</span>
                        <input type="text" id="edit-nombre-${e.id_equipamiento}" class="inline-edit" value="${e.nombre}" disabled>
                    </div>
                </td>
                <td><input type="text" id="edit-marca-${e.id_equipamiento}" class="inline-edit" value="${e.marca}" disabled></td>
                <td><input type="text" id="edit-modelo-${e.id_equipamiento}" class="inline-edit" value="${e.modelo}" disabled></td>
                <td>
                    <span class="eq-badge" id="cat-span-${e.id_equipamiento}">${e.categoria}</span>
                    <select id="edit-cat-${e.id_equipamiento}" class="inline-edit eq-badge category-select" disabled style="display: none;">
                        <option value="PORTATIL" ${e.categoria === 'PORTATIL' ? 'selected' : ''}>Portátil</option>
                        <option value="SOBREMESA" ${e.categoria === 'SOBREMESA' ? 'selected' : ''}>Sobremesa</option>
                        <option value="PERIFERICO" ${e.categoria === 'PERIFERICO' ? 'selected' : ''}>Periférico</option>
                        <option value="AUDIOVISUAL" ${e.categoria === 'AUDIOVISUAL' ? 'selected' : ''}>Audiovisual</option>
                        <option value="OTROS" ${e.categoria === 'OTROS' ? 'selected' : ''}>Otros</option>
                    </select>
                </td>
                <td>
                    <a href="index.html?page=historico&id=${e.id_equipamiento}" class="eq-location-link">
                        <i class="fa-solid fa-location-dot"></i> ${e.ubicacion || 'Almacén'}
                    </a>
                </td>
                <td>
                    <div class="desc-truncate" id="desc-div-${e.id_equipamiento}" onclick="verDescripcion('${safeDesc}')">
                        ${e.descripcion || 'Sin descripción'}
                    </div>
                    <input type="text" id="edit-desc-${e.id_equipamiento}" class="inline-edit" value="${e.descripcion || ''}" disabled style="display: none;">
                </td>
                <td>${btns}</td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// ==========================================
// 3. LÓGICA DEL MODAL ASIGNAR
// ==========================================
window.abrirModalAsignar = function(idEquipo, ubicacionActual) {
    document.getElementById('asignar-id-eq').value = idEquipo;
    
    const select = document.getElementById('asignar-ubicacion-select');
    select.innerHTML = '<option value="">Selecciona una ubicación...</option>';
    
    if (listaUbicaciones && listaUbicaciones.length > 0) {
        listaUbicaciones.forEach(ubi => {
            const option = document.createElement('option');
            option.value = ubi.id_ubicacion; 
            option.textContent = ubi.nombre;
            if (ubi.nombre === ubicacionActual) option.selected = true;
            select.appendChild(option);
        });
    } else {
        select.innerHTML = '<option value="">Error: No hay aulas cargadas</option>';
    }

    document.getElementById('modal-asignar-ubicacion').showModal();
}

window.cerrarModalAsignar = function() {
    document.getElementById('modal-asignar-ubicacion').close();
}

// Escuchar el submit del modal
document.addEventListener('submit', async (e) => {
    if (e.target && e.target.id === 'form-asignar-ubicacion') {
        e.preventDefault();
        
        const idEquipo = document.getElementById('asignar-id-eq').value;
        const nuevaUbicacionId = document.getElementById('asignar-ubicacion-select').value;
        
        try {
            const res = await fetch(`api/Equipamiento.php?id=${idEquipo}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_ubicacion_actual: nuevaUbicacionId })
            });

            if (res.ok) {
                cerrarModalAsignar();
                location.reload(); 
            } else {
                const err = await res.json();
                alert("Error al guardar: " + (err.error || "Desconocido"));
            }
        } catch (error) {
            alert("Error de conexión.");
        }
    }
});

// ==========================================
// 4. FUNCIONES AUXILIARES
// ==========================================
function normalizarTexto(texto) {
    if (!texto) return '';
    return texto.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function obtenerIconoHTML(categoria) {
    if (categoria === 'PORTATIL' || categoria === 'SOBREMESA') return '<i class="fa-solid fa-laptop"></i>';
    if (categoria === 'PERIFERICO') return '<i class="fa-solid fa-computer-mouse"></i>';
    if (categoria === 'AUDIOVISUAL') return '<i class="fa-solid fa-video"></i>';
    return '<i class="fa-solid fa-box"></i>';
}

function actualizarEstadisticas() {
    document.getElementById('stat-total').textContent = todosLosEquipos.length;
    const categoriasUnicas = new Set(todosLosEquipos.map(e => e.categoria));
    document.getElementById('stat-categories').textContent = categoriasUnicas.size;
    const ubicacionesUnicas = new Set(todosLosEquipos.map(e => e.ubicacion));
    document.getElementById('stat-locations').textContent = ubicacionesUnicas.size;

    const locSelect = document.getElementById('filter-location');
    if(locSelect) {
        locSelect.innerHTML = '<option value="">Ubicación: Todas</option>';
        ubicacionesUnicas.forEach(loc => {
            if(loc) locSelect.innerHTML += `<option value="${loc}">${loc}</option>`;
        });
    }
}

function verDescripcion(texto) {
    document.getElementById('desc-text-content').textContent = texto;
    document.getElementById('modal-desc').style.display = 'flex';
}

function cerrarModalDesc() {
    document.getElementById('modal-desc').style.display = 'none';
}

// Lógica de edición y eliminación (ADMIN)
function toggleEdit(id) {
    const row = document.getElementById(`row-${id}`);
    const nombreInput = document.getElementById(`edit-nombre-${id}`);
    const marcaInput = document.getElementById(`edit-marca-${id}`);
    const modeloInput = document.getElementById(`edit-modelo-${id}`);
    const catSpan = document.getElementById(`cat-span-${id}`);
    const catSelect = document.getElementById(`edit-cat-${id}`);
    const descDiv = document.getElementById(`desc-div-${id}`);
    const descInput = document.getElementById(`edit-desc-${id}`);
    const actionsWrapper = document.getElementById(`actions-${id}`);

    nombreInput.disabled = false;
    marcaInput.disabled = false;
    modeloInput.disabled = false;
    catSpan.style.display = 'none';
    catSelect.style.display = 'inline-block';
    catSelect.disabled = false;
    descDiv.style.display = 'none';
    descInput.style.display = 'block';
    descInput.disabled = false;
    row.classList.add('row-editing'); 
    
    actionsWrapper.innerHTML = `
        <button class="eq-action-btn eq-btn-save" onclick="guardarEdicion(${id})"><i class="fa-solid fa-check"></i></button>
        <button class="eq-action-btn eq-btn-cancel" onclick="cancelarEdicion(${id})"><i class="fa-solid fa-xmark"></i></button>
    `;
    nombreInput.focus();
}

async function guardarEdicion(id) {
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

    actionsWrapper.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
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

        equipoOriginal.nombre = body.nombre;
        equipoOriginal.marca = body.marca;
        equipoOriginal.modelo = body.modelo;
        equipoOriginal.categoria = body.categoria;
        equipoOriginal.descripcion = body.descripcion;

        nombreInput.disabled = true; marcaInput.disabled = true; modeloInput.disabled = true;
        catSelect.style.display = 'none'; catSelect.disabled = true; catSpan.style.display = 'inline-block'; catSpan.textContent = body.categoria; 
        descInput.disabled = true; descInput.style.display = 'none'; descDiv.style.display = 'block'; descDiv.textContent = body.descripcion || 'Sin descripción';
        
        const newSafeDesc = (body.descripcion || 'Sin descripción').replace(/'/g, "\\'");
        descDiv.setAttribute('onclick', `verDescripcion('${newSafeDesc}')`);
        iconSpan.innerHTML = obtenerIconoHTML(body.categoria);
        row.classList.remove('row-editing'); 
        
        actionsWrapper.innerHTML = `
            <button class="eq-action-btn eq-btn-edit" onclick="toggleEdit(${id})"><i class="fa-solid fa-pen"></i></button>
            <button class="eq-action-btn eq-btn-delete" onclick="borrarEquipo(${id})"><i class="fa-regular fa-trash-can"></i></button>
        `;
    } catch (error) {
        alert("ERROR: " + error.message);
        cancelarEdicion(id);
    }
}

function cancelarEdicion(id) {
    const row = document.getElementById(`row-${id}`);
    const nombreInput = document.getElementById(`edit-nombre-${id}`);
    const marcaInput = document.getElementById(`edit-marca-${id}`);
    const modeloInput = document.getElementById(`edit-modelo-${id}`);
    const catSpan = document.getElementById(`cat-span-${id}`);
    const catSelect = document.getElementById(`edit-cat-${id}`);
    const descDiv = document.getElementById(`desc-div-${id}`);
    const descInput = document.getElementById(`edit-desc-${id}`);
    const actionsWrapper = document.getElementById(`actions-${id}`);

    const equipoOriginal = todosLosEquipos.find(e => e.id_equipamiento == id);
    nombreInput.value = equipoOriginal.nombre; marcaInput.value = equipoOriginal.marca; modeloInput.value = equipoOriginal.modelo;
    catSelect.value = equipoOriginal.categoria; descInput.value = equipoOriginal.descripcion || '';

    nombreInput.disabled = true; marcaInput.disabled = true; modeloInput.disabled = true;
    catSelect.style.display = 'none'; catSelect.disabled = true; catSpan.style.display = 'inline-block';
    descInput.disabled = true; descInput.style.display = 'none'; descDiv.style.display = 'block';
    row.classList.remove('row-editing');

    actionsWrapper.innerHTML = `
        <button class="eq-action-btn eq-btn-edit" onclick="toggleEdit(${id})"><i class="fa-solid fa-pen"></i></button>
        <button class="eq-action-btn eq-btn-delete" onclick="borrarEquipo(${id})"><i class="fa-regular fa-trash-can"></i></button>
    `;
}

function borrarEquipo(id) {
    document.getElementById('delete-id-eq').value = id;
    document.getElementById('modal-eliminar-eq').style.display = 'flex';
}

function cerrarModalEliminar() {
    document.getElementById('modal-eliminar-eq').style.display = 'none';
}

function confirmarEliminar() {
    const id = document.getElementById('delete-id-eq').value;
    fetch(`api/Equipamiento.php?id=${id}`, { method: 'DELETE' })
        .then(res => {
            if (res.ok) { cerrarModalEliminar(); location.reload(); } 
            else alert("Error al intentar eliminar el equipo.");
        })
        .catch(err => alert("Error de conexión."));
}

function abrirModalCrear() { document.getElementById('modal-crear').showModal(); }
function cerrarModalCrear() { document.getElementById('modal-crear').close(); }

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
            cerrarModalCrear(); location.reload();
        } catch (error) { alert("Error de conexión."); }
    });
}

// Eventos de búsqueda y carga

    iniciarEquipamientos();

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.addEventListener('input', renderizarTabla);

    const filterLoc = document.getElementById('filter-location');
    if (filterLoc) filterLoc.addEventListener('change', renderizarTabla);

    // Cada tarjeta abre la tabla filtrada; así el inventario completo no aparece al entrar en la vista.
    document.querySelectorAll('.eq-category-card').forEach(tarjeta => {
        tarjeta.addEventListener('click', () => {
            seleccionarCategoria(tarjeta.dataset.category, tarjeta.dataset.label);
        });
    });

    // Permite volver a cambiar de categoría sin recargar la página.
    const btnVolverCategorias = document.getElementById('eq-back-categories');
    if (btnVolverCategorias) {
        btnVolverCategorias.addEventListener('click', () => {
            currentCategoryFilter = '';
            document.getElementById('eq-user-results-header').hidden = true;
            document.getElementById('eq-table-section').hidden = true;
            document.getElementById('eq-category-browser').hidden = false;
        });
    }

    // Mantiene la navegación original de pestañas disponible únicamente para administradores.
    document.querySelectorAll('#eq-admin-tabs .eq-tab').forEach(tab => {
        tab.addEventListener('click', event => {
            document.querySelectorAll('#eq-admin-tabs .eq-tab').forEach(item => item.classList.remove('active'));
            event.currentTarget.classList.add('active');
            currentCategoryFilter = event.currentTarget.getAttribute('data-category') || '';
            renderizarTabla();
        });
    });

    const clearSearchBtn = document.getElementById('clear-search-eq');
    if (searchInput && clearSearchBtn) {
        searchInput.addEventListener('input', () => {
            if (searchInput.value.length > 0) clearSearchBtn.classList.add('visible');
            else clearSearchBtn.classList.remove('visible');
        });
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearSearchBtn.classList.remove('visible');
            searchInput.dispatchEvent(new Event('input')); 
            searchInput.focus(); 
        });
    }

// Se ejecuta después de abrir la categoría para que el equipo enlazado desde Ubicaciones ya esté en el DOM.
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