// ruta para los css de las vistas
const appCssBaseUrl = new URL('../css/', document.currentScript.src);
// clave de localstorage que guarda qué notificaciones ha leido. 
let notificationUserId = null;
let notifications = [];

// load
document.addEventListener("DOMContentLoaded", async () => {
    // pagina pedido del usuario
    const urlParams = new URLSearchParams(window.location.search);
    // si no hay pedido page, por defecto get login
    let page = urlParams.get('page') || 'login';

    // temas guardados, daltonismo y oscuro. se guarda en localstorage.
    const isColorblind = localStorage.getItem('modoDaltonismo') === 'true';
    const isDarkMode = localStorage.getItem('modoOscuro') === 'true';

    if (isColorblind) {
        document.body.classList.add('colorblind-mode');
        document.querySelectorAll('.cb-switch-toggle').forEach(sw => sw.classList.add('active'));
    }

    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        document.querySelectorAll('.dark-switch-toggle').forEach(sw => sw.classList.add('active'));
    }
    // verifica sesion con php Login, usa try/catch porque puede fallar
    try {
        const res = await fetch('api/Login.php', { method: 'GET' });
        const sessionData = await res.json();

        // no autenticado 
        // si intenta entrar en cualquier pagina que no sea login, redirigir login. 
        if (sessionData.autenticado === false) {
            if (page !== 'login') {
                window.location.href = 'index.html?page=login';
                return;
            }
            document.getElementById('main-navbar').style.display = 'none';
            document.getElementById('main-footer').style.display = 'none';
            
            loadView('login');

            // autenticado
        } else {
            const user = sessionData.usuario;
            window.ROL = user.rol; 
            window.USUARIO_ID = user.id_usuario;
            window.USUARIO_DATA = user;
            // si ya esta logueado, manda a la pagina principal equipamientos
            if (page === 'login') {
                window.location.href = 'index.html?page=equipamientos';
                return;
            }

            if ((page === 'usuarios' || page === 'ubicaciones') && user.rol !== 'ADMIN') {
                window.location.href = 'index.html?page=equipamientos';
                return;
            }
            // mostrar navbar y footer si hay sesion
            document.getElementById('main-navbar').style.display = 'flex';
            document.getElementById('main-footer').style.display = 'block';
            // pinta nombre y avatar en la navbar segun su nombre
            document.getElementById('nav-username').textContent = user.nombre;
            // las primeras 2 letras de nombre del usuario
            document.getElementById('nav-avatar').textContent = user.nombre.substring(0, 2).toUpperCase();
            
            // mobile enlances para admin
            const mobUbi = document.getElementById('mobile-nav-ubicaciones');
            const mobUsu = document.getElementById('mobile-nav-usuarios');

            if (user.rol === 'ADMIN') {
                document.getElementById('nav-ubicaciones').style.display = 'block';
                document.getElementById('nav-usuarios').style.display = 'block';
                if (mobUbi) mobUbi.style.display = 'block';
                if (mobUsu) mobUsu.style.display = 'block';
            } else {
                // ocultas solo en mobile
                if (mobUbi) mobUbi.style.display = 'none';
                if (mobUsu) mobUsu.style.display = 'none';
            }

            const notificationToggle = document.getElementById('notificationToggle');
            const isNotificationList = page === 'notificaciones' && (
                user.rol !== 'ADMIN' ||
                new URLSearchParams(window.location.search).get('vista') === 'lista'
            );
            notificationToggle.classList.toggle('is-current', isNotificationList);
            
            if (page === 'notificaciones') {
                notificationToggle.setAttribute('aria-current', 'page');
            } else {
                notificationToggle.removeAttribute('aria-current');
            }

            initializeNotificationDropdown(user.id_usuario);
            // marcar el link activo en la navbar
            document.querySelectorAll('.nav-link').forEach(link => {
                if (link.dataset.page === page) link.classList.add('active');
                else link.classList.remove('active');
            });
            // cargar la vista pedida
            loadView(page, user.rol);
        }
        // mensajes de error
    } catch (error) {
        console.error("Error checking session:", error);
        document.getElementById('app-content').innerHTML = '<p style="text-align:center; color:red;">Error de conexión. Revisa la consola.</p>';
    }
});
// load
async function loadView(pageName, role) {
    const mainContent = document.getElementById('app-content');
    mainContent.innerHTML = '<p style="text-align:center; margin-top:50px;">Cargando vista...</p>';
    // archivos
    let htmlFile = '';
    let cssFile = '';
    let jsFile = '';
    // mapa de archivos html y js
    if (pageName === 'login') { 
        htmlFile = 'Login'; jsFile = 'Login';
    } else if (pageName === 'equipamientos') {
        htmlFile = 'Equipamientos'; jsFile = 'Equipamiento';
    } else if (pageName === 'usuarios') {
        htmlFile = 'Usuarios'; jsFile = 'Usuarios';
    } else if (pageName === 'ubicaciones') {
        htmlFile = 'Ubicaciones'; cssFile = 'Ubicaciones'; jsFile = 'Ubicaciones';
    } else if (pageName === 'notificaciones') {
        const showNotificationList = new URLSearchParams(window.location.search).get('vista') === 'lista';
        htmlFile = (role === 'ADMIN' && !showNotificationList) ? 'NotificacionesAdmin' : 'NotificacionesLista';
        if (htmlFile === 'NotificacionesLista') jsFile = 'Notificaciones';
    } else if (pageName === 'historico') {
        htmlFile = 'Historico'; jsFile = 'Historico';
    }
    // descargar html
    try {
        const res = await fetch(`view/html/${htmlFile}.html`);
        if (!res.ok) throw new Error(`No se encontró ${htmlFile}.html`);
        
        const html = await res.text();
        mainContent.innerHTML = html;

    // cargar css y js de la vista
        loadPageCSS(cssFile);
        loadPageJS(jsFile);

    } catch (error) {
        console.error(error);
        mainContent.innerHTML = `<p style="text-align:center; color:red;">Error 404: No se encontró la vista ${htmlFile}.html</p>`;
    }
}
// load css 
// elimina el link id="dynamic-css" anterior y crea uno nuevo
// si la vista tiene CSS propio. Esto EVITA que el CSS de una
// vista "contamine" a la siguiente
function loadPageCSS(cssFileName) {
    const oldCSS = document.getElementById('dynamic-css');
    if (oldCSS) oldCSS.remove();
    if (cssFileName) {
        const link = document.createElement('link');
        link.id = 'dynamic-css';
        link.rel = 'stylesheet';
// Ruta absoluta: new URL('Ubicaciones.css', '.../view/css/')
        link.href = new URL(`${cssFileName}.css`, appCssBaseUrl).href;
        document.head.appendChild(link);
    }
}
// load js
function loadPageJS(jsFileName) {
    const oldScript = document.getElementById('dynamic-script');
    if (oldScript) oldScript.remove();
    if (jsFileName) {
        const script = document.createElement('script');
        script.id = 'dynamic-script';
        script.src = `view/javascript/${jsFileName}.js`;
        script.onerror = () => console.error(`ERROR 404: No se pudo cargar view/javascript/${jsFileName}.js`);
        document.body.appendChild(script);
        // al ser un <script> clásico, se ejecuta al insertarse
        // si fuera module, sería asíncrono y habría que esperar 'load'
    }
}
// load menu perfil
// abre/cierra el menu de perfil
function toggleDropdown(event) {
    // este método permite evitar la propagación del evento actual
    event.stopPropagation();
    // global de window y lo cierre inmediatamente después
    document.getElementById('adminMenu').classList.toggle('show');
}
// load logout
async function logout() {
    try {
        await fetch('api/Login.php', { method: 'DELETE' });
        window.location.href = 'index.html?page=login';
    } catch (error) {
        window.location.href = 'index.html?page=login';
    }
}
// abrir perfil
async function abrirPerfil(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('adminMenu');
    if (menu) menu.classList.remove('show');
// placeholders mientras llega la respuesta
    const modal = document.getElementById('perfilModal');
    document.getElementById('perfil-nombre').textContent = 'Cargando...';
    document.getElementById('perfil-apellidos').textContent = '...';
    document.getElementById('perfil-usuario').textContent = '...';
    document.getElementById('perfil-rol').textContent = '...';
    modal.showModal();

    try {
        const res = await fetch('api/Perfil.php');
        if (!res.ok) throw new Error("El servidor falló.");
        const user = await res.json();
// Rellenar campos con datos reales.
// Se usa textContent (no innerHTML)
        document.getElementById('perfil-nombre').textContent = user.nombre || 'N/A';
        document.getElementById('perfil-apellidos').textContent = user.apellidos || 'N/A';
        document.getElementById('perfil-usuario').textContent = user.nombre_usuario || 'N/A';
        document.getElementById('perfil-rol').textContent = user.rol || 'N/A';
        
        document.getElementById('perfil-avatar').textContent = (user.nombre || 'U').substring(0, 2).toUpperCase();

    } catch (error) {
        console.error("Error en fetch:", error);
        alert("No se pudieron cargar los datos. Revisa la consola (F12).");
        cerrarPerfil();
    }
}
// cerrar perfil
function cerrarPerfil() {
    const modal = document.getElementById('perfilModal');
    if (modal && typeof modal.close === 'function') modal.close();
}
// daltonimso
// activa/desactiva
// sincroniza todos los switches 
// estricto en activar solo un switch
function toggleColorblind(event) {
    if (event) event.stopPropagation();
    const body = document.body;
    const isActive = body.classList.toggle('colorblind-mode');
    // sincronizar switches visuales (desktop + mobile)
    document.querySelectorAll('.cb-switch-toggle').forEach(sw => sw.classList.toggle('active', isActive));

    //  si activamos daltonismo, apagamos oscuro
    if (isActive) {
        body.classList.remove('dark-mode');
        document.querySelectorAll('.dark-switch-toggle').forEach(sw => sw.classList.remove('active'));
        localStorage.setItem('modoOscuro', 'false');
    }
    localStorage.setItem('modoDaltonismo', isActive); // guarda true or false
}
// darkmode
function toggleDarkMode(event) {
    if (event) event.stopPropagation();
    const body = document.body;
    const isActive = body.classList.toggle('dark-mode');

    document.querySelectorAll('.dark-switch-toggle').forEach(sw => sw.classList.toggle('active', isActive));

    if (isActive) {
        body.classList.remove('colorblind-mode');
        document.querySelectorAll('.cb-switch-toggle').forEach(sw => sw.classList.remove('active'));
        localStorage.setItem('modoDaltonismo', 'false');
    }
    localStorage.setItem('modoOscuro', isActive);
}
// click features
// se ejecuta con cada click en la pagina
document.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    // cierra si hace click fuera
    if (target instanceof HTMLDialogElement && target.open) {
        const rect = target.getBoundingClientRect();
        const clickedOutside = (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
        );
        if (clickedOutside) target.close();
        return;
    }
    // cierra .eq-modal visibles (css)
    if (target.matches('.eq-modal') && getComputedStyle(target).display !== 'none') {
        target.style.display = 'none';
    }
});

