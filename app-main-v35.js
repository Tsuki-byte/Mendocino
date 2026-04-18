const NIVELES_USUARIO = {
    BASICO: 'basico',
    AVANZADO: 'avanzado',
    EXPERTO: 'experto'
};

let usuarioActual = {
    nombre: 'demo',
    nivel: localStorage.getItem('nivelUsuarioMotor') || NIVELES_USUARIO.BASICO
};

// === VARIABLES GLOBALES CRÍTICAS ===
window.esAdmin = false;
window.sessionActiva = null;
window.profileActual = null;
window.authInicializada = false;
window.modoRegistroAuth = false;
window.proyectoActivo = null; // { id_unico, titulo }

window.MATERIALES_CONDUCTORES = {
    cobre: { nombre: "Cobre", densidad: 8.95, resistividad: 1.75e-8, colorUI: "#d35400" },
    aluminio: { nombre: "Aluminio", densidad: 2.70, resistividad: 2.82e-8, colorUI: "#7f8c8d" }
};

window.EstadoDiseno = {
    resistenciaPanelObjetivo: 0,
    diametroRotor: 0,
    longitudPanel: 0,
    anchoPanel: 0,
    numeroCaras: 0,
    intensidadPanel_mA: 0,
    espirasPorDevanado: 0,
    diametroHilo_mm: 0,
    anchoRanura_mm: 0,
    altoRanura_mm: 0,
    areaRanuraUtil_mm2: 0,
    margenMarco_mm: 0,
    longitudEspira_m: 0,
    numDevanados: 0,
    fmm_Av: 0,
    fuerzaLorentz_N: 0,
    par_Nm: 0,
    campoB_T: 0,
    longitudActiva_m: 0,
    factorOcupacion: 0,
    radioCircunscrito: 0,
    anguloPanel: 0,
    anguloRanura: 0
};

// === FUNCIONES DE AUTENTICACIÓN GLOBALES ===
window.toggleModoAuth = function(e) {
    if (e) e.preventDefault();
    window.modoRegistroAuth = !window.modoRegistroAuth;
    const gNombre = document.getElementById('auth-nombre-group');
    const bAccion = document.getElementById('btn-auth-accion');
    const lToggle = document.getElementById('link-toggle-auth');
    if (gNombre) gNombre.style.display = window.modoRegistroAuth ? 'block' : 'none';
    if (bAccion) bAccion.textContent = window.modoRegistroAuth ? 'Registrarse' : 'Iniciar Sesión';
    if (lToggle) lToggle.textContent = window.modoRegistroAuth ? '¿Ya tienes cuenta? Inicia sesión aquí.' : '¿No tienes cuenta? Registrate aquí.';
};

window.sincronizarInputRPM = function(origen) {
    const slider = document.getElementById('fcem-rpm-sim');
    const num = document.getElementById('fcem-rpm-num');
    if (!slider || !num) return;
    
    if (origen === 'slider') {
        num.value = slider.value;
    } else if (origen === 'num') {
        const val = Number(num.value);
        if (val > Number(slider.max)) {
            slider.max = val + 100; // Auto-expande el slider si se teclea un numero mayor
        }
        slider.value = num.value;
    }
};

window.ejecutarAuth = async function() {
    console.log("DEBUG: Ejecutando Auth...");
    const email = document.getElementById('auth-email')?.value.trim();
    const password = document.getElementById('auth-password')?.value.trim();
    const errorMsg = document.getElementById('auth-error');
    const successMsg = document.getElementById('auth-success');
    const btnAccion = document.getElementById('btn-auth-accion');
    
    if (errorMsg) errorMsg.style.display = 'none';
    if (successMsg) successMsg.style.display = 'none';
    
    if (!email || !password) {
        if (errorMsg) { errorMsg.textContent = "Email y contraseña requeridos"; errorMsg.style.display = 'block'; }
        return;
    }

    const textoOriginal = btnAccion ? btnAccion.textContent : 'Iniciar Sesión';
    if (btnAccion) {
        btnAccion.textContent = "Procesando...";
        btnAccion.style.opacity = "0.7";
        btnAccion.style.pointerEvents = "none";
    }

    try {
        const client = window.dbMendocinoClient;
        if (!client) throw new Error("Servicio de autenticación no listo. Espera un momento.");

        // Timeout preventivo si Supabase no responde
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Tiempo límite excedido. Revisa tu conexión a internet.")), 12000));
        
        let authPromise;
        if (window.modoRegistroAuth) {
            const nombre = document.getElementById('auth-nombre')?.value.trim();
            authPromise = client.auth.signUp({ 
                email, 
                password,
                options: { data: { nombre: nombre || 'Usuario' } }
            });
        } else {
            authPromise = client.auth.signInWithPassword({ email, password });
        }

        const { data, error } = await Promise.race([authPromise, timeoutPromise]);

        if (error) throw error;
        
        if (window.modoRegistroAuth && successMsg) { 
            successMsg.textContent = "¡Registro éxito! Revisa tu email."; 
            successMsg.style.display = 'block'; 
        }
    } catch (e) {
        console.error("Error Auth:", e);
        if (errorMsg) { 
            let msg = e.message;
            if (msg.includes("Invalid login credentials")) msg = "El usuario o la contraseña no son correctos.";
            else if (msg.includes("weak_password")) msg = "La contraseña debe tener al menos 6 caracteres.";
            else if (msg.includes("Failed to fetch")) msg = "Error de red. Comprueba tu conexión a internet.";
            else if (msg.includes("User already registered")) msg = "El usuario ya está registrado con este correo.";
            
            errorMsg.textContent = msg; 
            errorMsg.style.display = 'block'; 
        }
    } finally {
        if (btnAccion) {
            btnAccion.textContent = textoOriginal;
            btnAccion.style.opacity = "1";
            btnAccion.style.pointerEvents = "auto";
        }
    }
};

const CONFIG_NIVELES = {
    basico: {
        pasosPermitidos: [1, 2],
        puedeVerPasoMagnetico: false,
        puedeVerPasoFCEM: false,
        puedeVerInforme: false
    },
    avanzado: {
        pasosPermitidos: [1, 2, 3, 4],
        puedeVerPasoMagnetico: true,
        puedeVerPasoFCEM: false,
        puedeVerInforme: false
    },
    experto: {
        pasosPermitidos: [1, 2, 3, 4, 5, 6],
        puedeVerPasoMagnetico: true,
        puedeVerPasoFCEM: true,
        puedeVerInforme: true
    }
};

function obtenerConfigNivel() {
    // Si es administrador, acceso TOTAL ignorando restricciones
    if (window.esAdmin) {
        return CONFIG_NIVELES.experto;
    }

    const configBase = CONFIG_NIVELES[usuarioActual.nivel] || CONFIG_NIVELES.basico;
    
    // Si el usuario tiene permisos granulares definidos, los usamos
    if (usuarioActual.permisos_pasos) {
        try {
            const pasos = usuarioActual.permisos_pasos.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
            if (pasos.length > 0) {
                return {
                    pasosPermitidos: pasos,
                    puedeVerPasoMagnetico: pasos.includes(3),
                    puedeVerPasoFCEM: pasos.includes(5),
                    puedeVerInforme: pasos.includes(6)
                };
            }
        } catch (e) {
            console.error("Error procesando permisos_pasos:", e);
        }
    }
    
    return configBase;
}

// --- UTILIDADES ---
function parsearNumero(valor) {
    if (!valor) return NaN;
    return parseFloat(valor.replace(',', '.'));
}


        function obtenerElemento(id) {
            return document.getElementById(id);
        }

        function mostrarToast(mensaje, tipo = 'info') {
            const contenedor = obtenerElemento('contenedor-toast');
            if (!contenedor) return;

            const toast = document.createElement('div');
            toast.className = `toast toast--${tipo}`;
            toast.textContent = mensaje;
            contenedor.appendChild(toast);

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(8px)';
            }, 2600);

            setTimeout(() => {
                toast.remove();
            }, 3000);
        }

        function inicializarNavegacionProfesional() {
            document.querySelectorAll('.nav-tab[data-page]').forEach((boton) => {
                boton.addEventListener('click', () => cambiarPagina(boton.dataset.page));
            });
        }


