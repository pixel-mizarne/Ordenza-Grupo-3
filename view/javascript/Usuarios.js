const apiUrl = new URL('../../api/UsuariosAPI.php', document.currentScript.src).href;

// Referencias al DOM
const contenedorAdmins = document.getElementById('contenedorAdmins');
const contenedorUsuarios = document.getElementById('contenedorUsuarios');
const btnAnadir = document.getElementById('btnAnadir');
const dialogPopup = document.getElementById('popupUsuario');
const formUsuario = document.getElementById('formularioUsuario');
const btnCerrarPopup = document.getElementById('btnCerrarPopUp');
const tituloPopup = document.getElementById('popupTitulo');
const estadisticaTotal = document.getElementById('estadisticaTotal');
const dialogEliminar = document.getElementById('popupEliminar');
const btnCancelarEliminar = document.getElementById('btnCancelarEliminar');
const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');
const inputEliminarId = document.getElementById('eliminarUsuId');
const dialogAvisoCuenta = document.getElementById('popupAvisoCuenta');
const mensajeAvisoCuenta = document.getElementById('mensajeAvisoCuenta');
const btnCerrarAvisoCuenta = document.getElementById('btnCerrarAvisoCuenta');

// GET
async function cargarUsuarios() {
    try {
        const respuesta = await fetch(apiUrl);
        if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
        const usuarios = await respuesta.json();
        
        contenedorAdmins.innerHTML = '';
        contenedorUsuarios.innerHTML = '';
        if (estadisticaTotal) estadisticaTotal.textContent = usuarios.length; // Actualiza el contador

        usuarios.forEach(usuario => {
            const article = document.createElement('article');
            const esAdmin = String(usuario.rol).toUpperCase() === 'ADMIN';
            article.className = `tarjeta-usu ${esAdmin ? 'admin' : 'usuario'}`;
            const detalles = document.createElement('div');
            detalles.className = 'tarjeta-info';

            [
                ['Nombre:', usuario.nombre],
                ['Apellido:', usuario.apellidos],
                ['Usuario:', usuario.nombre_usuario],
                ['Rol:', usuario.rol]
            ].forEach(([etiqueta, valor]) => {
                const parrafo = document.createElement('p');
                const textoEtiqueta = document.createElement('strong');
                textoEtiqueta.textContent = etiqueta;
                parrafo.append(textoEtiqueta, ` ${valor ?? ''}`);
                detalles.appendChild(parrafo);
            });

            const acciones = document.createElement('div');
            acciones.className = 'tarjetaAccion';
            const esUsuarioActual = Number(usuario.id_usuario) === Number(window.USUARIO_ID);

            const botonEditar = document.createElement('button');
            botonEditar.className = 'btnEditar';
            botonEditar.type = 'button';
            botonEditar.setAttribute('aria-label', 'Editar usuario');
            botonEditar.title = 'Editar usuario';
            const iconoEditar = document.createElement('i');
            iconoEditar.className = 'fa-solid fa-pen';
            iconoEditar.setAttribute('aria-hidden', 'true');
            botonEditar.appendChild(iconoEditar);
            botonEditar.addEventListener('click', () => {
                if (esUsuarioActual) {
                    mostrarAvisoCuenta('editar');
                    return;
                }

                abrirEditar(
                    usuario.id_usuario,
                    usuario.nombre,
                    usuario.apellidos,
                    usuario.nombre_usuario,
                    usuario.rol
                );
            });

            const botonEliminar = document.createElement('button');
            botonEliminar.className = 'btnEliminar';
            botonEliminar.type = 'button';
            botonEliminar.setAttribute('aria-label', 'Eliminar usuario');
            botonEliminar.title = 'Eliminar usuario';
            const iconoEliminar = document.createElement('i');
            iconoEliminar.className = 'fa-regular fa-trash-can';
            iconoEliminar.setAttribute('aria-hidden', 'true');
            botonEliminar.appendChild(iconoEliminar);
            botonEliminar.addEventListener('click', () => {
                if (esUsuarioActual) {
                    mostrarAvisoCuenta('eliminar');
                    return;
                }

                borrarUsuario(usuario.id_usuario);
            });

            acciones.append(botonEditar, botonEliminar);
            article.append(detalles, acciones);
            (esAdmin ? contenedorAdmins : contenedorUsuarios).appendChild(article);
        });
    } catch (error) {
        console.error("Error al cargar:", error);
    }
}

