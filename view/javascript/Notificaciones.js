(() => {
    const cuerpoTabla = document.querySelector('.notificaciones-lista tbody');
    if (!cuerpoTabla) return;

    const esAdmin = window.ROL === 'ADMIN';
    let notificacionesCargadas = [];
    let filtroEstado = 'TODO';
    const estados = [
        { valor: 'PENDIENTE', etiqueta: 'Pendiente' },
        { valor: 'EN_PROCESO', etiqueta: 'En proceso' },
        { valor: 'REALIZADA', etiqueta: 'Completada' }
    ];

    document.querySelectorAll('.notis-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.notis-tab').forEach(otraTab => {
                otraTab.classList.remove('active');
            });
            tab.classList.add('active');
            filtroEstado = tab.dataset.category;
            mostrarNotificaciones();
        });
    });

    cargarNotificaciones();

    async function cargarNotificaciones() {
        try {
            const respuesta = await fetch(
                esAdmin ? 'api/NotificacionesAPI.php?all=1' : 'api/NotificacionesAPI.php?mine=1'
            );
            if (!respuesta.ok) {
                throw new Error(`No se pudieron cargar las notificaciones (${respuesta.status}).`);
            }

            const notificaciones = await respuesta.json();
            if (!Array.isArray(notificaciones)) {
                throw new Error('La respuesta de notificaciones no es válida.');
            }

            notificacionesCargadas = notificaciones;

            mostrarNotificaciones();
        } catch (error) {
            console.error('Error al cargar la lista de notificaciones:', error);
            mostrarMensaje('No se pudieron cargar las notificaciones. Inténtalo de nuevo.', 'error');
        }
    }

    function mostrarNotificaciones() {
        const notificacionesFiltradas = filtroEstado === 'TODO'
            ? notificacionesCargadas
            : notificacionesCargadas.filter(notificacion => notificacion.estado === filtroEstado);

        cuerpoTabla.replaceChildren();

        if (notificacionesFiltradas.length === 0) {
            const mensaje = notificacionesCargadas.length === 0
                ? 'No tienes notificaciones.'
                : 'No hay notificaciones con este estado.';
            mostrarMensaje(mensaje, 'empty');
            return;
        }

        notificacionesFiltradas.forEach(notificacion => {
            const fila = document.createElement('tr');

            [
                notificacion.fecha_creacion,
                notificacion.titulo,
                notificacion.descripcion
            ].forEach(valor => {
                const celda = document.createElement('td');
                celda.textContent = valor;
                fila.appendChild(celda);
            });

            const celdaEstado = document.createElement('td');
            if (esAdmin) {
                const selector = document.createElement('select');
                selector.className = 'notificaciones-lista__estado';
                selector.setAttribute('aria-label', `Estado de la notificación ${notificacion.titulo}`);

                estados.forEach(estado => {
                    const opcion = document.createElement('option');
                    opcion.value = estado.valor;
                    opcion.textContent = estado.etiqueta;
                    selector.appendChild(opcion);
                });

                selector.value = notificacion.estado;
                selector.disabled = notificacion.estado === 'REALIZADA';
                selector.addEventListener('change', () => {
                    actualizarEstado(notificacion, selector.value);
                });
                celdaEstado.appendChild(selector);
            } else {
                celdaEstado.textContent = etiquetaEstado(notificacion.estado);
            }
            fila.appendChild(celdaEstado);
            cuerpoTabla.appendChild(fila);
        });
    }

    async function actualizarEstado(notificacion, estado) {
        try {
            const respuesta = await fetch('api/NotificacionesAPI.php', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_notificacion: notificacion.id_notificacion,
                    estado
                })
            });
            const datos = await respuesta.json();
            if (!respuesta.ok) {
                throw new Error(datos.error || `No se pudo actualizar el estado (${respuesta.status}).`);
            }

            notificacion.estado = estado;
            mostrarNotificaciones();
        } catch (error) {
            console.error('Error al actualizar el estado de la notificación:', error);
            await cargarNotificaciones();
            mostrarMensaje(error.message, 'error');
        }
    }

    function etiquetaEstado(estado) {
        return {
            REALIZADA: 'Completada',
            PENDIENTE: 'Pendiente',
            EN_PROCESO: 'En proceso'
        }[estado] || estado;
    }

    function mostrarMensaje(mensaje, tipo) {
        const fila = document.createElement('tr');
        const celda = document.createElement('td');
        celda.colSpan = 4;
        celda.className = `notificaciones-lista__mensaje notificaciones-lista__mensaje--${tipo}`;
        celda.textContent = mensaje;
        fila.appendChild(celda);
        cuerpoTabla.replaceChildren(fila);
    }
})();