function cargarMotor(config, id_unico = null, titulo = null) {
    if (!config) {
        alert("La configuración no es válida.");
        return;
    }

    console.log("Cargando motor con config:", config);
    
    // Si viene con ID, lo marcamos como el proyecto activo del usuario
    if (id_unico && titulo) {
        window.proyectoActivo = { id_unico, titulo };
    } else {
        // Si cargamos algo sin ID (ej: desde la galería pública), reseteamos el activo
        window.proyectoActivo = null;
    }
    actualizarUIProyectoActivo();

    cambiarPagina('calc');

    const caras = document.getElementById('caras');
    const panelSelect = document.getElementById('panel');
    const margen = document.getElementById('margen-placa');
    const ranuraAncho = document.getElementById('ranura-ancho');
    const ranuraAlto = document.getElementById('ranura-alto');
    const ranuraTipo = document.getElementById('ranura-tipo');
    const materialHilo = document.getElementById('material-hilo');
    const diaHilo = document.getElementById('dia-hilo-select');
    const calidad = document.getElementById('calidad-bobinado');

    if (caras) caras.value = config.caras ?? 4;

    // --- Lógica de Panel (con auto-importación) ---
    let panelValue = config.panel;
    let panelInfo = config.panelData;
    
    if (panelInfo && dbPaneles.length > 0) {
        // Intentar buscar por características técnicas para evitar duplicados si el nombre cambió
        let idxExistente = dbPaneles.findIndex(p => 
            p.v === panelInfo.v && 
            p.i === panelInfo.i && 
            p.voc === panelInfo.voc && 
            p.isc === panelInfo.isc &&
            p.l === panelInfo.l &&
            p.a === panelInfo.a
        );

        if (idxExistente === -1) {
            // No existe, lo añadimos al inventario local
            console.log("DEBUG [Import]: Añadiendo nueva placa desde proyecto:", panelInfo.nombre);
            dbPaneles.push({...panelInfo});
            guardarDatos(); // Guarda en LocalStorage y refresca UI
            
            // Si hay sesión activa, también persistimos en la nube para que no se pierda al recargar
            if (window.dbMendocinoClient && sessionActiva) {
                const pParaSubir = { ...panelInfo };
                delete pParaSubir.id; // Evitar conflictos de ID si el origen tenía uno
                pParaSubir.usuario_id = sessionActiva.user.id;
                pParaSubir.es_publico = false;
                
                dbMendocinoClient.from('paneles').insert([pParaSubir])
                    .then(({error}) => {
                        if (error) console.error("Error sincronizando placa importada:", error);
                        else console.log("DEBUG [Import]: Placa sincronizada con la nube.");
                    });
            }
            
            idxExistente = dbPaneles.length - 1;
        }
        panelValue = String(idxExistente);
    } else if (config.panelNombre && dbPaneles.length > 0) {
        const idxPorNombre = dbPaneles.findIndex(p => p.nombre === config.panelNombre);
        if (idxPorNombre >= 0) {
            panelValue = String(idxPorNombre);
        }
    }

    if (panelSelect && panelValue !== undefined && panelValue !== null) {
        panelSelect.value = panelValue;
    }

    if (margen) margen.value = config.margen ?? 2;
    if (ranuraAncho) ranuraAncho.value = config.ranuraAncho ?? 10;
    if (ranuraAlto) ranuraAlto.value = config.ranuraAlto ?? 15;
    if (ranuraTipo) ranuraTipo.value = config.ranuraTipo ?? 'rect';
    if (materialHilo) materialHilo.value = config.material ?? 'cobre';
    if (diaHilo) {
        // Buscamos el valor exacto del hilo en el select
        const diaBuscado = parseFloat(config.hilo);
        let encontrado = false;
        for (let i = 0; i < diaHilo.options.length; i++) {
            if (Math.abs(parseFloat(diaHilo.options[i].value) - diaBuscado) < 0.001) {
                diaHilo.selectedIndex = i;
                encontrado = true;
                break;
            }
        }
        // Si no está, lo añadimos temporalmente para que el motor cargue bien los cálculos
        if (!encontrado) {
            const nuevaOp = new Option(`${diaBuscado.toFixed(3)} mm (Proyecto)`, diaBuscado);
            diaHilo.add(nuevaOp);
            diaHilo.value = diaBuscado;
        }
    }

    if (calidad && config.calidad) {
        calidad.value = config.calidad;
    }

    // --- Lógica de Imán de Motor (Paso 3) ---
    const imanSelect = document.getElementById('iman-motor');
    const imanOrient = document.getElementById('iman-orientacion');
    const imanDist = document.getElementById('iman-distancia');

    if (config.imanMotorNombre && dbImanes.length > 0) {
        const idxIm = dbImanes.findIndex(im => im.nombre === config.imanMotorNombre);
        if (idxIm >= 0 && imanSelect) {
            imanSelect.value = String(idxIm);
        }
    }
    if (imanOrient && config.imanMotorOrientacion) {
        imanOrient.value = config.imanMotorOrientacion;
    }
    if (imanDist && config.imanMotorDistancia !== undefined) {
        imanDist.value = config.imanMotorDistancia;
    }

    if (typeof poblarInfoImanMotor === 'function') poblarInfoImanMotor();

    // --- Otros parámetros Paso 3 ---
    const campoBInput = document.getElementById('campo-b');
    const radioEfectivoInput = document.getElementById('radio-efectivo-mm');
    if (campoBInput && config.campoB !== undefined) campoBInput.value = config.campoB;
    if (radioEfectivoInput && config.radioEfectivo !== undefined) radioEfectivoInput.value = config.radioEfectivo;

    // --- Lógica Paso 4 (Lumínico) ---
    const lumGiroIn = document.getElementById('lum-giro');
    const lumLuzIn = document.getElementById('lum-angulo-luz');
    const lumConIn = document.getElementById('lum-conexion');

    if (lumGiroIn && config.lumGiro !== undefined) {
        lumGiroIn.value = config.lumGiro;
        const valDisp = document.getElementById('lum-giro-val');
        if (valDisp) valDisp.textContent = config.lumGiro;
    }
    if (lumLuzIn && config.lumAnguloLuz !== undefined) {
        lumLuzIn.value = config.lumAnguloLuz;
        const valDisp = document.getElementById('lum-luz-val');
        if (valDisp) valDisp.textContent = config.lumAnguloLuz;
    }
    if (lumConIn && config.lumConexion !== undefined) {
        lumConIn.value = config.lumConexion;
    }

    // --- Lógica Paso 5 (FCEM) ---
    const fcemRpmIn = document.getElementById('fcem-rpm-sim');
    const fcemPerdIn = document.getElementById('fcem-perdidas');

    if (fcemRpmIn && config.fcemRpmSim !== undefined) {
        fcemRpmIn.value = config.fcemRpmSim;
        const valDisp = document.getElementById('fcem-rpm-val');
        if (valDisp) valDisp.textContent = config.fcemRpmSim;
    }
    if (fcemPerdIn && config.fcemPerdidas !== undefined) {
        fcemPerdIn.value = config.fcemPerdidas;
    }
    
    // Restaurar Peso Real
    const elPesoReal = document.getElementById('peso-total-real');
    if (elPesoReal) elPesoReal.value = config.resumen?.pesoReal || '0';

    // --- Lógica de Informe (Paso 6) ---
    if (config.informe) {
        const areaInforme = document.getElementById('informe-automatico');
        if (areaInforme) areaInforme.value = config.informe;
    }

    if (config.resumen) {
        const elTipo = document.getElementById('res-tipo-rotor');
        const elComp = document.getElementById('res-comportamiento');
        const elNivel = document.getElementById('res-nivel');

        if (elTipo) elTipo.textContent = config.resumen.tipoRotor || '--';
        if (elComp) elComp.textContent = config.resumen.comportamiento || '--';
        if (elNivel) elNivel.textContent = config.resumen.nivel || '--';
    }

    // --- Disparar recálculos finales ---
    actualizarResumenPaso1();
    setTimeout(() => {
        // Encadenamos cálculos para que las gráficas se actualicen con los nuevos parámetros
        if (typeof calcularPaso2 === 'function') calcularPaso2();
        if (typeof calcularPasoMagnetico === 'function') calcularPasoMagnetico();
        if (typeof calcularPasoLuminico === 'function') calcularPasoLuminico();
        if (typeof calcularPasoFCEM === 'function') calcularPasoFCEM();
        if (typeof generarInformeAutomatico === 'function') generarInformeAutomatico();
    }, 100);
}



        // --- BASE DE DATOS PREDETERMINADA ---
        const defaultPaneles = [
            { nombre: "Aliexpress 48x21", l: 48, a: 21, voc: 0.6, isc: 129, v: 0.41, i: 166.5 },
            { nombre: "Aliexpress 53x18", l: 53, a: 18, voc: 0.501, isc: 133.3, v: 0.468, i: 101.3 },
            { nombre: "Aliexpress 53x29", l: 53, a: 29, voc: 5.78, isc: 13.8, v: 4.55, i: 9.3 },
            { nombre: "Aliexpress 43x16", l: 43, a: 16, voc: 1.9, isc: 45, v: 1.83, i: 42.4 },
            { nombre: "Aliexpress 43x25", l: 43, a: 25, voc: 2.29, isc: 23, v: 1.51, i: 21.8 },
            { nombre: "Aliexpress 84x142", l: 84, a: 142, voc: 5.5, isc: 65, v: 5.08, i: 61.9 },
            { nombre: "Aliexpress 28x55", l: 28, a: 55, voc: 2.95, isc: 5, v: 1.75, i: 4.2 },
            { nombre: "Mono 52x19 (Ali)", l: 52, a: 19, voc: 0.55, isc: 200, v: 0.52, i: 200 },
            { nombre: "Mono 52x26 (Ali)", l: 52, a: 26, voc: 0.542, isc: 205, v: 0.33, i: 226 },
            { nombre: "Mono 39x19 (Ali)", l: 39, a: 19, voc: 0.528, isc: 153, v: 0.36, i: 75.2 },
            { nombre: "Mono 78x26 (Ali)", l: 78, a: 26, voc: 0.552, isc: 233, v: 0.37, i: 316 },
            { nombre: "Mono 159x26 (Ali)", l: 159, a: 26, voc: 0.57, isc: 246, v: 0.29, i: 432 },
            { nombre: "Mono 157x13 (Ali)", l: 157, a: 13, voc: 0.534, isc: 155, v: 0.35, i: 134 },
            { nombre: "Mono 158x52 (Ali)", l: 158, a: 52, voc: 0.551, isc: 241, v: 0.19, i: 639 }
        ];

      
        // Lista de diámetros disponibles para Cobre (en mm)
        const hilosCobre = [0.10, 0.15, 0.25, 0.28, 0.315, 0.40, 0.50, 0.55, 0.63, 0.90, 1.0];

        // Lista de diámetros disponibles para Aluminio (en mm)
        const hilosAluminio = [0.90];

        const defaultHilos = [0.10, 0.15, 0.25, 0.28, 0.315, 0.40, 0.50, 0.55, 0.63, 0.90, 1.0];


        const defaultImanes = [
            { nombre: "Bloque 30x15x6 (42SH)", forma: "Bloque", l: 30, a: 15, h: 6, br: 1.32 },
            { nombre: "Bloque 60x20x5 (N45)", forma: "Bloque", l: 60, a: 20, h: 5, br: 1.37 },
            { nombre: "Bloque 60x30x10 (N45)", forma: "Bloque", l: 60, a: 30, h: 10, br: 1.37 },
            { nombre: "Bloque 80x40x10 (N45)", forma: "Bloque", l: 80, a: 40, h: 10, br: 1.37 },
            { nombre: "Bloque 27x9x4 (N35)", forma: "Bloque", l: 27.85, a: 8.83, h: 4.22, br: 1.21 },
            { nombre: "Bloque 30x10x5 (N42)", forma: "Bloque", l: 29.84, a: 9.76, h: 4.76, br: 1.32 },
            { nombre: "Bloque 50x5x5 (N45)", forma: "Bloque", l: 49.96, a: 4.91, h: 4.91, br: 1.37 },
            { nombre: "Bloque 40x20x5 (N42)", forma: "Bloque", l: 40, a: 20, h: 5, br: 1.32 },
            { nombre: "Bloque 40x10x5 (N42)", forma: "Bloque", l: 40, a: 9.96, h: 5, br: 1.32 },
            { nombre: "Aro 25x4.2x5 (N45)", forma: "Aro", l: 25, a: 4.2, h: 5, br: 1.37 },
            { nombre: "Aro 19x9.5x6.4 (N42)", forma: "Aro", l: 19, a: 9.53, h: 6.36, br: 1.32 }
        ];


        const proyectosDestacados = []; // Ahora se cargan desde Supabase

        // --- CARGA DE DATOS (MIGRADO A SUPABASE) ---
        let dbPaneles = [], dbHilos = [], dbImanes = [];
        let dbPanelesPublicos = [], dbHilosPublicos = [], dbImanesPublicos = [];
        
        async function cargarDatosGlobales() {
            try {
                if (window.dbMendocinoClient && sessionActiva) {
                    const uid = sessionActiva.user.id;
                    
                    // 1. Cargar datos del usuario
                    const { data: paneles, error: errP } = await dbMendocinoClient.from('paneles').select('*').eq('usuario_id', uid);
                    const { data: hilos, error: errH } = await dbMendocinoClient.from('hilos').select('*').eq('usuario_id', uid);
                    const { data: imanes, error: errI } = await dbMendocinoClient.from('imanes').select('*').eq('usuario_id', uid);
                    
                    // 2. Cargar datos públicos (disponibles para todos)
                    const { data: pPub, error: errPP } = await dbMendocinoClient.from('paneles').select('*').eq('es_publico', true);
                    const { data: hPub, error: errHP } = await dbMendocinoClient.from('hilos').select('*').eq('es_publico', true);
                    const { data: iPub, error: errIP } = await dbMendocinoClient.from('imanes').select('*').eq('es_publico', true);

                    dbPanelesPublicos = pPub || [];
                    dbHilosPublicos = (hPub || []).map(h => parseFloat(h.diametro));
                    dbImanesPublicos = iPub || [];

                    // Combinar (con prioridad a los del usuario si hay duplicados por nombre, aunque no debería haber conflictos críticos)
                    // Para los hilos, combinamos y quitamos duplicados
                    dbPaneles = [...(paneles || []), ...dbPanelesPublicos];
                    dbHilos = [...new Set([...(hilos || []).map(h => parseFloat(h.diametro)), ...dbHilosPublicos])];
                    dbImanes = [...(imanes || []), ...dbImanesPublicos];

                    // Fallback a locales si no hay nada en la nube (primer inicio)
                    if (dbPaneles.length === 0) dbPaneles = JSON.parse(localStorage.getItem('dbPaneles')) || [...defaultPaneles];
                    if (dbHilos.length === 0) dbHilos = JSON.parse(localStorage.getItem('dbHilos')) || [...defaultHilos];
                    if (dbImanes.length === 0) dbImanes = JSON.parse(localStorage.getItem('dbImanes')) || [...defaultImanes];

                } else {
                    throw new Error("Supabase no definido o sin sesión");
                }
            } catch (e) {
                console.warn("Fallo cargando de Supabase, usando LocalStorage:", e);
                dbPaneles = JSON.parse(localStorage.getItem('dbPaneles')) || [...defaultPaneles];
                dbHilos = JSON.parse(localStorage.getItem('dbHilos')) || [...defaultHilos];
                dbImanes = JSON.parse(localStorage.getItem('dbImanes')) || [...defaultImanes];
            }
        }

        function guardarDatos() {
            localStorage.setItem('dbPaneles', JSON.stringify(dbPaneles));
            localStorage.setItem('dbHilos', JSON.stringify(dbHilos));
            localStorage.setItem('dbImanes', JSON.stringify(dbImanes));
            renderizarUI(); 
        }

        async function resetearBaseDatos() {
            if(await mostrarConfirmacion("Restaurar Datos", "¿Estás seguro de que quieres borrar tus componentes y volver a los de defecto?")) {
                dbPaneles = [...defaultPaneles];
                dbHilos = [...defaultHilos];
                dbImanes = [...defaultImanes];
                guardarDatos();
                mostrarToast('Base de datos restaurada correctamente.', 'ok');
            }
        }

        // --- RENDERIZADO DE INTERFAZ GENERAL ---
        function renderizarUI() {
            try {
                const selPanel = document.getElementById('panel');
                const selHilo = document.getElementById('dia-hilo-select');
                const panelActual = selPanel ? selPanel.value : '';
                const hiloActual = selHilo ? selHilo.value : '';

                if (selPanel) {
                    selPanel.innerHTML = '';
                    dbPaneles.forEach((p, index) => {
                        selPanel.innerHTML += `<option value="${index}">${p.nombre}</option>`;
                    });

                    if (dbPaneles.length === 0) {
                        selPanel.innerHTML = '<option value="">Sin paneles disponibles</option>';
                    } else if (panelActual !== '' && Number(panelActual) >= 0 && Number(panelActual) < dbPaneles.length) {
                        selPanel.value = panelActual;
                    } else {
                        selPanel.selectedIndex = 0;
                    }
                }

                if (selHilo) {
                    selHilo.innerHTML = '';
                    [...dbHilos].sort((a, b) => a - b).forEach(h => {
                        selHilo.innerHTML += `<option value="${h}">${Number(h).toFixed(3)} mm</option>`;
                    });

                    if (hiloActual !== '' && dbHilos.map(Number).includes(Number(hiloActual))) {
                        selHilo.value = hiloActual;
                    }
                }

                // Poblado del selector de imán de motor (bloques únicamente)
                const selImanMotor = document.getElementById('iman-motor');
                if (selImanMotor && Array.isArray(dbImanes)) {
                    const motorActual = selImanMotor.value;
                    selImanMotor.innerHTML = '';
                    dbImanes.forEach((im, index) => {
                        if (String(im.forma || '').toLowerCase().includes('bloque')) {
                            const texto = `${im.nombre} (${im.br} T)`;
                            selImanMotor.innerHTML += `<option value="${index}">${texto}</option>`;
                        }
                    });

                    if (dbImanes.length === 0) {
                        selImanMotor.innerHTML = '<option value="">Sin imanes bloque</option>';
                    } else if (motorActual !== '' && Number(motorActual) >= 0 && Number(motorActual) < dbImanes.length) {
                        selImanMotor.value = motorActual;
                    } else {
                        // Selección por defecto del primer bloque disponible
                        const idxBloque = dbImanes.findIndex(im => String(im.forma || '').toLowerCase().includes('bloque'));
                        if (idxBloque >= 0) selImanMotor.value = String(idxBloque);
                    }
                    poblarInfoImanMotor();
                }

                document.getElementById('lista-paneles').innerHTML = dbPaneles.map((p, i) => {
                    const p_mW = p.v * p.i;
                    const r_ohm = p.i > 0 ? p.v / (p.i / 1000) : 0;
                    const ff = (p.voc * p.isc) > 0 ? (p.v * p.i) / (p.voc * p.isc) : 0;
                    return `<li style="font-size: 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                        <div style="flex-grow: 1;">
                            <strong>${p.nombre}</strong> (${p.l}x${p.a}mm) 
                            <br>
                            <small>Voc: ${p.voc}V | Isc: ${p.isc}mA | V: ${p.v}V | I: ${p.i}mA</small><br>
                            <small style="color:var(--primary-color);"><strong>P:</strong> ${p_mW.toFixed(1)}mW | <strong>R ideal:</strong> ${r_ohm.toFixed(1)}Ω | <strong>FF:</strong> ${ff.toFixed(3)}</small>
                        </div>
                        <button class="btn-delete" onclick="borrarPanel(${i})">X</button>
                    </li>`;
                }).join('');

                document.getElementById('lista-hilos').innerHTML = [...dbHilos].sort((a, b) => a - b).map((h, i) =>
                    `<li>Ø ${Number(h).toFixed(3)} mm <button class="btn-delete" onclick="borrarHilo(${i})">X</button></li>`
                ).join('');

                document.getElementById('lista-imanes').innerHTML = dbImanes.map((im, i) =>
                    `<li>${im.nombre} <button class="btn-delete" onclick="borrarIman(${i})">X</button></li>`
                ).join('');

                if (dbPaneles.length > 0) {
                    actualizarResumenPaso1();
                } else {
                    const diametro = document.getElementById('diametro');
                    if (diametro) diametro.value = 'Sin paneles disponibles';
                }
                
                // Renderizado de proyectos NO bloqueante con pequeño delay
                setTimeout(() => {
                    renderizarProyectos().catch(e => console.error("DEBUG [UI]: Fallo galería:", e));
                }, 100);
                
                console.log("DEBUG [UI]: Renderización de interfaz completada.");
            } catch (e) {
                console.error("DEBUG [UI]: Error fatal durante la renderización:", e);
            }
        }

        async function añadirHilo() {
            const inputVal = document.getElementById('db-hilo-dia').value;
            const dia = parsearNumero(inputVal);
            if (isNaN(dia) || dia <= 0) { alert("Error: Introduce un diámetro válido."); return; }
            if (dbHilos.includes(dia)) { alert("Error: Este diámetro ya existe."); return; }
            
            if (window.dbMendocinoClient && sessionActiva) {
                await dbMendocinoClient.from('hilos').insert([{ usuario_id: sessionActiva.user.id, diametro: dia }]);
                await cargarDatosGlobales();
                renderizarUI();
            } else {
                dbHilos.push(dia);
                guardarDatos();
            }
            document.getElementById('db-hilo-dia').value = '';
            mostrarToast(`Hilo Ø ${dia} mm añadido correctamente.`, 'ok');
        }

        async function añadirPanel() {
            const nombre = document.getElementById('db-panel-nombre').value;
            const voc = parsearNumero(document.getElementById('db-panel-voc').value);
            const isc = parsearNumero(document.getElementById('db-panel-isc').value);
            const v = parsearNumero(document.getElementById('db-panel-v').value);
            const i = parsearNumero(document.getElementById('db-panel-i').value);
            const l = parsearNumero(document.getElementById('db-panel-l').value);
            const a = parsearNumero(document.getElementById('db-panel-a').value);

            if (!nombre || [voc, isc, v, i, l, a].some(n => isNaN(n) || n <= 0)) {
                alert("Error: Todos los valores del panel deben ser numéricos y mayores que 0.");
                return;
            }
            
            const nuevoObj = { usuario_id: sessionActiva.user.id, nombre, voc, isc, v, i, l, a };

            if (window.dbMendocinoClient) {
                await dbMendocinoClient.from('paneles').insert([nuevoObj]);
                await cargarDatosGlobales();
                renderizarUI();
            } else {
                dbPaneles.push({ nombre, voc, isc, v, i, l, a });
                guardarDatos();
            }
            
            document.querySelectorAll('#page-db input').forEach(inpt => inpt.value = '');
            mostrarToast(`Panel "${nombre}" añadido correctamente.`, 'ok');
        }

        async function añadirIman() {
            const nombre = document.getElementById('db-iman-nombre').value;
            const forma = document.getElementById('db-iman-forma').value;
            const br = parsearNumero(document.getElementById('db-iman-br').value);
            const l = parsearNumero(document.getElementById('db-iman-l').value);
            const a = parsearNumero(document.getElementById('db-iman-a').value);
            const h = parsearNumero(document.getElementById('db-iman-h').value);
            
            if (!nombre || [br, l, a, h].some(n => isNaN(n) || n <= 0)) {
                alert("Error: Br y dimensiones deben ser numéricos y mayores que 0.");
                return;
            }

            const nuevoObj = { usuario_id: sessionActiva.user.id, nombre, forma, l, a, h, br };
            
            if (typeof supabase !== 'undefined' && supabase) {
                await dbMendocinoClient.from('imanes').insert([nuevoObj]);
                await cargarDatosGlobales();
                renderizarUI();
            } else {
                dbImanes.push({ nombre, forma, l, a, h, br });
                guardarDatos();
            }
            document.querySelectorAll('#db-iman-nombre, #db-iman-br, #db-iman-l, #db-iman-a, #db-iman-h').forEach(el => el.value = '');
            mostrarToast(`Imán "${nombre}" añadido correctamente.`, 'ok');
        }

        async function borrarPanel(index) { 
            if (window.dbMendocinoClient && dbPaneles[index] && dbPaneles[index].id) {
                await dbMendocinoClient.from('paneles').delete().eq('id', dbPaneles[index].id);
                await cargarDatosGlobales();
                renderizarUI();
            } else {
                dbPaneles.splice(index, 1); guardarDatos(); 
            }
        }
        async function borrarHilo(index) { 
            if (typeof supabase !== 'undefined' && supabase && sessionActiva) {
                const uid = sessionActiva.user.id;
                await dbMendocinoClient.from('hilos').delete().eq('usuario_id', uid).eq('diametro', dbHilos[index]);
                await cargarDatosGlobales();
                renderizarUI();
            } else {
                dbHilos.splice(index, 1); guardarDatos(); 
            }
        }
        async function borrarIman(index) { 
            if (window.dbMendocinoClient && dbImanes[index] && dbImanes[index].id) {
                await dbMendocinoClient.from('imanes').delete().eq('id', dbImanes[index].id);
                await cargarDatosGlobales();
                renderizarUI();
            } else {
                dbImanes.splice(index, 1); guardarDatos(); 
            }
        }

        // --- NAVEGACIÓN ---
        function cambiarPagina(pagina) {
            document.querySelectorAll('.page-container').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
            document.getElementById('page-' + pagina).classList.add('active');
            document.getElementById('tab-' + pagina).classList.add('active');
        }


        // --- LÓGICA DE CÁLCULO ---

        // --- PASO 1: GEOMETRÍA ---
        function actualizarResumenPaso1() {
            if (dbPaneles.length === 0) return;

            EstadoDiseno.numeroCaras = parseInt(document.getElementById('caras').value); 
            const indexPanel = document.getElementById('panel').value;
            const panel = dbPaneles[indexPanel];
            if (!panel) return;

            EstadoDiseno.longitudPanel = panel.l || 0;
            EstadoDiseno.anchoPanel = panel.a || 0;


            EstadoDiseno.profundidadRanura_mm = parseFloat(document.getElementById('ranura-alto')?.value || 0) || 0;
            
            EstadoDiseno.intensidadPanel_mA = panel.i; 

            const inputMargen = document.getElementById('margen-placa');
            EstadoDiseno.margenMarco_mm = inputMargen ? (parseFloat(inputMargen.value) || 0) : 0;

            // --- CÁLCULO DE IMÁN DE MOTOR (BASE) ---
            const selIman = document.getElementById('iman-motor');
            const distImanRotor = parseFloat(document.getElementById('iman-distancia')?.value || 2);
            const orientacion = document.getElementById('iman-orientacion')?.value || 'long';
            
            if (selIman && selIman.value !== '') {
                const im = dbImanes?.[Number(selIman.value)];
                if (im) {
                    const dims = [Number(im.l), Number(im.a), Number(im.h)];
                    const T = Math.min(...dims); // espesor de magnetización
                    const baseDims = dims.filter((_, i) => i !== dims.indexOf(T));
                    let L_eff, W_eff;
                    
                    if (orientacion === 'long') {
                        L_eff = Math.max(...baseDims); // Dimensión larga paralela al eje
                        W_eff = Math.min(...baseDims);
                    } else {
                        L_eff = Math.min(...baseDims); // Dimensión corta paralela al eje
                        W_eff = Math.max(...baseDims);
                    }
                    
                    // Calculamos B a la distancia z. 
                    // z = entrehierro + 1mm (margen conservador al centro del devanado exterior)
                    const z = distImanRotor + 1; 
                    const B_calculado = calcularCampoBPrisma(Number(im.br), L_eff, W_eff, T, z);
                    const B_max = calcularCampoBPrisma(Number(im.br), L_eff, W_eff, T, 1); // A 0mm gap + 1mm offset
                    
                    EstadoDiseno.campoB_T = B_calculado;
                    EstadoDiseno.campoB_max = B_max > 0 ? B_max : B_calculado;
                    EstadoDiseno.imanMotorNombre = im.nombre;
                    
                    // Sincronizamos con el input del Paso 3
                    const inputPaso3 = document.getElementById('campo-b');
                    if (inputPaso3) {
                        inputPaso3.value = B_calculado.toFixed(3);
                    }
                }
            }

            EstadoDiseno.anchoRanura_mm = parseFloat(document.getElementById('ranura-ancho').value) || 0;
            EstadoDiseno.altoRanura_mm = parseFloat(document.getElementById('ranura-alto').value) || 0;
            const tipoRanura = document.getElementById('ranura-tipo').value;

            const Wp = EstadoDiseno.anchoPanel;
            const WpTotal = Wp + (2 * EstadoDiseno.margenMarco_mm);
            const Ws = EstadoDiseno.anchoRanura_mm;
            const Ds = EstadoDiseno.altoRanura_mm;

            const sumaAnchuras = WpTotal + Ws;
            if (EstadoDiseno.numeroCaras <= 0 || sumaAnchuras <= 0) {
                document.getElementById('diametro').value = '0.00 mm';
                EstadoDiseno.diametroRotor = 0;
                EstadoDiseno.areaRanuraUtil_mm2 = 0;
                return;
            }

            const proporcionPanel = WpTotal / sumaAnchuras;
            const proporcionRanura = Ws / sumaAnchuras;

            const anguloTotalRadianes = (2 * Math.PI) / EstadoDiseno.numeroCaras;
            const angP = anguloTotalRadianes * proporcionPanel;
            const angS = anguloTotalRadianes * proporcionRanura;

            const seno = Math.sin(angP / 2);
            if (seno === 0) {
                document.getElementById('diametro').value = '0.00 mm';
                EstadoDiseno.diametroRotor = 0;
                EstadoDiseno.areaRanuraUtil_mm2 = 0;
                return;
            }

            const radioCircunscrito = WpTotal / (2 * seno);
            EstadoDiseno.diametroRotor = radioCircunscrito * 2;
            document.getElementById('diametro').value = EstadoDiseno.diametroRotor.toFixed(2) + ' mm';

            if (tipoRanura === 'trapecio') {
                const baseMenor = 2 * (radioCircunscrito - Ds) * Math.sin(angS / 2);
                EstadoDiseno.areaRanuraUtil_mm2 = ((Ws + baseMenor) / 2) * Ds;
                if (EstadoDiseno.areaRanuraUtil_mm2 < 0) EstadoDiseno.areaRanuraUtil_mm2 = 0; 
            } else {
                EstadoDiseno.areaRanuraUtil_mm2 = Ws * Ds;
            }

            EstadoDiseno.resistenciaPanelObjetivo = panel.v / (panel.i / 1000); 
            const p_mW = panel.v * panel.i;
            const ff = (panel.v * panel.i) / (panel.voc * panel.isc) || 0;

            document.getElementById('res-medidas').textContent = `${panel.l} x ${panel.a} mm`;
            document.getElementById('res-panel-voc').textContent = panel.voc.toFixed(2) + ' V';
            document.getElementById('res-panel-isc').textContent = panel.isc.toFixed(1) + ' mA';
            document.getElementById('res-panel-v').textContent = panel.v.toFixed(2) + ' V';
            document.getElementById('res-panel-i').textContent = panel.i.toFixed(1) + ' mA';
            document.getElementById('res-panel-p').textContent = p_mW.toFixed(1) + ' mW';
            document.getElementById('res-panel-ff').textContent = ff.toFixed(3);
            document.getElementById('res-panel-r').textContent = EstadoDiseno.resistenciaPanelObjetivo.toFixed(2) + ' Ω';

            EstadoDiseno.radioCircunscrito = radioCircunscrito;
            EstadoDiseno.anguloPanel = angP;
            EstadoDiseno.anguloRanura = angS;

            dibujarRotorSVG();
            // Dibujar la vista superior del panel
            dibujarPanelSVG(EstadoDiseno.longitudPanel, Wp, EstadoDiseno.margenMarco_mm);
            // Actualizar cálculos eléctricos y ocupación
            calcularPaso2();
            calcularOcupacionRanura(); 
            calcularPasoMagnetico();
            if (typeof calcularPasoLuminico === 'function') calcularPasoLuminico();
        }

        // --- DIBUJO GEOMÉTRICO (SVG) ---
        function dibujarRotorSVG() {
            const N = EstadoDiseno.numeroCaras;
            const tipoRanura = document.getElementById('ranura-tipo')?.value || 'rect';
            const Wp = EstadoDiseno.anchoPanel;
            const Ws = EstadoDiseno.anchoRanura_mm;
            const Ds = EstadoDiseno.altoRanura_mm;
            const R = EstadoDiseno.radioCircunscrito;
            const angP = EstadoDiseno.anguloPanel;
            const angS = EstadoDiseno.anguloRanura;

            const ids = ['rotor-svg', 'rotor-svg-step2'];
            
            ids.forEach(id => {
                const svg = document.getElementById(id);
                if(!svg) return;
                svg.innerHTML = ''; 
                
                const centro = 100; 
                const radioMaxPx = 90; 
                const escala = radioMaxPx / R; 

                const Rfondo = R - Ds;
                let RfondoPx = Rfondo * escala;
                
                const radioMasa = radioMaxPx * 0.35;
                if (RfondoPx < radioMasa) RfondoPx = radioMasa;

                const strokeColor = getComputedStyle(document.documentElement).getPropertyValue('--svg-stroke-color').trim() || "#333";
                const colorImpresion3D = getComputedStyle(document.documentElement).getPropertyValue('--svg-panel-color').trim() || "#fdebd0";

                const circuloExt = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                circuloExt.setAttribute("cx", centro);
                circuloExt.setAttribute("cy", centro);
                circuloExt.setAttribute("r", radioMaxPx);
                circuloExt.setAttribute("fill", "none");
                circuloExt.setAttribute("stroke", "#777"); 
                circuloExt.setAttribute("stroke-width", "1"); 
                circuloExt.setAttribute("stroke-dasharray", "3"); 
                svg.appendChild(circuloExt);

                let dRotor = "";
                const profPx = Ds * escala;

                for (let i = 0; i < N; i++) {
                    const anguloCentroPanel = i * (angP + angS) - (Math.PI / 2);
                    const theta1 = anguloCentroPanel - (angP / 2); 
                    const theta2 = anguloCentroPanel + (angP / 2); 
                    const theta3 = theta2 + angS;                  

                    const p1x = centro + radioMaxPx * Math.cos(theta1);
                    const p1y = centro + radioMaxPx * Math.sin(theta1);
                    const p2x = centro + radioMaxPx * Math.cos(theta2);
                    const p2y = centro + radioMaxPx * Math.sin(theta2);
                    const p3x = centro + radioMaxPx * Math.cos(theta3);
                    const p3y = centro + radioMaxPx * Math.sin(theta3);

                    if (i === 0) {
                        dRotor += `M ${p1x} ${p1y} `;
                    } else {
                        dRotor += `L ${p1x} ${p1y} `;
                    }
                    dRotor += `L ${p2x} ${p2y} `;

                    if (tipoRanura === 'trapecio') {
                        const s1x = centro + RfondoPx * Math.cos(theta2);
                        const s1y = centro + RfondoPx * Math.sin(theta2);
                        const s2x = centro + RfondoPx * Math.cos(theta3);
                        const s2y = centro + RfondoPx * Math.sin(theta3);
                        dRotor += `L ${s1x} ${s1y} L ${s2x} ${s2y} `;
                    } else { 
                        const thetaBisectriz = (theta2 + theta3) / 2;
                        const dirX = Math.cos(thetaBisectriz);
                        const dirY = Math.sin(thetaBisectriz);
                        
                        const s1x = p2x - dirX * profPx;
                        const s1y = p2y - dirY * profPx;
                        const s2x = p3x - dirX * profPx;
                        const s2y = p3y - dirY * profPx;
                        dRotor += `L ${s1x} ${s1y} L ${s2x} ${s2y} `;
                    }
                }
                dRotor += "Z"; 

                const pathRotor = document.createElementNS("http://www.w3.org/2000/svg", "path");
                pathRotor.setAttribute("d", dRotor);
                pathRotor.setAttribute("fill", colorImpresion3D); 
                pathRotor.setAttribute("stroke", strokeColor);
                pathRotor.setAttribute("stroke-width", "1");
                svg.appendChild(pathRotor);

                // --- DIBUJO DEL BOBINADO (NARANJA / ROJO SI >= 100%) ---
                const fo = EstadoDiseno.factorOcupacion || 0;
                if (fo > 0) {
                    const esExceso = fo >= 1.0;
                    const colorBobinado = esExceso ? "#e74c3c" : "#d35400";
                    const opacidadBobinado = esExceso ? "1.0" : "0.8"; 
                    const profBobinadoPx = Ds * escala * Math.min(fo, 1.2); 
                    
                    for (let i = 0; i < N; i++) {
                        const anguloCentroPanel = i * (angP + angS) - (Math.PI / 2);
                        const theta2 = anguloCentroPanel + (angP / 2); 
                        const theta3 = theta2 + angS;
                        const thetaBisectriz = (theta2 + theta3) / 2;
                        const dirX = Math.cos(thetaBisectriz);
                        const dirY = Math.sin(thetaBisectriz);

                        let pVbob = "";

                        if (tipoRanura === 'trapecio') {
                            // Puntos base inferiores (en el fondo)
                            const f1x = centro + RfondoPx * Math.cos(theta2);
                            const f1y = centro + RfondoPx * Math.sin(theta2);
                            const f2x = centro + RfondoPx * Math.cos(theta3);
                            const f2y = centro + RfondoPx * Math.sin(theta3);

                            // Puntos superiores (creciendo radialmente hacia afuera)
                            const rExt = RfondoPx + profBobinadoPx;
                            const o1x = centro + rExt * Math.cos(theta2);
                            const o1y = centro + rExt * Math.sin(theta2);
                            const o2x = centro + rExt * Math.cos(theta3);
                            const o2y = centro + rExt * Math.sin(theta3);
                            
                            pVbob = `${f1x},${f1y} ${o1x},${o1y} ${o2x},${o2y} ${f2x},${f2y}`;
                        } else {
                            // Rectangular: los puntos p2 y p3 son los de la superficie
                            const p2x = centro + radioMaxPx * Math.cos(theta2);
                            const p2y = centro + radioMaxPx * Math.sin(theta2);
                            const p3x = centro + radioMaxPx * Math.cos(theta3);
                            const p3y = centro + radioMaxPx * Math.sin(theta3);

                            // Fondo de la ranura rectangular
                            const f1x = p2x - dirX * profPx;
                            const f1y = p2y - dirY * profPx;
                            const f2x = p3x - dirX * profPx;
                            const f2y = p3y - dirY * profPx;

                            // Superficie del bobinado (creciendo paralelo al eje de la ranura)
                            const o1x = f1x + dirX * profBobinadoPx;
                            const o1y = f1y + dirY * profBobinadoPx;
                            const o2x = f2x + dirX * profBobinadoPx;
                            const o2y = f2y + dirY * profBobinadoPx;

                            pVbob = `${f1x},${f1y} ${o1x},${o1y} ${o2x},${o2y} ${f2x},${f2y}`;
                        }

                        const polyBobinado = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                        polyBobinado.setAttribute("points", pVbob);
                        polyBobinado.setAttribute("fill", colorBobinado);
                        polyBobinado.setAttribute("opacity", opacidadBobinado);
                        svg.appendChild(polyBobinado);
                    }
                }

                const eje = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                eje.setAttribute("cx", centro);
                eje.setAttribute("cy", centro);
                eje.setAttribute("r", radioMaxPx * 0.12);
                eje.setAttribute("fill", "#ffffff"); 
                eje.setAttribute("stroke", strokeColor);
                eje.setAttribute("stroke-width", "1");
                svg.appendChild(eje);

                for (let i = 0; i < N; i++) {
                    const anguloCentroPanel = i * (angP + angS) - (Math.PI / 2);
                    
                    const WpTotal = Wp + (2 * EstadoDiseno.margenMarco_mm);
                    const proporcionPlaca = WpTotal > 0 ? (Wp / WpTotal) : 1;
                    const angPlacaReal = angP * proporcionPlaca;

                    const theta1 = anguloCentroPanel - (angPlacaReal / 2);
                    const theta2 = anguloCentroPanel + (angPlacaReal / 2);

                    const p1x = centro + radioMaxPx * Math.cos(theta1);
                    const p1y = centro + radioMaxPx * Math.sin(theta1);
                    const p2x = centro + radioMaxPx * Math.cos(theta2);
                    const p2y = centro + radioMaxPx * Math.sin(theta2);

                    const placaSol = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    placaSol.setAttribute("x1", p1x);
                    placaSol.setAttribute("y1", p1y);
                    placaSol.setAttribute("x2", p2x);
                    placaSol.setAttribute("y2", p2y);
                    placaSol.setAttribute("stroke", "#2c3e50"); 
                    placaSol.setAttribute("stroke-width", "4");
                    placaSol.setAttribute("stroke-linecap", "round");
                    svg.appendChild(placaSol);
                }
            });
        }