// POPUP CREAR
btnAnadir.addEventListener('click', () => {
    formUsuario.reset();
    document.getElementById('userId').value = '';
    const passwordInput = document.getElementById('password');
    passwordInput.required = true;
    passwordInput.placeholder = '';
    tituloPopup.textContent = 'AÑADIR USUARIO';
    dialogPopup.showModal();
});

// POPUP EDITAR
window.abrirEditar = function(id, nombre, apellido, username, rolActual) {
    document.getElementById('userId').value = id;
    document.getElementById('nombre').value = nombre;
    document.getElementById('apellido').value = apellido;
    document.getElementById('username').value = username;
    
    const opcionRol = formUsuario.querySelector(`input[name="rol"][value="${String(rolActual).toUpperCase()}"]`);
    if (opcionRol) opcionRol.checked = true;

    const passwordInput = document.getElementById('password');
    passwordInput.value = '';
    passwordInput.required = false;
    passwordInput.placeholder = 'Dejar en blanco para mantener la actual';
    
    tituloPopup.textContent = 'EDITAR USUARIO';
    dialogPopup.showModal();
}

function mostrarAvisoCuenta(accion) {
    mensajeAvisoCuenta.textContent = accion === 'editar'
        ? 'No puedes editar tu propia cuenta mientras tienes la sesión iniciada.'
        : 'No puedes eliminar tu propia cuenta mientras tienes la sesión iniciada.';
    dialogAvisoCuenta.showModal();
}

btnCerrarAvisoCuenta.addEventListener('click', () => {
    dialogAvisoCuenta.close();
});

// CERRAR POPUP
btnCerrarPopup.addEventListener('click', () => {
    dialogPopup.close();
});

// POST - PUT
formUsuario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const id = document.getElementById('userId').value;
    const metodo = id ? 'PUT' : 'POST';
    
    const urlPeticion = id ? `${apiUrl}?id=${id}` : apiUrl;

    const password = document.getElementById('password').value;
    const datos = {
        nombre: document.getElementById('nombre').value,
        apellidos: document.getElementById('apellido').value,
        nombre_usuario: document.getElementById('username').value,
        rol: formUsuario.querySelector('input[name="rol"]:checked').value
    };
    if (password) datos.password = password;

    try {
        const respuesta = await fetch(urlPeticion, { 
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();
        if (respuesta.ok) {
            dialogPopup.close();
            await cargarUsuarios();
        } else {
            console.error("Error al guardar el usuario:", resultado.error);
            alert(resultado.error || "Error al guardar el usuario.");
        }
    } catch (error) {
        console.error("Error al comunicarse con la API:", error);
        alert("No se pudo guardar el usuario. Comprueba la conexión e inténtalo de nuevo.");
    }
});

// DELETE 
window.borrarUsuario = function(id) {
    inputEliminarId.value = id;
    dialogEliminar.showModal();
}

btnCancelarEliminar.addEventListener('click', () => {
    dialogEliminar.close();
});

btnConfirmarEliminar.addEventListener('click', async () => {
    const id = inputEliminarId.value;
    
    try {
        const respuesta = await fetch(`${apiUrl}?id=${id}`, { method: 'DELETE' });
        
        if (respuesta.ok) {
            dialogEliminar.close(); // Cerramos la ventana si ha ido bien
            await cargarUsuarios();    // Refrescamos la tabla
        } else {
            const resultado = await respuesta.json();
            console.error("Error al borrar en la base de datos:", resultado.error);
            alert(resultado.error || "Error al borrar el usuario.");
        }
    } catch (error) {
        console.error("Fallo de conexión al borrar:", error);
        alert("No se pudo borrar el usuario. Comprueba la conexión e inténtalo de nuevo.");
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargarUsuarios, { once: true });
} else {
    cargarUsuarios();
}