let todosLosEquipos = [];
let currentCategoryFilter = "";

function normalizarTexto(texto) {
    if (!texto) return '';
    return texto.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

fetch('api/Equipamiento.php')
    .then(res => res.json())
    .then(data => {
        if (!document.getElementById('historico-table-body')) return; 
        todosLosEquipos = data;
        renderizarTablaHistorico(); 
    })
    .catch(err => console.error("Error al cargar equipos:", err));

// Pestañas de categoría
document.querySelectorAll('.eq-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        document.querySelectorAll('.eq-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        currentCategoryFilter = e.target.getAttribute('data-category');
        renderizarTablaHistorico();
    });
});

function renderizarTablaHistorico() {
    const tbody = document.getElementById('historico-table-body');
    if (!tbody) return;

    const searchInput = document.getElementById('search-input');
    const search = searchInput ? normalizarTexto(searchInput.value) : '';

    const filtrados = todosLosEquipos.filter(e => {
        // 👇 BÚSQUEDA AMPLIADA: Nombre, ID, Marca y Modelo 👇
        const matchSearch = normalizarTexto(e.nombre).includes(search) || 
                            normalizarTexto(e.id_equipamiento).includes(search) ||
                            normalizarTexto(e.marca).includes(search) ||
                            normalizarTexto(e.modelo).includes(search);
                            
        const matchCat = currentCategoryFilter === '' || e.categoria === currentCategoryFilter;
        return matchSearch && matchCat;
    });

    if (filtrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">No se encontraron resultados.</td></tr>';
        return;
    }

    let html = '';
    filtrados.forEach(e => {
        html += `
            <tr id="row-${e.id_equipamiento}">
                <td>${e.id_equipamiento}</td>
                <td>
                    <div class="eq-item-name">${e.nombre}</div>
                </td>
                <td>
                    <div class="eq-location">
                        <i class="fa-solid fa-location-dot"></i> ${e.ubicacion || 'Almacén'}
                    </div>
                </td>
               <td style="text-align: right;">
                    <!-- Botón inicial en "Ver" -->
                    <button type="button" class="eq-btn-history" onclick="verHistorialExpandido(${e.id_equipamiento})">
                        Ver
                    </button>
                </td>
            </tr>
            <tr id="history-row-${e.id_equipamiento}" style="display: none;">
                <td colspan="4" id="history-content-${e.id_equipamiento}" style="padding: 15px; background: #fffdf5;"></td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;

    // Auto-abrir desde el enlace de Equipamientos
    const urlParams = new URLSearchParams(window.location.search);
    const idToHighlight = urlParams.get('id');
    if (idToHighlight) {
        setTimeout(() => {
            verHistorialExpandido(idToHighlight); 
            const rowToHighlight = document.getElementById(`row-${idToHighlight}`);
            if (rowToHighlight) {
                rowToHighlight.classList.add('row-highlight');
                rowToHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => rowToHighlight.classList.remove('row-highlight'), 3000);
            }
        }, 100);
    }
}

async function verHistorialExpandido(id) {
    const historyRow = document.getElementById(`history-row-${id}`);
    const contentDiv = document.getElementById(`history-content-${id}`);
    const btn = document.querySelector(`#row-${id} .eq-btn-history`); // 👈 Capturamos el botón

    if (!historyRow) return;

    // Si ya está abierto, lo cierra y cambia el texto a "Ver"
    if (historyRow.style.display !== 'none') {
        historyRow.style.display = 'none';
        if (btn) btn.textContent = 'Ver';
        return;
    }

    // Si está cerrado, lo abre y cambia el texto a "Ocultar"
    historyRow.style.display = 'table-row';
    if (btn) btn.textContent = 'Ocultar';
    
    contentDiv.innerHTML = '<p style="text-align:center; padding: 20px;">Buscando...</p>';

    try {
        const res = await fetch(`api/Historico.php?id_equipamiento=${id}`);
        const datos = await res.json();

        if (!res.ok) throw new Error(datos.error || 'Error');
        
        if (datos.length === 0) {
            contentDiv.innerHTML = '<p style="text-align:center; color: orange; padding: 20px;">No hay movimientos.</p>';
            return;
        }

        datos.reverse(); 

        let html = '<div class="horizontal-timeline">';
        datos.forEach((h) => {
            const fInicio = new Date(h.fecha_inicio);
            const esActual = (h.fecha_fin === null);
            const formatFecha = (fecha) => fecha.toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

            html += `
                <div class="ht-node">
                    <div class="ht-icon ${esActual ? 'current' : ''}">
                        <i class="fa-solid fa-location-dot"></i>
                    </div>
                    <div class="ht-content">
                        <div class="ht-location">${h.ubicacion}</div>
                        <div class="ht-date">${formatFecha(fInicio)}</div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        contentDiv.innerHTML = html;

    } catch (err) {
        contentDiv.innerHTML = `<p style="text-align:center; color: red; padding: 20px;">Error: ${err.message}</p>`;
    }
}

// 👇 EVENTOS DEL BUSCADOR 👇
const searchHis = document.getElementById('search-input');
const clearHis = document.getElementById('clear-search-his');

if (searchHis) {
    // Cuando el usuario escribe, se filtra la tabla al instante
    searchHis.addEventListener('input', renderizarTablaHistorico); 
}

if (searchHis && clearHis) {
    searchHis.addEventListener('input', () => {
        clearHis.classList.toggle('visible', searchHis.value.length > 0);
    });
    
    clearHis.addEventListener('click', () => {
        searchHis.value = '';
        clearHis.classList.remove('visible');
        // Forzamos la actualización de la tabla
        renderizarTablaHistorico(); 
        searchHis.focus();
    });
}