// --- DIBUJO DE LA VISTA SUPERIOR DEL PANEL ---
        // --- DIBUJO DE LA VISTA SUPERIOR DEL PANEL ---
        function dibujarPanelSVG(Lp, Wp, margen) {
            const ids = ['panel-svg', 'panel-svg-step2'];
            
            ids.forEach(id => {
                const svg = document.getElementById(id);
                if(!svg) return;
                svg.innerHTML = '';
                
                const L_total = Lp + (2 * margen);
                const W_total = Wp + (2 * margen);
                
                if(L_total <= 0 || W_total <= 0) return;

                // Usamos la dimensión mayor para que el 'padding' sea siempre uniforme y nada se deforme
                const maxDim = Math.max(L_total, W_total);
                // Aumentamos el padding significativamente (0.55) para que quepan etiquetas largas
                const pad = maxDim * 0.55; 
                
                const vbWidth = L_total + pad * 2;
                const vbHeight = W_total + pad * 2;
                
                svg.setAttribute('viewBox', `0 0 ${vbWidth} ${vbHeight}`);

                const strokeColor = getComputedStyle(document.documentElement).getPropertyValue('--svg-stroke-color').trim() || "#333";
                const colorImpresion3D = getComputedStyle(document.documentElement).getPropertyValue('--svg-panel-color').trim() || "#fdebd0";

                // 1. Dibujar el marco de plástico 3D
                const marco = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                marco.setAttribute("x", pad);
                marco.setAttribute("y", pad);
                marco.setAttribute("width", L_total);
                marco.setAttribute("height", W_total);
                marco.setAttribute("fill", colorImpresion3D);
                marco.setAttribute("stroke", strokeColor);
                marco.setAttribute("stroke-width", maxDim * 0.005);
                marco.setAttribute("rx", maxDim * 0.02);
                svg.appendChild(marco);

                // 2. Dibujar el cristal oscuro (Placa Solar)
                const placa = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                placa.setAttribute("x", pad + margen);
                placa.setAttribute("y", pad + margen);
                placa.setAttribute("width", Lp);
                placa.setAttribute("height", Wp);
                placa.setAttribute("fill", "#2c3e50");
                placa.setAttribute("stroke", "rgba(255,255,255,0.2)");
                placa.setAttribute("stroke-width", maxDim * 0.003);
                svg.appendChild(placa);

                // 3. Textos y Líneas de Cota
                const fontSize = Math.max(maxDim * 0.07, 3);
                const estiloTexto = `font-size: ${fontSize}px; font-family: sans-serif; fill: #555; text-anchor: middle; font-weight: bold;`;
                const strokeCota = maxDim * 0.003;

                // --- COTA LARGO (Abajo) ---
                const yCotaLargo = pad + W_total + (pad * 0.35);
                const lineLargo = document.createElementNS("http://www.w3.org/2000/svg", "line");
                lineLargo.setAttribute("x1", pad);
                lineLargo.setAttribute("y1", yCotaLargo);
                lineLargo.setAttribute("x2", pad + L_total);
                lineLargo.setAttribute("y2", yCotaLargo);
                lineLargo.setAttribute("stroke", "#999");
                lineLargo.setAttribute("stroke-width", strokeCota);
                svg.appendChild(lineLargo);

                const txtLargo = document.createElementNS("http://www.w3.org/2000/svg", "text");
                txtLargo.setAttribute("x", pad + (L_total / 2));
                txtLargo.setAttribute("y", yCotaLargo + (fontSize * 1.1));
                txtLargo.setAttribute("style", estiloTexto);
                txtLargo.textContent = L_total + " mm";
                svg.appendChild(txtLargo);

                // --- COTA ANCHO (Derecha) ---
                const xCotaAncho = pad + L_total + (pad * 0.35);
                const lineAncho = document.createElementNS("http://www.w3.org/2000/svg", "line");
                lineAncho.setAttribute("x1", xCotaAncho);
                lineAncho.setAttribute("y1", pad);
                lineAncho.setAttribute("x2", xCotaAncho);
                lineAncho.setAttribute("y2", pad + W_total);
                lineAncho.setAttribute("stroke", "#999");
                lineAncho.setAttribute("stroke-width", strokeCota);
                svg.appendChild(lineAncho);

                const txtAncho = document.createElementNS("http://www.w3.org/2000/svg", "text");
                const txtAnchoX = xCotaAncho + (fontSize * 0.9);
                const txtAnchoY = pad + (W_total / 2);
                txtAncho.setAttribute("x", txtAnchoX);
                txtAncho.setAttribute("y", txtAnchoY);
                // Rotamos el texto 90 grados para que quede paralelo a la línea y no ocupe espacio horizontal
                txtAncho.setAttribute("transform", `rotate(90, ${txtAnchoX}, ${txtAnchoY})`);
                txtAncho.setAttribute("style", estiloTexto);
                txtAncho.setAttribute("dominant-baseline", "middle");
                txtAncho.textContent = W_total + " mm";
                svg.appendChild(txtAncho);
                
                // --- COTA MARGEN (Arriba) ---
                if(margen > 0) {
                    const yCotaMargen = pad - (pad * 0.2);
                    const lineMargen = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    lineMargen.setAttribute("x1", pad);
                    lineMargen.setAttribute("y1", yCotaMargen);
                    lineMargen.setAttribute("x2", pad + margen);
                    lineMargen.setAttribute("y2", yCotaMargen);
                    lineMargen.setAttribute("stroke", "#e74c3c");
                    lineMargen.setAttribute("stroke-width", strokeCota * 1.5);
                    svg.appendChild(lineMargen);

                    const txtMargen = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    txtMargen.setAttribute("x", pad + (margen / 2));
                    txtMargen.setAttribute("y", yCotaMargen - (fontSize * 0.5));
                    txtMargen.setAttribute("style", `font-size: ${fontSize * 1.1}px; font-family: sans-serif; fill: #e74c3c; text-anchor: middle; font-weight: bold;`);
                    txtMargen.textContent = "m: " + margen + " mm (Grosor marco)";
                    svg.appendChild(txtMargen);
                }
            });
        }




function actualizarListaHilos() {
            const material = document.getElementById('material-hilo').value;
            const selHilo = document.getElementById('dia-hilo-select');

            const valorActual = parseFloat(selHilo.value);
            selHilo.innerHTML = '';

            let listaUsar = [];
            if (material === 'aluminio') {
                listaUsar = [...hilosAluminio];
            } else {
                listaUsar = [...hilosCobre];
            }

            listaUsar.sort((a, b) => a - b).forEach(h => {
                selHilo.innerHTML += `<option value="${h}">${Number(h).toFixed(3)} mm</option>`;
            });

            if (listaUsar.includes(valorActual)) {
                selHilo.value = String(valorActual);
            } else if (listaUsar.length > 0) {
                selHilo.selectedIndex = 0;
            }
        }


        // --- PASO 2: CÁLCULO ELÉCTRICO ---
// --- PASO 2: CÁLCULO ELÉCTRICO ---
        function calcularPaso2() {
            if(dbHilos.length === 0) return;
            const selHilo = document.getElementById('dia-hilo-select');
            if(!selHilo || selHilo.value === "") return;

            const idMaterial = document.getElementById('material-hilo').value;
            const materialConductor = MATERIALES_CONDUCTORES[idMaterial];
            const diaHilo = parseFloat(selHilo.value);
            
            EstadoDiseno.diametroHilo_mm = diaHilo;

            // --- NUEVO: Cambio de color visual en la Interfaz (Alerta si >= 100%) ---
            const foActual = (EstadoDiseno.factorOcupacion || 0);
            const esExcesoActual = foActual >= 1.0;
            const colorAlerta = esExcesoActual ? "#e74c3c" : "#d35400";

            const leyenda1 = document.getElementById('leyenda-ranura');
            const leyenda2 = document.getElementById('leyenda-ranura-step2');
            if (leyenda1) {
                leyenda1.style.backgroundColor = colorAlerta;
                leyenda1.style.opacity = esExcesoActual ? "1" : "0.8";
            }
            if (leyenda2) {
                leyenda2.style.backgroundColor = colorAlerta;
                leyenda2.style.opacity = esExcesoActual ? "1" : "0.8";
            }
            
            const txtNombreMat = document.getElementById('res-mat-nombre');
            if (txtNombreMat) {
                txtNombreMat.style.color = materialConductor.colorUI;
                txtNombreMat.style.fontWeight = "bold";
            }

            const radioHilo = diaHilo / 2;
            const seccionHilo = Math.PI * Math.pow(radioHilo, 2); 
            document.getElementById('sec-hilo').value = seccionHilo.toFixed(5);

            if (seccionHilo > 0) {
                const densidad = (EstadoDiseno.intensidadPanel_mA / 1000) / seccionHilo;
                document.getElementById('densidad-corriente').value = densidad.toFixed(2);
                
                const alertaDensidad = document.getElementById('alerta-densidad');
                if(densidad > 5) {
                    alertaDensidad.style.display = 'block';
                    document.getElementById('densidad-corriente').style.color = '#c0392b';
                } else {
                    alertaDensidad.style.display = 'none';
                    document.getElementById('densidad-corriente').style.color = 'black';
                }

                const distanciaMediaRanuras = EstadoDiseno.diametroRotor - EstadoDiseno.altoRanura_mm;
                const largoTotalRotor = EstadoDiseno.longitudPanel + (2 * EstadoDiseno.margenMarco_mm); 
                const lonEspira = (2 * largoTotalRotor + 2 * distanciaMediaRanuras) / 1000; 
                
                document.getElementById('lon-espira').value = lonEspira.toFixed(4);
                EstadoDiseno.longitudEspira_m = lonEspira;

                // --- CÁLCULO DE ESPIRAS Y FACTOR DE OCUPACIÓN ---
                const lonTotalIdeal = (EstadoDiseno.resistenciaPanelObjetivo * (seccionHilo * 1e-6)) / materialConductor.resistividad;
                const espirasCalculadas = Math.round(lonTotalIdeal / lonEspira);
                
                document.getElementById('espiras').value = espirasCalculadas;
                document.getElementById('res-espiras-final').textContent = espirasCalculadas;
                EstadoDiseno.espirasPorDevanado = espirasCalculadas;

                const fmm = espirasCalculadas * (EstadoDiseno.intensidadPanel_mA / 1000);
                EstadoDiseno.fmm_Av = fmm;
                const elFmm = document.getElementById('res-fmm');
                if (elFmm) elFmm.textContent = fmm.toFixed(2) + ' Av';

                const lonTotalReal = espirasCalculadas * lonEspira;
                document.getElementById('lon-total').value = lonTotalReal.toFixed(2);

                const rReal = (materialConductor.resistividad * lonTotalReal) / (seccionHilo * 1e-6);
                const elResDev = document.getElementById('res-devanado');
                if (elResDev) elResDev.value = rReal.toFixed(2);
                EstadoDiseno.resistenciaTotal = rReal; // Persistimos el valor para otros pasos (FCEM)

                const numDevanados = EstadoDiseno.numeroCaras / 2;
                EstadoDiseno.numDevanados = numDevanados;
                const elNumDev = document.getElementById('num-devanados');
                if (elNumDev) elNumDev.value = numDevanados;

                const volumen1_cm3 = seccionHilo * (lonTotalReal * 1000) / 1000;
                const masa1_g = volumen1_cm3 * materialConductor.densidad;
                const masaTotal_g = masa1_g * numDevanados;

                const elMatNombre = document.getElementById('res-mat-nombre');
                if (elMatNombre) elMatNombre.textContent = materialConductor.nombre;
                
                const elResLonEspira = document.getElementById('res-lon-espira-resumen');
                if (elResLonEspira) elResLonEspira.textContent = lonEspira.toFixed(4) + ' m';
                
                const elResLonDev = document.getElementById('res-lon-devanado');
                if (elResLonDev) elResLonDev.textContent = lonTotalReal.toFixed(2) + ' m';
                
                const elResPesoDev = document.getElementById('res-peso-devanado');
                if (elResPesoDev) elResPesoDev.textContent = masa1_g.toFixed(1) + ' g';
                
                const elResLonTotal = document.getElementById('res-lon-total-todos');
                if (elResLonTotal) elResLonTotal.textContent = (lonTotalReal * numDevanados).toFixed(2) + ' m';
                
                const elResPesoTotal = document.getElementById('res-peso-total-todos');
                if (elResPesoTotal) elResPesoTotal.textContent = masaTotal_g.toFixed(1) + ' g';

                calcularOcupacionRanura();
            }
        }




function precargarPasoMagnetico() {
    const inputRadioEfectivo = document.getElementById('radio-efectivo-mm');

    const longitudActivaPorPanel_mm = Math.max(
        EstadoDiseno.longitudPanel || 0,
        EstadoDiseno.anchoPanel || 0
    );

    EstadoDiseno.longitudActiva_m = longitudActivaPorPanel_mm / 1000;

    const elLongitudActiva = document.getElementById('mag-longitud-activa');
    if (elLongitudActiva) {
        elLongitudActiva.textContent = `${longitudActivaPorPanel_mm.toFixed(1)} mm`;
    }

    const diametroRotor = EstadoDiseno.diametroRotor || 0;
    const profundidadRanura = EstadoDiseno.profundidadRanura_mm || 0;

    const radioEfectivo_mm = Math.max(
        0,
        (diametroRotor / 2) - (profundidadRanura / 2)
    );

    EstadoDiseno.radioEfectivo_m = radioEfectivo_mm / 1000;

    if (inputRadioEfectivo) {
        inputRadioEfectivo.value = radioEfectivo_mm.toFixed(1);
    }

    const elRadio = document.getElementById('mag-radio-efectivo');
    if (elRadio) {
        elRadio.textContent = `${radioEfectivo_mm.toFixed(1)} mm`;
    }
}







function calcularPasoMagnetico() {
    const corrienteA = (EstadoDiseno.intensidadPanel_mA || 0) / 1000;
    const espiras = EstadoDiseno.espirasPorDevanado || 0;
    const numDevanados = EstadoDiseno.numDevanados || (EstadoDiseno.numeroCaras / 2) || 0;
    const longitudEspira = EstadoDiseno.longitudEspira_m || 0;

    const inputCampoB = document.getElementById('campo-b');
    const inputRadioEfectivo = document.getElementById('radio-efectivo-mm');

    const campoB = parseFloat(inputCampoB?.value || 0) || 0;
    const radioEfectivo_m = (parseFloat(inputRadioEfectivo?.value || 0) || 0) / 1000;
    const longitudActiva_m = EstadoDiseno.longitudActiva_m || 0;

    EstadoDiseno.campoB_T = campoB;
    EstadoDiseno.radioEfectivo_m = radioEfectivo_m;

    const fmm = espiras * corrienteA;

    // Fuerza de Lorentz únicamente por el imán principal
    const fuerzaLorentz = campoB * corrienteA * longitudActiva_m * espiras;
    const par = fuerzaLorentz * radioEfectivo_m;

    EstadoDiseno.fmm_Av = fmm;
    EstadoDiseno.fuerzaLorentz_N = fuerzaLorentz;
    EstadoDiseno.par_Nm = par;

    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setText('mag-espiras', espiras.toFixed(0));
    setText('mag-corriente', `${corrienteA.toFixed(3)} A`);
    setText('mag-lon-espira', `${longitudEspira.toFixed(4)} m`);
    setText('mag-devanados', `${numDevanados.toFixed(0)}`);
    setText('mag-diametro-rotor', `${(EstadoDiseno.diametroRotor || 0).toFixed(2)} mm`);
    setText('mag-longitud-activa', `${(longitudActiva_m * 1000).toFixed(1)} mm`);
    setText('mag-radio-efectivo', `${(radioEfectivo_m * 1000).toFixed(1)} mm`);
    setText('mag-b-preview', `${campoB.toFixed(3)} T`);

    setText('res-fmm', `${fmm.toFixed(2)} Av`);
    setText('res-lorentz', `${fuerzaLorentz.toFixed(4)} N`);
    setText('res-par', `${par.toFixed(6)} N·m`);
    setText('res-campo-b', `${campoB.toFixed(3)} T`);

    let lectura = 'Pendiente';
    if (par > 0.01) {
        lectura = 'Par prometedor';
    } else if (par > 0.003) {
        lectura = 'Par moderado';
    } else if (par > 0) {
        lectura = 'Par bajo';
    }

    setText('res-lectura-magnetica', lectura);

    dibujarInteraccionMagneticaSVG();
}

