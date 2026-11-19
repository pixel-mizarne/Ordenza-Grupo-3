(() => {
    // inicialización de la vista de notificaciones
    const cuerpoTabla = document.querySelector('.notificaciones-lista tbody');
    if (!cuerpoTabla) return;

    // datos de sesión y elementos de la interfaz
    const rolUsuario = typeof window.ROL === 'string' ? window.ROL.toUpperCase() : '';
    const esAdmin = rolUsuario === 'ADMIN';
    const botonAnadir = document.getElementById('btn-anadir-notificacion');
    const modalAnadir = document.getElementById('modal-anadir-notificacion');
    const formularioAnadir = document.getElementById('form-anadir-notificacion');
    const mensajeError = document.getElementById('notificacion-error');
    const tituloModal = document.getElementById('modal-notificacion-titulo');
    const botonSubmitFormulario = formularioAnadir.querySelector('[type="submit"]');
    const modalEliminar = document.getElementById('modal-eliminar-notificacion');
    const mensajeErrorEliminar = document.getElementById('notificacion-eliminar-error');
    const botonConfirmarEliminar = document.getElementById('btn-confirmar-eliminar-notificacion');
    const encabezadoAcciones = document.getElementById('notificaciones-acciones-header');
    let idNotificacionEliminar = null;
    let idNotificacionEditar = null;
    let notificacionesCargadas = [];
    let filtroEstado = 'TODO';

    // opciones que puede tener el estado de una notificación
    const estados = [
        { valor: 'PENDIENTE', etiqueta: 'Pendiente' },
        { valor: 'EN_PROCESO', etiqueta: 'En proceso' },
        { valor: 'REALIZADA', etiqueta: 'Completada' }
    ];

    // acciones de creación y eliminación disponibles para usuarios
    if (rolUsuario === 'USER' && botonAnadir && modalAnadir && formularioAnadir) {
        encabezadoAcciones.hidden = false;
        botonAnadir.hidden = false;
        botonAnadir.addEventListener('click', abrirFormularioCrear);
        document.getElementById('btn-cancelar-notificacion').addEventListener('click', () => {
            modalAnadir.close();
            resetearFormulario();
        });
        modalAnadir.addEventListener('click', evento => {
            if (evento.target === modalAnadir) modalAnadir.close();
        });
        formularioAnadir.addEventListener('submit', crearNotificacion);
        document.getElementById('btn-cancelar-eliminar-notificacion').addEventListener('click', () => {
            modalEliminar.close();
            mensajeErrorEliminar.hidden = true;
        });
        modalEliminar.addEventListener('click', evento => {
            if (evento.target === modalEliminar) modalEliminar.close();
        });
        botonConfirmarEliminar.addEventListener('click', eliminarNotificacion);
    }

    // filtrar la tabla según la pestaña seleccionada
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

    // abrir el formulario vacío para crear una notificación
    function abrirFormularioCrear() {
        resetearFormulario();
        tituloModal.textContent = 'Añadir notificación';
        botonSubmitFormulario.textContent = 'Añadir';
        modalAnadir.showModal();
    }

    // cargar los datos de la notificación seleccionada en el formulario
    function abrirFormularioEditar(notificacion) {
        resetearFormulario();
        idNotificacionEditar = notificacion.id_notificacion;
        formularioAnadir.elements.titulo.value = notificacion.titulo;
        formularioAnadir.elements.descripcion.value = notificacion.descripcion;
        tituloModal.textContent = 'Editar notificación';
        botonSubmitFormulario.textContent = 'Guardar';
        modalAnadir.showModal();
    }

    // limpiar el formulario y descartar el identificador de edición
    function resetearFormulario() {
        formularioAnadir.reset();
        mensajeError.hidden = true;
        idNotificacionEditar = null;
    }

    // guardar una notificación nueva o los cambios de una existente
    async function crearNotificacion(evento) {
        evento.preventDefault();
        botonSubmitFormulario.disabled = true;
        mensajeError.hidden = true;

        try {
            const respuesta = await fetch('api/NotificacionesAPI.php', {
                method: idNotificacionEditar === null ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_notificacion: idNotificacionEditar,
                    titulo: formularioAnadir.elements.titulo.value.trim(),
                    descripcion: formularioAnadir.elements.descripcion.value.trim()
                })
            });
            const datos = await respuesta.json();
            if (!respuesta.ok) {
                throw new Error(datos.error || `No se pudo guardar la notificación (${respuesta.status}).`);
            }

            resetearFormulario();
            modalAnadir.close();
            await cargarNotificaciones();
        } catch (error) {
            console.error('Error al guardar la notificación:', error);
            mensajeError.textContent = error.message || 'No se pudo guardar la notificación. Inténtalo de nuevo.';
            mensajeError.hidden = false;
        } finally {
            botonSubmitFormulario.disabled = false;
        }
    }

    // guardar el identificador antes de pedir confirmación
    function confirmarEliminar(notificacion) {
        idNotificacionEliminar = notificacion.id_notificacion;
        mensajeErrorEliminar.hidden = true;
        modalEliminar.showModal();
    }

    // eliminar la notificación confirmada
    async function eliminarNotificacion() {
        if (idNotificacionEliminar === null) return;
        botonConfirmarEliminar.disabled = true;
        mensajeErrorEliminar.hidden = true;

        try {
            const respuesta = await fetch(
                `api/NotificacionesAPI.php?id=${encodeURIComponent(idNotificacionEliminar)}`,
                { method: 'DELETE' }
            );
            const datos = await respuesta.json();
            if (!respuesta.ok) {
                throw new Error(datos.error || `No se pudo eliminar la notificación (${respuesta.status}).`);
            }

            modalEliminar.close();
            idNotificacionEliminar = null;
            await cargarNotificaciones();
        } catch (error) {
            console.error('Error al eliminar la notificación:', error);
            mensajeErrorEliminar.textContent = error.message || 'No se pudo eliminar la notificación. Inténtalo de nuevo.';
            mensajeErrorEliminar.hidden = false;
        } finally {
            botonConfirmarEliminar.disabled = false;
        }
    }

    // obtener las notificaciones del usuario o todas, según su rol
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

    // aplicar el filtro actual y dibujar las filas de la tabla
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
            if (esAdmin) fila.classList.add('notificaciones-lista__fila--admin');

            const celdaFecha = document.createElement('td');
            celdaFecha.dataset.label = 'Fecha';
            celdaFecha.textContent = notificacion.fecha_creacion;
            fila.appendChild(celdaFecha);

            const celdaTitulo = document.createElement('td');
            celdaTitulo.dataset.label = 'Título';
            celdaTitulo.textContent = notificacion.titulo;
            celdaTitulo.title = notificacion.titulo;
            fila.appendChild(celdaTitulo);

            const celdaDescripcion = document.createElement('td');
            celdaDescripcion.className = 'notificaciones-lista__descripcion';
            celdaDescripcion.dataset.label = 'Mensaje';
            celdaDescripcion.textContent = notificacion.descripcion;
            celdaDescripcion.title = notificacion.descripcion;
            fila.appendChild(celdaDescripcion);

            const celdaEstado = document.createElement('td');
            celdaEstado.dataset.label = 'Estado';
            if (esAdmin) {
                // los administradores pueden cambiar el estado pendiente o en proceso
                const selector = document.createElement('select');
                selector.className = 'notificaciones-lista__estado';
                selector.dataset.estado = notificacion.estado;
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
                    selector.dataset.estado = selector.value;
                    actualizarEstado(notificacion, selector.value);
                });
                celdaEstado.appendChild(selector);
            } else {
                const etiqueta = document.createElement('span');
                etiqueta.className = 'notificaciones-lista__estado notificaciones-lista__estado--etiqueta';
                etiqueta.dataset.estado = notificacion.estado;
                etiqueta.textContent = etiquetaEstado(notificacion.estado);
                celdaEstado.appendChild(etiqueta);
            }
            fila.appendChild(celdaEstado);

            // los usuarios pueden editar o eliminar sus notificaciones
            if (rolUsuario === 'USER') {
                const celdaAcciones = document.createElement('td');
                celdaAcciones.dataset.label = 'Acciones';
                const acciones = document.createElement('div');
                acciones.className = 'notificaciones-lista__acciones';

                const botonEditar = document.createElement('button');
                botonEditar.type = 'button';
                botonEditar.className = 'notificaciones-lista__boton-accion';
                botonEditar.setAttribute('aria-label', `Editar notificación ${notificacion.titulo}`);
                botonEditar.title = 'Editar notificación';
                botonEditar.innerHTML = '<i class="fa-solid fa-pen" aria-hidden="true"></i><span class="notificaciones-lista__texto-accion">Editar</span>';
                botonEditar.addEventListener('click', () => abrirFormularioEditar(notificacion));

                const botonEliminar = document.createElement('button');
                botonEliminar.type = 'button';
                botonEliminar.className = 'notificaciones-lista__boton-accion notificaciones-lista__boton-accion--eliminar';
                botonEliminar.setAttribute('aria-label', `Eliminar notificación ${notificacion.titulo}`);
                botonEliminar.title = 'Eliminar notificación';
                botonEliminar.innerHTML = '<i class="fa-regular fa-trash-can" aria-hidden="true"></i><span class="notificaciones-lista__texto-accion">Eliminar</span>';
                botonEliminar.addEventListener('click', () => confirmarEliminar(notificacion));

                acciones.append(botonEditar, botonEliminar);
                celdaAcciones.appendChild(acciones);
                fila.appendChild(celdaAcciones);
            }
            cuerpoTabla.appendChild(fila);
        });
    }

    // guardar el cambio de estado realizado por un administrador
    async function actualizarEstado(notificacion, estado) {
        try {
            const respuesta = await fetch('api/NotificacionesAPI.php?action=update-state', {
                method: 'POST',
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

    // convertir el valor guardado en un texto visible
    function etiquetaEstado(estado) {
        return {
            REALIZADA: 'Completada',
            PENDIENTE: 'Pendiente',
            EN_PROCESO: 'En proceso'
        }[estado] || estado;
    }

    // mostrar mensajes vacíos o errores dentro de la tabla
    function mostrarMensaje(mensaje, tipo) {
        const fila = document.createElement('tr');
        fila.className = 'notificaciones-lista__fila-mensaje';
        const celda = document.createElement('td');
        celda.colSpan = rolUsuario === 'USER' ? 5 : 4;
        celda.className = `notificaciones-lista__mensaje notificaciones-lista__mensaje--${tipo}`;
        celda.textContent = mensaje;
        fila.appendChild(celda);
        cuerpoTabla.replaceChildren(fila);
    }
})();
