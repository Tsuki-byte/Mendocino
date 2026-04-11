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

window.ejecutarAuth = async function() {
    console.log("DEBUG: Ejecutando Auth...");
    const email = document.getElementById('auth-email')?.value.trim();
    const password = document.getElementById('auth-password')?.value.trim();
    const errorMsg = document.getElementById('auth-error');
    const successMsg = document.getElementById('auth-success');
    
    if (errorMsg) errorMsg.style.display = 'none';
    if (successMsg) successMsg.style.display = 'none';
    
    if (!email || !password) {
        if (errorMsg) { errorMsg.textContent = "Email y contraseña requeridos"; errorMsg.style.display = 'block'; }
        return;
    }

    try {
        const client = window.dbMendocinoClient;
        if (!client) throw new Error("Servicio de autenticación no listo. Espera un momento.");

        if (window.modoRegistroAuth) {
            const nombre = document.getElementById('auth-nombre')?.value.trim();
            const { data, error } = await client.auth.signUp({ 
                email, 
                password,
                options: { data: { nombre: nombre || 'Usuario' } }
            });
            if (error) throw error;
            if (successMsg) { successMsg.textContent = "¡Registro éxito! Revisa tu email."; successMsg.style.display = 'block'; }
        } else {
            const { data, error } = await client.auth.signInWithPassword({ email, password });
            if (error) throw error;
        }
    } catch (e) {
        console.error("Error Auth:", e);
        if (errorMsg) { errorMsg.textContent = e.message; errorMsg.style.display = 'block'; }
    }
};

const CONFIG_NIVELES = {
    basico: {
        pasosPermitidos: [1, 2],
        puedeVerPasoMagnetico: false,
        puedeVerPasoLevitacion: false,
        puedeVerInforme: false
    },
    avanzado: {
        pasosPermitidos: [1, 2, 3],
        puedeVerPasoMagnetico: true,
        puedeVerPasoLevitacion: false,
        puedeVerInforme: false
    },
    experto: {
        pasosPermitidos: [1, 2, 3, 4, 5],
        puedeVerPasoMagnetico: true,
        puedeVerPasoLevitacion: true,
        puedeVerInforme: true
    }
};