function dibujarInteraccionMagneticaSVG() {
    const svg = document.getElementById('magnetismo-svg');
    if (!svg) return;

    svg.innerHTML = ''; // Limpiar lienzo

    const R = (EstadoDiseno.diametroRotor || 50) / 2;
    const cx = 100;
    const cy = 80; // Centro elevado para acomodar el imán base
    const factorEscala = 60 / R; // Ajuste visual de escala
    const radioRotorSVG = R * factorEscala;

    // --- LECTURA DE VARIABLES ---
    const campoB = EstadoDiseno.campoB_T || 0.18;
    const fuerza = EstadoDiseno.fuerzaLorentz_N || 0;
    const parActivo = EstadoDiseno.par_Nm || 0;

    // --- 1. CONFIGURACIÓN DEL IMÁN A ESCALA ---
    let imanWidth = 60;
    let imanHeight = 20;
    let imanY = 175;
    
    const selIman = document.getElementById('iman-motor');
    const distImanRotor = parseFloat(document.getElementById('iman-distancia')?.value || 2);
    const orientacion = document.getElementById('iman-orientacion')?.value || 'long';
    
    if (selIman && selIman.value !== '') {
        const im = dbImanes?.[Number(selIman.value)];
        if (im) {
            const dims = [Number(im.l), Number(im.a), Number(im.h)];
            const T = Math.min(...dims);
            const baseDims = dims.filter((_, i) => i !== dims.indexOf(T));
            // Visible width depends on orientation
            const W_real = (orientacion === 'long') ? Math.min(...baseDims) : Math.max(...baseDims);
            
            imanWidth = W_real * factorEscala;
            imanHeight = T * factorEscala;
            // imanY = cy + radioRotorSVG + gap;
            imanY = cy + radioRotorSVG + (distImanRotor * factorEscala);
        }
    }

    // --- 2. DIBUJO DE LÍNEAS B (Flujo Magnético Realista) ---
    const numLineas = Math.min(15, Math.max(3, Math.floor(campoB * 30)));
    const expansionFactor = 1.35; // Factor de divergencia (cuánto se abren las líneas)
    
    for(let i=0; i<numLineas; i++){
        // lx1: Punto de origen en la superficie del imán
        const lx1 = cx - (imanWidth/2) + (imanWidth*0.1) + (i * ((imanWidth*0.8) / Math.max(1, numLineas-1)));
        
        // lx2: Punto de destino cerca del rotor (abierto en abanico)
        const dx = lx1 - cx;
        const lx2 = cx + dx * expansionFactor;
        const yDest = cy + radioRotorSVG;
        
        // Generamos un camino curvo (Bezier cuadrática)
        const pathB = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const cpX = lx1; // Punto de control para mantener la verticalidad inicial
        const cpY = imanY - (imanY - yDest) * 0.4;
        
        const d = `M ${lx1} ${imanY} Q ${cpX} ${cpY} ${lx2} ${yDest + 2}`;
        pathB.setAttribute('d', d);
        pathB.setAttribute('stroke', '#3498db');
        pathB.setAttribute('stroke-width', '1.2');
        pathB.setAttribute('stroke-dasharray', '3,3');
        pathB.setAttribute('fill', 'none');
        // La opacidad cae ligeramente en los extremos para realismo
        pathB.setAttribute('opacity', 0.45 - (Math.abs(dx)/imanWidth)*0.3);
        
        // Flecha B: Orientada según la trayectoria final de la curva
        const anguloDeg = Math.atan2(yDest - cpY, lx2 - cpX) * 180 / Math.PI;
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        arrow.setAttribute('points', `0,0 -3,7 3,7`);
        arrow.setAttribute('fill', '#3498db'); 
        arrow.setAttribute('opacity', '0.5');
        // Rotamos y trasladamos la flecha a la punta de la curva (corregido para que apunte hacia afuera del N)
        arrow.setAttribute('transform', `translate(${lx2}, ${yDest}) rotate(${anguloDeg + 90})`);
        
        svg.appendChild(pathB); svg.appendChild(arrow);
    }

    // --- 3. IMÁN BASE (Bipolo: Norte Rojo / Sur Azul) a escala ---
    const hMedio = imanHeight / 2;
    
    // Parte Norte (Superior - Rojo)
    const rectN = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rectN.setAttribute('x', cx - imanWidth/2); rectN.setAttribute('y', imanY);
    rectN.setAttribute('width', imanWidth); rectN.setAttribute('height', hMedio);
    rectN.setAttribute('fill', '#e74c3c'); rectN.setAttribute('stroke', '#c0392b');
    rectN.setAttribute('stroke-width', '1'); rectN.setAttribute('rx', '1');
    svg.appendChild(rectN);
    
    const txtN = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txtN.setAttribute('x', cx); txtN.setAttribute('y', imanY + hMedio - 2);
    txtN.setAttribute('font-size', Math.min(11, hMedio*1.5)); txtN.setAttribute('fill', 'white');
    txtN.setAttribute('font-weight', 'bold'); txtN.setAttribute('text-anchor', 'middle');
    txtN.textContent = 'N';
    if (hMedio > 4) svg.appendChild(txtN);

    // Parte Sur (Inferior - Azul)
    const rectS = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rectS.setAttribute('x', cx - imanWidth/2); rectS.setAttribute('y', imanY + hMedio);
    rectS.setAttribute('width', imanWidth); rectS.setAttribute('height', hMedio);
    rectS.setAttribute('fill', '#3498db'); rectS.setAttribute('stroke', '#2980b9');
    rectS.setAttribute('stroke-width', '1'); rectS.setAttribute('rx', '1');
    svg.appendChild(rectS);

    const txtS = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txtS.setAttribute('x', cx); txtS.setAttribute('y', imanY + imanHeight - 2);
    txtS.setAttribute('font-size', Math.min(11, hMedio*1.5)); txtS.setAttribute('fill', 'white');
    txtS.setAttribute('font-weight', 'bold'); txtS.setAttribute('text-anchor', 'middle');
    txtS.textContent = 'S';
    if (hMedio > 4) svg.appendChild(txtS);

    // --- 4. ROTOR POLIGONAL CON EJE ---
    const N = EstadoDiseno.numeroCaras || 4;
    const Wp = EstadoDiseno.anchoPanel || 50;
    const Ws = EstadoDiseno.anchoRanura_mm || 5;
    const Ds = EstadoDiseno.altoRanura_mm || 4;
    
    let angP = EstadoDiseno.anguloPanel;
    let angS = EstadoDiseno.anguloRanura;
    if (!angP || !angS) {
        const WpTotal = Wp + (2 * (EstadoDiseno.margenMarco_mm || 3));
        const sumaAnchuras = WpTotal + Ws;
        const anguloTotalRadianes = (2 * Math.PI) / N;
        angP = anguloTotalRadianes * (WpTotal / sumaAnchuras);
        angS = anguloTotalRadianes * (Ws / sumaAnchuras);
    }

    const profPx = Ds * factorEscala;
    const RfondoPx = Math.max( radioRotorSVG * 0.35, radioRotorSVG - profPx );
    const tipoRanura = document.getElementById('ranura-tipo')?.value || 'rect';
    let dRotor = "";

    // Desfase para asegurar que una ranura apunte exactamente hacia el imán (abajo)
    const rotOffset = -(angP + angS) / 2;

    for (let i = 0; i < N; i++) {
        const anguloCentroPanel = i * (angP + angS) - (Math.PI / 2) + rotOffset;
        const theta1 = anguloCentroPanel - (angP / 2);
        const theta2 = anguloCentroPanel + (angP / 2);
        const theta3 = theta2 + angS;

        const p1x = cx + radioRotorSVG * Math.cos(theta1); const p1y = cy + radioRotorSVG * Math.sin(theta1);
        const p2x = cx + radioRotorSVG * Math.cos(theta2); const p2y = cy + radioRotorSVG * Math.sin(theta2);
        const p3x = cx + radioRotorSVG * Math.cos(theta3); const p3y = cy + radioRotorSVG * Math.sin(theta3);


        if (i === 0) dRotor += `M ${p1x} ${p1y} `;
        else dRotor += `L ${p1x} ${p1y} `;
        dRotor += `L ${p2x} ${p2y} `;

        if (tipoRanura === 'trapecio') {
            const s1x = cx + RfondoPx * Math.cos(theta2); const s1y = cy + RfondoPx * Math.sin(theta2);
            const s2x = cx + RfondoPx * Math.cos(theta3); const s2y = cy + RfondoPx * Math.sin(theta3);
            dRotor += `L ${s1x} ${s1y} L ${s2x} ${s2y} `;
        } else {
            const thetaBisectriz = (theta2 + theta3) / 2;
            const dirX = Math.cos(thetaBisectriz); const dirY = Math.sin(thetaBisectriz);
            const s1x = p2x - dirX * profPx; const s1y = p2y - dirY * profPx;
            const s2x = p3x - dirX * profPx; const s2y = p3y - dirY * profPx;
            dRotor += `L ${s1x} ${s1y} L ${s2x} ${s2y} `;
        }
    }
    dRotor += "Z";

    // Silueta guía externa discontinua
    const circuloExt = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circuloExt.setAttribute("cx", cx); circuloExt.setAttribute("cy", cy);
    circuloExt.setAttribute("r", radioRotorSVG);
    circuloExt.setAttribute("fill", "none"); circuloExt.setAttribute("stroke", "#ccc");
    circuloExt.setAttribute("stroke-dasharray", "3");
    svg.appendChild(circuloExt);

    const pathRotor = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathRotor.setAttribute("d", dRotor);
    pathRotor.setAttribute("fill", "#ecf0f1");
    pathRotor.setAttribute("stroke", "#bdc3c7");
    pathRotor.setAttribute("stroke-width", "2");
    svg.appendChild(pathRotor);

    // Eje central de apoyo visual
    const ejeCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    ejeCircle.setAttribute("cx", cx); ejeCircle.setAttribute("cy", cy);
    ejeCircle.setAttribute("r", radioRotorSVG * 0.15); // Tamaño dinámico
    ejeCircle.setAttribute("fill", "#fff");
    ejeCircle.setAttribute("stroke", "#95a5a6");
    ejeCircle.setAttribute("stroke-width", "2");
    svg.appendChild(ejeCircle);


    // --- 4. DEVANADOS Y FUERZAS EN TODAS LAS RANURAS ---
    // (angP, angS y RfondoPx ya están calculados arriba)
    
    const maxDevanadoR = (radioRotorSVG - RfondoPx) / 2;
    const devanadoR = Math.max(3, Math.min(8, maxDevanadoR)); 

    for (let i = 0; i < N; i++) {
        // Ángulo de cada ranura (empezando por abajo: PI/2)
        const anguloRanura = i * (angP + angS) + (Math.PI / 2);
        const sx = cx + (RfondoPx + devanadoR) * Math.cos(anguloRanura);
        const sy = cy + (RfondoPx + devanadoR) * Math.sin(anguloRanura);

        // --- Círculo de Devanado ---
        const devCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        devCircle.setAttribute('cx', sx); devCircle.setAttribute('cy', sy);
        devCircle.setAttribute('r', devanadoR);
        devCircle.setAttribute('fill', '#e67e22'); devCircle.setAttribute('stroke', '#d35400');
        devCircle.setAttribute('opacity', sy > cy ? '1' : '0.4'); // Más tenue arriba
        svg.appendChild(devCircle);

        // --- Símbolo Corriente (⊗) ---
        const csz = Math.max(2, devanadoR * 0.4);
        const l1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        l1.setAttribute('x1', sx - csz); l1.setAttribute('y1', sy - csz);
        l1.setAttribute('x2', sx + csz); l1.setAttribute('y2', sy + csz);
        l1.setAttribute('stroke', '#fff'); l1.setAttribute('stroke-width', '1.2');
        svg.appendChild(l1);
        const l2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        l2.setAttribute('x1', sx + csz); l2.setAttribute('y1', sy - csz);
        l2.setAttribute('x2', sx - csz); l2.setAttribute('y2', sy + csz);
        l2.setAttribute('stroke', '#fff'); l2.setAttribute('stroke-width', '1.2');
        svg.appendChild(l2);

        // --- FUERZA DE LORENTZ LOCAL (Cualitativa) ---
        // Estimamos el campo B en esta posición específica
        const distVertical = Math.max(1, imanY - sy);
        const distHorizontal = Math.abs(sx - cx);
        
        // El campo cae con la distancia vertical y lateralmente
        // Usamos una aproximación cualitativa: B_local = B_max * (1/z^2) * damping_lateral
        const z_norm = distVertical / (radioRotorSVG * 0.5);
        const damping_lateral = Math.exp(-Math.pow(distHorizontal / (imanWidth * 0.8), 2));
        const localRatio = Math.min(1, (1 / (1 + z_norm * z_norm)) * damping_lateral);
        
        // Solo dibujamos la flecha de fuerza en la espira inferior (i=0) para simplificar el diagrama
        if (i === 0 && localRatio > 0.05) {
            const F_len = 5 + (localRatio * 80); 
            // Apuntar hacia la IZQUIERDA (Física: Corriente entrando + Campo arriba = Fuerza Izquierda)
            const f_x1 = sx - devanadoR - 2;
            const f_x2 = f_x1 - F_len;
            
            const lineF = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            lineF.setAttribute('x1', f_x1); lineF.setAttribute('y1', sy);
            lineF.setAttribute('x2', f_x2); lineF.setAttribute('y2', sy);
            lineF.setAttribute('stroke', '#e74c3c'); lineF.setAttribute('stroke-width', '2.5');
            lineF.setAttribute('opacity', localRatio * 1.5);
            svg.appendChild(lineF);

            const arrF = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            // Triángulo apuntando a la izquierda
            arrF.setAttribute('points', `${f_x2},${sy} ${f_x2+6},${sy-3.5} ${f_x2+6},${sy+3.5}`);
            arrF.setAttribute('fill', '#e74c3c'); arrF.setAttribute('opacity', localRatio * 1.5);
            svg.appendChild(arrF);
        }
    }

    // --- 5. PAR ROTATORIO (CURVA) ---
    // Recalibración de grosor: más sutil (rango 2 a 7)
    const strokeW = Math.min(7, 2 + (parActivo * 120)); 
    const rx = radioRotorSVG + 18;
    
    // Curva indicadora de giro (sentido horario, el lado izquierdo SUBE)
    // Coordenadas calculadas para que el arco esté a la izquierda y apunte hacia ARRIBA
    const startX = cx - rx * 0.7; const startY = cy + rx * 0.7; // Empieza abajo izquierda
    const endX = cx - rx * 0.7;   const endY = cy - rx * 0.7;   // Termina arriba izquierda
    const tauPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    // sweep-flag = 1 para que sea un arco convexo hacia fuera en sentido horario
    tauPath.setAttribute('d', `M ${startX} ${startY} A ${rx} ${rx} 0 0 1 ${endX} ${endY}`);
    tauPath.setAttribute('stroke', '#2ecc71'); tauPath.setAttribute('stroke-width', strokeW);
    tauPath.setAttribute('fill', 'none');
    svg.appendChild(tauPath);
    
    // Punta de flecha de par (proporcional al grosor)
    const headSize = Math.max(10, strokeW * 1.5);
    const tauArrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    // Triángulo apuntando hacia la punta (0,0)
    tauArrow.setAttribute('points', `0,0 ${-headSize/2},${headSize} ${headSize/2},${headSize}`);
    tauArrow.setAttribute('fill', '#2ecc71');
    // Rotamos 45 grados para que apunte hacia arriba-derecha siguiendo la curva en el tope izquierdo
    tauArrow.setAttribute('transform', `translate(${endX}, ${endY}) rotate(45)`);
    svg.appendChild(tauArrow);
}

// --- PASO 4: INTERACCIÓN LUMÍNICA ---
function calcularPasoLuminico() {
    const N = EstadoDiseno?.numeroCaras || parseInt(document.getElementById('caras')?.value || 4);
    const corrienteMax = window.corrienteDisponibleMagnetica || (parseFloat(document.getElementById('res-panel-isc')?.textContent) || 0.15); 
    const parMax = window.parMotrizMagnetico || 0.005;

    const giro_deg = parseFloat(document.getElementById('lum-giro')?.value) || 0;
    const luz_deg = parseFloat(document.getElementById('lum-angulo-luz')?.value) || 0;
    const conexion = document.getElementById('lum-conexion')?.value || '0';
    const off = parseInt(conexion); 

    const luz_normal = (luz_deg - 90) * Math.PI / 180;
    let effs = [];
    let minDistBottom = Infinity;
    let indexBottom = 0;

    for(let i=0; i<N; i++) {
        let angulo = (i * 360 / N - 90 + giro_deg);
        let anguloRad = angulo * Math.PI / 180;
        let delta = anguloRad - luz_normal;
        let cosInc = Math.cos(delta);
        effs.push(Math.max(0, cosInc));

        let normalSVG = ((angulo % 360) + 360) % 360; 
        let dist = Math.abs(normalSVG - 90);
        if (dist > 180) dist = 360 - dist;
        if (dist < minDistBottom) {
            minDistBottom = dist;
            indexBottom = i;
        }
    }
    
    // 1. Calcular corrientes de bobinados por par opuesto
    // En un Mendocino, el panel i y el panel i + N/2 están en serie-opuesta/antiparalelo.
    // La corriente en el bobinado j es proporcional a (eff[j] - eff[j+N/2])
    let currents = new Array(N).fill(0);
    let totalFactor = 0;

    for (let i = 0; i < N / 2; i++) {
        let iOpp = i + (N / 2);
        let netEff = effs[i] - effs[iOpp]; // Corriente neta del par
        
        // El par i alimenta al bobinado k
        // Si off=0 (Derecha), el par i alimenta la ranura i
        // Si off=-1 (Izquierda), el par i alimenta la ranura i-1
        let k = (i + off + N) % N;
        let kOpp = (k + (N / 2)) % N;

        currents[k] = netEff;
        currents[kOpp] = -netEff; // El retorno tiene sentido opuesto

        // Solo sumamos al factor total lo que ocurre abajo (donde está el imán)
        // El par motor neto depende de cuánta corriente hay abajo
        // NOTA: indexBottom nos dice qué ranura está abajo.
        if (k === indexBottom) totalFactor += netEff;
        if (kOpp === indexBottom) totalFactor += (-netEff);
    }

    let factor = Math.abs(totalFactor); // Factor de par motor resultante
    let caraActiva = -1; // Ya no hay una sola cara activa, es un sistema distribuido

    let corrienteResult = corrienteMax * factor;
    let parResult = parMax * factor; 

    const resObj1 = document.getElementById('lum-res-factor');
    const resObj2 = document.getElementById('lum-res-corriente');
    const resObj3 = document.getElementById('lum-res-par');
    
    if(resObj1) resObj1.textContent = factor.toFixed(2);
    if(resObj2) resObj2.textContent = corrienteResult.toFixed(3) + ' A';
    if(resObj3) resObj3.textContent = parResult.toFixed(4) + ' N·m';

    window.estadoLuminico = { 
        N: N, 
        giro: giro_deg, 
        luz: luz_deg, 
        effs: effs, 
        currents: currents, // IMPORTANTE: Enviamos el array de corrientes a la vista
        caraActiva: caraActiva, 
        factor: factor, 
        indexBottom: indexBottom 
    };
    
    if (document.getElementById('step-4').classList.contains('active')) {
        dibujarInteraccionLuminicaSVG();
    }
    
    // Renderizar fórmulas matemáticas si existen en el nuevo paso
    if (typeof renderizarMatematicas === 'function') {
        setTimeout(renderizarMatematicas, 100);
    }
}

