// 1. Get the form elements
const loginForm = document.getElementById('loginForm');
const errorDiv = document.getElementById('login-error');

// 2. Handle Login Submission
if (loginForm) {
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const btnLogin = document.getElementById('btnLogin');
        
        const inputUsuario = document.getElementById('usuario').value.trim();
        const inputPassword = document.getElementById('password').value;

        // Hide previous errors
        errorDiv.style.display = 'none';

        // Prevent blank spaces / empty fields
        if (inputUsuario === '' || inputPassword.trim() === '') {
            errorDiv.textContent = "El usuario y la contraseña no pueden estar vacíos.";
            errorDiv.style.display = 'block';
            return;
        }
        
        btnLogin.textContent = "Cargando...";
        btnLogin.disabled = true;

        try {
            const respuesta = await fetch('api/Login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    nombre_usuario: inputUsuario, 
                    password: inputPassword 
                })
            });
            
            const datos = await respuesta.json();
            
            if (respuesta.ok) {
                window.location.href = 'index.html?page=equipamientos';
            } else {
                errorDiv.textContent = "Usuario o contraseña incorrectos. Por favor, inténtalo de nuevo.";
                errorDiv.style.display = 'block';
                btnLogin.textContent = "Iniciar sesión";
                btnLogin.disabled = false;
            }
        } catch (error) {
            console.error("Error:", error);
            errorDiv.textContent = "Error de conexión con el servidor. Inténtalo más tarde.";
            errorDiv.style.display = 'block';
            btnLogin.textContent = "Iniciar sesión";
            btnLogin.disabled = false;
        }
    });
}

// 3. --- CLEAR INPUT (X) FUNCTIONALITY ---
function setupClearButton(inputId, btnId) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(btnId);
    
    if (!input || !btn) return;

    const toggleBtn = () => {
        btn.style.display = input.value.length > 0 ? 'block' : 'none';
    };

    toggleBtn();
    input.addEventListener('input', toggleBtn);

    btn.addEventListener('click', () => {
        input.value = '';
        toggleBtn();
        input.focus(); 
    });
}

// Initialize for both fields
setupClearButton('usuario', 'clear-usuario');
setupClearButton('password', 'clear-password');