/* =========================================
   1. GLOBAL VARIABLES & SETUP
   ========================================= */
const appCssBaseUrl = new URL('../css/', document.currentScript.src);
let notificationUserId = null;
let notifications = [];

/* =========================================
   2. INITIALIZATION & SESSION CHECK
   ========================================= */
document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    let page = urlParams.get('page') || 'login';

    // --- COLORBLIND Dark Mode ---
    const isColorblind = localStorage.getItem('modoDaltonismo') === 'true';
    const isDarkMode = localStorage.getItem('modoOscuro') === 'true';

    if (isColorblind) {
        document.body.classList.add('colorblind-mode');
        const switchEl = document.getElementById('colorblindSwitch');
        if (switchEl) switchEl.classList.add('active');
    }

    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        const darkSwitchEl = document.getElementById('darkSwitch');
        if (darkSwitchEl) darkSwitchEl.classList.add('active');
    }

    try {
        const res = await fetch('api/Login.php', { method: 'GET' });
        const sessionData = await res.json();

        if (sessionData.autenticado === false) {
            if (page !== 'login') {
                window.location.href = 'index.html?page=login';
                return;
            }
            loadView('login');
        } else {
            const user = sessionData.usuario;
            window.ROL = user.rol; 
            window.USUARIO_ID = user.id_usuario;
            window.USUARIO_DATA = user;

            if (page === 'login') {
                window.location.href = 'index.html?page=equipamientos';
                return;
            }

            // Security Check 
            if ((page === 'usuarios' || page === 'ubicaciones') && user.rol !== 'ADMIN') {
                window.location.href = 'index.html?page=equipamientos';
                return;
            }
            document.getElementById('main-navbar').style.display = 'flex';
            document.getElementById('main-footer').style.display = 'block';
            document.getElementById('nav-username').textContent = user.nombre;
            document.getElementById('nav-avatar').textContent = user.nombre.substring(0, 2).toUpperCase();

            if (user.rol === 'ADMIN') {
                document.getElementById('nav-ubicaciones').style.display = 'block';
                document.getElementById('nav-usuarios').style.display = 'block';
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

            document.querySelectorAll('.nav-link').forEach(link => {
                if (link.dataset.page === page) link.classList.add('active');
                else link.classList.remove('active');
            });

            loadView(page, user.rol);
        }
    } catch (error) {
        console.error("Error checking session:", error);
        document.getElementById('app-content').innerHTML = '<p style="text-align:center; color:red;">Error de conexión. Revisa la consola.</p>';
    }
});

/* =========================================
   3. DYNAMIC VIEW LOADER
   ========================================= */
async function loadView(pageName, role) {
    const mainContent = document.getElementById('app-content');
    mainContent.innerHTML = '<p style="text-align:center; margin-top:50px;">Cargando vista...</p>';

    let htmlFile = '';
    let cssFile = '';
    let jsFile = '';

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

    try {
        const res = await fetch(`view/html/${htmlFile}.html`);
        if (!res.ok) throw new Error(`No se encontró ${htmlFile}.html`);
        
        const html = await res.text();
        mainContent.innerHTML = html;

        loadPageCSS(cssFile);
        loadPageJS(jsFile);

    } catch (error) {
        console.error(error);
        mainContent.innerHTML = `<p style="text-align:center; color:red;">Error 404: No se encontró la vista ${htmlFile}.html</p>`;
    }
}

function loadPageCSS(cssFileName) {
    const oldCSS = document.getElementById('dynamic-css');
    if (oldCSS) oldCSS.remove();
    if (cssFileName) {
        const link = document.createElement('link');
        link.id = 'dynamic-css';
        link.rel = 'stylesheet';
        link.href = new URL(`${cssFileName}.css`, appCssBaseUrl).href;
        document.head.appendChild(link);
    }
}

function loadPageJS(jsFileName) {
    const oldScript = document.getElementById('dynamic-script');
    if (oldScript) oldScript.remove();
    if (jsFileName) {
        const script = document.createElement('script');
        script.id = 'dynamic-script';
        script.src = `view/javascript/${jsFileName}.js`;
        script.onerror = () => console.error(`❌ ERROR 404: No se pudo cargar view/javascript/${jsFileName}.js`);
        document.body.appendChild(script);
    }
}

/* =========================================
   4. NAVBAR UTILITIES and USER SETTINGS
   ========================================= */
function toggleDropdown(event) {
    event.stopPropagation();
    document.getElementById('adminMenu').classList.toggle('show');
}