function dibujarInteraccionLuminicaSVG() {
    const svg = document.getElementById('luminico-svg');
    if (!svg || !window.estadoLuminico) return;
    svg.innerHTML = '';
    
    const { N, giro, luz, effs, currents, caraActiva, indexBottom } = window.estadoLuminico;
    const off = parseInt(document.getElementById('lum-conexion')?.value || '0') || 0; 
    const cx = 100, cy = 80; // Centro elevado para consistencia visual con Paso 3
    const radioExterior = 45; // Escala base visual

    // 1. SOL EN ÓRBITA
    // El ángulo 'luz' en el slider va de -90 a 90 (0 es arriba)
    const anguloSolRad = (luz - 90) * Math.PI / 180;
    const radioOrbita = 85;
    const solX = cx + radioOrbita * Math.cos(anguloSolRad);
    const solY = cy + radioOrbita * Math.sin(anguloSolRad);
    
    // Brillo del Sol
    const solGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    solGlow.setAttribute('cx', solX); solGlow.setAttribute('cy', solY);
    solGlow.setAttribute('r', 18); solGlow.setAttribute('fill', 'url(#sunGradient)');
    
    // Gradiente para el sol si no existe lo creamos
    let defs = svg.querySelector('defs');
    if(!defs){
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.appendChild(defs);
        const grad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
        grad.setAttribute('id', 'sunGradient');
        grad.innerHTML = '<stop offset="0%" stop-color="#fff700"/><stop offset="100%" stop-color="#f39c12"/>';
        defs.appendChild(grad);
    }
    svg.appendChild(solGlow);

    // Rayos direccionales (siguen al sol)
    for(let j=-2; j<=2; j++) {
        const offsetAng = j * 12; // Separación de rayos
        const r_ang = (luz - 90 + offsetAng) * Math.PI / 180;
        const rx_s = cx + (radioOrbita - 5) * Math.cos(r_ang);
        const ry_s = cy + (radioOrbita - 5) * Math.sin(r_ang);
        
        let dirX = -Math.cos(anguloSolRad);
        let dirY = -Math.sin(anguloSolRad);
        
        const ray = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        ray.setAttribute('x1', rx_s); ray.setAttribute('y1', ry_s);
        ray.setAttribute('x2', rx_s + dirX * 25); ray.setAttribute('y2', ry_s + dirY * 25);
        ray.setAttribute('stroke', '#f39c12'); ray.setAttribute('stroke-width', '1.5');
        ray.setAttribute('stroke-dasharray', '3,3');
        ray.setAttribute('opacity', '0.7');
        svg.appendChild(ray);
    }

    // 2. GEOMETRÍA DEL ROTOR (Unificada con Pasos 1, 2 y 3)
    const strokeColor = getComputedStyle(document.documentElement).getPropertyValue('--svg-stroke-color').trim() || "#333";
    const colorImpresion3D = getComputedStyle(document.documentElement).getPropertyValue('--svg-panel-color').trim() || "#fdebd0";

    const Ws = EstadoDiseno?.anchoRanura_mm || 5;
    const Ds = EstadoDiseno?.altoRanura_mm || 4;
    const R_mm = (EstadoDiseno?.diametroRotor || 50) / 2;
    const factorEscala = (R_mm > 0) ? (45 / R_mm) : 1; 
    
    const radioRotorSVG = radioExterior;
    const profPx = Ds * factorEscala;
    const RfondoPx = radioRotorSVG - profPx;
    const tipoRanura = document.getElementById('ranura-tipo')?.value || 'rect';

    const Wp = EstadoDiseno?.anchoPanel || 50;
    const WpTotal = Wp + (2 * (EstadoDiseno?.margenMarco_mm || 3));
    const sumaAnchuras = WpTotal + Ws;
    const anguloTotalRadianes = (2 * Math.PI) / N;
    const angP = anguloTotalRadianes * (WpTotal / sumaAnchuras);
    const angS = anguloTotalRadianes * (Ws / sumaAnchuras);

    // Offset de giro real (alineado exactamente igual que el cálculo de effs en la lógica)
    const rotOffset = (giro * Math.PI / 180);

    // --- A. DIBUJAR CUERPO DEL ROTOR (Un solo Path 3D) ---
    let dRotor = "";

    for (let i = 0; i < N; i++) {
        const anguloCentroPanel = i * (angP + angS) - (Math.PI / 2) + rotOffset;
        const theta1 = anguloCentroPanel - (angP / 2);
        const theta2 = anguloCentroPanel + (angP / 2);
        const theta3 = theta2 + angS;

        const p1x = cx + radioRotorSVG * Math.cos(theta1); const p1y = cy + radioRotorSVG * Math.sin(theta1);
        const p2x = cx + radioRotorSVG * Math.cos(theta2); const p2y = cy + radioRotorSVG * Math.sin(theta2);
        const p3x = cx + radioRotorSVG * Math.cos(theta3); const p3y = cy + radioRotorSVG * Math.sin(theta3);

        if (i === 0) dRotor += `M ${p1x} ${p1y} `;
        else dRotor += `L ${p1x} ${p1y} `;
        dRotor += `L ${p2x} ${p2y} `;

        if (tipoRanura === 'trapecio') {
            const s1x = cx + RfondoPx * Math.cos(theta2); const s1y = cy + RfondoPx * Math.sin(theta2);
            const s2x = cx + RfondoPx * Math.cos(theta3); const s2y = cy + RfondoPx * Math.sin(theta3);
            dRotor += `L ${s1x} ${s1y} L ${s2x} ${s2y} `;
        } else {
            const thetaBisectriz = (theta2 + theta3) / 2;
            const dirX = Math.cos(thetaBisectriz); const dirY = Math.sin(thetaBisectriz);
            const s1x = p2x - dirX * profPx; const s1y = p2y - dirY * profPx;
            const s2x = p3x - dirX * profPx; const s2y = p3y - dirY * profPx;
            dRotor += `L ${s1x} ${s1y} L ${s2x} ${s2y} `;
        }
    }
    dRotor += "Z";

    const pathRotor = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathRotor.setAttribute("d", dRotor);
    pathRotor.setAttribute("fill", colorImpresion3D);
    pathRotor.setAttribute("stroke", strokeColor);
    pathRotor.setAttribute("stroke-width", "1.5");
    svg.appendChild(pathRotor);

    // --- B. DIBUJAR BOBINADOS Y PANELES SOLARES ---
    const fo = EstadoDiseno?.factorOcupacion || 0.8; 
    const profBobinadoPx = Ds * factorEscala * Math.min(fo, 1.2); 
    // currents ya está disponible por la desestructuración al inicio de la función

    for (let i = 0; i < N; i++) {
        const anguloCentroPanel = i * (angP + angS) - (Math.PI / 2) + rotOffset;
        const theta1 = anguloCentroPanel - (angP / 2);
        const theta2 = anguloCentroPanel + (angP / 2);
        const theta3 = theta2 + angS;

        // 1. BOBINADO
        const thetaBisectriz = (theta2 + theta3) / 2;
        const dirX = Math.cos(thetaBisectriz);
        const dirY = Math.sin(thetaBisectriz);
        let pVbob = "";

        if (tipoRanura === 'trapecio') {
            const f1x = cx + RfondoPx * Math.cos(theta2); const f1y = cy + RfondoPx * Math.sin(theta2);
            const f2x = cx + RfondoPx * Math.cos(theta3); const f2y = cy + RfondoPx * Math.sin(theta3);
            const rExt = RfondoPx + profBobinadoPx;
            const o1x = cx + rExt * Math.cos(theta2); const o1y = cy + rExt * Math.sin(theta2);
            const o2x = cx + rExt * Math.cos(theta3); const o2y = cy + rExt * Math.sin(theta3);
            pVbob = `${f1x},${f1y} ${o1x},${o1y} ${o2x},${o2y} ${f2x},${f2y}`;
        } else {
            const p2x = cx + radioRotorSVG * Math.cos(theta2); const p2y = cy + radioRotorSVG * Math.sin(theta2);
            const p3x = cx + radioRotorSVG * Math.cos(theta3); const p3y = cy + radioRotorSVG * Math.sin(theta3);
            const f1x = p2x - dirX * profPx; const f1y = p2y - dirY * profPx;
            const f2x = p3x - dirX * profPx; const f2y = p3y - dirY * profPx;
            const o1x = f1x + dirX * profBobinadoPx; const o1y = f1y + dirY * profBobinadoPx;
            const o2x = f2x + dirX * profBobinadoPx; const o2y = f2y + dirY * profBobinadoPx;
            pVbob = `${f1x},${f1y} ${o1x},${o1y} ${o2x},${o2y} ${f2x},${f2y}`;
        }

        // Color del bobinado basado en la corriente absoluta
        // I_inst va de -1 a 1. Usamos |I| para la intensidad del ROJO.
        const I_inst = Math.abs(currents[i] || 0);
        
        // Colores: Gris (#95a5a6) a Rojo (#e74c3c)
        const r_b = Math.round(149 + (231 - 149) * I_inst);
        const g_b = Math.round(165 + (76 - 165) * I_inst);
        const b_b = Math.round(166 + (60 - 166) * I_inst);
        const colorBobinado = `rgb(${r_b}, ${g_b}, ${b_b})`;
        
        const polyBobinado = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        polyBobinado.setAttribute("points", pVbob);
        polyBobinado.setAttribute("fill", colorBobinado);
        polyBobinado.setAttribute("opacity", "0.9");
        
        // Si es el bobinado inferior y tiene corriente, le damos un borde de alerta
        if (i === indexBottom && I_inst > 0.1) {
            polyBobinado.setAttribute("stroke", "#c0392b");
            polyBobinado.setAttribute("stroke-width", "1");
        }
        svg.appendChild(polyBobinado);

        // 2. PANEL SOLAR
        const proporcionPlaca = WpTotal > 0 ? (Wp / WpTotal) : 1;
        const angPlacaReal = angP * proporcionPlaca;
        const tPlaca1 = anguloCentroPanel - (angPlacaReal / 2);
        const tPlaca2 = anguloCentroPanel + (angPlacaReal / 2);

        const pl1x = cx + radioRotorSVG * Math.cos(tPlaca1);
        const pl1y = cy + radioRotorSVG * Math.sin(tPlaca1);
        const pl2x = cx + radioRotorSVG * Math.cos(tPlaca2);
        const pl2y = cy + radioRotorSVG * Math.sin(tPlaca2);

        // Calculamos el color de la placa en base a la luz que recibe (eff = de 0 a 1)
        let eff = effs[i];
        
        let r, g, b;
        if (eff === 0) {
            // Sombra total: Gris apagado #7f8c8d
            r = 127; g = 140; b = 141;
        } else if (eff < 0.3) {
            // Transición de Gris a Oro Oscuro (aprox rgb 180, 150, 40)
            let t = eff / 0.3;
            r = Math.round(127 + (180 - 127) * t);
            g = Math.round(140 + (150 - 140) * t);
            b = Math.round(141 + (40 - 141) * t);
        } else {
            // Transición de Oro Oscuro a Amarillo Solar #f1c40f
            let t = (eff - 0.3) / 0.7;
            r = Math.round(180 + (241 - 180) * t); 
            g = Math.round(150 + (196 - 150) * t); 
            b = Math.round(40 + (15 - 40) * t);    
        }
        
        let colorSolarBase = `rgb(${r},${g},${b})`;
        let strokeW = 4;

        if (caraActiva === i || (caraActiva === -2 && eff > 0)) {
             // Pequeño extra de grosor visual para el panel primario que está dictando la corriente
             strokeW = 5; 
        }
        const placaSolBase = document.createElementNS("http://www.w3.org/2000/svg", "line");
        placaSolBase.setAttribute("x1", pl1x); placaSolBase.setAttribute("y1", pl1y);
        placaSolBase.setAttribute("x2", pl2x); placaSolBase.setAttribute("y2", pl2y);
        placaSolBase.setAttribute("stroke", colorSolarBase); 
        placaSolBase.setAttribute("stroke-width", strokeW.toString());
        placaSolBase.setAttribute("stroke-linecap", "round");
        svg.appendChild(placaSolBase);
    }

    // Eje central
    const eje = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    eje.setAttribute('cx', cx); eje.setAttribute('cy', cy);
    eje.setAttribute('r', 5); eje.setAttribute('fill', '#fff');
    eje.setAttribute('stroke', '#7f8c8d');
    svg.appendChild(eje);

    // --- IMÁN BASE A ESCALA REAL ---
    let magW = 60; 
    let magH = 16;
    let magY = cy + radioRotorSVG + 10;
    
    const selIman4 = document.getElementById('iman-motor');
    const distImanRotor4 = parseFloat(document.getElementById('iman-distancia')?.value || 2);
    const orientacion4 = document.getElementById('iman-orientacion')?.value || 'long';
    
    if (selIman4 && selIman4.value !== '') {
        const im = dbImanes?.[Number(selIman4.value)];
        if (im) {
            const dims = [Number(im.l), Number(im.a), Number(im.h)];
            const T = Math.min(...dims);
            const baseDims = dims.filter((_, i) => i !== dims.indexOf(T));
            const W_real = (orientacion4 === 'long') ? Math.min(...baseDims) : Math.max(...baseDims);
            
            magW = W_real * factorEscala;
            magH = T * factorEscala;
            magY = cy + radioRotorSVG + (distImanRotor4 * factorEscala);
        }
    }

    const hM = magH / 2;

    // Norte (Rojo)
    const rectN4 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rectN4.setAttribute('x', cx - magW/2); rectN4.setAttribute('y', magY);
    rectN4.setAttribute('width', magW); rectN4.setAttribute('height', hM);
    rectN4.setAttribute('fill', '#e74c3c'); rectN4.setAttribute('stroke', '#c0392b');
    svg.appendChild(rectN4);
    
    const textN4 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textN4.setAttribute('x', cx); textN4.setAttribute('y', magY + hM - 2);
    textN4.setAttribute('fill', '#fff'); textN4.setAttribute('font-size', Math.min(9, hM*1.5));
    textN4.setAttribute('font-weight', 'bold'); textN4.setAttribute('text-anchor', 'middle');
    textN4.textContent = 'N';
    if (hM > 3) svg.appendChild(textN4);

    // Sur (Azul)
    const rectS4 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rectS4.setAttribute('x', cx - magW/2); rectS4.setAttribute('y', magY + hM);
    rectS4.setAttribute('width', magW); rectS4.setAttribute('height', hM);
    rectS4.setAttribute('fill', '#3498db'); rectS4.setAttribute('stroke', '#2980b9');
    svg.appendChild(rectS4);

    const textS4 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textS4.setAttribute('x', cx); textS4.setAttribute('y', magY + magH - 2);
    textS4.setAttribute('fill', '#fff'); textS4.setAttribute('font-size', Math.min(9, hM*1.5));
    textS4.setAttribute('font-weight', 'bold'); textS4.setAttribute('text-anchor', 'middle');
    textS4.textContent = 'S';
    if (hM > 3) svg.appendChild(textS4);
}

// Hook the variables exported by Magnetic to be used as starting values for Lumínico
const oldCalcularMagnetico = window.calcularPasoMagnetico || function(){};
window.calcularPasoMagnetico = function() {
    oldCalcularMagnetico();
    const I = parseFloat(document.getElementById('mag-corriente')?.textContent);
    window.corrienteDisponibleMagnetica = !isNaN(I) ? I : null;
    const P = parseFloat(document.getElementById('res-par')?.textContent);
    window.parMotrizMagnetico = !isNaN(P) ? P : null;
    calcularPasoLuminico(); // Chain execution
}


// --- PASO 5: ENCAJE EN RANURA ---