function obtenerConfigNivel() {
    return CONFIG_NIVELES[usuarioActual.nivel] || CONFIG_NIVELES.basico;
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


function cargarMotor(config) {
    if (!config) {
        alert("La configuración no es válida.");
        return;
    }

    console.log("Cargando motor con config:", config);
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

    if (margen) margen.value = config.margen ?? 0;
    if (ranuraAncho) ranuraAncho.value = config.ranuraAncho ?? 6.5;
    if (ranuraAlto) ranuraAlto.value = config.ranuraAlto ?? 3.5;
    if (ranuraTipo) ranuraTipo.value = config.ranuraTipo ?? 'trapecio';

    // --- Lógica de Material e Hilo ---
    if (materialHilo) materialHilo.value = config.material ?? 'cobre';
    if (typeof actualizarListaHilos === 'function') {
        actualizarListaHilos(); // Regenerar las opciones del select de hilos
    }

    if (diaHilo && config.hilo !== undefined) {
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

    // --- Lógica de Imanes (si aplica en el paso 4) ---
    if (config.imanRotorNombre || config.imanBaseNombre) {
        const selBase = document.getElementById('lev-base-iman');
        const selRotor = document.getElementById('lev-rotor-iman');
        
        if (selBase && config.imanBaseNombre) {
             const idx = dbImanes.findIndex(im => im.nombre === config.imanBaseNombre);
             if (idx >= 0) selBase.value = idx;
        }
        if (selRotor && config.imanRotorNombre) {
             const idx = dbImanes.findIndex(im => im.nombre === config.imanRotorNombre);
             if (idx >= 0) selRotor.value = idx;
        }
    }

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

    // Disparar cálculos en cascada con un pequeño delay para asegurar estabilidad del DOM
    setTimeout(() => {
        actualizarResumenPaso1();
        // Los pasos siguientes se llaman en cadena desde allí
    }, 50);
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

        function resetearBaseDatos() {
            if(confirm("¿Estás seguro de que quieres borrar tus componentes y volver a los de defecto?")) {
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
            precargarPasoMagnetico();
            calcularPasoMagnetico();

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
    const inputCampoBLev = document.getElementById('campo-b-levitacion');
    const inputLongitudLev = document.getElementById('longitud-activa-levitacion-mm');
    const inputFactorLev = document.getElementById('factor-orientacion-levitacion');

    const campoB = parseFloat(inputCampoB?.value || 0) || 0;
    const radioEfectivo_m = (parseFloat(inputRadioEfectivo?.value || 0) || 0) / 1000;
    const longitudActiva_m = EstadoDiseno.longitudActiva_m || 0;

    const campoBLev = parseFloat(inputCampoBLev?.value || 0) || 0;
    const longitudLevitacion_m = (parseFloat(inputLongitudLev?.value || 0) || 0) / 1000;
    const factorOrientacionLev = parseFloat(inputFactorLev?.value || 0) || 0;

    EstadoDiseno.campoB_T = campoB;
    EstadoDiseno.radioEfectivo_m = radioEfectivo_m;
    EstadoDiseno.campoBLevitacion_T = campoBLev;
    EstadoDiseno.longitudActivaLevitacion_m = longitudLevitacion_m;
    EstadoDiseno.factorOrientacionLevitacion = factorOrientacionLev;

    const fmm = espiras * corrienteA;

    const fuerzaLorentzPrincipal =
        campoB * corrienteA * longitudActiva_m * espiras;

    const fuerzaLorentzLevitacion =
        campoBLev * corrienteA * longitudLevitacion_m * espiras * factorOrientacionLev;

    const fuerzaLorentz = fuerzaLorentzPrincipal + fuerzaLorentzLevitacion;
    const par = fuerzaLorentz * radioEfectivo_m;

    EstadoDiseno.fmm_Av = fmm;
    EstadoDiseno.fuerzaLorentzPrincipal_N = fuerzaLorentzPrincipal;
    EstadoDiseno.fuerzaLorentzLevitacion_N = fuerzaLorentzLevitacion;
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

    if (fuerzaLorentzLevitacion > 0) {
        lectura += ' + ayuda de levitación';
    } else if (fuerzaLorentzLevitacion < 0) {
        lectura += ' + levitación opuesta';
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

    // --- 1. DIBUJO DE LÍNEAS B (Flujo Magnético) ---
    const imanWidth = 60;
    const imanHeight = 20;
    const imanY = 175;
    const numLineas = Math.min(12, Math.max(3, Math.floor(campoB * 25))); // Crecen con B

    for(let i=0; i<numLineas; i++){
        const lx = cx - (imanWidth/2) + 5 + (i * ((imanWidth-10) / Math.max(1, numLineas-1)));
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', lx); line.setAttribute('y1', imanY);
        line.setAttribute('x2', lx); line.setAttribute('y2', cy + radioRotorSVG - 5);
        line.setAttribute('stroke', '#3498db');
        line.setAttribute('stroke-width', '1.5');
        line.setAttribute('stroke-dasharray', '4,4');
        line.setAttribute('opacity', '0.5');
        
        // Flecha B
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        arrow.setAttribute('points', `${lx},${cy + radioRotorSVG} ${lx-3},${cy + radioRotorSVG + 8} ${lx+3},${cy + radioRotorSVG + 8}`);
        arrow.setAttribute('fill', '#3498db'); arrow.setAttribute('opacity', '0.6');
        
        svg.appendChild(line); svg.appendChild(arrow);
    }

    // --- 2. IMÁN BASE ---
    const rectIman = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rectIman.setAttribute('x', cx - imanWidth/2); rectIman.setAttribute('y', imanY);
    rectIman.setAttribute('width', imanWidth); rectIman.setAttribute('height', imanHeight);
    rectIman.setAttribute('fill', '#95a5a6'); rectIman.setAttribute('stroke', '#7f8c8d');
    rectIman.setAttribute('stroke-width', '2'); rectIman.setAttribute('rx', '2');
    svg.appendChild(rectIman);
    
    const textN = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textN.setAttribute('x', cx); textN.setAttribute('y', imanY + 15);
    textN.setAttribute('font-size', '13'); textN.setAttribute('fill', 'white');
    textN.setAttribute('font-weight', 'bold'); textN.setAttribute('text-anchor', 'middle');
    textN.textContent = 'N';
    svg.appendChild(textN);

    // --- 3. ROTOR POLIGONAL CON EJE ---
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


    // Hilo de cobre (ahora encajado exactamente en la ranura inferior)
    const maxDevanadoR = (radioRotorSVG - RfondoPx) / 2;
    const devanadoR = Math.max(3, Math.min(8, maxDevanadoR)); // Limitamos entre 3 y 8 px
    const devanadoY = cy + RfondoPx + devanadoR;

    const devCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    devCircle.setAttribute('cx', cx); devCircle.setAttribute('cy', devanadoY);
    devCircle.setAttribute('r', devanadoR);
    devCircle.setAttribute('fill', '#e67e22'); devCircle.setAttribute('stroke', '#d35400');
    svg.appendChild(devCircle);
    // Símbolo de corriente entrante (Cruz ⊗) congruente con Fuerza a la derecha e Imán N abajo
    const crossSize = Math.max(2, devanadoR * 0.4);
    
    const lineC1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    lineC1.setAttribute('x1', cx - crossSize); lineC1.setAttribute('y1', devanadoY - crossSize);
    lineC1.setAttribute('x2', cx + crossSize); lineC1.setAttribute('y2', devanadoY + crossSize);
    lineC1.setAttribute('stroke', '#fff'); lineC1.setAttribute('stroke-width', '1.5');
    svg.appendChild(lineC1);

    const lineC2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    lineC2.setAttribute('x1', cx + crossSize); lineC2.setAttribute('y1', devanadoY - crossSize);
    lineC2.setAttribute('x2', cx - crossSize); lineC2.setAttribute('y2', devanadoY + crossSize);
    lineC2.setAttribute('stroke', '#fff'); lineC2.setAttribute('stroke-width', '1.5');
    svg.appendChild(lineC2);

    // --- 4. FUERZA LORENTZ VECTOR ---
    const lenF = Math.min(50, Math.max(15, fuerza * 4000)); // Longitud reactiva
    const fx1 = cx + devanadoR + 3;
    const fy = devanadoY;
    const fx2 = fx1 + lenF;

    const flechaF = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    flechaF.setAttribute('x1', fx1); flechaF.setAttribute('y1', fy);
    flechaF.setAttribute('x2', fx2); flechaF.setAttribute('y2', fy);
    flechaF.setAttribute('stroke', '#e74c3c'); flechaF.setAttribute('stroke-width', '3');
    svg.appendChild(flechaF);

    const arrowF = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    arrowF.setAttribute('points', `${fx2},${fy} ${fx2-6},${fy-4} ${fx2-6},${fy+4}`);
    arrowF.setAttribute('fill', '#e74c3c');
    svg.appendChild(arrowF);

    // --- 5. PAR ROTATORIO (CURVA) ---
    const strokeW = Math.min(6, Math.max(1.5, parActivo * 1500)); // Grosor reactivo
    const rx = radioRotorSVG + 18;
    
    // Curva indicadora de giro (sentido antihorario, el lado izquierdo baja)
    const startX = cx - rx * 0.7; const startY = cy - rx * 0.7; // Empieza arriba izquierda
    const endX = cx - rx * 0.7;   const endY = cy + rx * 0.7;   // Termina abajo izquierda
    const tauPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    tauPath.setAttribute('d', `M ${startX} ${startY} A ${rx} ${rx} 0 0 0 ${endX} ${endY}`);
    tauPath.setAttribute('stroke', '#2ecc71'); tauPath.setAttribute('stroke-width', strokeW);
    tauPath.setAttribute('fill', 'none');
    svg.appendChild(tauPath);

    // Punta de flecha de par (apuntando hacia abajo)
    const tauArrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    tauArrow.setAttribute('points', `${endX},${endY+8} ${endX-5},${endY-3} ${endX+5},${endY-3}`);
    tauArrow.setAttribute('fill', '#2ecc71');
    tauArrow.setAttribute('transform', `rotate(-35 ${endX} ${endY})`);
    svg.appendChild(tauArrow);
}








        // --- PASO 4: ENCAJE EN RANURA ---

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
            
            // 1. Cargar de LocalStorage primero (fallback/persistente)
            try {
                const datosLocal = localStorage.getItem('listaMotoresMendocino');
                if (datosLocal) motoresFinales = JSON.parse(datosLocal);
            } catch (e) { console.warn("Error local:", e); }

            // 2. Si hay sesión, cargar de Supabase y fusionar
            if (typeof supabase !== 'undefined' && supabase && sessionActiva) {
                try {
                    const { data: motoresCloud, error } = await dbMendocinoClient
                        .from('motores')
                        .select('titulo, config')
                        .eq('usuario_id', sessionActiva.user.id);
                    
                    if (!error && motoresCloud) {
                        motoresCloud.forEach(m => {
                            motoresFinales[m.titulo] = m.config;
                        });
                    }
                } catch (e) { console.error("Error sincronizando nube:", e); }
            }
            return motoresFinales;
        }

        
        async function guardarConfiguracionLocal() {
        const nombreMotor = prompt("📝 Ponle un nombre a esta configuración (ej: 'Motor rápido 4 caras'):");
        if (!nombreMotor || nombreMotor.trim() === "") return;

        const panelSelect = document.getElementById('panel');
        const informe = document.getElementById('informe-automatico')?.value || "";
        const tipoRotor = document.getElementById('res-tipo-rotor')?.textContent || "";
        const comportamiento = document.getElementById('res-comportamiento')?.textContent || "";
        const nivel = document.getElementById('res-nivel')?.textContent || "";

        const miConfiguracion = {
            caras: document.getElementById('caras').value,
            panel: panelSelect.value,
            panelNombre: panelSelect.options[panelSelect.selectedIndex]?.text || '',
            panelData: dbPaneles[panelSelect.value] ? {...dbPaneles[panelSelect.value]} : null,
            margen: document.getElementById('margen-placa').value,
            ranuraAncho: document.getElementById('ranura-ancho').value,
            ranuraAlto: document.getElementById('ranura-alto').value,
            ranuraTipo: document.getElementById('ranura-tipo').value,
            material: document.getElementById('material-hilo').value,
            hilo: document.getElementById('dia-hilo-select').value,
            calidad: document.getElementById('calidad-bobinado').value,

            // Nuevo
            informe,
            resumen: {
                tipoRotor,
                comportamiento,
                nivel
            },
            fechaGuardado: new Date().toLocaleString('es-ES')
        };

    const misMotores = await obtenerMotoresGuardados();
    misMotores[nombreMotor] = miConfiguracion;
    localStorage.setItem('listaMotoresMendocino', JSON.stringify(misMotores));

        if (window.dbMendocinoClient) {
            const usrId = sessionActiva?.user?.id;
            const usrNombre = usuarioActual?.nombre || 'Alumno';
            const id_unico = (usuarioActual?.nombre || 'demo') + '-' + new Date().getTime();
            
            await dbMendocinoClient.from('motores').insert([{
                id_unico: id_unico,
                titulo: nombreMotor,
                config: miConfiguracion,
                usuario_id: usrId,
                autor_nombre: usrNombre,
                es_publico: false // Por defecto privado hasta que el admin lo publique
            }]);
        }

    mostrarToast(`Motor "${nombreMotor}" guardado correctamente.`, 'ok');
}

    async function cargarConfiguracionLocal() {
    const misMotores = await obtenerMotoresGuardados();

    const listaDiv = document.getElementById('lista-configs');
    const modal = document.getElementById('modal-configs');

    if (!listaDiv || !modal) {
        console.error("No se encontró el modal o la lista de configuraciones.");
        alert("No se pudo abrir la ventana de configuraciones guardadas.");
        return;
    }

    listaDiv.innerHTML = '';

    const nombresDeMotores = Object.keys(misMotores);

    if (nombresDeMotores.length === 0) {
        listaDiv.innerHTML = '<p class="texto-vacio-modal">No tienes ninguna configuración guardada todavía.</p>';
    } else {
        nombresDeMotores.forEach(nombre => {
            const config = misMotores[nombre];

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
                    cargarMotor(config);
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
            btnBorrar.onclick = function () {
                if (confirm(`¿Seguro que quieres borrar la configuración "${nombre}"?`)) {
                    delete misMotores[nombre];
                    localStorage.setItem('listaMotoresMendocino', JSON.stringify(misMotores));
                    cargarConfiguracionLocal();
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


        // --- PROYECTOS Y VALORACIÓN ---
        function obtenerValoracionesProyectos() {
            return JSON.parse(localStorage.getItem('valoracionesProyectosMendocino') || '{}');
        }

        function guardarValoracionesProyectos(datos) {
            localStorage.setItem('valoracionesProyectosMendocino', JSON.stringify(datos));
        }

        function obtenerVotosUsuario() {
            return JSON.parse(localStorage.getItem('votosUsuarioProyectosMendocino') || '{}');
        }

        function guardarVotosUsuario(datos) {
            localStorage.setItem('votosUsuarioProyectosMendocino', JSON.stringify(datos));
        }

        function calcularResumenVotos(lista) {
            if (!Array.isArray(lista) || lista.length === 0) return { media: 0, total: 0 };
            const suma = lista.reduce((acc, n) => acc + Number(n || 0), 0);
            return { media: suma / lista.length, total: lista.length };
        }

        function votarProyecto(idProyecto, valor) {
            const votosUsuario = obtenerVotosUsuario();
            const valoraciones = obtenerValoracionesProyectos();
            const votosProyecto = Array.isArray(valoraciones[idProyecto]) ? valoraciones[idProyecto] : [];

            if (votosUsuario[idProyecto]) {
                mostrarToast('Ya has valorado este proyecto en este navegador.', 'aviso');
                return;
            }

            votosProyecto.push(Number(valor));
            valoraciones[idProyecto] = votosProyecto;
            votosUsuario[idProyecto] = Number(valor);

            guardarValoracionesProyectos(valoraciones);
            guardarVotosUsuario(votosUsuario);
            renderizarProyectos();
            mostrarToast('Gracias por tu voto.', 'ok');
        }

        async function renderizarProyectos() {
            const contenedor = obtenerElemento('contenedor-proyectos');
            if (!contenedor) return;

            console.log("DEBUG [Gallery]: Iniciando renderizado de la galería...");
            contenedor.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:50px; color:#64748b;">⏳ Cargando galería de proyectos...</div>';

            try {
                // 1. Obtener proyectos públicos de Supabase
                const { data: proyectos, error } = await dbMendocinoClient
                    .from('motores')
                    .select('*')
                    .eq('es_publico', true)
                    .order('creado_en', { ascending: false });

                if (error) throw error;
                if (!proyectos || proyectos.length === 0) {
                    contenedor.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:50px; color:#64748b;">No hay proyectos públicos disponibles en este momento.</div>';
                    return;
                }

                const valoraciones = obtenerValoracionesProyectos();
                const votosUsuario = obtenerVotosUsuario();

                contenedor.innerHTML = proyectos.map((proyecto) => {
                    const resumen = calcularResumenVotos(valoraciones[proyecto.id_unico]);
                    const votoUsuario = votosUsuario[proyecto.id_unico] || 0;
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
                                        <div class="proyecto-ficha__fila"><span>Panel</span><strong>${proyecto.ficha?.panel || '--'}</strong></div>
                                        <div class="proyecto-ficha__fila"><span>Hilo</span><strong>${proyecto.ficha?.hilo || '--'}</strong></div>
                                        <div class="proyecto-ficha__fila"><span>Espiras</span><strong>${proyecto.ficha?.espiras || '--'}</strong></div>
                                        <div class="proyecto-ficha__fila"><span>Velocidad</span><strong>${proyecto.ficha?.velocidad || '--'}</strong></div>
                                        <div class="proyecto-ficha__fila"><span>Peso</span><strong>${proyecto.ficha?.peso || '--'}</strong></div>
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
                                    <h4>⭐ Ranking de la comunidad</h4>
                                    <div class="proyecto-votos">
                                        ${[1,2,3,4,5].map(n => `<button class="btn-voto ${votoUsuario === n ? 'activo' : ''}" onclick="votarProyecto('${proyecto.id_unico}', ${n})">${n}★</button>`).join('')}
                                    </div>
                                    <div class="proyecto-ranking">
                                        <strong>${resumen.total ? resumen.media.toFixed(2) : 'Sin votos'}</strong>
                                        ${resumen.total ? `<small> · ${resumen.total} voto${resumen.total === 1 ? '' : 's'}</small>` : ''}
                                    </div>
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

            } catch (e) {
                console.error("Error cargando galería:", e);
                contenedor.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:50px; color:#ef4444;">Error al conectar con la galería: ${e.message}</div>`;
            }
        }

        // --- INICIALIZACIÓN BASE ---
        function inicializarAplicacionBase() {
            inicializarNavegacionProfesional();
            renderizarProyectos();
            poblarSelectoresLevitacion();
            actualizarModeloAxial();
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
        [ 5. COMPORTAMIENTO ]
        Tipo de rotor: ${tipoRotor}

        Arranque:
        ${arranque}

        Velocidad:
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
        La FCEM estabiliza el sistema al aumentar la velocidad.

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



function poblarSelectoresLevitacion() {
    const selBase = document.getElementById('lev-base-iman');
    const selRotor = document.getElementById('lev-rotor-iman');
    if (!selBase || !selRotor || !Array.isArray(dbImanes)) return;

    const basePrev = selBase.value;
    const rotorPrev = selRotor.value;

    selBase.innerHTML = '';
    selRotor.innerHTML = '';

    dbImanes.forEach((im, index) => {
        const texto = `${im.nombre} · Br ${Number(im.br || 0).toFixed(2)} T`;
        selBase.innerHTML += `<option value="${index}">${texto}</option>`;
        selRotor.innerHTML += `<option value="${index}">${texto}</option>`;
    });

    if (dbImanes.length === 0) {
        selBase.innerHTML = '<option value="">Sin imanes</option>';
        selRotor.innerHTML = '<option value="">Sin imanes</option>';
        return;
    }

    const idxAro = dbImanes.findIndex(im => String(im.forma || '').toLowerCase().includes('aro'));
    const idxBloque = dbImanes.findIndex(im => String(im.forma || '').toLowerCase().includes('bloque'));

    selBase.value = (basePrev !== '' && Number(basePrev) < dbImanes.length) ? basePrev : String(Math.max(0, idxBloque));
    selRotor.value = (rotorPrev !== '' && Number(rotorPrev) < dbImanes.length) ? rotorPrev : String(idxAro >= 0 ? idxAro : 0);
}

function obtenerFactorIman(indice, rol = 'base') {
    const im = dbImanes?.[Number(indice)];
    if (!im) return 1;
    const br = Number(im.br || 1.2);
    const l = Number(im.l || 10);
    const a = Number(im.a || 10);
    const h = Number(im.h || 5);
    let area = 0;

    if (String(im.forma || '').toLowerCase().includes('aro')) {
        const dExt = l;
        const dInt = a;
        area = Math.max(1, Math.PI * (dExt*dExt - dInt*dInt) / 4);
    } else {
        area = Math.max(1, l * a);
    }

    const volumen = area * Math.max(1, h);
    let factor = br * Math.pow(volumen, 0.35) / 8;
    if (rol === 'base') factor *= 1.15;
    return Math.max(0.2, factor);
}

function actualizarModeloAxial() {
    const svg = document.getElementById('levitacion-svg');
    if (!svg) return;

    const masa = parseFloat(document.getElementById('lev-masa-rotor')?.value || 32);
    const gapFrontal = parseFloat(document.getElementById('lev-gap-frontal')?.value || 2.5);
    const gapTrasero = parseFloat(document.getElementById('lev-gap-trasero')?.value || 2.5);
    const fraccionPunta = parseFloat(document.getElementById('lev-fraccion-punta')?.value || 15) / 100;
    const exponente = parseFloat(document.getElementById('lev-exponente')?.value || 2.7);
    const factorGeom = parseFloat(document.getElementById('lev-factor')?.value || 1.0);
    const desalineacion = parseFloat(document.getElementById('lev-desalineacion')?.value || 0);
    const sepApoyos = parseFloat(document.getElementById('lev-separacion-apoyos')?.value || 110);
    const idxBase = document.getElementById('lev-base-iman')?.value || 0;
    const idxRotor = document.getElementById('lev-rotor-iman')?.value || 0;

    const g = 9.81;
    const peso = Math.max(0, masa) / 1000 * g;

    const fBase = obtenerFactorIman(idxBase, 'base');
    const fRotor = obtenerFactorIman(idxRotor, 'rotor');
    const k = 0.16 * factorGeom * fBase * fRotor;

    function fuerzaPar(gapMm) {
        const gap = Math.max(0.2, gapMm);
        const fuerzaPorIman = k / Math.pow(gap, exponente);
        return 2 * fuerzaPorIman; // dos imanes de base por extremo
    }

    const fFrontal = fuerzaPar(gapFrontal + Math.max(0, desalineacion));
    const fTrasera = fuerzaPar(gapTrasero + Math.max(0, -desalineacion));
    const fTotal = fFrontal + fTrasera;
    const cargaObjetivoPunta = peso * fraccionPunta;
    const cargaRealPunta = Math.max(0, peso - fTotal);
    const desequilibrio = Math.abs(fFrontal - fTrasera);
    const rigidez = (exponente * fFrontal / Math.max(0.2, gapFrontal)) + (exponente * fTrasera / Math.max(0.2, gapTrasero));

    let diagnostico = '🔴 Carga alta en la punta';
    let lectura = 'La sustentación magnética es baja y la punta sigue soportando una parte grande del peso.';
    if (cargaRealPunta <= cargaObjetivoPunta) {
        diagnostico = '🟢 Sustentación favorable';
        lectura = 'La mayor parte del peso la llevan los imanes. La punta trabaja sobre todo como guía y estabilizador.';
    } else if (cargaRealPunta <= peso * 0.45) {
        diagnostico = '🟡 Semisustentado';
        lectura = 'Los imanes descargan una parte importante del peso, pero aún queda carga apreciable sobre la punta.';
    }

    const setText = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.textContent = txt;
    };

    setText('lev-res-f-frontal', `${fFrontal.toFixed(3)} N`);
    setText('lev-res-f-trasera', `${fTrasera.toFixed(3)} N`);
    setText('lev-res-f-total', `${fTotal.toFixed(3)} N`);
    setText('lev-res-peso', `${peso.toFixed(3)} N`);
    setText('lev-res-punta', `${cargaRealPunta.toFixed(3)} N`);
    setText('lev-res-deseq', `${desequilibrio.toFixed(3)} N`);
    setText('lev-res-rigidez', `${rigidez.toFixed(3)} N/mm`);
    setText('lev-res-lectura', lectura);
    setText('lev-diagnostico', diagnostico);

    const badge = document.getElementById('lev-diagnostico');
    if (badge) {
        badge.style.background = diagnostico.startsWith('🟢') ? '#e8f7ee' : diagnostico.startsWith('🟡') ? '#fff7e0' : '#fdecec';
        badge.style.color = diagnostico.startsWith('🟢') ? '#166534' : diagnostico.startsWith('🟡') ? '#92400e' : '#991b1b';
        badge.style.border = '1px solid rgba(0,0,0,0.08)';
        badge.style.padding = '10px 12px';
        badge.style.borderRadius = '10px';
        badge.style.fontWeight = '700';
    }

    dibujarLevitacionSVG({gapFrontal, gapTrasero, cargaRealPunta, peso, fFrontal, fTrasera, sepApoyos, diagnostico});
}

function dibujarLevitacionSVG({gapFrontal, gapTrasero, cargaRealPunta, peso, fFrontal, fTrasera, sepApoyos, diagnostico}) {
    const svg = document.getElementById('levitacion-svg');
    if (!svg) return;

    const colorDiag = diagnostico.startsWith('🟢') ? '#166534' : diagnostico.startsWith('🟡') ? '#92400e' : '#991b1b';

    svg.setAttribute('viewBox', '0 0 900 320');
    svg.innerHTML = `
      <rect x="0" y="0" width="900" height="320" fill="#efefef"/>

      <!-- Dibujo lateral exacto basado en el esquema aportado -->
      <rect x="70" y="235" width="430" height="52" fill="#cfcfd1" stroke="#555" stroke-width="2"/>
      <rect x="85" y="248" width="54" height="54" fill="none" stroke="#444" stroke-width="2"/>
      <text x="112" y="282" text-anchor="middle" font-size="28" font-weight="700">A</text>

      <rect x="102" y="62" width="10" height="173" fill="#f8fafc" stroke="#666" stroke-width="2"/>
      <line x1="102" y1="62" x2="112" y2="72" stroke="#999" stroke-width="2"/>
      <line x1="102" y1="92" x2="112" y2="102" stroke="#999" stroke-width="2"/>
      <line x1="102" y1="122" x2="112" y2="132" stroke="#999" stroke-width="2"/>
      <line x1="102" y1="152" x2="112" y2="162" stroke="#999" stroke-width="2"/>
      <line x1="102" y1="182" x2="112" y2="192" stroke="#999" stroke-width="2"/>
      <rect x="52" y="75" width="44" height="44" fill="none" stroke="#444" stroke-width="2"/>
      <text x="74" y="105" text-anchor="middle" font-size="28" font-weight="700">D</text>

      <polygon points="112,170 130,160 185,160 185,180 130,180" fill="#d8d8da" stroke="#666" stroke-width="2"/>
      <rect x="185" y="165" width="70" height="10" fill="#d8d8da" stroke="#666" stroke-width="2"/>
      <rect x="255" y="165" width="145" height="10" fill="#d8d8da" stroke="#666" stroke-width="2"/>
      <rect x="400" y="165" width="80" height="10" fill="#d8d8da" stroke="#666" stroke-width="2"/>

      <rect x="215" y="110" width="150" height="120" fill="#7fb0d8" stroke="#4b5b68" stroke-width="2"/>

      <rect x="152" y="138" width="14" height="60" fill="#3156e8" stroke="#333" stroke-width="1.5"/>
      <rect x="166" y="138" width="14" height="60" fill="#ff3b30" stroke="#333" stroke-width="1.5"/>
      <rect x="405" y="138" width="14" height="60" fill="#ff3b30" stroke="#333" stroke-width="1.5"/>
      <rect x="419" y="138" width="14" height="60" fill="#3156e8" stroke="#333" stroke-width="1.5"/>

      <rect x="174" y="185" width="14" height="50" fill="#3156e8" stroke="#333" stroke-width="1.5"/>
      <rect x="188" y="185" width="14" height="50" fill="#ff3b30" stroke="#333" stroke-width="1.5"/>
      <rect x="406" y="185" width="14" height="50" fill="#ff3b30" stroke="#333" stroke-width="1.5"/>
      <rect x="420" y="185" width="14" height="50" fill="#3156e8" stroke="#333" stroke-width="1.5"/>

      <rect x="227" y="235" width="145" height="16" fill="#ff3b30" stroke="#333" stroke-width="1.5"/>
      <rect x="227" y="251" width="145" height="12" fill="#3156e8" stroke="#333" stroke-width="1.5"/>

      <rect x="126" y="185" width="42" height="42" fill="none" stroke="#444" stroke-width="2"/>
      <text x="147" y="214" text-anchor="middle" font-size="26" font-weight="700">C</text>
      <rect x="476" y="185" width="42" height="42" fill="none" stroke="#444" stroke-width="2"/>
      <text x="497" y="214" text-anchor="middle" font-size="26" font-weight="700">C</text>
      <rect x="272" y="198" width="42" height="42" fill="none" stroke="#444" stroke-width="2"/>
      <text x="293" y="227" text-anchor="middle" font-size="26" font-weight="700">B</text>

      <!-- Texto informativo actual -->
      <text x="590" y="88" font-size="18" font-weight="700" fill="#0f172a">Modelo lateral de levitación</text>
      <text x="590" y="120" font-size="26" font-weight="700">A - Base impresa</text>
      <text x="590" y="170" font-size="26" font-weight="700">B - Imán (40x20x5mm)</text>
      <text x="590" y="220" font-size="26" font-weight="700">C - Imanes (30x10x5mm) x4</text>
      <text x="590" y="270" font-size="26" font-weight="700">D - Cristal de muestras x2</text>

      <text x="590" y="34" font-size="16" font-weight="700" fill="${colorDiag}">${diagnostico}</text>
      <text x="590" y="300" font-size="14" fill="#334155">Gap izq.: ${gapFrontal.toFixed(1)} mm · Gap der.: ${gapTrasero.toFixed(1)} mm</text>
      <text x="590" y="318" font-size="14" fill="#334155">Carga punta: ${cargaRealPunta.toFixed(2)} N · Peso: ${peso.toFixed(2)} N</text>
    `;
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
        poblarSelectoresLevitacion();
        actualizarModeloAxial();
    }
    if (numPaso === 5) {
        generarInformeAutomatico();
    }

    // Guardar el número de paso en el progreso
    guardarProgresoCalculadora();
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

    const pasos = [1, 2, 3, 4, 5];

    pasos.forEach((numPaso) => {
        const indicador = document.getElementById(`ind-${numPaso}`);
        if (!indicador) return;

        const permitido = config.pasosPermitidos.includes(numPaso);

        indicador.style.opacity = permitido ? '1' : '0.35';
        indicador.style.pointerEvents = permitido ? 'auto' : 'none';
        indicador.title = permitido ? '' : 'Bloqueado para este nivel';
    });

    aplicarVisibilidadPorNivel();
    actualizarMensajeNivel();

    const pasoActual = obtenerPasoActual();
    if (!config.pasosPermitidos.includes(pasoActual)) {
        cambiarPaso(config.pasosPermitidos[0]);
    }
}

function obtenerPasoActual() {
    const activo = document.querySelector('.step-container.active');
    if (!activo) return 1;
    const match = activo.id.match(/step-(\d+)/);
    return match ? Number(match[1]) : 1;
}


function aplicarVisibilidadPorNivel() {
    const nivel = usuarioActual.nivel;

    document.querySelectorAll('.solo-experto-paso3').forEach(el => {
        el.style.display = (nivel === 'experto') ? '' : 'none';
    });

    document.querySelectorAll('.solo-avanzado').forEach(el => {
        el.style.display = (nivel === 'avanzado' || nivel === 'experto') ? '' : 'none';
    });

    document.querySelectorAll('.solo-experto').forEach(el => {
        el.style.display = (nivel === 'experto') ? '' : 'none';
    });

    document.querySelectorAll('.oculto-basico').forEach(el => {
        el.style.display = (nivel === 'basico') ? 'none' : '';
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

                if (session) {
                    console.log("DEBUG [Auth]: Usuario detectado. Inicializando interfaz...");
                    const modalAuth = document.getElementById('modal-auth');
                    if (modalAuth) modalAuth.style.display = 'none';

                    // 1. Mostrar identidad base de inmediato (sin esperar a DB)
                    actualizarPanelAdminUI(); 
                    renderizarUI(); // Renderizado rápido con lo que haya en memoria/local
                    mostrarUIAutenticada();

                    // 2. Cargar perfil y datos globales en segundo plano (para no bloquear)
                    cargarPerfilUsuario(session.user).then(() => actualizarPanelAdminUI());
                    
                    await cargarDatosGlobales();
                    renderizarUI(); // Segundo renderizado con datos frescos de la nube
                    actualizarPanelAdminUI();
                    aplicarNivelUsuario();
                } else {
                    console.log("DEBUG [Auth]: Sin sesión. Mostrando login.");
                    if (!window.location.pathname.includes('admin-v35.html')) {
                        ocultarUIHastaAutenticacion();
                    }
                }
            } catch (error) {
                console.error("Error en flujo de arranque:", error);
            } finally {
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
            .select('id, nombre, nivel, rol')
            .eq('id', user.id)
            .single();
            
        if (profile && !error) {
            profileActual = profile;
            // Si el perfil tiene rol admin, o ya lo detectamos por email whitelist
            esAdmin = esAdmin || (profile.rol === 'admin');
            usuarioActual.nombre = profile.nombre || user.email;
            usuarioActual.nivel = profile.nivel || NIVELES_USUARIO.BASICO;
        } else {
            // Error controlado o fila no existente: el whitelist por email ya nos protege arriba
            profileActual = null;
            usuarioActual.nombre = user.user_metadata?.nombre || user.email || 'Alumno';
            usuarioActual.nivel = NIVELES_USUARIO.BASICO;
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
        window.location.href = window.location.pathname;
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
            console.log("DEBUG [AdminUI]: Mostrando botón de administración.");
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
            'campo-b', 'radio-efectivo-mm', 'campo-b-levitacion', 
            'longitud-activa-levitacion-mm', 'factor-orientacion-levitacion'
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
    // Si estamos en el panel de administración, script.js no debe inicializar
    // la app principal (elementos como modal-auth, lista-paneles, etc. no existen aquí)
    if (window.location.pathname.includes('admin-v35.html')) {
        return;
    }

    ocultarUIHastaAutenticacion();
    inicializarAplicacionBase();
    await inicializarAuth();

    // Si después de inicializar no hay sesión, aseguramos que el modal se vea
    if (!sessionActiva) {
        const modalAuth = document.getElementById('modal-auth');
        if (modalAuth) {
            modalAuth.style.display = 'flex';
        }
    } else {
        mostrarUIAutenticada();
        
        // --- RESTAURAR PROGRESO ---
        cargarProgresoCalculadora();
        inicializarAutoGuardado();
    }
};

