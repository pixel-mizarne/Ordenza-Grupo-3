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

    const search = normalizarTexto(document.getElementById('search-input').value);

    const filtrados = todosLosEquipos.filter(e => {
        const matchSearch = normalizarTexto(e.nombre).includes(search) || 
                            normalizarTexto(e.marca).includes(search) || 
                            normalizarTexto(e.id_equipamiento).includes(search);
        const matchCat = currentCategoryFilter === '' || e.categoria === currentCategoryFilter;
        
        return matchSearch && matchCat;
    });

    if (filtrados.length === 0) {
        // 👇 COLSPAN A 4 👇
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">No se encontraron resultados.</td></tr>';
        return;
    }

    let html = '';
    filtrados.forEach(e => {
        let icon = '<i class="fa-solid fa-box"></i>';
        if (e.categoria === 'PORTATIL' || e.categoria === 'SOBREMESA') icon = '<i class="fa-solid fa-laptop"></i>';
        if (e.categoria === 'PERIFERICO') icon = '<i class="fa-solid fa-computer-mouse"></i>';
        if (e.categoria === 'AUDIOVISUAL') icon = '<i class="fa-solid fa-video"></i>';

        html += `
            <tr id="row-${e.id_equipamiento}" onclick="verHistorialExpandido(${e.id_equipamiento})" style="cursor: pointer;">
                <td>${e.id_equipamiento}</td>
                <td>
                    <div class="eq-item-name">
                        <span class="eq-item-icon">${icon}</span> ${e.nombre}
                    </div>
                </td>
                <td>
                    <div class="eq-location">
                        <i class="fa-solid fa-location-dot"></i> ${e.ubicacion || 'Almacén'}
                    </div>
                </td>
               <td style="text-align: left;">
    <button class="eq-btn-history">
        <i class="fa-solid  fa-clock-rotate-left"></i> Ver Historial
    </button>
</td>
            </tr>
            <tr id="history-row-${e.id_equipamiento}" style="display: none; background: #fffdf5;">
                <!-- 👇 COLSPAN A 4 👇 -->
                <td colspan="4" id="history-content-${e.id_equipamiento}" style="padding: 20px;"></td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;

    // Lógica de resaltado (Highlight)
    const urlParams = new URLSearchParams(window.location.search);
    const idToHighlight = urlParams.get('id');

    if (idToHighlight) {
        setTimeout(() => {
            const rowToHighlight = document.getElementById(`row-${idToHighlight}`);
            
            if (rowToHighlight) {
                rowToHighlight.classList.add('row-highlight');
                rowToHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                setTimeout(() => {
                    rowToHighlight.classList.remove('row-highlight');
                }, 5000);
            }
        }, 100);
    }
} 

document.getElementById('search-input').addEventListener('input', renderizarTablaHistorico);

async function verHistorialExpandido(id) {
    const historyRow = document.getElementById(`history-row-${id}`);
    const contentDiv = document.getElementById(`history-content-${id}`);

    if (historyRow.style.display === 'table-row') {
        historyRow.style.display = 'none';
        return;
    }

    historyRow.style.display = 'table-row';
    contentDiv.innerHTML = '<p style="text-align:center;">Buscando movimientos...</p>';

    try {
        const res = await fetch(`api/Historico.php?id_equipamiento=${id}`);
        const datos = await res.json();

        if (!res.ok) throw new Error(datos.error || 'Error al obtener historial');
        
        if (datos.length === 0) {
            contentDiv.innerHTML = '<p style="text-align:center; color: orange;">No hay movimientos registrados para este equipo.</p>';
            return;
        }

        let html = '<div class="horizontal-timeline">';

        datos.forEach((h, index) => {
            const fInicio = new Date(h.fecha_inicio);
            const fFin = h.fecha_fin ? new Date(h.fecha_fin) : null;
            const esActual = (fFin === null);

            const formatFecha = (fecha) => {
                return fecha.toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            };

            html += `
                <div class="ht-node">
                    <div class="ht-icon ${esActual ? 'current' : ''}">
                        <i class="fa-solid fa-location-dot"></i>
                    </div>
                    <div class="ht-location">${h.ubicacion}</div>
                    <div class="ht-date">${formatFecha(fInicio)}</div>
                </div>
            `;

            if (index < datos.length - 1) {
                html += `<div class="ht-line"></div>`;
            }
        });

        html += '</div>';
        contentDiv.innerHTML = html;

    } catch (err) {
        contentDiv.innerHTML = `<p style="text-align:center; color: red;">Error: ${err.message}</p>`;
    }
}
// Search Clear Logic for Historico
const searchHis = document.getElementById('search-input');
const clearHis = document.getElementById('clear-search-his');

if (searchHis && clearHis) {
    searchHis.addEventListener('input', () => {
        clearHis.classList.toggle('visible', searchHis.value.length > 0);
    });
    clearHis.addEventListener('click', () => {
        searchHis.value = '';
        clearHis.classList.remove('visible');
        searchHis.dispatchEvent(new Event('input')); // Triggers table refresh
        searchHis.focus();
    });
}