function calcularOcupacionRanura() {
    const anchoReal = EstadoDiseno.anchoRanura_mm;
    const altoReal = EstadoDiseno.altoRanura_mm;

    if (anchoReal > 0 && altoReal > 0 && EstadoDiseno.diametroHilo_mm > 0 && EstadoDiseno.espirasPorDevanado > 0) {
        const conductoresCapa = Math.floor(anchoReal / EstadoDiseno.diametroHilo_mm);

        if (conductoresCapa <= 0) {
            document.getElementById('alerta-ranura').style.display = 'block';
            document.getElementById('alerta-ranura').innerHTML = "<strong>⚠️ Error:</strong> El hilo es más grueso que el ancho de la ranura.";
        } else {
            const numCapas = Math.ceil(EstadoDiseno.espirasPorDevanado / conductoresCapa);

            let espirasUltima = EstadoDiseno.espirasPorDevanado % conductoresCapa;
            if (espirasUltima === 0) espirasUltima = conductoresCapa;

            const anchoOcupado = (EstadoDiseno.espirasPorDevanado < conductoresCapa ? EstadoDiseno.espirasPorDevanado : conductoresCapa) * EstadoDiseno.diametroHilo_mm;
            const altoOcupado = numCapas * EstadoDiseno.diametroHilo_mm;

            const areaCobre = EstadoDiseno.espirasPorDevanado * Math.PI * Math.pow(EstadoDiseno.diametroHilo_mm / 2, 2);
            const calidad = parseFloat(document.getElementById("calidad-bobinado").value);
            const areaEfectiva = areaCobre * (1 + calidad);
            const areaRanura = EstadoDiseno.areaRanuraUtil_mm2;
            const factorRelleno = areaRanura > 0 ? (areaEfectiva / areaRanura) * 100 : 0;

            document.getElementById('res-area-ranura').textContent = areaRanura.toFixed(2) + ' mm²';
            document.getElementById('res-ancho-ocupado').textContent = anchoOcupado.toFixed(2) + ' mm';
            document.getElementById('res-alto-ocupado').textContent = altoOcupado.toFixed(2) + ' mm';
        document.getElementById('res-factor').textContent = factorRelleno.toFixed(1) + '%';
        const elVisualBar = document.getElementById('visual-factor-bar');
        if (elVisualBar) elVisualBar.style.width = Math.min(factorRelleno, 100) + '%';

        // Guardar para el dibujo
        EstadoDiseno.factorOcupacion = factorRelleno / 100;
        
        // Redibujar el rotor para actualizar el color de alerta
        dibujarRotorSVG();

        const alerta = document.getElementById('alerta-ranura');
        const cabePorArea = areaEfectiva <= areaRanura;

        if (altoOcupado > altoReal || !cabePorArea) {
            alerta.style.display = 'block';
            alerta.innerHTML = `<strong>⚠️ Cuidado:</strong> El bobinado sobresaldrá de la ranura (${(factorRelleno).toFixed(0)}% ocupación).`;
        } else {
            alerta.style.display = 'none';
        }
    }
} else {
    // RESET si no hay datos de bobinado
    document.getElementById('res-factor').textContent = '0%';
    if (document.getElementById('visual-factor-bar')) document.getElementById('visual-factor-bar').style.width = '0%';
    EstadoDiseno.factorOcupacion = 0;
}
                
    // REDIBUJAR SIEMPRE (FUERA DEL IF) para asegurar sincronización
    const caras = EstadoDiseno.numeroCaras;
    if (caras >= 3) {
        const tipoRanura = document.getElementById('ranura-tipo').value;
        const Wp = EstadoDiseno.anchoPanel;
        const Ws = EstadoDiseno.anchoRanura_mm;
        const Ds = EstadoDiseno.altoRanura_mm;
        const R = EstadoDiseno.diametroRotor / 2;
        
        const WpTotal = Wp + (2 * EstadoDiseno.margenMarco_mm);
        const sumaAnchuras = WpTotal + Ws;
        const anguloTotalRadianes = (2 * Math.PI) / caras;
        const angP = anguloTotalRadianes * (WpTotal / sumaAnchuras);
        const angS = anguloTotalRadianes * (Ws / sumaAnchuras);
        
        dibujarRotorSVG(caras, tipoRanura, Wp, Ws, Ds, R, angP, angS);
        dibujarPanelSVG(EstadoDiseno.longitudPanel, Wp, EstadoDiseno.margenMarco_mm);
    }
}


        // --- FUNCIONES PARA GUARDAR Y CARGAR LOCALMENTE ---

        async function obtenerMotoresGuardados() {
            let motoresFinales = {};
            
            // 1. Cargar de LocalStorage primero
            try {
                const datosLocal = localStorage.getItem('listaMotoresMendocino');
                if (datosLocal) motoresFinales = JSON.parse(datosLocal);
            } catch (e) { console.warn("Error leyendo LocalStorage:", e); }

            // 2. Si hay sesión, cargar de Supabase
            if (window.dbMendocinoClient && sessionActiva) {
                try {
                    console.log("DEBUG [Auth]: Sincronizando diseños desde la nube...");
                    const fetchPromise = dbMendocinoClient
                        .from('motores')
                        .select('id_unico, titulo, config')
                        .eq('usuario_id', sessionActiva.user.id);
                    
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error("Timeout Supabase")), 8000)
                    );

                    const { data: motoresCloud, error } = await Promise.race([fetchPromise, timeoutPromise]);
                    
                    if (!error && motoresCloud) {
                        motoresCloud.forEach(m => {
                            // Guardamos un objeto más completo para poder identificar el id_unico al cargar
                            motoresFinales[m.titulo] = {
                                config: m.config,
                                id_unico: m.id_unico
                            };
                        });
                        console.log(`DEBUG [Auth]: ${motoresCloud.length} diseños recuperados de la nube.`);
                        // Actualizamos LocalStorage con lo que hay en la nube para persistencia offline futura
                        localStorage.setItem('listaMotoresMendocino', JSON.stringify(motoresFinales));
                    } else if (error) {
                        console.error("Error sincronizando motores:", error);
                    }
                } catch (e) { 
                    console.warn("DEBUG [Auth]: Usando solo local por fallo en la nube:", e.message);
                }
            }
            return motoresFinales;
        }

        
        // --- DIÁLOGOS PERSONALIZADOS (MODALES) ---
        function mostrarConfirmacion(titulo, mensaje) {
            return new Promise((resolve) => {
                const modal = document.getElementById('modal-dialogo');
                const t = document.getElementById('modal-dialogo-titulo');
                const m = document.getElementById('modal-dialogo-mensaje');
                const iCont = document.getElementById('modal-dialogo-input-cont');
                const btnAceptar = document.getElementById('modal-dialogo-btn-aceptar');
                const btnCancelar = document.getElementById('modal-dialogo-btn-cancelar');

                t.textContent = titulo;
                m.textContent = mensaje;
                iCont.style.display = 'none';
                modal.style.display = 'flex';

                const limpiarEventos = () => {
                    btnAceptar.onclick = null;
                    btnCancelar.onclick = null;
                };

                btnAceptar.onclick = () => {
                    limpiarEventos();
                    modal.style.display = 'none';
                    resolve(true);
                };
                btnCancelar.onclick = () => {
                    limpiarEventos();
                    modal.style.display = 'none';
                    resolve(false);
                };
            });
        }

        function mostrarPrompt(titulo, mensaje, valorDefecto = "") {
            return new Promise((resolve) => {
                const modal = document.getElementById('modal-dialogo');
                const t = document.getElementById('modal-dialogo-titulo');
                const m = document.getElementById('modal-dialogo-mensaje');
                const iCont = document.getElementById('modal-dialogo-input-cont');
                const input = document.getElementById('modal-dialogo-input');
                const btnAceptar = document.getElementById('modal-dialogo-btn-aceptar');
                const btnCancelar = document.getElementById('modal-dialogo-btn-cancelar');

                t.textContent = titulo;
                m.textContent = mensaje;
                iCont.style.display = 'block';
                input.value = valorDefecto;
                modal.style.display = 'flex';
                setTimeout(() => input.focus(), 100);

                const limpiarEventos = () => {
                    btnAceptar.onclick = null;
                    btnCancelar.onclick = null;
                    input.onkeydown = null;
                };

                const aceptar = () => {
                    const val = input.value;
                    limpiarEventos();
                    modal.style.display = 'none';
                    resolve(val);
                };

                const cancelar = () => {
                    limpiarEventos();
                    modal.style.display = 'none';
                    resolve(null);
                };

                btnAceptar.onclick = aceptar;
                btnCancelar.onclick = cancelar;
                input.onkeydown = (e) => {
                    if (e.key === 'Enter') aceptar();
                    if (e.key === 'Escape') cancelar();
                };
            });
        }

        async function nuevoProyecto() {
            if (await mostrarConfirmacion("Nuevo Diseño", "¿Deseas limpiar el diseño actual y empezar uno nuevo? Se perderán los cambios que no hayas guardado en la nube.")) {
                localStorage.removeItem('progresoMendocino');
                // Al recargar, como hemos borrado el progreso, iniciará de cero
                location.reload();
            }
        }

        async function guardarConfiguracionLocal() {
            const btnGuardar = document.querySelector('button[onclick*="guardarConfiguracionLocal"]');
            const textoOriginal = btnGuardar ? btnGuardar.innerHTML : '';

            try {
                let nombreMotor = "";
                let modoEdicion = false;

                if (window.proyectoActivo) {
                    const confirmacion = await mostrarConfirmacion(
                        "Actualizar Diseño", 
                        `¿Quieres sobreescribir los cambios en "${window.proyectoActivo.titulo}"? \n\n Pulsa "Aceptar" para actualizar o "Cancelar" para guardar como un diseño nuevo.`
                    );
                    if (confirmacion) {
                        nombreMotor = window.proyectoActivo.titulo;
                        modoEdicion = true;
                    }
                }

                if (!modoEdicion) {
                    nombreMotor = await mostrarPrompt(
                        "Guardar Nuevo Diseño", 
                        "📝 Ponle un nombre a esta nueva configuración:"
                    );
                    if (nombreMotor === null || nombreMotor.trim() === "") return;
                }

                if (btnGuardar) {
                    btnGuardar.disabled = true;
                    btnGuardar.innerHTML = '<span>Guardando...</span> ⏳';
                }

                // --- RECOPILACIÓN SEGURA DE DATOS ---
                const getVal = (id) => document.getElementById(id)?.value || '';
                const getTxt = (id) => {
                    const el = document.getElementById(id);
                    if (!el) return '';
                    if (el.tagName === 'SELECT') {
                        return el.selectedIndex >= 0 ? el.options[el.selectedIndex]?.text : '';
                    }
                    return el.textContent || '';
                };

                const panelSelect = document.getElementById('panel');
                const informe = document.getElementById('informe-automatico')?.value || "";
                const tipoRotor = getTxt('res-tipo-rotor');
                const comportamiento = getTxt('res-comportamiento');
                const nivel = getTxt('res-nivel');

                const miConfiguracion = capturarEstadoConfiguracionActual();

                // 1. Guardado Local
                const misMotores = await obtenerMotoresGuardados();
                misMotores[nombreMotor] = { config: miConfiguracion, id_unico: modoEdicion ? window.proyectoActivo.id_unico : null };
                localStorage.setItem('listaMotoresMendocino', JSON.stringify(misMotores));

                // 2. Sincronización con la Nube
                if (window.dbMendocinoClient && sessionActiva) {
                    const uid = sessionActiva.user.id;
                    console.log("DEBUG [Save]: Iniciando sincronización con Supabase para UID:", uid);
                    
                    if (modoEdicion && window.proyectoActivo.id_unico) {
                        const { error } = await dbMendocinoClient
                            .from('motores')
                            .update({ config: miConfiguracion, usuario_id: uid })
                            .eq('id_unico', window.proyectoActivo.id_unico);
                        if (error) throw error;
                        mostrarToast(`"${nombreMotor}" actualizado en la nube.`, 'ok');
                    } else {
                        const id_nuevo = (usuarioActual?.nombre || 'user').replace(/\s+/g, '_') + '-' + Date.now();
                        const payload = {
                            id_unico: id_nuevo,
                            titulo: nombreMotor,
                            config: miConfiguracion,
                            usuario_id: uid,
                            autor_nombre: usuarioActual?.nombre || 'Alumno',
                            es_publico: false 
                        };
                        
                        console.log("DEBUG [Save]: Enviando nuevo diseño:", payload);
                        
                        const { data, error } = await dbMendocinoClient
                            .from('motores')
                            .insert([payload])
                            .select(); // Forzamos select para validar la inserción inmediata
                            
                        if (error) {
                            console.error("DEBUG [Save]: Error de Supabase:", error);
                            // Si el error es RLS, intentamos dar una pista más clara
                            if (error.code === '42501') {
                                throw new Error("Permiso denegado (RLS). Tu sesión podría haber expirado o la base de datos no reconoce tu usuario.");
                            }
                            throw error;
                        }
                        
                        window.proyectoActivo = { id_unico: id_nuevo, titulo: nombreMotor };
                        actualizarUIProyectoActivo();
                        mostrarToast(`"${nombreMotor}" guardado en la nube.`, 'ok');
                    }
                } else {
                    mostrarToast(`Guardado solo localmente (Sesión no iniciada).`, 'aviso');
                }

            } catch (err) {
                console.error("Error crítico durante el guardado:", err);
                mostrarToast(`Error al guardar: ${err.message || 'Error desconocido'}`, 'error');
            } finally {
                if (btnGuardar) {
                    btnGuardar.disabled = false;
                    btnGuardar.innerHTML = textoOriginal;
                }
            }
        }

        function capturarEstadoConfiguracionActual() {
            const getVal = (id) => {
                const el = document.getElementById(id);
                if (!el) return null;
                const val = el.value;
                return (el.tagName === 'SELECT') ? val : val;
            };
            const getTxt = (id) => {
                const el = document.getElementById(id);
                if (!el) return '';
                if (el.tagName === 'SELECT') {
                    return el.selectedIndex >= 0 ? el.options[el.selectedIndex]?.text : '';
                }
                return el.textContent || '';
            };

            const panelSelect = document.getElementById('panel');
            const tipoRotor = getTxt('res-tipo-rotor');
            const comportamiento = getTxt('res-comportamiento');
            const nivel = getTxt('res-nivel');

            return {
                caras: getVal('caras') || 4,
                panel: getVal('panel'),
                panelNombre: panelSelect ? (panelSelect.options[panelSelect.selectedIndex]?.text || '') : '',
                panelData: (panelSelect && dbPaneles[panelSelect.value]) ? { ...dbPaneles[panelSelect.value] } : null,
                margen: getVal('margen-placa') || 2,
                ranuraAncho: getVal('ranura-ancho') || 10,
                ranuraAlto: getVal('ranura-alto') || 15,
                ranuraTipo: getVal('ranura-tipo') || 'rect',
                material: getVal('material-hilo') || 'cobre',
                hilo: getVal('dia-hilo-select') || 0.15,
                calidad: getVal('calidad-bobinado') || 'media',
                imanMotorNombre: getTxt('iman-motor'),
                imanMotorOrientacion: getVal('iman-orientacion') || 'long',
                imanMotorDistancia: getVal('iman-distancia') || 2.0,
                campoB: getVal('campo-b') || 0.18,
                radioEfectivo: getVal('radio-efectivo-mm') || 0,
                lumGiro: getVal('lum-giro') || 0,
                lumAnguloLuz: getVal('lum-angulo-luz') || 0,
                lumConexion: getVal('lum-conexion') || '0',
                fcemRpmSim: getVal('fcem-rpm-sim') || 0,
                fcemPerdidas: getVal('fcem-perdidas') || 15,
                informe: document.getElementById('informe-automatico')?.value || "",
                resumen: {
                    tipoRotor,
                    comportamiento,
                    nivel,
                    espiras: getVal('espiras') || 0,
                    pesoCobre: getTxt('res-peso-total-todos') || '0 g',
                    pesoReal: getVal('peso-total-real') || '0',
                    velocidadMax: getTxt('res-fcem-rpm-real') || '0 RPM'
                },
                fechaGuardado: new Date().toLocaleString('es-ES')
            };
        }

        function actualizarUIProyectoActivo() {
            const display = document.getElementById('proyecto-activo-display');
            if (display) {
                if (window.proyectoActivo) {
                    display.textContent = `📋 Proyecto: ${window.proyectoActivo.titulo}`;
                    display.style.display = 'block';
                } else {
                    display.style.display = 'none';
                }
            }
        }

    async function cargarConfiguracionLocal() {
    const btnToolbar = document.querySelector('button[onclick="cargarConfiguracionLocal()"]');
    const textoOriginal = btnToolbar ? btnToolbar.innerHTML : '';
    if (btnToolbar) {
        btnToolbar.disabled = true;
        btnToolbar.innerHTML = '<span>Cargando...</span> ⏳';
    }

    const misMotores = await obtenerMotoresGuardados();

    if (btnToolbar) {
        btnToolbar.disabled = false;
        btnToolbar.innerHTML = textoOriginal;
    }

    const listaDiv = document.getElementById('lista-configs');
    const modal = document.getElementById('modal-configs');

    if (!listaDiv || !modal) {
        console.error("No se encontró el modal o la lista de configuraciones.");
        alert("No se pudo abrir la ventana de configuraciones guardadas.");
        return;
    }

    listaDiv.innerHTML = '';

    // Nueva Cabecera con botón de sincronización
    const cabecera = document.createElement('div');
    cabecera.style.display = 'flex';
    cabecera.style.justifyContent = 'space-between';
    cabecera.style.alignItems = 'center';
    cabecera.style.marginBottom = '15px';
    cabecera.style.padding = '0 5px 10px 5px';
    cabecera.style.borderBottom = '1px solid #e2e8f0';

    const tituloModal = document.createElement('h3');
    tituloModal.textContent = "Tus Diseños";
    tituloModal.style.margin = "0";
    tituloModal.style.fontSize = "16px";

    const btnSync = document.createElement('button');
    btnSync.innerHTML = "🔄 Sincronizar";
    btnSync.className = "btn-voto"; // Reutilizamos estilo de botón pequeño
    btnSync.style.height = "28px";
    btnSync.style.padding = "0 10px";
    btnSync.onclick = async () => {
        btnSync.disabled = true;
        btnSync.textContent = "⏳...";
        await cargarConfiguracionLocal();
    };

    cabecera.appendChild(tituloModal);
    cabecera.appendChild(btnSync);
    listaDiv.appendChild(cabecera);

    const nombresDeMotores = Object.keys(misMotores);

    if (nombresDeMotores.length === 0) {
        listaDiv.innerHTML = '<p class="texto-vacio-modal">No tienes ninguna configuración guardada todavía.</p>';
    } else {
        nombresDeMotores.forEach(nombre => {
            const entrada = misMotores[nombre];
            // Manejamos tanto el formato nuevo {config, id_unico} como el antiguo (solo config)
            const config = entrada.config || entrada;
            const id_unico = entrada.id_unico || null;

            const renglon = document.createElement('div');
            renglon.style.display = 'flex';
            renglon.style.justifyContent = 'space-between';
            renglon.style.alignItems = 'center';
            renglon.style.padding = '10px 0';
            renglon.style.borderBottom = '1px solid #f1f2f6';
            renglon.style.gap = '10px';

            const titulo = document.createElement('div');
            titulo.style.flex = '1';

            const fecha = config?.fechaGuardado ? `<br><small style="color:#7f8c8d;">${config.fechaGuardado}</small>` : '';
            titulo.innerHTML = `<strong>⚙️ ${nombre}</strong>${fecha}`;

            const cajaBotones = document.createElement('div');
            cajaBotones.style.display = 'flex';
            cajaBotones.style.gap = '8px';

            const btnCargar = document.createElement('button');
            btnCargar.textContent = 'Cargar';
            btnCargar.className = 'btn-action';
            btnCargar.style.marginTop = '0';
            btnCargar.onclick = function () {
                try {
                    cargarMotor(config, id_unico, nombre);
                    cerrarModalConfigs();
                    mostrarToast(`Configuración "${nombre}" cargada.`, 'ok');
                } catch (e) {
                    console.error("Error cargando configuración:", e);
                    alert(`No se pudo cargar la configuración "${nombre}".`);
                }
            };

            const btnBorrar = document.createElement('button');
            btnBorrar.textContent = '🗑️';
            btnBorrar.className = 'btn-delete';
            btnBorrar.onclick = async function () {
                if (await mostrarConfirmacion("Borrar Diseño", `¿Seguro que quieres borrar la configuración "${nombre}"?`)) {
                    try {
                        // 1. Intentar borrar en la nube si tiene ID
                        if (id_unico && window.dbMendocinoClient && sessionActiva) {
                            console.log("DEBUG [Delete]: Borrando de Supabase ID:", id_unico);
                            const { error } = await dbMendocinoClient
                                .from('motores')
                                .delete()
                                .eq('id_unico', id_unico);
                            
                            if (error) {
                                console.error("Error borrando en Supabase:", error);
                                // Opcional: podrías decidir NO borrar localmente si falla la nube,
                                // pero para el usuario suele ser mejor que desaparezca de su vista.
                            } else {
                                console.log("DEBUG [Delete]: Borrado de Supabase OK.");
                            }
                        }

                        // 2. Borrar de LocalStorage
                        delete misMotores[nombre];
                        localStorage.setItem('listaMotoresMendocino', JSON.stringify(misMotores));
                        
                        mostrarToast(`"${nombre}" eliminado.`, 'ok');
                        
                        // 3. Refrescar la lista en el modal
                        await cargarConfiguracionLocal();
                    } catch (e) {
                        console.error("Error en proceso de borrado:", e);
                        mostrarToast("Error al eliminar el diseño.", "error");
                    }
                }
            };

            cajaBotones.appendChild(btnCargar);
            cajaBotones.appendChild(btnBorrar);

            renglon.appendChild(titulo);
            renglon.appendChild(cajaBotones);
            listaDiv.appendChild(renglon);
        });
    }

    modal.style.display = 'flex';
}

    function cerrarModalConfigs() {
    const modal = document.getElementById('modal-configs');
    if (modal) {
        modal.style.display = 'none';
    }
}


        // --- PROYECTOS ---

        async function renderizarProyectos() {
            const contenedor = obtenerElemento('contenedor-proyectos');
            if (!contenedor) return;

            console.log("DEBUG [Gallery]: Iniciando renderizado de la galería...");
            contenedor.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:50px; color:#64748b;">⏳ Cargando galería de proyectos...</div>';

            try {
                // 1. Obtener proyectos públicos de Supabase con TIMEOUT de seguridad
                const fetchPromise = dbMendocinoClient
                    .from('motores')
                    .select('*')
                    .eq('es_publico', true)
                    .order('creado_en', { ascending: false });

                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Tiempo de espera agotado al conectar con el servidor.")), 10000)
                );

                const { data: proyectos, error } = await Promise.race([fetchPromise, timeoutPromise]);

                if (error) throw error;
                if (!proyectos || proyectos.length === 0) {
                    contenedor.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:50px; color:#64748b;">No hay proyectos públicos disponibles en este momento.</div>';
                    return;
                }

                contenedor.innerHTML = proyectos.map((proyecto) => {
                    const autor = proyecto.autor_nombre ? `<span class="proyecto-autor">👤 Por: ${proyecto.autor_nombre}</span>` : '';

                    return `
                        <div class="proyecto-card">
                            <div class="proyecto-card__media">
                                <video controls preload="metadata" loading="lazy">
                                    <source src="${proyecto.video_url || ''}" type="video/mp4">
                                    Tu navegador no soporta el video.
                                </video>
                            </div>
                            <div class="proyecto-card__body">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                                    <h3 class="proyecto-card__title" style="margin:0;">${proyecto.titulo}</h3>
                                    ${autor}
                                </div>
                                <p class="proyecto-card__subtitle">${proyecto.subtitulo || ''}</p>

                                <div class="proyecto-badges">
                                    ${(proyecto.etiquetas || []).map(tag => `<span class="proyecto-badge">${tag}</span>`).join('')}
                                </div>

                                <div class="proyecto-bloque">
                                    <h4>⚙️ Características generales</h4>
                                    <div class="proyecto-ficha">
                                        <div class="proyecto-ficha__fila"><span>Panel</span><strong>${proyecto.ficha?.panel || proyecto.config?.panelNombre || '--'}</strong></div>
                                        <div class="proyecto-ficha__fila"><span>Hilo</span><strong>${proyecto.ficha?.hilo || (proyecto.config?.hilo ? (proyecto.config.hilo + ' mm') : '--')}</strong></div>
                                        <div class="proyecto-ficha__fila"><span>Espiras</span><strong>${proyecto.ficha?.espiras || proyecto.config?.resumen?.espiras || '--'}</strong></div>
                                        <div class="proyecto-ficha__fila"><span>Velocidad</span><strong>${proyecto.ficha?.velocidad || proyecto.config?.resumen?.velocidadMax || '--'}</strong></div>
                                        <div class="proyecto-ficha__fila"><span>Peso</span><strong>${proyecto.ficha?.peso || (proyecto.config?.resumen?.pesoReal && proyecto.config.resumen.pesoReal !== '0' ? (proyecto.config.resumen.pesoReal + ' g') : (proyecto.config?.resumen?.pesoCobre || proyecto.config?.resumen?.pesoTotal || '--'))}</strong></div>
                                    </div>
                                </div>

                                ${proyecto.notas ? `
                                <div class="proyecto-bloque">
                                    <h4>🧠 Notas técnicas anexas</h4>
                                    <ul>
                                        ${proyecto.notas.map(nota => `<li>${nota}</li>`).join('')}
                                    </ul>
                                </div>` : ''}

                                <div class="proyecto-bloque">
                                    <h4>🔬 Comentario técnico general</h4>
                                    <p>${proyecto.explicacion || ''}</p>
                                </div>

                                <div class="proyecto-bloque proyecto-acciones">
                                    <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
                                        <button class="btn-config" style="width: 100%; font-family: inherit !important; font-size:14px; height:42px; font-weight:700 !important; padding:0; display:inline-flex; align-items:center; justify-content:center; gap:8px; border:none; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;" onclick='cargarMotor(${JSON.stringify(proyecto.config)})'>⚙️ Cargar en calculadora</button>
                                        <a href="${proyecto.video_url}" download class="btn-download" style="text-decoration:none; font-family: inherit !important; display:inline-flex; align-items:center; justify-content:center; gap:8px; width:100%; height:42px; font-size:14px; font-weight:700 !important; padding:0; background-color:#10b981; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
                                            ⬇️ Descargar vídeo
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

                // Renderizar fórmulas en la galería
                if (typeof renderizarMatematicas === 'function') renderizarMatematicas();

            } catch (e) {
                console.error("Error cargando galería:", e);
                contenedor.innerHTML = `
                    <div style="grid-column: 1/-1; text-align:center; padding:50px; color:#ef4444;">
                        <p>Error al conectar con la galería: ${e.message}</p>
                        <button class="btn-config" style="max-width:250px; margin:20px auto; display:block;" onclick="renderizarProyectos()">
                            🔄 Reintentar conexión con la galería
                        </button>
                    </div>`;
            }
        }

        // --- INICIALIZACIÓN BASE ---
        function inicializarAplicacionBase() {
            inicializarNavegacionProfesional();
            // Ya no llamamos aquí a renderizarProyectos, se hará tras inicializar Auth
        }


        function finalizarConfiguracion() {
            guardarConfiguracionLocal();
        }

    
        // === PROYECTOS: mostrar uno por uno ===
        const projects = document.querySelectorAll(".project");
        let current = 0;

        function showProject(index) {
            projects.forEach((p, i) => {
                p.style.display = i === index ? "block" : "none";

                const video = p.querySelector("video");
                if (video && i !== index) {
                    video.pause();
                    video.currentTime = 0;
                }
            });
        }

        if (projects.length > 0) {
            showProject(current);

            const nextBtn = document.getElementById("nextProject");
            const prevBtn = document.getElementById("prevProject");

            if (nextBtn) {
                nextBtn.addEventListener("click", () => {
                    current = (current + 1) % projects.length;
                    showProject(current);
                });
            }

            if (prevBtn) {
                prevBtn.addEventListener("click", () => {
                    current = (current - 1 + projects.length) % projects.length;
                    showProject(current);
                });
            }
        }





function evaluarDisenoMotor({ caras, ranuraAncho, ranuraAlto, espiras, resistencia, vpanel, ipanel, corriente }) {
    const alertas = [];
    const recomendaciones = [];
    let veredicto = "Diseño equilibrado";
    let icono = "✔️";

    // 1) Comprobación de arranque aproximada
    if (vpanel < 0.5 && espiras > 80) {
        alertas.push("La tensión del panel es baja para un devanado con muchas espiras.");
        recomendaciones.push("Reducir el número de espiras o usar un panel con mayor tensión.");
        veredicto = "Diseño con arranque comprometido";
        icono = "⚠️";
    }

    if (caras >= 12 && vpanel < 1.0) {
        alertas.push("El número de caras aumenta la complejidad e inercia del rotor.");
        recomendaciones.push("Reducir el número de caras o aligerar el rotor.");
        veredicto = "El motor probablemente arrancará con dificultad";
        icono = "⚠️";
    }

    // 2) Resistencia
    if (resistencia > 25) {
        alertas.push("La resistencia del devanado es alta y limitará la corriente.");
        recomendaciones.push("Reducir resistencia: usar hilo más grueso o menos longitud total de devanado.");
        veredicto = "Diseño penalizado por resistencia elevada";
        icono = "⚠️";
    }

    // 3) Corriente muy baja
    if (corriente > 0 && corriente < 0.02) {
        alertas.push("La corriente estimada es muy baja para generar un par útil.");
        recomendaciones.push("Aumentar la corriente disponible o reducir la resistencia del devanado.");
        veredicto = "El motor probablemente no arrancará por falta de corriente";
        icono = "⚠️";
    }

    // 4) Geometría y velocidad
    if (caras <= 4 && espiras < 90 && resistencia < 15) {
        veredicto = "Diseño optimizado para alta velocidad";
        icono = "✔️";
    }

    if (caras >= 8 && espiras >= 100) {
        alertas.push("El diseño prioriza estabilidad e inercia frente a velocidad.");
        recomendaciones.push("Reducir masa o espiras si se busca más velocidad.");
        if (icono !== "⚠️") {
            veredicto = "Diseño orientado a estabilidad más que a velocidad";
            icono = "✔️";
        }
    }

    // 5) Ranura pequeña
    if (ranuraAlto < 2.5 || ranuraAncho < 4) {
        alertas.push("La ranura es pequeña y puede dificultar el alojamiento real del bobinado.");
        recomendaciones.push("Aumentar el tamaño de la ranura o usar hilo más fino.");
    }

    // 6) Demasiadas espiras
    if (espiras > 180) {
        alertas.push("Un número muy alto de espiras aumenta el peso y la resistencia.");
        recomendaciones.push("Valorar una reducción moderada de espiras para mejorar la respuesta del rotor.");
    }

    // 7) Sin alertas
    if (alertas.length === 0) {
        recomendaciones.push("Validar experimentalmente el arranque, la estabilidad y la velocidad de equilibrio.");
    }

    return { veredicto, icono, alertas, recomendaciones };
}





function generarInformeAutomatico() {
    const caras = parseFloat(document.getElementById("caras")?.value || 4);
    const ranuraAncho = parseFloat(document.getElementById("ranura-ancho")?.value || 6.5);
    const ranuraAlto = parseFloat(document.getElementById("ranura-alto")?.value || 3.5);
    const ranuraTipo = document.getElementById("ranura-tipo")?.value || "trapecio";
    const margen = parseFloat(document.getElementById("margen-placa")?.value || 3);

    const espiras = parseFloat(document.getElementById("espiras")?.value || 0);
    const resistencia = parseFloat(document.getElementById("res-devanado")?.value || 0);
    const fmm = EstadoDiseno.fmm_Av || 0;
    const fuerzaLorentz = EstadoDiseno.fuerzaLorentz_N || 0;
    const parMagnetico = EstadoDiseno.par_Nm || 0;
    const campoB = EstadoDiseno.campoB_T || 0;

    const textoVpanel = document.getElementById("res-panel-v")?.textContent || "0";
    const textoIpanel = document.getElementById("res-panel-i")?.textContent || "0";

    const vpanel = parseFloat(textoVpanel.replace(",", ".")) || 0;
    const ipanel = parseFloat(textoIpanel.replace(",", ".")) || 0;
    const corriente = resistencia > 0 ? vpanel / resistencia : 0;
    const corriente_mA = corriente * 1000;

    let tipoRotor = "equilibrado";
    if (caras <= 4 && ranuraAncho < 7) tipoRotor = "ligero";
    if (caras >= 8) tipoRotor = "pesado";

    let textoEspiras = "";
    if (espiras > 150) {
        textoEspiras = "alto número de espiras, favoreciendo el par pero aumentando resistencia y peso";
    } else if (espiras > 80) {
        textoEspiras = "configuración equilibrada entre par y resistencia";
    } else {
        textoEspiras = "bajo número de espiras, favoreciendo velocidad pero con menor par";
    }

    let arranque = "";
    if (tipoRotor === "ligero") {
        arranque = "Se espera un arranque fácil debido a la baja inercia.";
    } else if (tipoRotor === "pesado") {
        arranque = "El arranque puede ser más difícil debido a la alta inercia.";
    } else {
        arranque = "El arranque dependerá del equilibrio entre par e inercia.";
    }

    let velocidad = "";
    if (tipoRotor === "ligero") {
        velocidad = "Se prevé una velocidad alta.";
    } else if (tipoRotor === "pesado") {
        velocidad = "Se prevé una velocidad moderada pero estable.";
    } else {
        velocidad = "Se prevé una velocidad intermedia.";
    }

    const diagnostico = evaluarDisenoMotor({
        caras,
        ranuraAncho,
        ranuraAlto,
        espiras,
        resistencia,
        vpanel,
        ipanel,
        corriente
    });

    const bloqueAlertas = diagnostico.alertas.length
        ? diagnostico.alertas.map((a, i) => `${i + 1}. ${a}`).join("\n")
        : "No se detectan alertas importantes con este análisis simplificado.";

    const bloqueRecomendaciones = diagnostico.recomendaciones.length
        ? diagnostico.recomendaciones.map((r, i) => `${i + 1}. ${r}`).join("\n")
        : "No se requieren recomendaciones específicas.";

        const informe = `
        ══════════════════════════════════════════════
              INFORME TÉCNICO · MOTOR MENDOCINO
        ══════════════════════════════════════════════

        [ 0. VEREDICTO GENERAL ]
        ${diagnostico.icono} ${diagnostico.veredicto}

        ──────────────────────────────────────────────
        [ 1. GEOMETRÍA ]
        Rotor de ${caras} caras
        Ranura: ${ranuraTipo}
        Dimensiones: ${ranuraAncho} mm x ${ranuraAlto} mm
        Margen estructural: ${margen} mm

        ──────────────────────────────────────────────
        [ 2. PANEL SOLAR ]
        Tensión: ${vpanel.toFixed(2)} V
        Corriente: ${ipanel.toFixed(1)} mA

        ──────────────────────────────────────────────
        [ 3. BOBINADO ]
        Espiras: ${espiras}
        Configuración: ${textoEspiras}
        Resistencia: ${resistencia.toFixed(2)} Ω
        Corriente estimada: ${corriente_mA.toFixed(1)} mA

        ──────────────────────────────────────────────
        [ 4. EFECTOS MAGNÉTICOS ]
        Fuerza magnetomotriz: ${fmm.toFixed(2)} Av
        Campo B asumido: ${campoB.toFixed(3)} T
        Fuerza de Lorenz estimada: ${fuerzaLorentz.toFixed(4)} N
        Par ejercido estimado: ${parMagnetico.toFixed(6)} N·m

        ──────────────────────────────────────────────
        [ 5. COMPORTAMIENTO Y VELOCIDAD ]
        Tipo de rotor: ${tipoRotor}
        Velocidad máx. teórica: ${document.getElementById('res-fcem-rpm-teo')?.textContent || '0 RPM'}
        Velocidad máx. real (est.): ${document.getElementById('res-fcem-rpm-real')?.textContent || '0 RPM'}

        Arranque:
        ${arranque}

        Interpretación de velocidad:
        ${velocidad}

        ──────────────────────────────────────────────
        [ 6. ALERTAS ]
        ${bloqueAlertas}

        ──────────────────────────────────────────────
        [ 7. RECOMENDACIONES ]
        ${bloqueRecomendaciones}

        ──────────────────────────────────────────────
        [ 8. INTERPRETACIÓN FÍSICA ]
        La energía luminosa se convierte en energía eléctrica mediante el panel solar.
        La corriente circula por las bobinas generando interacción con el campo magnético.
        Esto produce el par que hace girar el rotor.
        La FCEM (Fuerza Contraelectromotriz) se genera cuando las bobinas cortan el flujo magnético en movimiento; este voltaje se opone al del panel y es lo que finalmente estabiliza y limita la velocidad máxima del motor.

        ──────────────────────────────────────────────
        [ 9. CONCLUSIÓN ]
        El diseño presenta un comportamiento ${tipoRotor},
        condicionado por la relación entre espiras, resistencia e inercia.
        `.trim();

    const area = document.getElementById("informe-automatico");
    if (area) area.value = informe;

    const tipo = document.getElementById("res-tipo-rotor");
    const comp = document.getElementById("res-comportamiento");
    const nivel = document.getElementById("res-nivel");

    if (tipo) tipo.textContent = tipoRotor;
    if (comp) comp.textContent = diagnostico.veredicto;

    let nivelTecnico = "";
    if (diagnostico.icono === "⚠️") {
        nivelTecnico = "Necesita revisión";
    } else if (espiras > 150 && resistencia < 15) {
        nivelTecnico = "Diseño ambicioso";
    } else {
        nivelTecnico = "Diseño equilibrado";
    }

    if (nivel) nivel.textContent = nivelTecnico;
}








function copiarInformeAutomatico() {
    const area = document.getElementById("informe-automatico");
    if (!area || !area.value.trim()) {
        alert("No hay informe para copiar.");
        return;
    }

    navigator.clipboard.writeText(area.value)
        .then(() => alert("Informe copiado."))
        .catch(() => alert("No se pudo copiar el informe."));
}


function descargarInformeAutomatico() {
    const area = document.getElementById("informe-automatico");
    if (!area || !area.value.trim()) {
        alert("No hay informe para descargar.");
        return;
    }

    const blob = new Blob([area.value], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "informe_motor_mendocino.txt";
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);

    URL.revokeObjectURL(url);
}



function calcularPasoFCEM() {
    // 1. Obtener datos de pasos anteriores
    const selPanel = document.getElementById('panel');
    const idPanel = selPanel?.value || localStorage.getItem('mendocino_panel_last');
    const panel = dbPaneles[idPanel];
    
    // Voltaje nominal del panel (Vmp)
    const vmp = panel ? (panel.v || panel.vmp || 0.5) : 0.5; 
    
    // Si no hay panel cargado, intentamos usar el del estado persistido
    if (!panel && EstadoDiseno.resistenciaPanelObjetivo > 0) {
        console.warn("Panel no detectado por ID, usando fallback de resistencia objetivo.");
    }
    
    const vueltas = EstadoDiseno.espirasPorDevanado || 100;
    
    // Campo B del imán base calculado en el Paso 3 (objeto global)
    const campoB = EstadoDiseno.campoB_T || 0.18;
    
    // Geometría para el área efectiva (L * D)
    const L_m = (EstadoDiseno.longitudPanel || 50) / 1000;
    const R_m = ((EstadoDiseno.diametroRotor || 50) / 2) / 1000;
    
    // 2. Parámetros de simulación
    const rpmSim = parseFloat(document.getElementById('fcem-rpm-sim')?.value || 0);
    const perdidasPerc = parseFloat(document.getElementById('fcem-perdidas')?.value || 15);
    const factorPerdidas = (100 - perdidasPerc) / 100;
    
    // V_fcem = 2 * N * B * L * r * omega
    const omegaSim = (rpmSim * 2 * Math.PI) / 60;
    const vfcemSim = 2 * vueltas * campoB * L_m * R_m * omegaSim;
    
    // RPM Máximas (cuando Vfcem = Vmp * factorPerdidas)
    const factorK = 2 * vueltas * campoB * L_m * R_m;
    const rpmMaxTeo = (vmp > 0 && factorK > 0) ? (vmp * 60) / (2 * Math.PI * factorK) : 0;
    const rpmMaxReal = rpmMaxTeo * factorPerdidas;

    // Persistir para el informe
    EstadoDiseno.rpmMaxTotal = rpmMaxReal;
    EstadoDiseno.vfcemMax = vfcemSim;
    
    // 3. Actualizar UI
    const elV = document.getElementById('res-fcem-v');
    const elTeo = document.getElementById('res-fcem-rpm-teo');
    const elReal = document.getElementById('res-fcem-rpm-real');

    if (elV) elV.textContent = vfcemSim.toFixed(3) + ' V';
    if (elTeo) elTeo.textContent = Math.round(rpmMaxTeo) + ' RPM';
    if (elReal) elReal.textContent = Math.round(rpmMaxReal) + ' RPM';
    
    // Resistencia (ya calculada en paso 2)
    const resTotal = (EstadoDiseno.resistenciaTotal || 0);
    const elRes = document.getElementById('fcem-resistencia');
    if (elRes) elRes.value = resTotal.toFixed(2) + ' Ω';
    
    // 4. Dibujar Gráfica
    dibujarGraficaFCEM(vmp, factorK, rpmMaxReal, rpmSim, vfcemSim);

    // 5. Ajustar el slider de simulación y el input manual para que se acomoden al motor real.
    const sliderRpm = document.getElementById('fcem-rpm-sim');
    const numRpm = document.getElementById('fcem-rpm-num');
    if (sliderRpm && numRpm) {
        // Autoajuste: doble de la velocidad real (si es 17RPM -> max 100), pero si de forma manual teclea más, se respeta.
        const ajusteMotor = Math.max(100, Math.round(rpmMaxReal * 2));
        const simActual = Number(sliderRpm.value);
        const nuevoMax = Math.max(ajusteMotor, simActual);
        
        if (parseFloat(sliderRpm.max) !== nuevoMax) {
            sliderRpm.max = nuevoMax;
        }
        
        // Hacemos que siempre se inicialice con el valor correcto en el cuadro de texto.
        if (numRpm.value === "" || (numRpm.value === "0" && sliderRpm.value !== "0")) {
            numRpm.value = sliderRpm.value;
        }
    }
}

function dibujarGraficaFCEM(vmp, factorK, rpmMaxReal, rpmSim, vfcemSim) {
    const svg = document.getElementById('fcem-svg');
    if (!svg) return;
    
    const w = 300, h = 200;
    const margin = 35;
    
    // Escala dinámica del Eje X: 
    // Usamos el máximo entre un suelo mínimo (100 RPM), 1.5 veces el máximo real (para ver el punto de equilibrio) y la simulación actual
    const rpmMaxEje = Math.max(100, Math.round((rpmMaxReal || 0) * 1.5 / 10) * 10, rpmSim);
    
    // Escala del Eje Y autoajustable a la placa:
    // El eje Y subirá hasta 1.8 veces el voltaje de la placa (vmp) para que la línea roja sea muy visible.
    // Si la simulación dispara la FCEM muy por encima del voltaje del panel, el eje Y crecerá para mostrar el punto azul.
    const vMaxEje = Math.max(vmp * 1.8, vfcemSim * 1.15, 0.5);
    
    const toX = (val) => margin + (val / rpmMaxEje) * (w - margin * 1.5);
    const toY = (val) => (h - margin) - (val / vMaxEje) * (h - margin * 1.5);
    
    let contenido = `
        <!-- Ejes -->
        <line x1="${margin}" y1="${h-margin}" x2="${w-10}" y2="${h-margin}" stroke="#333" stroke-width="1.5"/>
        <line x1="${margin}" y1="${h-margin}" x2="${margin}" y2="10" stroke="#333" stroke-width="1.5"/>
        <text x="${w-10}" y="${h-15}" font-size="9" text-anchor="end" font-weight="bold">Velocidad (RPM)</text>
        <text x="${margin-10}" y="20" font-size="9" text-anchor="middle" font-weight="bold" transform="rotate(-90 ${margin-10},20)">Voltaje (V)</text>
        
        <!-- Línea V. Panel (Roja) -->
        <line x1="${margin}" y1="${toY(vmp)}" x2="${w-margin}" y2="${toY(vmp)}" stroke="#e74c3c" stroke-width="2" stroke-dasharray="4,2"/>
        <text x="${w-margin-5}" y="${toY(vmp)-4}" font-size="8" fill="#e74c3c" text-anchor="end">V. Panel (${vmp.toFixed(1)}V)</text>
        
        <!-- Curva FCEM (Azul) -->
        <path d="M ${toX(0)} ${toY(0)} L ${toX(rpmMaxEje)} ${toY(factorK * (rpmMaxEje * 2 * Math.PI / 60))}" stroke="#3498db" stroke-width="2.5" fill="none"/>
        <text x="${toX(rpmMaxEje*0.8)}" y="${toY(factorK * (rpmMaxEje*0.8 * 2 * Math.PI / 60))-6}" font-size="8" fill="#3498db" transform="rotate(${-30} ${toX(rpmMaxEje*0.8)}, ${toY(factorK * (rpmMaxEje*0.8 * 2 * Math.PI / 60))})">Pendiente FCEM</text>
        
        <!-- Límite RPM (Verde) -->
        <line x1="${toX(rpmMaxReal)}" y1="${h-margin}" x2="${toX(rpmMaxReal)}" y2="${toY(vmp)}" stroke="#2ecc71" stroke-width="2" stroke-dasharray="2,2"/>
        <circle cx="${toX(rpmMaxReal)}" cy="${toY(vmp)}" r="4" fill="#2ecc71"/>
        <text x="${toX(rpmMaxReal)}" y="${h-5}" font-size="9" fill="#27ae60" text-anchor="middle" font-weight="bold">${Math.round(rpmMaxReal)} RPM</text>
        
        <!-- Punto de simulación actual -->
        <circle cx="${toX(rpmSim)}" cy="${toY(vfcemSim)}" r="5" fill="#34495e" stroke="white" stroke-width="2"/>
    `;
    
    svg.innerHTML = contenido;
}

function poblarInfoImanMotor() {
    const sel = document.getElementById('iman-motor');
    const info = document.getElementById('info-iman-motor');
    if (!sel || !info) return;

    const im = dbImanes?.[Number(sel.value)];
    if (!im) {
        info.style.display = 'none';
        return;
    }

    const dims = [Number(im.l), Number(im.a), Number(im.h)];
    const T = Math.min(...dims); // espesor = eje N-S
    const baseDims = dims.filter((_, i) => i !== dims.indexOf(T));
    const L_base = Math.max(...baseDims);
    const W_base = Math.min(...baseDims);

    info.style.display = 'block';
    info.innerHTML = `
        <strong>Detalles:</strong> ${im.forma} de ${L_base}x${W_base}x${T} mm. <br>
        <strong>Br:</strong> ${im.br} T | <strong>Caras polares:</strong> ${L_base}x${W_base} mm.
    `;
}

function calcularCampoBPrisma(Br, L, W, T, z) {
    if (z < 0.1) z = 0.1; // Evitar singularidades
    const term1 = Math.atan((L * W) / (2 * z * Math.sqrt(L*L + W*W + 4*z*z)));
    const term2 = Math.atan((L * W) / (2 * (z + T) * Math.sqrt(L*L + W*W + 4*(z + T)*(z + T))));
    return (Br / Math.PI) * (term1 - term2);
}

function cambiarPaso(numPaso) {
    const config = obtenerConfigNivel();

    if (!config.pasosPermitidos.includes(numPaso)) {
        mostrarToast('Ese contenido está bloqueado para tu nivel actual.', 'aviso');
        return;
    }

    document.querySelectorAll('.step-container').forEach(step => step.classList.remove('active'));
    document.querySelectorAll('.step-indicator').forEach(ind => ind.classList.remove('active'));

    const paso = document.getElementById(`step-${numPaso}`);
    const indicador = document.getElementById(`ind-${numPaso}`);

    if (paso) paso.classList.add('active');
    if (indicador) indicador.classList.add('active');

    if (numPaso === 3) {
        precargarPasoMagnetico();
        calcularPasoMagnetico();
    }
    if (numPaso === 4) {
        calcularPasoLuminico();
    }
    if (numPaso === 5) {
        calcularPasoFCEM();
    }
    if (numPaso === 5) {
        generarInformeAutomatico();
    }

    // Guardar el número de paso en el progreso
    guardarProgresoCalculadora();

    // Renderizar fórmulas matemáticas si existen en el nuevo paso (KaTeX)
    if (typeof renderizarMatematicas === 'function') {
        setTimeout(renderizarMatematicas, 100);
    }
}



function descargarInformePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const informeOriginal = document.getElementById("informe-automatico")?.value || "";
    const informe = limpiarTextoParaPDF(informeOriginal);

    const tipo = limpiarTextoParaPDF(document.getElementById("res-tipo-rotor")?.textContent || "");
    const comp = limpiarTextoParaPDF(document.getElementById("res-comportamiento")?.textContent || "");
    const nivel = limpiarTextoParaPDF(document.getElementById("res-nivel")?.textContent || "");

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    let y = 20;

    // Título
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("INFORME TECNICO", pageWidth / 2, y, { align: "center" });
    y += 8;

    doc.setFontSize(13);
    doc.text("Motor Mendocino", pageWidth / 2, y, { align: "center" });
    y += 12;

    // Caja resumen
    doc.setDrawColor(180);
    doc.rect(margin, y, pageWidth - margin * 2, 24);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    y += 7;
    doc.text(`Tipo de rotor: ${tipo}`, margin + 4, y);
    y += 6;
    doc.text(`Comportamiento: ${comp}`, margin + 4, y);
    y += 6;
    doc.text(`Nivel tecnico: ${nivel}`, margin + 4, y);

    y += 10;

    // Línea
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Texto del informe con salto de página
    doc.setFontSize(10.5);
    const lineas = doc.splitTextToSize(informe, pageWidth - margin * 2);

    lineas.forEach((linea) => {
        if (y > pageHeight - 15) {
            doc.addPage();
            y = 20;
        }
        doc.text(linea, margin, y);
        y += 5.5;
    });

    doc.save("informe_motor_mendocino.pdf");
}



function limpiarTextoParaPDF(texto) {
    return (texto || "")
        .replace(/✔️/g, "OK")
        .replace(/⚠️/g, "AVISO")
        .replace(/Ω/g, "ohm")
        .replace(/═/g, "=")
        .replace(/─/g, "-")
        .replace(/[•]/g, "-");
}

function cambiarNivelUsuario(nuevoNivel) {
    if (!CONFIG_NIVELES[nuevoNivel]) return;

    usuarioActual.nivel = nuevoNivel;
    localStorage.setItem('nivelUsuarioMotor', nuevoNivel);

    aplicarNivelUsuario();
    mostrarToast(`Nivel cambiado a: ${nuevoNivel}`, 'ok');
}

function aplicarNivelUsuario() {
    const config = obtenerConfigNivel();

    const selectorNivel = document.getElementById('selector-nivel');
    if (selectorNivel) {
        selectorNivel.value = usuarioActual.nivel;
    }

    const pasos = [1, 2, 3, 4, 5, 6];

    pasos.forEach((numPaso) => {
        const indicador = document.getElementById(`ind-${numPaso}`);
        if (!indicador) return;

        const permitido = config.pasosPermitidos.includes(numPaso);

        indicador.style.opacity = permitido ? '1' : '0.35';
        indicador.style.pointerEvents = permitido ? 'auto' : 'none';
        indicador.title = permitido ? '' : 'Bloqueado para tu configuración actual';
        
        // Opcionalmente podemos ocultar o mostrar
        indicador.style.display = permitido ? 'flex' : (usuarioActual.nivel === 'experto' ? 'flex' : 'none');
    });

    aplicarVisibilidadPorNivel();
    actualizarMensajeNivel();

    const pasoActual = obtenerPasoActual();
    if (!config.pasosPermitidos.includes(pasoActual)) {
        // No redirigimos automáticamente para no molestar, 
        // pero podrías hacerlo al primer paso permitido:
        // cambiarPaso(config.pasosPermitidos[0]);
    }
}

function obtenerPasoActual() {
    const activo = document.querySelector('.step-container.active');
    if (!activo) return 1;
    const match = activo.id.match(/step-(\d+)/);
    return match ? Number(match[1]) : 1;
}


function aplicarVisibilidadPorNivel() {
    const config = obtenerConfigNivel();
    const nivel = usuarioActual.nivel;

    document.querySelectorAll('.solo-experto-paso3').forEach(el => {
        el.style.display = config.puedeVerPasoFCEM ? '' : 'none';
    });

    document.querySelectorAll('.solo-avanzado').forEach(el => {
        el.style.display = (config.puedeVerPasoMagnetico) ? '' : 'none';
    });

    document.querySelectorAll('.solo-experto').forEach(el => {
        el.style.display = config.puedeVerPasoFCEM ? '' : 'none';
    });

    document.querySelectorAll('.oculto-basico').forEach(el => {
        el.style.display = (config.pasosPermitidos.length > 2 || nivel !== 'basico') ? '' : 'none';
    });
}

function abrirPanelAdmin() {
    const esRealAdmin = esAdmin || (sessionActiva && EMAILS_ADMIN_FALLBACK.includes(sessionActiva.user.email));
    if (!esRealAdmin) {
        mostrarToast('Debes acceder como administrador.', 'aviso');
        return;
    }

    // Redirigimos directamente a la página completa de administración
    window.location.href = 'admin-v35.html';
}

function salirModoAdmin() {
    esAdmin = false;
    sessionStorage.removeItem('adminMotorMendocino');
    actualizarPanelAdminUI();
    aplicarNivelUsuario();
    mostrarToast('Modo administrador cerrado.', 'info');
}

function adminEstaActivo() {
    return sessionStorage.getItem('adminMotorMendocino') === '1';
}

function adminNormalizarNombre(nombre) {
    return (nombre || '').trim();
}

function adminCrearUsuario(nombre, nivel = NIVELES_USUARIO.BASICO) {
    const nombreLimpio = adminNormalizarNombre(nombre);
    if (!nombreLimpio) {
        return { ok: false, mensaje: 'Introduce un nombre de usuario.' };
    }
    if (!CONFIG_NIVELES[nivel]) {
        return { ok: false, mensaje: 'Nivel no válido.' };
    }

    const usuarios = obtenerUsuariosGuardados();
    usuarios[nombreLimpio] = { ...(usuarios[nombreLimpio] || {}), nivel };
    guardarUsuariosGuardados(usuarios);
    return { ok: true, mensaje: `Usuario ${nombreLimpio} guardado.` };
}

function adminEliminarUsuario(nombre) {
    const nombreLimpio = adminNormalizarNombre(nombre);
    if (!nombreLimpio) {
        return { ok: false, mensaje: 'Usuario no válido.' };
    }

    const usuarios = obtenerUsuariosGuardados();
    if (!usuarios[nombreLimpio]) {
        return { ok: false, mensaje: 'Ese usuario no existe.' };
    }

    delete usuarios[nombreLimpio];
    guardarUsuariosGuardados(usuarios);

    if (usuarioActual.nombre === nombreLimpio) {
        usuarioActual.nombre = 'Alumno';
        usuarioActual.nivel = NIVELES_USUARIO.BASICO;
        localStorage.removeItem('ultimoUsuarioMotorMendocino');
        const inputUsuario = document.getElementById('input-usuario');
        if (inputUsuario) inputUsuario.value = '';
        aplicarNivelUsuario();
    }

    return { ok: true, mensaje: `Usuario ${nombreLimpio} eliminado.` };
}


function ocultarUIHastaAutenticacion() {
    console.log("UI: Ocultando hasta autenticación...");
    const modal = document.getElementById('modal-auth');
    if (modal) modal.style.display = 'flex';
    
    const appPrincipal = document.getElementById('app-principal');
    if (appPrincipal) {
        appPrincipal.style.display = 'none';
        appPrincipal.style.opacity = '0';
        appPrincipal.style.pointerEvents = 'none';
    }
}

function mostrarUIAutenticada() {
    console.log("UI: Mostrando interfaz autenticada...");
    const modal = document.getElementById('modal-auth');
    if (modal) modal.style.display = 'none';
    
    const appPrincipal = document.getElementById('app-principal');
    if (appPrincipal) {
        appPrincipal.style.display = 'block';
        appPrincipal.style.opacity = '1';
        appPrincipal.style.pointerEvents = 'auto';
    }
}

async function inicializarAuth() {
    console.log("Iniciando inicializarAuth...");
    return new Promise((resolve) => {
        let arranqueInicialCompletado = false;

        const client = window.dbMendocinoClient || (typeof dbMendocinoClient !== 'undefined' ? dbMendocinoClient : null);
        if (!client) {
            console.error("CRÍTICO: Cliente Supabase no encontrado.");
            resolve(); return;
        }

        const finalizarArranqueConDatos = async (session) => {
            try {
                sessionActiva = session;
                authInicializada = true;

                // --- 1. RESOLVER DE INMEDIATO ---
                // Marcamos como completado y resolvemos para que window.onload siga adelante
                if (!arranqueInicialCompletado) {
                    arranqueInicialCompletado = true;
                    resolve();
                    console.log("DEBUG [Auth]: Promesa resuelta (UI desbloqueada)");
                }

                if (session) {
                    console.log("DEBUG [Auth]: Usuario detectado. Inicializando interfaz...");
                    actualizarPanelAdminUI(); 
                    renderizarUI(); 
                    mostrarUIAutenticada();

                    // --- 2. CARGA EN SEGUNDO PLANO (Sin bloquear el arranque) ---
                    // Lanzamos las tareas asíncronas pero no las esperamos aquí
                    (async () => {
                        try {
                            await cargarPerfilUsuario(session.user);
                            actualizarPanelAdminUI();
                            
                            await cargarDatosGlobales();
                            renderizarUI(); 
                            actualizarPanelAdminUI();
                            aplicarNivelUsuario();

                            // Sincronización proactiva de diseños del usuario
                            await obtenerMotoresGuardados();
                            console.log("DEBUG [Auth]: Diseños sincronizados proactivamente tras login.");
                        } catch (e) {
                            console.error("Error en carga de fondo:", e);
                        }
                    })();
                } else {
                    console.log("DEBUG [Auth]: Sin sesión. Mostrando login.");
                    if (!window.location.pathname.includes('admin-v35.html')) {
                        ocultarUIHastaAutenticacion();
                    }
                }
            } catch (error) {
                console.error("Error crítico en flujo de arranque:", error);
                if (!arranqueInicialCompletado) {
                    arranqueInicialCompletado = true;
                    resolve();
                }
            }
        };

        // Escuchar SIEMPRE los cambios (permite login, logout y cambio de cuenta)
        client.auth.onAuthStateChange(async (event, session) => {
            console.log("DEBUG [Auth]: Evento detectado:", event);
            await finalizarArranqueConDatos(session);
        });

        // Solo usamos el timeout para el "primer arranque" si el servidor no responde nada
        setTimeout(async () => {
            if (!arranqueInicialCompletado) {
                console.warn("DEBUG [Auth]: Timeout de seguridad: Forzando arranque inicial.");
                try {
                    const { data: { session } } = await client.auth.getSession();
                    if (!arranqueInicialCompletado) await finalizarArranqueConDatos(session);
                } catch (e) {
                    if (!arranqueInicialCompletado) {
                        arranqueInicialCompletado = true;
                        resolve();
                    }
                }
            }
        }, 3500);
    });
}

async function cargarPerfilUsuario(user) {
    if (!user) return;
    
    // Verificación preliminar de admin por email (robusta ante fallos de DB)
    const esAdminPorEmail = EMAILS_ADMIN_FALLBACK.includes(user.email);
    if (esAdminPorEmail) {
        console.log("DEBUG [Perfil]: Admin detectado por email fallback.");
        esAdmin = true;
    }

    try {
        const client = window.dbMendocinoClient || dbMendocinoClient;
        // Optimizamos la consulta para evitar posibles errores 500 por columnas calculadas o inexistentes
        const { data: profile, error } = await client
            .from('profiles')
            .select('id, nombre, nivel, rol, permisos_pasos')
            .eq('id', user.id)
            .single();
            
        if (profile && !error) {
            profileActual = profile;
            // Si el perfil tiene rol admin, o ya lo detectamos por email whitelist
            esAdmin = esAdmin || (profile.rol === 'admin');
            usuarioActual.nombre = profile.nombre || user.email;
            usuarioActual.nivel = profile.nivel || NIVELES_USUARIO.BASICO;
            usuarioActual.permisos_pasos = profile.permisos_pasos || null;
        } else {
            // Error controlado o fila no existente: el whitelist por email ya nos protege arriba
            profileActual = null;
            usuarioActual.nombre = user.user_metadata?.nombre || user.email || 'Alumno';
            usuarioActual.nivel = NIVELES_USUARIO.BASICO;
            usuarioActual.permisos_pasos = null;
        }
    } catch (err) {
        console.error("DEBUG [Perfil]: Error crítico cargando perfil:", err);
        profileActual = null;
        usuarioActual.nombre = user.email || 'Usuario';
        usuarioActual.nivel = NIVELES_USUARIO.BASICO;
    } finally {
        actualizarPanelAdminUI(); // Aseguramos que el botón se actualice tras el intento de carga
        actualizarMensajeNivel();
    }
}


async function cerrarSesion() {
    try {
        console.log("Iniciando cierre de sesión robusto...");
        
        // 1. Limpieza local inmediata e infalible
        localStorage.clear();
        sessionStorage.clear();
        
        // Forzamos la desaparición del badge por si el reload tarda
        const el = document.getElementById('mensaje-nivel');
        if (el) el.style.display = 'none';

        // 2. Intentamos avisar al servidor, pero no bloqueamos el flujo si falla
        try {
            await dbMendocinoClient.auth.signOut();
        } catch (authErr) {
            console.warn("Error enviando signOut al servidor (probablemente sesión ya inválida):", authErr);
        }
        
        // 3. Recarga total de la página para resetear el estado
        window.location.href = window.location.pathname + "?v=" + new Date().getTime();
        
    } catch (e) {
        console.error("Error crítico al salir:", e);
        localStorage.clear();
        sessionStorage.clear();
        // Redirigimos solo si es estrictamente necesario, pero idealmente dejamos que el estado se limpie
        window.location.reload();
    }
}

function actualizarMensajeNivel() {
    const el = document.getElementById('mensaje-nivel');
    if (!el) return;
    
    // Si no hay sesión iniciada, limpiamos el badge
    if (!sessionActiva) {
        el.style.display = 'none';
        el.textContent = "";
        return;
    }
    
    // Si hay sesión pero el perfil aún no ha cargado, usamos el email de respaldo
    let nombreAMostrar = "Usuario";
    if (profileActual && profileActual.nombre) {
        nombreAMostrar = profileActual.nombre;
    } else if (sessionActiva.user && sessionActiva.user.email) {
        nombreAMostrar = sessionActiva.user.email;
    }
    
    const adminTxt = esAdmin ? ' · 🛡️ ADMIN' : '';
    
    el.style.display = 'flex';
    el.style.background = 'rgba(255,255,255,0.15)';
    el.textContent = `👤 ${nombreAMostrar}${adminTxt}`;
}

const EMAILS_ADMIN_FALLBACK = ['josecarlosmillandecortes@unizar.es', 'jcmillan@unizar.es', 'cmillan@unizar.es']; 

function actualizarPanelAdminUI() {
    const btnIrAdmin = document.getElementById('btn-ir-admin');
    const userEmail = sessionActiva?.user?.email;

    // El usuario es admin si tiene el rol O si su email está en la lista blanca
    const esRealAdmin = esAdmin || (userEmail && EMAILS_ADMIN_FALLBACK.includes(userEmail));
    
    console.log("DEBUG [AdminUI]: Verificando acceso admin. Email:", userEmail, "esRealAdmin:", esRealAdmin);

    if (btnIrAdmin) {
        btnIrAdmin.style.display = esRealAdmin ? 'inline-flex' : 'none';
        if (esRealAdmin) {
            console.log("DEBUG [AdminUI]: Panel Admin habilitado.");
        }
    }

    actualizarMensajeNivel();
}

function cerrarModalAdmin() {
    const modalAdmin = document.getElementById('modal-admin');
    if (modalAdmin) {
        modalAdmin.style.display = 'none';
    }
}

async function cargarListaAlumnosAdmin() {
    const listBody = document.getElementById('lista-alumnos-body');
    const totalStat = document.getElementById('stat-total-alumnos');
    
    listBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">Cargando clase...</td></tr>';
    
    try {
        const { data: alumnos, error } = await dbMendocinoClient
            .from('profiles')
            .select('*')
            .order('nombre', { ascending: true });
            
        if (error) throw error;
        
        totalStat.textContent = alumnos.length;
        listBody.innerHTML = '';
        
        alumnos.forEach(alumno => {
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid #f1f2f6';
            
            row.innerHTML = `
                <td style="padding: 12px; font-weight: bold; color: #2c3e50;">${alumno.nombre || 'Sin nombre'}</td>
                <td style="padding: 12px; color: #64748b; font-size: 14px;">${alumno.email}</td>
                <td style="padding: 12px;">
                    <select id="nivel-selector-${alumno.id}" style="padding: 8px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; cursor: pointer;">
                        <option value="basico" ${alumno.nivel === 'basico' ? 'selected' : ''}>Básico</option>
                        <option value="avanzado" ${alumno.nivel === 'avanzado' ? 'selected' : ''}>Avanzado</option>
                        <option value="experto" ${alumno.nivel === 'experto' ? 'selected' : ''}>Experto</option>
                    </select>
                </td>
                <td style="padding: 12px;">
                    <button onclick="actualizarNivelAlumno('${alumno.id}', '${alumno.nombre}')" style="background: #10b981; color: white; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600;">
                        Guardar
                    </button>
                </td>
            `;
            listBody.appendChild(row);
        });
        
    } catch (e) {
        listBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color: #ef4444;">Error: ${e.message}</td></tr>`;
    }
}

async function actualizarNivelAlumno(id, nombre) {
    const selector = document.getElementById(`nivel-selector-${id}`);
    const nuevoNivel = selector.value;
    
    try {
        const { error } = await dbMendocinoClient
            .from('profiles')
            .update({ nivel: nuevoNivel })
            .eq('id', id);
            
        if (error) throw error;
        
        mostrarToast(`Nivel de ${nombre} actualizado correctamente.`, 'ok');
        
        // Si el admin se cambia el nivel a sí mismo, aplicar cambios localmente
        if (id === sessionActiva.user.id) {
            usuarioActual.nivel = nuevoNivel;
            aplicarNivelUsuario();
        }
    } catch (e) {
        mostrarToast(`Error al actualizar: ${e.message}`, 'error');
    }
}


// --- PERSISTENCIA DE ESTADO (MEMORY SESSION) ---
function guardarProgresoCalculadora() {
    try {
        const inputs = [
            'caras', 'margen-placa', 'ranura-ancho', 'ranura-alto', 'ranura-tipo', 
            'material-hilo', 'dia-hilo-select', 'calidad-bobinado', 
            'campo-b', 'radio-efectivo-mm',
            'iman-motor', 'iman-orientacion', 'iman-distancia',
            'fcem-rpm-sim', 'fcem-perdidas'
        ];

        const estado = {
            pasoActual: 1,
            valores: {}
        };

        // Identificar paso actual
        const stepActivo = document.querySelector('.step-container.active');
        if (stepActivo) {
            estado.pasoActual = parseInt(stepActivo.id.replace('step-', ''));
        }

        // Recopilar valores
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                estado.valores[id] = el.value;
            }
        });

        // Guardar nombre del panel en lugar del índice (más robusto)
        const elPanel = document.getElementById('panel');
        if (elPanel && elPanel.selectedIndex >= 0) {
            estado.valores['panelNombre'] = elPanel.options[elPanel.selectedIndex].text;
        }

        const elIman = document.getElementById('iman-motor');
        if (elIman && elIman.selectedIndex >= 0) {
            estado.valores['imanMotorNombre'] = elIman.options[elIman.selectedIndex].text;
        }

        localStorage.setItem('progresoMendocino', JSON.stringify(estado));
    } catch (e) {
        console.error("Error guardando progreso:", e);
    }
}