function notificationStorageKey() {
    return `ordenza-notificaciones-leidas-${notificationUserId}`;
}

function getReadNotificationIds() {
    const savedIds = localStorage.getItem(notificationStorageKey());
    if (savedIds === null) return new Set();
    const parsedIds = JSON.parse(savedIds);
    if (!Array.isArray(parsedIds)) throw new Error('El estado de lectura guardado no es válido.');
    return new Set(parsedIds.map(String));
}

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    const readIds = getReadNotificationIds();
    const unreadCount = notifications.filter(notification => !readIds.has(String(notification.id_notificacion))).length;
    const markReadButton = document.getElementById('markAllNotificationsRead');

    badge.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
    badge.hidden = unreadCount === 0;
    markReadButton.disabled = unreadCount === 0;
}

function markAllNotificationsRead(event) {
    event.stopPropagation();
    const readIds = getReadNotificationIds();
    const unreadNotifications = notifications.filter(
        notification => !readIds.has(String(notification.id_notificacion))
    );

    if (unreadNotifications.length === 0) return;

    unreadNotifications.forEach(notification => readIds.add(String(notification.id_notificacion)));
    localStorage.setItem(notificationStorageKey(), JSON.stringify([...readIds]));
    renderNotificationItems([]);
    updateNotificationBadge();
}