async function logout() {
    try {
        const response = await fetch('api/Login.php', { method: 'DELETE' });
        if (response.ok) {
            window.location.href = 'index.html?page=login';
        } else {
            window.location.href = 'index.html?page=login';
        }
    } catch (error) {
        window.location.href = 'index.html?page=login';
    }
}

async function abrirPerfil(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('adminMenu');
    if (menu) menu.classList.remove('show');

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

function cerrarPerfil() {
    const modal = document.getElementById('perfilModal');
    if (modal && typeof modal.close === 'function') modal.close();
}

function toggleColorblind(event) {
    if (event) event.stopPropagation();

    const body = document.body;
    const switchEl = document.getElementById('colorblindSwitch');
    const darkSwitch = document.getElementById('darkSwitch');
    
    const isActive = body.classList.toggle('colorblind-mode');
    if (switchEl) switchEl.classList.toggle('active', isActive);
    
    // Si enciende Daltonismo, apagamos el Modo Oscuro
    if (isActive) {
        body.classList.remove('dark-mode');
        if (darkSwitch) darkSwitch.classList.remove('active');
        localStorage.setItem('modoOscuro', 'false');
    }
    
    localStorage.setItem('modoDaltonismo', isActive);
}

function toggleDarkMode(event) {
    if (event) event.stopPropagation();

    const body = document.body;
    const darkSwitch = document.getElementById('darkSwitch');
    const cbSwitch = document.getElementById('colorblindSwitch');
    
    const isActive = body.classList.toggle('dark-mode');
    if (darkSwitch) darkSwitch.classList.toggle('active', isActive);
    
    // Si enciende Modo Oscuro, apagamos Daltonismo
    if (isActive) {
        body.classList.remove('colorblind-mode');
        if (cbSwitch) cbSwitch.classList.remove('active');
        localStorage.setItem('modoDaltonismo', 'false');
    }
    
    localStorage.setItem('modoOscuro', isActive);
}
document.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof Element)) return;

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

    if (target.matches('.eq-modal') && getComputedStyle(target).display !== 'none') {
        target.style.display = 'none';
    }
});

/* =========================================
   5. NOTIFICATIONS SYSTEM
   ========================================= */
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

    badge.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
    badge.hidden = unreadCount === 0;
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
    const response = await fetch('api/NotificacionesAPI.php?mine=1');
    if (!response.ok) throw new Error(`No se pudieron cargar las notificaciones (${response.status}).`);

    const result = await response.json();
    if (!Array.isArray(result)) throw new Error('La respuesta de notificaciones no es válida.');

    notifications = result;
    updateNotificationBadge();
}

function initializeNotificationDropdown(userId) {
    notificationUserId = userId;
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
        unreadNotifications.forEach(notification => readIds.add(String(notification.id_notificacion)));
        localStorage.setItem(notificationStorageKey(), JSON.stringify([...readIds]));
        updateNotificationBadge();
    } catch (error) {
        console.error('Error al abrir las notificaciones:', error);
        list.replaceChildren();
        const message = document.createElement('p');
        message.className = 'notification-menu__message';
        message.textContent = 'No se pudieron cargar las notificaciones. Inténtalo de nuevo.';
        list.appendChild(message);
    }
}
/* =========================================
   CERRAR MENUS AL HACER CLIC FUERA para todos
   ========================================= */

window.addEventListener('click', function(event) {
    
    // MENÚ DE USUARIO (Perfil, Daltonismo, Salir)
    const adminMenu = document.getElementById('adminMenu');
    const adminBtn = document.querySelector('.admin-dropdown'); 

    if (adminMenu && adminMenu.classList.contains('show')) {
        if (!adminMenu.contains(event.target) && !adminBtn.contains(event.target)) {
            adminMenu.classList.remove('show');
        }
    }

    // MENÚ DE NOTIFICACIONES 
    const notifMenu = document.getElementById('notificationMenu');
    const notifBtn = document.getElementById('notificationToggle'); 

    if (notifMenu && notifMenu.classList.contains('show')) {
        if (!notifMenu.contains(event.target) && !notifBtn.contains(event.target)) {
            notifMenu.classList.remove('show');
            notifBtn.setAttribute('aria-expanded', 'false');
        }
    }
});

/* =========================================
   LÓGICA del hamburguesa
   ========================================= */
function toggleMobileMenu() {
    const navTabs = document.getElementById('navTabs');
    if (navTabs) {
        navTabs.classList.toggle('show-mobile');
    }
}

// Cerrar el menú móvil al hacer clic en un enlace
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-tabs a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const navTabs = document.getElementById('navTabs');
            if (navTabs && navTabs.classList.contains('show-mobile')) {
                navTabs.classList.remove('show-mobile');
            }
        });
    });
});