function cargarProgresoCalculadora() {
    try {
        const raw = localStorage.getItem('progresoMendocino');
        if (!raw) return;

        const estado = JSON.parse(raw);
        if (!estado || !estado.valores) return;

        console.log("DEBUG [Storage]: Cargando progreso guardado...", estado);

        // 0. Asegurar que la UI esté renderizada antes de poblar (para tener opciones en los selectores)
        if (typeof renderizarUI === 'function') renderizarUI();

        // 1. Restaurar Material del hilo primero (porque condiciona el selector de diámetros)
        const idMat = 'material-hilo';
        const elMat = document.getElementById(idMat);
        if (elMat && estado.valores[idMat]) {
            elMat.value = estado.valores[idMat];
            // Forzar actualización de la lista de hilos disponibles para ese material
            if (typeof actualizarListaHilos === 'function') {
                actualizarListaHilos();
            }
        }

        // 2. Restaurar el resto de valores
        Object.keys(estado.valores).forEach(id => {
            if (id === idMat || id === 'panelNombre') return; // Ya lo hemos procesado o es especial
            const el = document.getElementById(id);
            if (el) {
                el.value = estado.valores[id];
            }
        });

        // 2.5 Restaurar Panel por Nombre (más robusto que índice)
        const panelNombre = estado.valores['panelNombre'];
        const elPanel = document.getElementById('panel');
        if (elPanel && panelNombre) {
            for (let i = 0; i < elPanel.options.length; i++) {
                if (elPanel.options[i].text === panelNombre) {
                    elPanel.selectedIndex = i;
                    break;
                }
            }
        }

        // 3. Restaurar el paso
        if (estado.pasoActual > 1) {
            cambiarPaso(estado.pasoActual);
        }

        // Forzar recalcular todo para que los gráficos y resultados se sincronicen
        actualizarResumenPaso1(); 
        
    } catch (e) {
        console.error("Error cargando progreso:", e);
    }
}