function renderNotificationItems(items) {
    const list = document.getElementById('notificationList');
    list.replaceChildren();

    if (items.length === 0) {
        const message = document.createElement('p');
        message.className = 'notification-menu__message notification-menu__message--empty';
        message.textContent = 'No tienes notificaciones sin leer.';
        list.appendChild(message);
        return;
    }

    items.forEach(notification => {
        const item = document.createElement('article');
        item.className = 'notification-menu__item';

        const title = document.createElement('h3');
        title.textContent = notification.titulo;
        item.appendChild(title);

        const description = document.createElement('p');
        description.textContent = notification.descripcion;
        item.appendChild(description);

        const date = document.createElement('time');
        date.className = 'notification-menu__date';
        date.textContent = notification.fecha_creacion;
        date.dateTime = notification.fecha_creacion;
        item.appendChild(date);

        list.appendChild(item);
    });
}

async function fetchNotifications() {
    const endpoint = window.ROL === 'ADMIN'
        ? 'api/NotificacionesAPI.php?all=1'
        : 'api/NotificacionesAPI.php?mine=1';
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`No se pudieron cargar las notificaciones (${response.status}).`);

    const result = await response.json();
    if (!Array.isArray(result)) throw new Error('La respuesta de notificaciones no es válida.');

    notifications = result;
    updateNotificationBadge();
}

function initializeNotificationDropdown(userId) {
    notificationUserId = userId;
    document.getElementById('markAllNotificationsRead').addEventListener('click', markAllNotificationsRead);
    fetchNotifications().catch(error => console.error('Error al cargar las notificaciones:', error));
}

async function toggleNotifications(event) {
    event.stopPropagation();
    const menu = document.getElementById('notificationMenu');
    const toggle = document.getElementById('notificationToggle');

    if (menu.classList.contains('show')) {
        menu.classList.remove('show');
        toggle.setAttribute('aria-expanded', 'false');
        return;
    }

    menu.classList.add('show');
    toggle.setAttribute('aria-expanded', 'true');
    const list = document.getElementById('notificationList');
    list.replaceChildren();
    
    const loadingMessage = document.createElement('p');
    loadingMessage.className = 'notification-menu__message';
    loadingMessage.textContent = 'Cargando notificaciones...';
    list.appendChild(loadingMessage);

    try {
        await fetchNotifications();
        const readIds = getReadNotificationIds();
        const unreadNotifications = notifications.filter(
            notification => !readIds.has(String(notification.id_notificacion))
        );

        renderNotificationItems(unreadNotifications);
    } catch (error) {
        console.error('Error al abrir las notificaciones:', error);
        list.replaceChildren();
        const message = document.createElement('p');
        message.className = 'notification-menu__message';
        message.textContent = 'No se pudieron cargar las notificaciones. Inténtalo de nuevo.';
        list.appendChild(message);
    }
}

window.addEventListener('click', function(event) {
    const adminMenu = document.getElementById('adminMenu');
    const adminBtn = document.querySelector('.admin-dropdown'); 

    if (adminMenu && adminMenu.classList.contains('show')) {
        if (!adminMenu.contains(event.target) && !adminBtn.contains(event.target)) {
            adminMenu.classList.remove('show');
        }
    }

    const notifMenu = document.getElementById('notificationMenu');
    const notifBtn = document.getElementById('notificationToggle'); 

    if (notifMenu && notifMenu.classList.contains('show')) {
        if (!notifMenu.contains(event.target) && !notifBtn.contains(event.target)) {
            notifMenu.classList.remove('show');
            notifBtn.setAttribute('aria-expanded', 'false');
        }
    }
});
// modo mobile menu
// abre/cierra el menu hamburguesa
function toggleMobileMenu() {
    const drawer = document.getElementById('mobileDrawer');
    if (drawer) {
        drawer.classList.toggle('show');
    }
}

// Cerrar el menu mobile al hacer clic en un enlace (pero NO en los switches)
document.addEventListener('DOMContentLoaded', () => {
    // Al no incluir '.menu-option-daltonismo', los switches no cerrarán el menú
    const navLinks = document.querySelectorAll('.mobile-nav-links a, .mobile-user-options a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const drawer = document.getElementById('mobileDrawer');
            if (drawer && drawer.classList.contains('show')) {
                drawer.classList.remove('show');
            }
        });
    });
});

// logo animacion
// cuando el usuario baja > 30px, se añade .scrolled a <body>.
window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
        document.body.classList.add('scrolled');
    } else {
        document.body.classList.remove('scrolled');
    }
});