function inicializarAutoGuardado() {
    const contenedor = document.getElementById('page-calc');
    if (!contenedor) return;

    contenedor.addEventListener('input', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
            guardarProgresoCalculadora();
        }
    });
    
    contenedor.addEventListener('change', (e) => {
        if (e.target.tagName === 'SELECT') {
            guardarProgresoCalculadora();
        }
    });
}

function cargarUsuarioActualDesdeStorage() {
    // Reemplazada por cargarPerfilUsuario
}

window.onload = async function() {
    console.log("Mendocino App: Iniciando carga de ventana...");
    
    // Si estamos en el panel de administración, no inicializamos la app principal
    if (window.location.pathname.includes('admin-v35.html')) {
        return;
    }

    ocultarUIHastaAutenticacion();

    // 1. Inicialización de Auth con protección
    try {
        const authPromise = inicializarAuth();
        const timeoutPromise = new Promise(res => setTimeout(() => res('timeout'), 6000));
        
        const result = await Promise.race([authPromise, timeoutPromise]);
        if (result === 'timeout') {
            console.warn("ADVERTENCIA: inicializarAuth timeout.");
        }
    } catch (e) {
        console.error("Fallo durante inicialización de Auth:", e);
    }

    // 2. Carga de UI y Lógica base (siempre se intenta, independientemente de auth)
    try {
        inicializarAplicacionBase();
        renderizarProyectos();

        if (sessionActiva) {
            mostrarUIAutenticada();
            cargarProgresoCalculadora();
            inicializarAutoGuardado();
        } else {
            console.log("No hay sesión activa. Manteniendo modal de login.");
            const modalAuth = document.getElementById('modal-auth');
            if (modalAuth) modalAuth.style.display = 'flex';
        }
    } catch (uiBaseErr) {
        console.error("Error crítico en inicialización UI base:", uiBaseErr);
    }
};

