const NIVELES_USUARIO = {
    BASICO: 'basico',
    AVANZADO: 'avanzado',
    EXPERTO: 'experto'
};

let usuarioActual = {
    nombre: 'demo',
    nivel: localStorage.getItem('nivelUsuarioMotor') || NIVELES_USUARIO.EXPERTO
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
        pasosPermitidos: [1, 2, 3],
        puedeVerPasoMagnetico: false,
        puedeVerPasoFCEM: false,
        puedeVerInforme: false
    },
    avanzado: {
        pasosPermitidos: [1, 2, 3, 4, 5, 6, 7],
        puedeVerPasoMagnetico: true,
        puedeVerPasoFCEM: false,
        puedeVerInforme: false
    },
    experto: {
        pasosPermitidos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
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
                    puedeVerPasoMagnetico: pasos.includes(4),
                    puedeVerPasoFCEM: pasos.includes(6),
                    puedeVerInforme: pasos.includes(12)
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

function cargarScriptsSecuencialmente(contenedor) {
    const scripts = Array.from(contenedor.querySelectorAll('script'));
    const loadScript = (index) => {
        if (index >= scripts.length) return;
        const oldScript = scripts[index];
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.text = oldScript.innerHTML;
        
        if (newScript.src) {
            newScript.onload = () => loadScript(index + 1);
            newScript.onerror = () => loadScript(index + 1);
            oldScript.parentNode.replaceChild(newScript, oldScript);
        } else {
            oldScript.parentNode.replaceChild(newScript, oldScript);
            loadScript(index + 1);
        }
    };
    loadScript(0);
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
window.urlsSTLActuales = { base: null, rotor: null };

window.descargarSTL = function(tipo) {
    const url = window.urlsSTLActuales[tipo];
    if (url) {
        window.open(url, '_blank');
    } else {
        alert("El archivo STL no está disponible para este diseño.");
    }
};

window.cargarMotorY3D = function(proyecto) {
    // Ya no se usa, redirigimos a la calculadora clásica
    cargarMotor(proyecto.config, proyecto.id_unico, proyecto.titulo);
};

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
    const diametroEje = document.getElementById('diametro-eje');
    if (diametroEje) diametroEje.value = config.diametroEje ?? 8;
    if (materialHilo) materialHilo.value = config.material ?? 'cobre';
    if (diaHilo && config.hilo !== undefined) {
        // Buscamos el valor exacto del hilo en el select
        const diaBuscado = parseFloat(config.hilo);
        if (!isNaN(diaBuscado)) {
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
    }

    if (calidad && config.calidad) {
        calidad.value = config.calidad;
    }

    // --- Lógica de Imán de Motor (Paso 3) ---
    const imanSelect = document.getElementById('iman-motor');
    const imanOrient = document.getElementById('iman-orientacion');
    const imanDist = document.getElementById('iman-distancia');

    if (imanSelect && config.imanMotorNombre) {
        for(let i=0; i<imanSelect.options.length; i++) {
            const optText = imanSelect.options[i].text;
            if(optText === config.imanMotorNombre || optText.includes(config.imanMotorNombre) || config.imanMotorNombre.includes(optText)) {
                imanSelect.selectedIndex = i; break;
            }
        }
    }
    
    if (imanOrient && config.imanMotorOrientacion) {
        imanOrient.value = config.imanMotorOrientacion;
        imanOrient.dispatchEvent(new Event('change'));
    }
    const imanPolaridad = document.getElementById('iman-polaridad');
    if (imanPolaridad && config.imanMotorPolaridad) {
        imanPolaridad.value = config.imanMotorPolaridad;
        imanPolaridad.dispatchEvent(new Event('change'));
    }
    if (imanDist && config.imanMotorDistancia !== undefined) {
        imanDist.value = config.imanMotorDistancia;
        imanDist.dispatchEvent(new Event('change'));
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
        const fcemRpmNum = document.getElementById('fcem-rpm-num');
        if (fcemRpmNum) fcemRpmNum.value = config.fcemRpmSim;
    }
    if (fcemPerdIn && config.fcemPerdidas !== undefined) {
        fcemPerdIn.value = config.fcemPerdidas;
    }
    
    // --- Lógica Paso 8 (Equilibrado) ---
    const equilMasaAd = document.getElementById('equil-masa-adicional');
    const equilRadio = document.getElementById('equil-radio-masa');
    const equilAngulo = document.getElementById('equil-angulo-masa');
    if (equilMasaAd && config.equilMasaAdicional !== undefined) equilMasaAd.value = config.equilMasaAdicional;
    if (equilRadio && config.equilRadioMasa !== undefined) equilRadio.value = config.equilRadioMasa;
    if (equilAngulo && config.equilAnguloMasa !== undefined) equilAngulo.value = config.equilAnguloMasa;

    // --- Lógica Paso 9 (Levitación) ---
    const levBaseXIn = document.getElementById('lev-base-x');
    const levBaseYIn = document.getElementById('lev-base-y');
    const levSustSepXIn = document.getElementById('lev-sust-sep-x');
    const levSustSepYIn = document.getElementById('lev-sust-sep-y');
    const levSustPolIzq = document.getElementById('lev-sust-pol-izq');
    const levSustPolDer = document.getElementById('lev-sust-pol-der');
    const levRotorPolIzq = document.getElementById('lev-rotor-pol-izq');
    const levRotorPolDer = document.getElementById('lev-rotor-pol-der');
    const levRotorOffsetIzq = document.getElementById('lev-rotor-offset-izq');
    const levRotorOffsetDer = document.getElementById('lev-rotor-offset-der');
    const levApoyoDistIn = document.getElementById('lev-apoyo-dist');

    if (levBaseXIn && config.levBaseX !== undefined) levBaseXIn.value = config.levBaseX;
    if (levBaseYIn && config.levBaseY !== undefined) levBaseYIn.value = config.levBaseY;
    if (levSustSepXIn && config.levSustSepX !== undefined) levSustSepXIn.value = config.levSustSepX;
    if (levSustSepYIn && config.levSustSepY !== undefined) levSustSepYIn.value = config.levSustSepY;
    const levSustIncIn = document.getElementById('lev-sust-inclinacion');
    if (levSustIncIn && config.levSustInc !== undefined) levSustIncIn.value = config.levSustInc;
    const levSustZIn = document.getElementById('lev-sust-z');
    if (levSustZIn && config.levSustZ !== undefined) levSustZIn.value = config.levSustZ;
    if (levSustPolIzq && config.levSustPolIzq !== undefined) levSustPolIzq.value = config.levSustPolIzq;
    if (levSustPolDer && config.levSustPolDer !== undefined) levSustPolDer.value = config.levSustPolDer;
    if (levRotorPolIzq && config.levRotorPolIzq !== undefined) levRotorPolIzq.value = config.levRotorPolIzq;
    if (levRotorPolDer && config.levRotorPolDer !== undefined) levRotorPolDer.value = config.levRotorPolDer;
    if (levRotorOffsetIzq && config.levRotorOffsetIzq !== undefined) levRotorOffsetIzq.value = config.levRotorOffsetIzq;
    if (levRotorOffsetDer && config.levRotorOffsetDer !== undefined) levRotorOffsetDer.value = config.levRotorOffsetDer;
    if (levApoyoDistIn && config.levApoyoDist !== undefined) levApoyoDistIn.value = config.levApoyoDist;

    // Restaurar selectores de imanes por nombre si existen
    const levSustIman = document.getElementById('lev-sust-iman');
    if (levSustIman && config.levSustImanNombre) {
        for(let i=0; i<levSustIman.options.length; i++) {
            if(levSustIman.options[i].text === config.levSustImanNombre) {
                levSustIman.selectedIndex = i; break;
            }
        }
    }
    const levRotorIman = document.getElementById('lev-rotor-iman');
    if (levRotorIman && config.levRotorImanNombre) {
        for(let i=0; i<levRotorIman.options.length; i++) {
            if(levRotorIman.options[i].text === config.levRotorImanNombre) {
                levRotorIman.selectedIndex = i; break;
            }
        }
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
        if (typeof calcularDimensionesRotor === 'function') calcularDimensionesRotor();
        if (typeof calcularDevanado === 'function') calcularDevanado();
        if (typeof calcularFuerzasPaso4 === 'function') calcularFuerzasPaso4();
        if (typeof calcularPasoLuminico === 'function') calcularPasoLuminico();
        if (typeof actualizarGraficoRotor === 'function') actualizarGraficoRotor();
        if (typeof actualizarVistasLevitacion === 'function') actualizarVistasLevitacion();
        if (typeof calcularPasoFCEM === 'function') calcularPasoFCEM();
        if (typeof generarInformeAutomatico === 'function') generarInformeAutomatico();
    }, 100);
}

window.actualizarMasaTotalRotor = function() {
    const elPesoReal = document.getElementById('peso-total-real');
    let manualPeso = elPesoReal ? parseFloat(elPesoReal.value) : 0;
    
    // Base estimation for rotor components: shaft, structure, magnets
    const baseEje = 10; 
    const baseEstructura = 20;
    const baseImanes = 10;
    const paneles = 5; // approx
    const baseConstante = baseEje + baseEstructura + baseImanes + paneles;
    
    const masaCobre = EstadoDiseno.masaCobre || 0;
    const calculada = baseConstante + masaCobre;
    
    if (elPesoReal) {
        elPesoReal.placeholder = calculada.toFixed(1);
    }
    
    if (manualPeso > 0) {
        EstadoDiseno.masaTotal = manualPeso;
    } else {
        EstadoDiseno.masaTotal = calculada;
    }
};

window.actualizarResumenPesoManual = function() {
    actualizarMasaTotalRotor();
    if (typeof ejecutarMagpylibLevitacion === 'function') {
        // Si ya han usado el paso 9, recalcular al cambiar el peso
        const cont = document.getElementById('res-magpylib-levitacion');
        if (cont && cont.innerHTML.includes('Resultado')) {
            ejecutarMagpylibLevitacion();
        }
    }
};


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
                    
                    let paneles, hilos, imanes;
                    if (window.esAdmin) {
                        // El administrador descarga todos los componentes para poder moderarlos
                        const resP = await dbMendocinoClient.from('paneles').select('*');
                        const resH = await dbMendocinoClient.from('hilos').select('*');
                        const resI = await dbMendocinoClient.from('imanes').select('*');
                        paneles = resP.data; hilos = resH.data; imanes = resI.data;
                    } else {
                        // Usuarios normales solo descargan los suyos
                        const resP = await dbMendocinoClient.from('paneles').select('*').eq('usuario_id', uid);
                        const resH = await dbMendocinoClient.from('hilos').select('*').eq('usuario_id', uid);
                        const resI = await dbMendocinoClient.from('imanes').select('*').eq('usuario_id', uid);
                        paneles = resP.data; hilos = resH.data; imanes = resI.data;
                    }
                    
                    // 2. Cargar datos públicos (disponibles para todos)
                    const { data: pPub, error: errPP } = await dbMendocinoClient.from('paneles').select('*').eq('es_publico', true);
                    const { data: hPub, error: errHP } = await dbMendocinoClient.from('hilos').select('*').eq('es_publico', true);
                    const { data: iPub, error: errIP } = await dbMendocinoClient.from('imanes').select('*').eq('es_publico', true);

                    dbPanelesPublicos = pPub || [];
                    dbHilosPublicos = (hPub || []).map(h => parseFloat(h.diametro));
                    dbImanesPublicos = iPub || [];

                    // Limpieza de datos antiguos cacheados para evitar fantasmas
                    localStorage.removeItem('dbPaneles');
                    localStorage.removeItem('dbHilos');
                    localStorage.removeItem('dbImanes');
                    localStorage.removeItem('mendocino_historial_ensayos');

                    // Combinar evitando duplicados por ID en paneles e imanes
                    const mapPaneles = new Map();
                    [...(paneles || []), ...dbPanelesPublicos].forEach(p => mapPaneles.set(p.id || p.nombre, p));
                    dbPaneles = Array.from(mapPaneles.values());

                    const mapImanes = new Map();
                    [...(imanes || []), ...dbImanesPublicos].forEach(im => mapImanes.set(im.id || im.nombre, im));
                    dbImanes = Array.from(mapImanes.values());

                    // Para los hilos, combinamos y quitamos duplicados de diámetro
                    dbHilos = [...new Set([...(hilos || []).map(h => parseFloat(h.diametro)), ...dbHilosPublicos])];

                    // Fallback de defecto si todo está vacío
                    if (dbPaneles.length === 0) {
                        dbPaneles = [...defaultPaneles];
                        if (window.esAdmin && window.dbMendocinoClient && sessionActiva) {
                            const pData = defaultPaneles.map(p => ({...p, usuario_id: sessionActiva.user.id, es_publico: true, config: {}}));
                            window.dbMendocinoClient.from('paneles').insert(pData).then(() => {
                                console.log('Paneles por defecto subidos a la nube.');
                                setTimeout(() => window.location.reload(), 1500);
                            });
                        }
                    }
                    if (dbHilos.length === 0) {
                        dbHilos = [...defaultHilos];
                        if (window.esAdmin && window.dbMendocinoClient && sessionActiva) {
                            const hData = defaultHilos.map(h => ({diametro: h, usuario_id: sessionActiva.user.id, es_publico: true}));
                            window.dbMendocinoClient.from('hilos').insert(hData).then(() => console.log('Hilos por defecto subidos a la nube.'));
                        }
                    }
                    if (dbImanes.length === 0) {
                        dbImanes = [...defaultImanes];
                        if (window.esAdmin && window.dbMendocinoClient && sessionActiva) {
                            const iData = defaultImanes.map(im => ({...im, usuario_id: sessionActiva.user.id, es_publico: true}));
                            window.dbMendocinoClient.from('imanes').insert(iData).then(() => console.log('Imanes por defecto subidos a la nube.'));
                        }
                    }

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
            renderizarUI(); 
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

                // Poblado del selector de imán de sustentación (Paso 9)
                const selLevSust = document.getElementById('lev-sust-iman');
                if (selLevSust && Array.isArray(dbImanes)) {
                    const sustActual = selLevSust.value;
                    selLevSust.innerHTML = '';
                    dbImanes.forEach((im, index) => {
                        const texto = `${im.nombre} (${im.forma}) - ${im.br}T`;
                        selLevSust.innerHTML += `<option value="${index}">${texto}</option>`;
                    });

                    if (dbImanes.length === 0) {
                        selLevSust.innerHTML = '<option value="">Sin imanes</option>';
                    } else if (sustActual !== '' && Number(sustActual) >= 0 && Number(sustActual) < dbImanes.length) {
                        selLevSust.value = sustActual;
                    } else {
                        const idx = dbImanes.findIndex(im => String(im.forma || '').toLowerCase().includes('bloque'));
                        selLevSust.value = String(idx >= 0 ? idx : 0);
                    }
                }

                // Poblado del selector de imán del rotor (anular)
                const selLevRotor = document.getElementById('lev-rotor-iman');
                if (selLevRotor && Array.isArray(dbImanes)) {
                    const rotActual = selLevRotor.value;
                    selLevRotor.innerHTML = '';
                    let tieneAros = false;
                    dbImanes.forEach((im, index) => {
                        const forma = String(im.forma || '').toLowerCase();
                        if (forma.includes('aro') || forma.includes('anillo')) {
                            const texto = `${im.nombre} (${im.forma}) - ${im.br}T`;
                            selLevRotor.innerHTML += `<option value="${index}">${texto}</option>`;
                            tieneAros = true;
                        }
                    });

                    if (!tieneAros) {
                        selLevRotor.innerHTML = '<option value="">Sin imanes anulares en BD</option>';
                    } else if (rotActual !== '' && Number(rotActual) >= 0 && Number(rotActual) < dbImanes.length) {
                        selLevRotor.value = rotActual;
                    } else {
                        // Selección por defecto del primer imán anular
                        const idxAro = dbImanes.findIndex(im => String(im.forma || '').toLowerCase().includes('aro') || String(im.forma || '').toLowerCase().includes('anillo'));
                        if (idxAro >= 0) selLevRotor.value = String(idxAro);
                    }
                }

                document.getElementById('lista-paneles').innerHTML = dbPaneles.map((p, i) => {
                    const p_mW = p.v * p.i;
                    const r_ohm = p.i > 0 ? p.v / (p.i / 1000) : 0;
                    const ff = (p.voc * p.isc) > 0 ? (p.v * p.i) / (p.voc * p.isc) : 0;
                    let btnHtml = '';
                    const miUid = window.sessionActiva ? window.sessionActiva.user.id : null;
                    const esMio = p.usuario_id === miUid;
                    const adminUser = window.esAdmin;

                    if (adminUser) {
                        btnHtml += `<button onclick="togglePublicoPanel(${i})" style="font-size: 11px; padding: 3px 6px; margin-right: 8px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; transition: all 0.2s; ${p.es_publico ? 'background-color: #10b981; color: white; box-shadow: 0 2px 4px rgba(16,185,129,0.3);' : 'background-color: #cbd5e1; color: #475569;'}">${p.es_publico ? 'PÚBLICO ✓' : 'PRIVADO'}</button>`;
                    }
                    if (adminUser || esMio) {
                        btnHtml += `<button class="btn-action" style="font-size: 11px; padding: 3px 6px; margin-right: 8px; border: none; border-radius: 4px; cursor: pointer; background-color: #3b82f6; color: white;" onclick="editarPanel(${i})">Editar</button>`;
                        btnHtml += `<button class="btn-delete" onclick="borrarPanel(${i})">X</button>`;
                    }

                    return `<li style="font-size: 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px; ${p.es_publico ? 'border-left: 3px solid #10b981; padding-left: 5px; background-color: #f0fdf4;' : ''}">
                        <div style="flex-grow: 1;">
                            <strong>${p.nombre}</strong> (${p.l}x${p.a}mm) ${p.es_publico ? '<span style="font-size: 10px; background: #10b981; color: white; padding: 2px 5px; border-radius: 4px; margin-left: 5px; font-weight: bold;">PÚBLICO</span>' : ''}
                            <br>
                            <small>Voc: ${p.voc}V | Isc: ${p.isc}mA | V: ${p.v}V | I: ${p.i}mA</small><br>
                            <small style="color:var(--primary-color);"><strong>P:</strong> ${p_mW.toFixed(1)}mW | <strong>R ideal:</strong> ${r_ohm.toFixed(1)}Ω | <strong>FF:</strong> ${ff.toFixed(3)}</small>
                        </div>
                        <div style="display: flex; align-items: center;">
                            ${btnHtml}
                        </div>
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
                
                if (typeof actualizarSelectorHistorial === 'function') {
                    actualizarSelectorHistorial();
                }
                
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
                await dbMendocinoClient.from('hilos').insert([{ usuario_id: sessionActiva.user.id, diametro: dia, es_publico: false }]);
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
            
            const nuevoObj = { usuario_id: sessionActiva.user.id, nombre, voc, isc, v, i, l, a, es_publico: false };

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

            const uid = (window.sessionActiva && window.sessionActiva.user) ? window.sessionActiva.user.id : 'local';
            const nuevoObj = { usuario_id: uid, nombre, forma, l, a, h, br, es_publico: false };
            
            if (typeof supabase !== 'undefined' && supabase && uid !== 'local') {
                const { data, error } = await dbMendocinoClient.from('imanes').insert([nuevoObj]).select();
                if (error) {
                    console.error("Error insertando imán:", error);
                    alert("Error guardando en la nube: " + error.message);
                    return;
                }
                await cargarDatosGlobales();
                renderizarUI();
            } else {
                dbImanes.push({ nombre, forma, l, a, h, br });
                guardarDatos();
            }
            document.querySelectorAll('#db-iman-nombre, #db-iman-br, #db-iman-l, #db-iman-a, #db-iman-h').forEach(el => el.value = '');
            mostrarToast(`Imán "${nombre}" añadido correctamente.`, 'ok');
        }

        window.togglePublicoPanel = async function(index) {
            if (!window.esAdmin) return;
            try {
                const p = dbPaneles[index];
                if (!p.id) {
                    mostrarToast("Este panel no está sincronizado en la nube.", "error");
                    return;
                }
                const nuevoEstado = !p.es_publico;
                const { data, error } = await window.dbMendocinoClient
                    .from('paneles')
                    .update({ es_publico: nuevoEstado })
                    .eq('id', p.id)
                    .select();
                
                if (error) throw error;
                if (!data || data.length === 0) {
                    throw new Error("Supabase ha bloqueado la actualización por seguridad (RLS). Debes añadir una política UPDATE para la tabla 'paneles' en tu dashboard.");
                }
                
                p.es_publico = nuevoEstado;
                renderizarUI();
                mostrarToast(nuevoEstado ? "Panel verificado y publicado." : "Panel marcado como privado.", "ok");
            } catch(err) {
                alert("Error al cambiar visibilidad: " + err.message);
            }
        };

        window.editarPanel = function(index) {
            const p = dbPaneles[index];
            if (!p) return;
            
            const modal = document.getElementById('modal-dialogo');
            const t = document.getElementById('modal-dialogo-titulo');
            const m = document.getElementById('modal-dialogo-mensaje');
            const btnAceptar = document.getElementById('modal-dialogo-btn-aceptar');
            const btnCancelar = document.getElementById('modal-dialogo-btn-cancelar');
            const iCont = document.getElementById('modal-dialogo-input-cont');
            
            if (!modal || !t || !m) return;

            t.innerText = "Editar Placa Solar";
            if (iCont) iCont.style.display = 'none';
            
            m.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:12px; text-align:left; font-size: 14px; color: #334155;">
                    <div style="display:flex; flex-direction:column; gap:4px;">
                        <label style="font-weight:600;">Identificador Panel</label>
                        <input type="text" id="edit-panel-nombre" value="${p.nombre}" style="padding:8px; border:1px solid #cbd5e1; border-radius:4px; width:100%; box-sizing:border-box;">
                    </div>
                    <div style="display:flex; gap:15px;">
                        <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
                            <label style="font-weight:600;">L Ext. (mm)</label>
                            <input type="number" id="edit-panel-l" value="${p.l}" style="padding:8px; border:1px solid #cbd5e1; border-radius:4px; width:100%; box-sizing:border-box;">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
                            <label style="font-weight:600;">A Ext. (mm)</label>
                            <input type="number" id="edit-panel-a" value="${p.a}" style="padding:8px; border:1px solid #cbd5e1; border-radius:4px; width:100%; box-sizing:border-box;">
                        </div>
                    </div>
                    <div style="display:flex; gap:15px;">
                        <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
                            <label style="font-weight:600;">Tensión Voc (V)</label>
                            <input type="number" step="0.01" id="edit-panel-voc" value="${p.voc}" style="padding:8px; border:1px solid #cbd5e1; border-radius:4px; width:100%; box-sizing:border-box;">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
                            <label style="font-weight:600;">Corriente Isc (mA)</label>
                            <input type="number" step="1" id="edit-panel-isc" value="${p.isc}" style="padding:8px; border:1px solid #cbd5e1; border-radius:4px; width:100%; box-sizing:border-box;">
                        </div>
                    </div>
                    
                    <div style="font-weight:700; color:#1e40af; border-bottom:1px solid #cbd5e1; padding-bottom:5px; margin-top:5px;">Metadatos (Opcional)</div>
                    
                    <div style="display:flex; gap:15px;">
                        <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
                            <label style="font-weight:600;">L Silicio (mm)</label>
                            <input type="number" id="edit-panel-l-sil" value="${(p.ensayo_data && p.ensayo_data.l_sil) || ''}" style="padding:8px; border:1px solid #cbd5e1; border-radius:4px; width:100%; box-sizing:border-box;">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
                            <label style="font-weight:600;">A Silicio (mm)</label>
                            <input type="number" id="edit-panel-a-sil" value="${(p.ensayo_data && p.ensayo_data.a_sil) || ''}" style="padding:8px; border:1px solid #cbd5e1; border-radius:4px; width:100%; box-sizing:border-box;">
                        </div>
                    </div>
                    
                    <div style="display:flex; gap:15px;">
                        <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
                            <label style="font-weight:600;">Fuente Luz</label>
                            <select id="edit-panel-luz" style="padding:8px; border:1px solid #cbd5e1; border-radius:4px; width:100%; box-sizing:border-box;">
                                <option value="halogena" ${((p.ensayo_data && p.ensayo_data.luz) || 'halogena') === 'halogena' ? 'selected' : ''}>Halógena</option>
                                <option value="led" ${((p.ensayo_data && p.ensayo_data.luz) || '') === 'led' ? 'selected' : ''}>LED</option>
                                <option value="sol" ${((p.ensayo_data && p.ensayo_data.luz) || '') === 'sol' ? 'selected' : ''}>Luz Solar Directa</option>
                            </select>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
                            <label style="font-weight:600;">Distancia (mm)</label>
                            <input type="number" id="edit-panel-distancia" value="${(p.ensayo_data && p.ensayo_data.distancia) || '156'}" style="padding:8px; border:1px solid #cbd5e1; border-radius:4px; width:100%; box-sizing:border-box;">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
                            <label style="font-weight:600;">Ilum. (Lux)</label>
                            <input type="number" id="edit-panel-lux" value="${(p.ensayo_data && p.ensayo_data.lux) || ''}" style="padding:8px; border:1px solid #cbd5e1; border-radius:4px; width:100%; box-sizing:border-box;">
                        </div>
                    </div>

                    <div style="display:flex; gap:15px;">
                        <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
                            <label style="font-weight:600;">Proveedor</label>
                            <input type="text" id="edit-panel-proveedor" value="${(p.ensayo_data && p.ensayo_data.proveedor) || ''}" style="padding:8px; border:1px solid #cbd5e1; border-radius:4px; width:100%; box-sizing:border-box;">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:4px; flex:0.7;">
                            <label style="font-weight:600;">Precio (€)</label>
                            <input type="number" step="0.01" id="edit-panel-precio" value="${(p.ensayo_data && p.ensayo_data.precio) || ''}" style="padding:8px; border:1px solid #cbd5e1; border-radius:4px; width:100%; box-sizing:border-box;">
                        </div>
                        <div style="display:flex; flex-direction:column; gap:4px; flex:0.7;">
                            <label style="font-weight:600;">Peso (g)</label>
                            <input type="number" step="0.1" id="edit-panel-peso" value="${(p.ensayo_data && p.ensayo_data.peso) || ''}" style="padding:8px; border:1px solid #cbd5e1; border-radius:4px; width:100%; box-sizing:border-box;">
                        </div>
                    </div>
                </div>
            `;
            
            btnAceptar.onclick = async function() {
                const nuevoNombre = document.getElementById('edit-panel-nombre').value.trim();
                const nuevoL = parseFloat(document.getElementById('edit-panel-l').value);
                const nuevoA = parseFloat(document.getElementById('edit-panel-a').value);
                const nuevoVoc = parseFloat(document.getElementById('edit-panel-voc').value);
                const nuevoIsc = parseFloat(document.getElementById('edit-panel-isc').value);
                
                const n_l_sil = document.getElementById('edit-panel-l-sil').value;
                const n_a_sil = document.getElementById('edit-panel-a-sil').value;
                const n_luz = document.getElementById('edit-panel-luz').value;
                const n_distancia = document.getElementById('edit-panel-distancia').value;
                const n_lux = document.getElementById('edit-panel-lux').value;
                const n_proveedor = document.getElementById('edit-panel-proveedor').value;
                const n_precio = document.getElementById('edit-panel-precio').value;
                const n_peso = document.getElementById('edit-panel-peso').value;
                
                if (!nuevoNombre || isNaN(nuevoL) || isNaN(nuevoA) || nuevoL <= 0 || nuevoA <= 0) {
                    alert("Por favor, rellena nombre, largo y ancho con valores válidos.");
                    return;
                }
                
                const oldNombre = p.nombre;
                
                p.nombre = nuevoNombre;
                p.l = nuevoL;
                p.a = nuevoA;
                p.voc = isNaN(nuevoVoc) ? 0 : nuevoVoc;
                p.isc = isNaN(nuevoIsc) ? 0 : nuevoIsc;
                
                if (!p.ensayo_data) p.ensayo_data = { puntos: [] };
                p.ensayo_data.l_sil = n_l_sil;
                p.ensayo_data.a_sil = n_a_sil;
                p.ensayo_data.luz = n_luz;
                p.ensayo_data.distancia = n_distancia;
                p.ensayo_data.lux = n_lux;
                p.ensayo_data.proveedor = n_proveedor;
                p.ensayo_data.precio = n_precio;
                p.ensayo_data.peso = n_peso;
                
                try {
                    btnAceptar.innerText = "Guardando...";
                    btnAceptar.disabled = true;
                    
                    if (p.id && window.dbMendocinoClient) {
                        const { error } = await dbMendocinoClient.from('paneles').update({
                            nombre: p.nombre, l: p.l, a: p.a, voc: p.voc, isc: p.isc, ensayo_data: p.ensayo_data
                        }).eq('id', p.id);
                        if (error) throw error;
                    }
                    
                    guardarDatos();
                    
                    // Si el panel tenía ensayos, actualizar el selector si estaba cargado
                    if (typeof actualizarSelectorHistorial === 'function') {
                        actualizarSelectorHistorial();
                        const sel = document.getElementById('ensayo-historial-select');
                        // Si estaba seleccionado actualmente, recargamos el nombre en el input principal
                        if (sel && (sel.value === 'db_' + oldNombre || sel.value === 'placa_' + oldNombre)) {
                            sel.value = (sel.value.startsWith('db_') ? 'db_' : 'placa_') + nuevoNombre;
                            const inpNom = document.getElementById('ensayo-nombre-panel');
                            if (inpNom) inpNom.value = nuevoNombre;
                        }
                    }
                    
                    renderizarUI();
                    modal.style.display = 'none';
                    mostrarToast('Panel actualizado correctamente.', 'ok');
                } catch (e) {
                    console.error("Error al editar panel:", e);
                    alert("Error en la nube: " + e.message);
                } finally {
                    btnAceptar.innerText = "Aceptar";
                    btnAceptar.disabled = false;
                }
            };
            
            btnCancelar.onclick = () => modal.style.display = 'none';
            modal.style.display = 'flex';
        };

        async function borrarPanel(index) { 
            try {
                if (window.dbMendocinoClient && dbPaneles[index] && dbPaneles[index].id) {
                    const { error } = await dbMendocinoClient.from('paneles').delete().eq('id', dbPaneles[index].id);
                    if (error) throw error;
                    
                    dbPaneles.splice(index, 1);
                    guardarDatos();
                    
                    await cargarDatosGlobales();
                    renderizarUI();
                } else {
                    dbPaneles.splice(index, 1); 
                    guardarDatos(); 
                }
            } catch (error) {
                console.error("Error al borrar panel:", error);
                alert("Error al borrar panel: " + error.message);
            }
        }
        async function borrarHilo(index) { 
            try {
                if (typeof supabase !== 'undefined' && supabase && sessionActiva) {
                    const uid = sessionActiva.user.id;
                    const { error } = await dbMendocinoClient.from('hilos').delete().eq('usuario_id', uid).eq('diametro', dbHilos[index]);
                    if (error) throw error;
                    
                    dbHilos.splice(index, 1);
                    guardarDatos();

                    await cargarDatosGlobales();
                    renderizarUI();
                } else {
                    dbHilos.splice(index, 1); 
                    guardarDatos(); 
                }
            } catch (error) {
                console.error("Error al borrar hilo:", error);
                alert("Error al borrar hilo: " + error.message);
            }
        }
        async function borrarIman(index) { 
            try {
                if (window.dbMendocinoClient && dbImanes[index] && dbImanes[index].id) {
                    const { error } = await dbMendocinoClient.from('imanes').delete().eq('id', dbImanes[index].id);
                    if (error) throw error;
                    
                    dbImanes.splice(index, 1);
                    guardarDatos();

                    await cargarDatosGlobales();
                    renderizarUI();
                } else {
                    dbImanes.splice(index, 1); 
                    guardarDatos(); 
                }
            } catch (error) {
                console.error("Error al borrar imán:", error);
                alert("Error al borrar imán: " + error.message);
            }
        }

        // --- NAVEGACIÓN ---
        function cambiarPagina(pagina) {
            document.querySelectorAll('.page-container').forEach(el => {
                el.classList.remove('active');
                el.style.display = ''; // Limpiar estilos inline
            });
            document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
            
            const selectorMaquina = document.getElementById('maquina-selector');
            const maquinaActual = selectorMaquina ? selectorMaquina.value : 'mendocino';

            if (pagina === 'calc') {
                if (typeof window.cambiarMaquina === 'function') {
                    window.cambiarMaquina(maquinaActual);
                } else {
                    document.getElementById('page-calc').classList.add('active');
                }
            } else {
                if (maquinaActual !== 'mendocino') {
                    // Mostrar "En construcción" adaptado al módulo (Componentes, Proyectos, Montaje)
                    let pageConstruccion = document.getElementById('page-construccion');
                    if (!pageConstruccion) {
                        pageConstruccion = document.createElement('div');
                        pageConstruccion.id = 'page-construccion';
                        pageConstruccion.className = 'page-container active';
                        const mainContent = document.querySelector('.app-main-content');
                        if (mainContent) mainContent.appendChild(pageConstruccion);
                    }
                    
                    const nombresModulo = {
                        'db': 'Base de Componentes',
                        'videos': 'Proyectos y Galería',
                        'montaje': 'Manuales de Montaje',
                        'ayuda': 'Manual de Ayuda'
                    };
                    const nombreMod = nombresModulo[pagina] || 'Módulo';
                    
                    pageConstruccion.innerHTML = `
                        <div class="card" style="width: 100%;">
                            <div class="header">
                                <h1>${nombreMod} <span style="font-size: 0.5em; color: #94a3b8;">v1.0</span></h1>
                                <p>Gestión de contenidos específicos para la máquina seleccionada</p>
                            </div>
                            <div class="content" style="display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 100px 20px;">
                                <h2 style="color: #2c3e50; font-size: 28px; margin-bottom: 15px;">🚧 Sección en Construcción</h2>
                                <p style="color: #64748b; font-size: 16px;">La sección de ${nombreMod.toLowerCase()} para este simulador se publicará próximamente.</p>
                            </div>
                        </div>
                    `;
                    pageConstruccion.classList.add('active');
                    pageConstruccion.style.display = 'block';
                } else {
                    // Mendocino clásico
                    document.getElementById('page-' + pagina).classList.add('active');
                }
            }
            document.getElementById('tab-' + pagina).classList.add('active');
        }


        // --- LÓGICA DE CÁLCULO ---

        // --- PASO 1: GEOMETRÍA ---
        function actualizarResumenPaso1(fromStep1 = false) {
            if (dbPaneles.length === 0) return;

            EstadoDiseno.numeroCaras = parseInt(document.getElementById('caras').value); 
            const indexPanel = document.getElementById('panel').value;
            const panel = dbPaneles[indexPanel];
            if (!panel) return;

            // Sincronizar hacia el Paso 1
            if (!fromStep1) {
                const elHist = document.getElementById('ensayo-historial-select');
                if (elHist) {
                    for (let i = 0; i < elHist.options.length; i++) {
                        if (elHist.options[i].value === 'db_' + panel.nombre || elHist.options[i].value === 'placa_' + panel.nombre) {
                            if (elHist.selectedIndex !== i) {
                                elHist.selectedIndex = i;
                                setTimeout(() => {
                                    if (typeof cargarEnsayoDesdeHistorial === 'function') {
                                        cargarEnsayoDesdeHistorial(true);
                                    }
                                }, 10);
                            }
                            break;
                        }
                    }
                }
            }

            EstadoDiseno.longitudPanel = panel.l || 0;
            EstadoDiseno.anchoPanel = panel.a || 0;
            
            // Área activa del panel
            EstadoDiseno.l_sil = panel.ensayo_data ? panel.ensayo_data.l_sil : null;
            EstadoDiseno.a_sil = panel.ensayo_data ? panel.ensayo_data.a_sil : null;


            EstadoDiseno.profundidadRanura_mm = parseFloat(document.getElementById('ranura-alto')?.value || 0) || 0;
            
            EstadoDiseno.intensidadPanel_mA = panel.i; 

            const inputMargen = document.getElementById('margen-placa');
            EstadoDiseno.margenMarco_mm = inputMargen ? (parseFloat(inputMargen.value) || 0) : 0;
            
            const inputEje = document.getElementById('diametro-eje');
            EstadoDiseno.diametroEje = inputEje ? (parseFloat(inputEje.value) || 8) : 8;

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
                    
                    // Input removido, ya no actualizamos la vista de Paso 4 desde aquí
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
            dibujarPanelSVG(EstadoDiseno.longitudPanel, Wp, EstadoDiseno.margenMarco_mm, EstadoDiseno.l_sil, EstadoDiseno.a_sil);
            // Actualizar cálculos eléctricos y ocupación
            calcularPaso2();
            calcularOcupacionRanura(); 
            calcularPasoMagnetico();
            if (typeof calcularPasoLuminico === 'function') calcularPasoLuminico();
        }

        // --- DIBUJO GEOMÉTRICO (SVG) ---
        function dibujarRotorSVG() {
            window.dibujarRotorSVG = dibujarRotorSVG; // Exponer globalmente para la Fase 8
            const N = EstadoDiseno.numeroCaras;
            const tipoRanura = document.getElementById('ranura-tipo')?.value || 'rect';
            const Wp = EstadoDiseno.anchoPanel;
            const Ws = EstadoDiseno.anchoRanura_mm;
            const Ds = EstadoDiseno.altoRanura_mm;
            const R = EstadoDiseno.radioCircunscrito;
            const angP = EstadoDiseno.anguloPanel;
            const angS = EstadoDiseno.anguloRanura;

            const ids = ['rotor-svg', 'rotor-svg-step2', 'rotor-equilibrado-svg'];
            
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
                
                const rEjePx = (EstadoDiseno.diametroEje / 2) * escala;
                eje.setAttribute("r", rEjePx);
                
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
        function dibujarPanelSVG(Lp, Wp, margen, L_sil, A_sil) {
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
                // Reducimos el padding (0.3) para que el gráfico se vea mucho más grande
                const pad = maxDim * 0.3; 
                
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
                
                // 2.5 Zona Activa (Interior del silicio)
                if (L_sil && A_sil && L_sil <= Lp && A_sil <= Wp) {
                    const actX = pad + margen + (Lp - L_sil) / 2;
                    const actY = pad + margen + (Wp - A_sil) / 2;
                    
                    // Aseguramos que existe el patrón de texturizado
                    let defs = svg.querySelector("defs");
                    if (!defs) {
                        defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
                        svg.appendChild(defs);
                    }
                    if (!document.getElementById("patron-activa")) {
                        const pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
                        pattern.setAttribute("id", "patron-activa");
                        pattern.setAttribute("width", "6");
                        pattern.setAttribute("height", "6");
                        pattern.setAttribute("patternUnits", "userSpaceOnUse");
                        
                        const pLine1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
                        pLine1.setAttribute("x1", "0"); pLine1.setAttribute("y1", "6");
                        pLine1.setAttribute("x2", "6"); pLine1.setAttribute("y2", "0");
                        pLine1.setAttribute("stroke", "#3498db");
                        pLine1.setAttribute("stroke-width", "0.5");
                        pattern.appendChild(pLine1);
                        defs.appendChild(pattern);
                    }

                    const zonaActiva = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    zonaActiva.setAttribute("x", actX);
                    zonaActiva.setAttribute("y", actY);
                    zonaActiva.setAttribute("width", L_sil);
                    zonaActiva.setAttribute("height", A_sil);
                    zonaActiva.setAttribute("fill", "url(#patron-activa)");
                    zonaActiva.setAttribute("stroke", "#3498db");
                    zonaActiva.setAttribute("stroke-width", "0.5");
                    zonaActiva.setAttribute("stroke-dasharray", "2,2");
                    svg.appendChild(zonaActiva);
                }

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
                    txtMargen.setAttribute("x", pad);
                    txtMargen.setAttribute("y", yCotaMargen - (fontSize * 0.5));
                    txtMargen.setAttribute("style", `font-size: ${fontSize * 1.1}px; font-family: sans-serif; fill: #e74c3c; text-anchor: start; font-weight: bold;`);
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
            
            const animHilo = document.getElementById('anim-bob-hilo');
            if (animHilo) {
                animHilo.innerHTML = selHilo.innerHTML;
                animHilo.value = selHilo.value;
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
                
                EstadoDiseno.masaCobre = masaTotal_g;
                if (typeof actualizarMasaTotalRotor === 'function') {
                    actualizarMasaTotalRotor();
                }

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

    // El campo B principal ahora se calcula y asigna en actualizarCalculosBackendMagnet
    const campoB = EstadoDiseno.campoB_T || 0.18;
    
    // El radio efectivo ahora lo calcula Magpylib vectorialmente,
    // pero para el cálculo analítico base usamos el radio del rotor.
    const radioEfectivo_m = (EstadoDiseno.diametroRotor || 0) / 2000; 

    const longitudActiva_m = EstadoDiseno.longitudActiva_m || 0;

    EstadoDiseno.radioEfectivo_m = radioEfectivo_m;

    const fmm = espiras * corrienteA;

    // Fuerza de Lorentz únicamente por el imán principal
    const fuerzaLorentz = campoB * corrienteA * longitudActiva_m * espiras;
    const par = fuerzaLorentz * radioEfectivo_m;

    EstadoDiseno.fmm_Av = fmm;
    EstadoDiseno.fuerzaLorentz_N = fuerzaLorentz;
    EstadoDiseno.par_Nm = par;
    EstadoDiseno.usandoParMagpylib = false; // Indica que usamos aproximación analítica

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
    setText('mag-b-preview', `${campoB.toFixed(3)} T`);

    setText('res-fmm', `${fmm.toFixed(2)} Av`);
    
    // Mostramos temporalmente el teórico mientras esperamos a Magpylib
    const elLorentz = document.getElementById('res-lorentz');
    if (elLorentz) elLorentz.innerHTML = `<span style="color:#94a3b8; font-size:12px;">Calculando 3D...</span>`;
    
    const elPar = document.getElementById('res-par');
    if (elPar) elPar.innerHTML = `<span style="color:#94a3b8; font-size:12px;">Calculando 3D...</span>`;
    
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

    // LLL: Llamada asíncrona a Magpylib para "Cálculo Real"
    if (typeof window.actualizarMagpylibFondo === 'function') {
        window.actualizarMagpylibFondo();
    }
}

window.actualizarMagpylibFondo = function() {
    if (window.debounceMagpylibTimeout) clearTimeout(window.debounceMagpylibTimeout);
    window.debounceMagpylibTimeout = setTimeout(async () => {
        try {
            const corrienteA = (EstadoDiseno.intensidadPanel_mA || 0) / 1000;
            const espiras = EstadoDiseno.espirasPorDevanado || 0;
            
            const diametro = parseFloat(document.getElementById('diametro')?.value) || EstadoDiseno.diametroRotor || 30;
            const longitud = parseFloat(document.getElementById('longitud')?.value) || EstadoDiseno.longitudPanel || 30;
            const orientacion = document.getElementById('iman-orientacion')?.value || 'long';
            const distancia = parseFloat(document.getElementById('iman-distancia')?.value || 2.0);
            
            const selIman = document.getElementById('iman-motor')?.value;
            const imanData = typeof dbImanes !== 'undefined' ? dbImanes[Number(selIman)] : null;
            
            let dimIman = [30, 15, 5]; // Default [Largo, Ancho, Grosor]
            let magnetizacion = 1.20;
            
            if (imanData) {
                const dims = [Number(imanData.l), Number(imanData.a), Number(imanData.h)];
                const T = Math.min(...dims); // espesor (Z)
                const baseDims = dims.filter((_, i) => i !== dims.indexOf(T));
                dimIman = [Math.max(...baseDims), Math.min(...baseDims), T];
                magnetizacion = Number(imanData.br) || 1.20;
            }
            
            const polaridad = parseInt(document.getElementById('iman-polaridad')?.value) || 1;
            
            let imanesBasePayload = [];
            const z_pos = - (diametro/2 + distancia + dimIman[2]/2);
            
            const magZ = magnetizacion * polaridad;

            if (orientacion === 'long') {
                imanesBasePayload.push({ dimension: dimIman, magnetizacion: [0, 0, magZ], posicion: [0, 0, z_pos] });
            } else {
                imanesBasePayload.push({ dimension: [dimIman[1], dimIman[0], dimIman[2]], magnetizacion: [0, 0, magZ], posicion: [0, 0, z_pos] });
            }

            const caras = EstadoDiseno?.numeroCaras || 4;
            const numDevanados = Math.max(1, Math.floor(caras / 2));
            const bobinasPayload = [];
            
            let currents = null;
            if (window.estadoLuminico && window.estadoLuminico.currents && window.estadoLuminico.currents.length >= caras) {
                currents = window.estadoLuminico.currents;
            }
            
            for (let i = 0; i < numDevanados; i++) {
                let bobinaCorriente = 0;
                if (currents) {
                    bobinaCorriente = corrienteA * currents[i];
                } else {
                    bobinaCorriente = i === 0 ? corrienteA : 0;
                }
                if (Math.abs(bobinaCorriente) < 1e-5) bobinaCorriente = 0.000001;

                // Magpylib usa coordenadas donde giro positivo es antihorario.
                // SVG usa giro positivo como horario. Aplicamos el negativo para sincronizar.
                const giro_deg = (window.estadoLuminico && window.estadoLuminico.giro !== undefined) ? window.estadoLuminico.giro : parseFloat(document.getElementById('lum-giro')?.value || document.getElementById('giro_motor')?.value || 0);
                const offset_ranura = 180 / caras;
                const angulo_final = - (i * (360 / caras) + offset_ranura + giro_deg);

                bobinasPayload.push({
                    dimension: [longitud, diametro],
                    vueltas: espiras,
                    corriente: bobinaCorriente,
                    angulo_x: angulo_final,
                    posicion: [0, 0, 0]
                });
            }

            const payload = {
                calc_only: true,
                imanes_base: imanesBasePayload,
                bobinas: bobinasPayload
            };
            console.log("Magpylib Payload:", JSON.stringify(payload));

            const response = await fetch('https://magpylib-api-mendocino.onrender.com/api/magpylib-forces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success') {
                    const realTorque = data.torque_x;
                    const realForce = Math.sqrt(data.force_vector[0]**2 + data.force_vector[1]**2 + data.force_vector[2]**2);
                    
                    // Extraer y formatear el Campo B
                    let b_mag = 0;
                    if (data.b_field) {
                        b_mag = Math.sqrt(data.b_field[0]**2 + data.b_field[1]**2 + data.b_field[2]**2);
                    }
                    EstadoDiseno.campoB_T = b_mag; // Actualizamos el teórico al real
                    
                    const elCampoB = document.getElementById('res-campo-b');
                    if (elCampoB) {
                        if (b_mag >= 0.01) {
                            elCampoB.innerHTML = `${(b_mag*1000).toFixed(2)} mT <span style="font-size:10px; color:#666;">(${(b_mag*10000).toFixed(0)} G)</span>`;
                        } else if (b_mag >= 0.0001) {
                            elCampoB.innerHTML = `${(b_mag*1000).toFixed(3)} mT <span style="font-size:10px; color:#666;">(${(b_mag*1000000).toFixed(0)} µT)</span>`;
                        } else {
                            elCampoB.innerHTML = `${(b_mag*1000000).toFixed(1)} µT`;
                        }
                    }
                    
                    // REEMPLAZO TOTAL DE VARIABLES DE CÁLCULO
                    EstadoDiseno.fuerzaLorentz_N = realForce;
                    EstadoDiseno.fuerzaLorentz_X = data.force_vector ? data.force_vector[0] : 0;
                    EstadoDiseno.fuerzaLorentz_Y = data.force_vector ? data.force_vector[1] : 0;
                    EstadoDiseno.fuerzaLorentz_Z = data.force_vector ? data.force_vector[2] : 0;
                    EstadoDiseno.par_Nm = Math.abs(realTorque); // Magpylib output is natively in Nm
                    EstadoDiseno.par_Nm_X = realTorque; // Conservamos el signo real
                    window.parMotrizMagnetico = EstadoDiseno.par_Nm;
                    EstadoDiseno.usandoParMagpylib = true; // Activa el flag para el Paso 7
                    
                    const elTorque = document.getElementById('res-par');
                    if (elTorque) {
                        elTorque.innerHTML = `${EstadoDiseno.par_Nm.toExponential(3)} N·m`;
                    }
                    
                    const elForce = document.getElementById('res-lorentz');
                    if (elForce) {
                        elForce.innerHTML = `${EstadoDiseno.fuerzaLorentz_N.toExponential(3)} N`;
                    }
                    
                    const elLectura = document.getElementById('res-lectura-magnetica');
                    if (elLectura) {
                        let lectura = 'Par minúsculo';
                        if (EstadoDiseno.par_Nm > 0.001) lectura = 'Par excelente';
                        else if (EstadoDiseno.par_Nm > 0.0001) lectura = 'Par moderado';
                        else if (EstadoDiseno.par_Nm > 0.00001) lectura = 'Par débil';
                        
                        elLectura.textContent = lectura;
                        elLectura.style.color = EstadoDiseno.par_Nm > 0.0001 ? '#2ecc71' : '#f39c12';
                    }
                    
                    // Update step 4 UI if open
                    const resObj3 = document.getElementById('lum-res-par');
                    if(resObj3 && window.estadoLuminico) {
                        resObj3.innerHTML = `${(EstadoDiseno.par_Nm * window.estadoLuminico.factor).toFixed(6)} N·m`;
                    }
                    
                    // Redibujar SVG con los vectores físicos exactos
                    if (typeof dibujarInteraccionMagneticaSVG === 'function') {
                        dibujarInteraccionMagneticaSVG();
                    }
                    
                    // Propagar a Paso 5 y 6
                    if (typeof calcularPasoFCEM === 'function') {
                        calcularPasoFCEM();
                    }
                } else {
                    throw new Error("Magpylib API returned error status");
                }
            } else {
                throw new Error("HTTP " + response.status);
            }
        } catch(e) {
            console.log("Magpylib API off. Usando fórmulas teóricas de respaldo.", e);
            // Restaurar visualmente los teóricos si falla
            const fuerzaLorentz = EstadoDiseno.campoB_T * ((EstadoDiseno.intensidadPanel_mA || 0) / 1000) * EstadoDiseno.longitudActiva_m * EstadoDiseno.espirasPorDevanado;
            const par = fuerzaLorentz * EstadoDiseno.radioEfectivo_m;
            document.getElementById('res-lorentz').innerHTML = `${fuerzaLorentz.toFixed(4)} N <span style="color:#f59e0b; font-size:10px;">(Aprox)</span>`;
            document.getElementById('res-par').innerHTML = `${par.toFixed(6)} N·m <span style="color:#f59e0b; font-size:10px;">(Aprox)</span>`;
            
            if (typeof calcularPasoFCEM === 'function') calcularPasoFCEM();
        }
    }, 400);
};

function dibujarInteraccionMagneticaSVG() {
    const svg = document.getElementById('magnetismo-svg');
    if (!svg) return;

    svg.innerHTML = ''; // Limpiar lienzo

    const R = (EstadoDiseno.diametroRotor || 50) / 2;
    const cx = 100;
    const cy = 85; // Centro ajustado
    const factorEscala = 82 / R; // Escala ampliada para coincidir con el paso 2 y 3
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
    
    // Ajustar viewBox dinámicamente para que el imán nunca se corte por abajo
    const maxBoundY = imanY + imanHeight;
    const vHeight = Math.max(210, maxBoundY + 15);
    // Expandimos ligeramente hacia arriba (-5) y ajustamos la altura total
    svg.setAttribute('viewBox', `0 -5 200 ${vHeight + 5}`);

    // --- 2. DIBUJO DE LÍNEAS B (Flujo Magnético Realista) ---
    const numLineas = Math.min(15, Math.max(3, Math.floor(campoB * 30)));
    const expansionFactor = 1.35; // Factor de divergencia (cuánto se abren las líneas)
    
    for(let i=0; i<numLineas; i++){
        // lx1: Punto de origen en la superficie del imán
        const lx1 = cx - (imanWidth/2) + (imanWidth*0.1) + (i * ((imanWidth*0.8) / Math.max(1, numLineas-1)));
        
        // lx2: Punto de destino (ahora con un margen para no solapar con el rotor)
        const dx = lx1 - cx;
        const expansionFactor = 1.35; 
        const lx2 = cx + dx * expansionFactor;
        const yDest = cy + radioRotorSVG + 8; // Aumentado margen de 2 a 8
        
        // Generamos un camino curvo (Bezier cuadrática)
        const pathB = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const cpX = lx1; 
        const cpY = imanY - (imanY - yDest) * 0.4;
        
        // Leer polaridad para la dirección del campo
        const polaridad = parseInt(document.getElementById('iman-polaridad')?.value) || 1;
        const esNorte = (polaridad === 1);

        const d = `M ${lx1} ${imanY} Q ${cpX} ${cpY} ${lx2} ${yDest + 2}`;
        pathB.setAttribute('d', d);
        pathB.setAttribute('stroke', '#3498db');
        pathB.setAttribute('stroke-width', '1.2');
        pathB.setAttribute('stroke-dasharray', '3,3');
        pathB.setAttribute('fill', 'none');
        pathB.setAttribute('opacity', 0.45 - (Math.abs(dx)/imanWidth)*0.3);
        
        // Flecha B
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        arrow.setAttribute('points', `0,0 -3,7 3,7`);
        arrow.setAttribute('fill', '#3498db'); 
        arrow.setAttribute('opacity', '0.5');
        
        if (esNorte) {
            // El campo sale del Norte (apunta hacia arriba al rotor)
            const anguloDeg = Math.atan2(yDest - cpY, lx2 - cpX) * 180 / Math.PI;
            arrow.setAttribute('transform', `translate(${lx2}, ${yDest}) rotate(${anguloDeg + 90})`);
        } else {
            // El campo entra al Sur (apunta hacia abajo al imán)
            const anguloDeg = Math.atan2(imanY - cpY, lx1 - cpX) * 180 / Math.PI;
            arrow.setAttribute('transform', `translate(${lx1}, ${imanY}) rotate(${anguloDeg - 90})`);
        }
        
        svg.appendChild(pathB); svg.appendChild(arrow);
    }

    // --- 3. IMÁN BASE (Bipolo: Norte Rojo / Sur Azul) a escala ---
    const hMedio = imanHeight / 2;
    
    const polaridad = parseInt(document.getElementById('iman-polaridad')?.value) || 1;
    
    // Parte Superior
    const colorSup = polaridad === 1 ? '#e74c3c' : '#3498db';
    const borderSup = polaridad === 1 ? '#c0392b' : '#2980b9';
    const textSup = polaridad === 1 ? 'N' : 'S';
    
    const rectSup = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rectSup.setAttribute('x', cx - imanWidth/2); rectSup.setAttribute('y', imanY);
    rectSup.setAttribute('width', imanWidth); rectSup.setAttribute('height', hMedio);
    rectSup.setAttribute('fill', colorSup); rectSup.setAttribute('stroke', borderSup);
    rectSup.setAttribute('stroke-width', '1'); rectSup.setAttribute('rx', '1');
    svg.appendChild(rectSup);
    
    const txtSup = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txtSup.setAttribute('x', cx); txtSup.setAttribute('y', imanY + hMedio - 2);
    txtSup.setAttribute('font-size', Math.min(11, hMedio*1.5)); txtSup.setAttribute('fill', 'white');
    txtSup.setAttribute('font-weight', 'bold'); txtSup.setAttribute('text-anchor', 'middle');
    txtSup.textContent = textSup;
    if (hMedio > 4) svg.appendChild(txtSup);

    // Parte Inferior
    const colorInf = polaridad === 1 ? '#3498db' : '#e74c3c';
    const borderInf = polaridad === 1 ? '#2980b9' : '#c0392b';
    const textInf = polaridad === 1 ? 'S' : 'N';
    
    const rectInf = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rectInf.setAttribute('x', cx - imanWidth/2); rectInf.setAttribute('y', imanY + hMedio);
    rectInf.setAttribute('width', imanWidth); rectInf.setAttribute('height', hMedio);
    rectInf.setAttribute('fill', colorInf); rectInf.setAttribute('stroke', borderInf);
    rectInf.setAttribute('stroke-width', '1'); rectInf.setAttribute('rx', '1');
    svg.appendChild(rectInf);
    
    const txtInf = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txtInf.setAttribute('x', cx); txtInf.setAttribute('y', imanY + imanHeight - 2);
    txtInf.setAttribute('font-size', Math.min(11, hMedio*1.5)); txtInf.setAttribute('fill', 'white');
    txtInf.setAttribute('font-weight', 'bold'); txtInf.setAttribute('text-anchor', 'middle');
    txtInf.textContent = textInf;
    if (hMedio > 4) svg.appendChild(txtInf);

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
    
    const strokeColor = getComputedStyle(document.documentElement).getPropertyValue('--svg-stroke-color').trim() || "#333";
    const colorImpresion3D = getComputedStyle(document.documentElement).getPropertyValue('--svg-panel-color').trim() || "#fdebd0";

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
    circuloExt.setAttribute("fill", "none"); circuloExt.setAttribute("stroke", "#777");
    circuloExt.setAttribute("stroke-width", "1");
    circuloExt.setAttribute("stroke-dasharray", "3");
    svg.appendChild(circuloExt);

    const pathRotor = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathRotor.setAttribute("d", dRotor);
    pathRotor.setAttribute("fill", colorImpresion3D);
    pathRotor.setAttribute("stroke", strokeColor);
    pathRotor.setAttribute("stroke-width", "1");
    svg.appendChild(pathRotor);

    // Dibujar placas solares
    const WpTotal = Wp + (2 * (EstadoDiseno.margenMarco_mm || 3));
    const proporcionPlaca = WpTotal > 0 ? (Wp / WpTotal) : 1;
    const angPlacaReal = angP * proporcionPlaca;

    for (let i = 0; i < N; i++) {
        const anguloCentroPanel = i * (angP + angS) - (Math.PI / 2) + rotOffset;
        const theta1 = anguloCentroPanel - (angPlacaReal / 2);
        const theta2 = anguloCentroPanel + (angPlacaReal / 2);

        const p1x = cx + radioRotorSVG * Math.cos(theta1);
        const p1y = cy + radioRotorSVG * Math.sin(theta1);
        const p2x = cx + radioRotorSVG * Math.cos(theta2);
        const p2y = cy + radioRotorSVG * Math.sin(theta2);

        const placaSol = document.createElementNS("http://www.w3.org/2000/svg", "line");
        placaSol.setAttribute("x1", p1x);
        placaSol.setAttribute("y1", p1y);
        placaSol.setAttribute("x2", p2x);
        placaSol.setAttribute("y2", p2y);
        placaSol.setAttribute("stroke", "#2c3e50"); 
        placaSol.setAttribute("stroke-width", "3");
        placaSol.setAttribute("stroke-linecap", "round");
        svg.appendChild(placaSol);
    }

    // Eje central de apoyo visual
    const ejeCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    ejeCircle.setAttribute("cx", cx); ejeCircle.setAttribute("cy", cy);
    const diametroEje_mm = EstadoDiseno?.diametroEje || 8;
    const rEjePx = (diametroEje_mm / 2) * factorEscala;
    ejeCircle.setAttribute("r", rEjePx); 
    ejeCircle.setAttribute("fill", "#fff");
    ejeCircle.setAttribute("stroke", strokeColor);
    ejeCircle.setAttribute("stroke-width", "1");
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

        // --- Símbolo Corriente (⊗ o ⊙) ---
        const csz = Math.max(2, devanadoR * 0.4);
        
        const conexion = document.getElementById('lum-conexion')?.value || '0';
        const isInvertido = (conexion === '-1');
        
        let esCruz = (sy > cy); // Originalmente cruz abajo
        if (isInvertido) {
            esCruz = !esCruz; // Invertido: punto abajo, cruz arriba
        }

        if (esCruz) {
            // Corriente ENTRA (x)
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
        } else {
            // Corriente SALE (o)
            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot.setAttribute('cx', sx); dot.setAttribute('cy', sy);
            dot.setAttribute('r', csz * 0.7);
            dot.setAttribute('fill', 'none');
            dot.setAttribute('stroke', '#fff'); dot.setAttribute('stroke-width', '1.2');
            svg.appendChild(dot);
            const dotFill = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dotFill.setAttribute('cx', sx); dotFill.setAttribute('cy', sy);
            dotFill.setAttribute('r', 1.5);
            dotFill.setAttribute('fill', '#fff');
            svg.appendChild(dotFill);
        }

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
            
            // Deducir fuerza unificada desde Magpylib como fuente de verdad
            const giroDir = window.obtenerDireccionGiro ? window.obtenerDireccionGiro() : 1;
            const giroEsHorario = (giroDir === 1);
            
            const fuerzaHaciaIzquierda = giroEsHorario; // Si gira horario, la base se mueve a la izquierda
            
            let f_x1, f_x2;
            if (fuerzaHaciaIzquierda) {
                // Apuntar hacia la IZQUIERDA
                f_x1 = sx - devanadoR - 8;
                f_x2 = f_x1 - F_len;
            } else {
                // Apuntar hacia la DERECHA
                f_x1 = sx + devanadoR + 8;
                f_x2 = f_x1 + F_len;
            }
            
            const F_y = sy;
            
            const fLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            fLine.setAttribute('x1', f_x1); fLine.setAttribute('y1', F_y);
            fLine.setAttribute('x2', f_x2); fLine.setAttribute('y2', F_y);
            fLine.setAttribute('stroke', '#e74c3c'); fLine.setAttribute('stroke-width', '4');
            svg.appendChild(fLine);
            
            const headOffset = fuerzaHaciaIzquierda ? 8 : -8;
            const fArrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            fArrow.setAttribute('points', `${f_x2},${F_y} ${f_x2 + headOffset},${F_y - 6} ${f_x2 + headOffset},${F_y + 6}`);
            fArrow.setAttribute('fill', '#e74c3c');
            svg.appendChild(fArrow);
        }
    }

    // --- 5. PAR ROTATORIO (CURVA) ---
    // Recalibración de grosor: más sutil (rango 2 a 7)
    const strokeW = Math.min(7, 2 + (parActivo * 120)); 
    const rx = radioRotorSVG + 14; // Reducido de 25 a 14 para que no se salga del canvas 
    
    const giroDir = window.obtenerDireccionGiro ? window.obtenerDireccionGiro() : 1;
    const giroHorario = (giroDir === 1);
    
    const tauPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    tauPath.setAttribute('stroke', '#2ecc71'); tauPath.setAttribute('stroke-width', strokeW);
    tauPath.setAttribute('fill', 'none');
    
    const headSize = Math.max(10, strokeW * 1.5);
    const tauArrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    tauArrow.setAttribute('fill', '#2ecc71');

    if (giroHorario) {
        // Sentido HORARIO
        const startX = cx - rx * 0.7; const startY = cy + rx * 0.7; // Empieza abajo izquierda
        const endX = cx - rx * 0.7;   const endY = cy - rx * 0.7;   // Termina arriba izquierda
        tauPath.setAttribute('d', `M ${startX} ${startY} A ${rx} ${rx} 0 0 1 ${endX} ${endY}`);
        
        // Flecha apuntando hacia arriba nativamente
        tauArrow.setAttribute('points', `0,0 ${-headSize/2},${headSize} ${headSize/2},${headSize}`);
        // Rotamos para que apunte hacia arriba-derecha siguiendo la curva horaria
        tauArrow.setAttribute('transform', `translate(${endX}, ${endY}) rotate(45)`);
    } else {
        // Sentido ANTIHORARIO
        const startX = cx + rx * 0.7; const startY = cy + rx * 0.7; // Empieza abajo derecha
        const endX = cx + rx * 0.7;   const endY = cy - rx * 0.7;   // Termina arriba derecha
        tauPath.setAttribute('d', `M ${startX} ${startY} A ${rx} ${rx} 0 0 0 ${endX} ${endY}`);
        
        tauArrow.setAttribute('points', `0,0 ${-headSize/2},${headSize} ${headSize/2},${headSize}`);
        tauArrow.setAttribute('transform', `translate(${endX}, ${endY}) rotate(-45)`);
    }
    
    svg.appendChild(tauPath);
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
    
    if (document.getElementById('step-6').classList.contains('active')) {
        dibujarInteraccionLuminicaSVG();
    }
    
    // Renderizar fórmulas matemáticas si existen en el nuevo paso
    if (typeof renderizarMatematicas === 'function') {
        setTimeout(renderizarMatematicas, 100);
    }
    
    // LLL: Desencadenar recálculo asíncrono de Magpylib usando los nuevos parámetros de luz
    if (typeof window.actualizarMagpylibFondo === 'function') {
        window.actualizarMagpylibFondo();
    }
}

// Función global para unificar el dibujo de la fuente de luz
window.generarSVGIconoFuenteLuz = function(tipoLuz) {
    let svg = '';
    let color = '#fef08a';
    
    if (tipoLuz === 'sol') {
        svg = '<text x="0" y="0" font-size="28" text-anchor="middle" dominant-baseline="central">☀️</text>';
        color = '#fde047';
    } else if (tipoLuz === 'incandescente') {
        svg = '<text x="0" y="0" font-size="28" text-anchor="middle" dominant-baseline="central" transform="rotate(180)">💡</text>';
        color = '#fef08a';
    } else if (tipoLuz === 'halogena') {
        svg = `
            <g transform="translate(-15, -15)">
                <line x1="10" y1="0" x2="10" y2="8" stroke="#94a3b8" stroke-width="2" />
                <line x1="20" y1="0" x2="20" y2="8" stroke="#94a3b8" stroke-width="2" />
                <polygon points="10,8 20,8 30,25 0,25" fill="#cbd5e1" stroke="#64748b" stroke-width="1.5" />
                <polygon points="12,10 18,10 26,24 4,24" fill="#f1f5f9" />
                <circle cx="15" cy="18" r="4" fill="#fef08a" />
            </g>`;
        color = '#fef08a';
    } else if (tipoLuz === 'fluorescente') {
        svg = `
            <g transform="translate(-40, -6)">
                <rect x="0" y="0" width="80" height="12" rx="6" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5" />
                <rect x="-2" y="1" width="4" height="10" fill="#cbd5e1" stroke="#64748b" stroke-width="1" />
                <rect x="78" y="1" width="4" height="10" fill="#cbd5e1" stroke="#64748b" stroke-width="1" />
                <line x1="10" y1="4" x2="70" y2="4" stroke="#ffffff" stroke-width="2" opacity="0.8" />
            </g>`;
        color = '#e2e8f0';
    } else if (tipoLuz === 'led') {
        svg = `
            <g transform="translate(-10, -15)">
                <line x1="7" y1="0" x2="7" y2="12" stroke="#94a3b8" stroke-width="1.5" />
                <line x1="13" y1="0" x2="13" y2="12" stroke="#94a3b8" stroke-width="1.5" />
                <rect x="4" y="12" width="12" height="3" fill="#bfdbfe" stroke="#60a5fa" stroke-width="1" />
                <path d="M 4,15 L 4,22 Q 10,32 16,22 L 16,15 Z" fill="#eff6ff" stroke="#60a5fa" stroke-width="1.5" />
                <circle cx="10" cy="20" r="2.5" fill="#93c5fd" />
            </g>`;
        color = '#bfdbfe';
    } else {
        svg = `<circle cx="0" cy="0" r="14" fill="#f1c40f" stroke="#f39c12" stroke-width="1.5"/>`;
        for(let i=0; i<8; i++) {
            let a = i * Math.PI / 4;
            let x1 = 18 * Math.cos(a);
            let y1 = 18 * Math.sin(a);
            let x2 = 24 * Math.cos(a);
            let y2 = 24 * Math.sin(a);
            svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#f39c12" stroke-width="2" stroke-linecap="round"/>`;
        }
        color = '#f1c40f';
    }
    return { svg, color };
};

function dibujarInteraccionLuminicaSVG() {
    const svg = document.getElementById('luminico-svg');
    if (!svg || !window.estadoLuminico) return;
    svg.innerHTML = '';
    
    const { N, giro, luz, effs, currents, caraActiva, indexBottom } = window.estadoLuminico;
    const off = parseInt(document.getElementById('lum-conexion')?.value || '0') || 0; 
    const cx = 100, cy = 105; // Centro ajustado hacia abajo para dar espacio al sol
    const radioExterior = 72; // Escala base visual ampliada

    // 1. SOL EN ÓRBITA
    // El ángulo 'luz' en el slider va de -90 a 90 (0 es arriba)
    const anguloSolRad = (luz - 90) * Math.PI / 180;
    const radioOrbita = radioExterior + 33;
    const solX = cx + radioOrbita * Math.cos(anguloSolRad);
    const solY = cy + radioOrbita * Math.sin(anguloSolRad);
    
    // Dibujar la fuente de luz seleccionada
    const selectLuz = document.getElementById('ensayo-fuente-luz');
    const tipoLuz = selectLuz ? selectLuz.value : 'halogena';
    const iconoLuz = window.generarSVGIconoFuenteLuz(tipoLuz);
    
    const solGlow = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    solGlow.setAttribute('transform', `translate(${solX}, ${solY}) rotate(${luz}) scale(1.2)`);
    solGlow.innerHTML = iconoLuz.svg;
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
    const factorEscala = (R_mm > 0) ? (radioExterior / R_mm) : 1; 
    
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
    const diametroEje_mm = EstadoDiseno?.diametroEje || 8;
    const rEjePx = (diametroEje_mm / 2) * factorEscala;
    eje.setAttribute('r', rEjePx); 
    eje.setAttribute('fill', '#fff');
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

    // Ajustar viewBox dinámicamente
    const maxBoundY = magY + magH;
    const vHeight = Math.max(210, maxBoundY + 15);
    svg.setAttribute('viewBox', `0 -5 200 ${vHeight + 5}`);
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
        dibujarPanelSVG(EstadoDiseno.longitudPanel, Wp, EstadoDiseno.margenMarco_mm, EstadoDiseno.l_sil, EstadoDiseno.a_sil);
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
                diametroEje: getVal('diametro-eje') || 8,
                material: getVal('material-hilo') || 'cobre',
                hilo: getVal('dia-hilo-select') || 0.15,
                calidad: getVal('calidad-bobinado') || 'media',
                imanMotorNombre: getTxt('iman-motor'),
                imanMotorOrientacion: getVal('iman-orientacion') || 'long',
                imanMotorPolaridad: getVal('iman-polaridad') || '1',
                imanMotorDistancia: getVal('iman-distancia') || 2.0,
                campoB: getVal('campo-b') || 0.18,
                radioEfectivo: getVal('radio-efectivo-mm') || 0,
                lumGiro: getVal('lum-giro') || 0,
                lumAnguloLuz: getVal('lum-angulo-luz') || 0,
                lumConexion: getVal('lum-conexion') || '0',
                fcemRpmSim: getVal('fcem-rpm-sim') || 0,
                fcemPerdidas: getVal('fcem-perdidas') || 15,
                
                // Paso 8
                equilMasaAdicional: getVal('equil-masa-adicional') || 0,
                equilRadioMasa: getVal('equil-radio-masa') || 0,
                equilAnguloMasa: getVal('equil-angulo-masa') || 0,
                
                // Paso 9
                levBaseX: getVal('lev-base-x') || 150,
                levBaseY: getVal('lev-base-y') || 60,
                levSustImanNombre: getTxt('lev-sust-iman'),
                levSustSepX: getVal('lev-sust-sep-x') || 30,
                levSustSepY: getVal('lev-sust-sep-y') || 40,
                levSustInc: getVal('lev-sust-inclinacion') || 0,
                levSustZ: getVal('lev-sust-z') || 0,
                levSustPolIzq: getVal('lev-sust-pol-izq') || 1,
                levSustPolDer: getVal('lev-sust-pol-der') || 1,
                levRotorImanNombre: getTxt('lev-rotor-iman'),
                levRotorPolIzq: getVal('lev-rotor-pol-izq') || -1,
                levRotorPolDer: getVal('lev-rotor-pol-der') || -1,
                levRotorOffsetIzq: getVal('lev-rotor-offset-izq') || 0,
                levRotorOffsetDer: getVal('lev-rotor-offset-der') || 0,
                levApoyoDist: getVal('lev-apoyo-dist') || 0,
                
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
                // 1. Obtener proyectos de Supabase según nivel de acceso
                let fetchPromise;
                if (window.esAdmin) {
                    fetchPromise = dbMendocinoClient.from('motores').select('*').order('creado_en', { ascending: false });
                } else if (window.sessionActiva) {
                    fetchPromise = dbMendocinoClient.from('motores')
                        .select('*')
                        .or(`es_publico.eq.true,usuario_id.eq.${window.sessionActiva.user.id}`)
                        .order('creado_en', { ascending: false });
                } else {
                    fetchPromise = dbMendocinoClient.from('motores')
                        .select('*')
                        .eq('es_publico', true)
                        .order('creado_en', { ascending: false });
                }

                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Tiempo de espera agotado al conectar con el servidor.")), 10000)
                );

                const { data: proyectos, error } = await Promise.race([fetchPromise, timeoutPromise]);

                if (error) throw error;
                if (!proyectos || proyectos.length === 0) {
                    contenedor.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:50px; color:#64748b;">No hay proyectos disponibles en este momento.</div>';
                    window.proyectosCargados = [];
                    if(window.poblarSelectProyectosInforme) window.poblarSelectProyectosInforme();
                    return;
                }

                window.proyectosCargados = proyectos;
                if(window.poblarSelectProyectosInforme) window.poblarSelectProyectosInforme();

                contenedor.innerHTML = proyectos.map((proyecto) => {
                    const autor = proyecto.autor_nombre ? `<span class="proyecto-autor">👤 Por: ${proyecto.autor_nombre}</span>` : '';
                    
                    const miUid = window.sessionActiva ? window.sessionActiva.user.id : null;
                    const esMio = proyecto.usuario_id === miUid;
                    const adminUser = window.esAdmin;
                    
                    let adminHtml = '';
                    if (adminUser) {
                        adminHtml += `<button onclick="togglePublicoMotor('${proyecto.id_unico}')" style="font-size: 11px; padding: 3px 6px; margin-right: 8px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; transition: all 0.2s; ${proyecto.es_publico ? 'background-color: #10b981; color: white; box-shadow: 0 2px 4px rgba(16,185,129,0.3);' : 'background-color: #cbd5e1; color: #475569;'}">${proyecto.es_publico ? 'PÚBLICO ✓' : 'PRIVADO'}</button>`;
                    } else if (esMio) {
                        adminHtml += `<span style="font-size: 10px; padding: 3px 6px; margin-right: 8px; border-radius: 4px; font-weight: bold; ${proyecto.es_publico ? 'background-color: #d1fae5; color: #065f46;' : 'background-color: #f1f5f9; color: #475569;'}">${proyecto.es_publico ? 'PÚBLICO' : 'PRIVADO (Pendiente)'}</span>`;
                    }
                    if (adminUser || esMio) {
                        adminHtml += `<button class="btn-delete" style="font-size: 11px; padding: 3px 6px;" onclick="borrarMotorDB('${proyecto.id_unico}')">🗑️</button>`;
                    }

                    return `
                        <div class="proyecto-card" ${esMio ? 'style="border: 2px solid #3b82f6;"' : ''}>
                            <div class="proyecto-card__media">
                                <video controls preload="metadata" loading="lazy">
                                    <source src="${proyecto.video_url ? proyecto.video_url + '#t=0.1' : ''}" type="video/mp4">
                                    Tu navegador no soporta el video.
                                </video>
                            </div>
                            <div class="proyecto-card__body">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:5px;">
                                    <h3 class="proyecto-card__title" style="margin:0;">${proyecto.titulo}</h3>
                                    ${autor}
                                </div>
                                <div style="margin-bottom:10px; display:flex; align-items:center;">
                                    ${adminHtml}
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
                                        <div class="proyecto-ficha__fila"><span>Velocidad</span><strong>${proyecto.ficha?.velocidad || '-'}</strong></div>
                                        <div class="proyecto-ficha__fila"><span>Peso</span><strong>${proyecto.ficha?.peso || (proyecto.config?.resumen?.pesoReal && proyecto.config.resumen.pesoReal !== '0' ? (proyecto.config.resumen.pesoReal + ' g') : (proyecto.config?.resumen?.pesoCobre || proyecto.config?.resumen?.pesoTotal || '--'))}</strong></div>
                                    </div>
                                </div>

                                ${proyecto.notas ? `
                                <div class="proyecto-bloque">
                                    <h4>📝 Créditos y Autoría</h4>
                                    <p style="font-size: 13px; line-height: 1.5;">${proyecto.notas.join(' - ')}</p>
                                </div>` : ''}

                                <div class="proyecto-bloque">
                                    <h4>🔬 Comentario técnico general</h4>
                                    <p>${proyecto.explicacion || ''}</p>
                                </div>

                                <div class="proyecto-bloque proyecto-acciones">
                                    <div style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
                                        <button class="btn-config" style="width: 100%; font-family: inherit !important; font-size:14px; height:42px; font-weight:700 !important; padding:0; display:inline-flex; align-items:center; justify-content:center; gap:8px; border:none; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;" onclick='window.cargarMotor(${JSON.stringify(proyecto.config)}, "${proyecto.id_unico}", "${proyecto.titulo}")'>⚙️ Cargar en calculadora</button>
                                        ${proyecto.video_url ? `<a href="${proyecto.video_url}${proyecto.video_url.includes('?') ? '&' : '?'}download=${encodeURIComponent(proyecto.titulo.replace(/[^a-zA-Z0-9]/g, '_') + '_video.mp4')}" download="${proyecto.titulo.replace(/[^a-zA-Z0-9]/g, '_')}_video.mp4" class="btn-download" style="text-decoration:none; font-family: inherit !important; display:inline-flex; align-items:center; justify-content:center; gap:8px; width:100%; height:42px; font-size:14px; font-weight:700 !important; padding:0; background-color:#10b981; color: white; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">⬇️ Descargar vídeo</a>` : ''}
                                    </div>
                                </div>
                                
                                ${(proyecto.modelo_3d_base_url || proyecto.modelo_3d_rotor_url || proyecto.base_stl_url || proyecto.rotor_stl_url) ? `
                                <div class="proyecto-bloque" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:15px; margin-top:15px;">
                                    <h4 style="margin-top:0; color:#1e40af; border-bottom:1px solid #cbd5e1; padding-bottom:8px;">🧊 Modelos 3D y Piezas (.STL)</h4>
                                    
                                    ${(proyecto.modelo_3d_base_url || proyecto.modelo_3d_rotor_url) ? `
                                    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                                        ${proyecto.modelo_3d_base_url ? `
                                        <div style="flex:1; border:1px solid #cbd5e1; border-radius:6px; overflow:hidden; background:#fff;">
                                            <div style="font-size:11px; text-align:center; background:#e2e8f0; padding:4px; font-weight:bold; color:#475569;">Visor: Base</div>
                                            <model-viewer src="${proyecto.modelo_3d_base_url}" auto-rotate camera-controls shadow-intensity="1" loading="lazy" style="width: 100%; height: 150px;"></model-viewer>
                                        </div>` : ''}
                                        ${proyecto.modelo_3d_rotor_url ? `
                                        <div style="flex:1; border:1px solid #cbd5e1; border-radius:6px; overflow:hidden; background:#fff;">
                                            <div style="font-size:11px; text-align:center; background:#e2e8f0; padding:4px; font-weight:bold; color:#475569;">Visor: Rotor</div>
                                            <model-viewer src="${proyecto.modelo_3d_rotor_url}" auto-rotate camera-controls shadow-intensity="1" loading="lazy" style="width: 100%; height: 150px;"></model-viewer>
                                        </div>` : ''}
                                    </div>` : ''}

                                    <div style="display: flex; flex-direction: column; gap: 8px;">
                                        ${proyecto.base_stl_url ? `<a href="${proyecto.base_stl_url}${proyecto.base_stl_url.includes('?') ? '&' : '?'}download=${encodeURIComponent(proyecto.titulo.replace(/[^a-zA-Z0-9]/g, '_') + '_base.stl')}" download="${proyecto.titulo.replace(/[^a-zA-Z0-9]/g, '_')}_base.stl" class="btn-primary" style="text-decoration:none; display:flex; justify-content:center; gap:8px; font-size:13px; padding:8px; border-radius:6px;">📦 Descargar Base (.STL)</a>` : ''}
                                        ${proyecto.rotor_stl_url ? `<a href="${proyecto.rotor_stl_url}${proyecto.rotor_stl_url.includes('?') ? '&' : '?'}download=${encodeURIComponent(proyecto.titulo.replace(/[^a-zA-Z0-9]/g, '_') + '_rotor.stl')}" download="${proyecto.titulo.replace(/[^a-zA-Z0-9]/g, '_')}_rotor.stl" class="btn-primary" style="text-decoration:none; display:flex; justify-content:center; gap:8px; font-size:13px; padding:8px; border-radius:6px;">⚙️ Descargar Rotor (.STL)</a>` : ''}
                                    </div>
                                </div>` : ''}
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
        
        window.togglePublicoMotor = async function(id_unico) {
            if (!window.esAdmin) return;
            try {
                // Obtener estado actual primero
                const { data: motor, error: fetchErr } = await window.dbMendocinoClient
                    .from('motores')
                    .select('es_publico')
                    .eq('id_unico', id_unico)
                    .single();
                
                if (fetchErr) throw fetchErr;

                const nuevoEstado = !motor.es_publico;
                const { error } = await window.dbMendocinoClient
                    .from('motores')
                    .update({ es_publico: nuevoEstado })
                    .eq('id_unico', id_unico);
                
                if (error) throw error;
                
                mostrarToast(`Proyecto ${nuevoEstado ? 'publicado' : 'ocultado'} correctamente.`, 'ok');
                renderizarProyectos(); // Recargar galería
            } catch (e) {
                console.error("Error cambiando estado público del motor:", e);
                mostrarToast("Error de conexión al actualizar proyecto.", "error");
            }
        };

        window.borrarMotorDB = async function(id_unico) {
            const confirmacion = await mostrarConfirmacion("Borrar Diseño", "¿Seguro que quieres borrar permanentemente este proyecto de la nube?");
            if (!confirmacion) return;
            
            try {
                const { error } = await window.dbMendocinoClient
                    .from('motores')
                    .delete()
                    .eq('id_unico', id_unico);
                
                if (error) throw error;
                
                mostrarToast("Proyecto borrado correctamente.", "ok");
                renderizarProyectos(); // Recargar galería
                
                // Opcional: borrar del localStorage si existe
                try {
                    const misMotores = await obtenerMotoresGuardados();
                    const keyMotor = Object.keys(misMotores).find(k => misMotores[k].id_unico === id_unico);
                    if (keyMotor) {
                        delete misMotores[keyMotor];
                        localStorage.setItem('listaMotoresMendocino', JSON.stringify(misMotores));
                        renderizarMisMotores(); // Recargar modal
                    }
                } catch(e) {}
                
            } catch (e) {
                console.error("Error borrando motor de la base de datos:", e);
                mostrarToast("Error al borrar el proyecto.", "error");
            }
        };

        // --- INICIALIZACIÓN BASE ---
        function inicializarAplicacionBase() {
            inicializarNavegacionProfesional();
            configurarBotonesNavegacionSmarter();
            // Ya no llamamos aquí a renderizarProyectos, se hará tras inicializar Auth
        }

        function configurarBotonesNavegacionSmarter() {
            document.querySelectorAll('.btn-next').forEach(btn => {
                btn.removeAttribute('onclick');
                btn.addEventListener('click', () => {
                    const actual = obtenerPasoActual();
                    const config = obtenerConfigNivel();
                    let siguiente = actual + 1;
                    while(siguiente <= 13 && !config.pasosPermitidos.includes(siguiente)) {
                        siguiente++;
                    }
                    if (siguiente <= 13) {
                        if (siguiente === 13 && typeof generarInformeAutomatico === 'function') generarInformeAutomatico();
                        cambiarPaso(siguiente);
                    } else {
                        mostrarToast('Has llegado al final de los pasos permitidos.', 'info');
                    }
                });
            });

            document.querySelectorAll('.btn-prev').forEach(btn => {
                btn.removeAttribute('onclick');
                btn.addEventListener('click', () => {
                    const actual = obtenerPasoActual();
                    const config = obtenerConfigNivel();
                    let anterior = actual - 1;
                    while(anterior >= 1 && !config.pasosPermitidos.includes(anterior)) {
                        anterior--;
                    }
                    if (anterior >= 1) {
                        cambiarPaso(anterior);
                    } else {
                        mostrarToast('Ya estás en el primer paso permitido.', 'info');
                    }
                });
            });
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
        Fuerza de Lorentz estimada: ${fuerzaLorentz.toFixed(4)} N
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
        La FCEM (Fuerza Contraelectromotriz) se genera cuando las bobinas cortan el flujo magnético en movimiento; esta tensión se opone a la del panel y es lo que finalmente estabiliza y limita la velocidad máxima del motor.

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
    
    // Se comenta la inyeccion automatica para que aparezca vacio inicialmente y requiera boton
    // if (typeof inyectarMemoriaTecnica === 'function') {
    //     inyectarMemoriaTecnica();
    // }
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
    
    // Tensión nominal del panel (Vmp)
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
    
    // Nueva física: En SI, K_t (Constante de par) = K_e (Constante eléctrica)
    // K_t = Torque (Nm) / Corriente (A)
    const corrienteA = (EstadoDiseno.intensidadPanel_mA || 101) / 1000;
    const parMaxMagpylib = EstadoDiseno.par_Nm || 0;
    
    let factorK_pico = 0;
    if (corrienteA > 0 && parMaxMagpylib > 0) {
        factorK_pico = parMaxMagpylib / corrienteA;
    } else {
        // Fallback si Magpylib no ha cargado: Asume campo sólo en 1 lado de la espira
        factorK_pico = vueltas * campoB * L_m * R_m;
    }
    
    // El par calculado es el MÁXIMO (espira a 0º, en el centro del imán).
    // En un motor Mendocino el campo magnético del imán rectangular decae rapidísimamente 
    // cuando la espira gira unos pocos grados (campo altamente no uniforme).
    // Por tanto, la FCEM promedio (integral del flujo) es muchísimo menor que la FCEM pico.
    // Un factor empírico del ~15-20% refleja mejor esta caída brusca en comparación con el 63% (2/pi) de un motor ideal.
    const factorK_promedio = factorK_pico * 0.18;
    
    // Tensión en vacío (Voc) de una célula solar suele ser la que delimita el techo de velocidad.
    // Usamos el Vmp proporcionado por el usuario y estimamos el Voc (+20%).
    const voc_estimado = vmp * 1.2;

    const omegaSim = (rpmSim * 2 * Math.PI) / 60;
    const vfcemSim = factorK_promedio * omegaSim;
    
    // RPM Máximas Teóricas (cuando Vfcem_promedio = Voc_estimado)
    let rpmMaxTeo = 0;
    
    // Fricción estática: Si el par magnético es menor a 50 uN·m (0.00005 N·m), el motor 
    // no tiene fuerza suficiente para vencer el rozamiento estático de la punta del eje y no gira.
    const elAlertaFriccion = document.getElementById('alerta-friccion');
    if (parMaxMagpylib > 0.00005) {
        rpmMaxTeo = (voc_estimado > 0 && factorK_promedio > 0) ? (voc_estimado * 60) / (2 * Math.PI * factorK_promedio) : 0;
        if (elAlertaFriccion) elAlertaFriccion.style.display = 'none';
    } else {
        if (elAlertaFriccion) elAlertaFriccion.style.display = 'block';
    }
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
    
    const elFuente = document.getElementById('alerta-fcem-fuente');
    if (elFuente) {
        if (EstadoDiseno.usandoParMagpylib) {
            elFuente.style.backgroundColor = '#dcfce7';
            elFuente.style.color = '#166534';
            elFuente.style.border = '1px solid #bbf7d0';
            elFuente.innerHTML = '✨ <strong>Alta Precisión:</strong> Se está utilizando el par exacto calculado por <strong>Magpylib 3D</strong> (Paso 8).';
        } else {
            elFuente.style.backgroundColor = '#f1f5f9';
            elFuente.style.color = '#475569';
            elFuente.style.border = '1px solid #e2e8f0';
            elFuente.innerHTML = 'ℹ️ <strong>Estimación Teórica:</strong> Basado en fórmulas analíticas. Para mayor precisión, calcula las fuerzas en el <strong>Paso 8</strong>.';
        }
    }
    
    // Resistencia (ya calculada en paso 2)
    const resTotal = (EstadoDiseno.resistenciaTotal || 0);
    const elRes = document.getElementById('fcem-resistencia');
    if (elRes) elRes.value = resTotal.toFixed(2) + ' Ω';
    
    // 4. Dibujar Gráfica
    dibujarGraficaFCEM(voc_estimado, factorK_promedio, rpmMaxReal, rpmSim, vfcemSim);

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
    // El eje Y subirá hasta 1.8 veces la tensión de la placa (vmp) para que la línea roja sea muy visible.
    // Si la simulación dispara la FCEM muy por encima de la tensión del panel, el eje Y crecerá para mostrar el punto azul.
    const vMaxEje = Math.max(vmp * 1.8, vfcemSim * 1.15, 0.5);
    
    const toX = (val) => margin + (val / rpmMaxEje) * (w - margin * 1.5);
    const toY = (val) => (h - margin) - (val / vMaxEje) * (h - margin * 1.5);
    
    let contenido = `
        <!-- Ejes -->
        <line x1="${margin}" y1="${h-margin}" x2="${w-10}" y2="${h-margin}" stroke="#333" stroke-width="1.5"/>
        <line x1="${margin}" y1="${h-margin}" x2="${margin}" y2="10" stroke="#333" stroke-width="1.5"/>
        <text x="${w-10}" y="${h-15}" font-size="9" text-anchor="end" font-weight="bold">Velocidad (RPM)</text>
        <text x="${margin-10}" y="20" font-size="9" text-anchor="middle" font-weight="bold" transform="rotate(-90 ${margin-10},20)">Tensión (V)</text>
        
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

    if (typeof cambiarPagina === 'function') {
        cambiarPagina('calc');
    }

    document.querySelectorAll('.step-container').forEach(step => step.classList.remove('active'));
    document.querySelectorAll('.step-indicator').forEach(ind => ind.classList.remove('active'));

    const paso = document.getElementById(`step-${numPaso}`);
    const indicador = document.getElementById(`ind-${numPaso}`);

    if (paso) paso.classList.add('active');
    if (indicador) indicador.classList.add('active');

    if (numPaso === 1) {
        if (typeof actualizarEsquemaEnsayo === 'function') {
            setTimeout(actualizarEsquemaEnsayo, 100);
        }
    }
    if (numPaso === 4) {
        if (typeof dibujarLevitacionSVG === 'function') {
            setTimeout(dibujarLevitacionSVG, 100);
        }
        // Al entrar en Magpylib Levitación, renderizar si no está
        setTimeout(() => {
            const contLev = document.getElementById('res-magpylib-levitacion');
            if (contLev && contLev.innerHTML.includes('Haz clic')) {
                ejecutarMagpylibLevitacion();
            }
        }, 300);
    }
    if (numPaso === 5) {
        precargarPasoMagnetico();
        calcularPasoMagnetico();
    }
    if (numPaso === 6) {
        calcularPasoLuminico();
    }
    if (numPaso === 7) {
        calcularPasoFCEM();
    }
    if (numPaso === 8) {
        // Al entrar en Magpylib Fuerzas, renderizar si no está
        setTimeout(() => {
            const contFuerzas = document.getElementById('magpylib-resultados');
            if (contFuerzas && contFuerzas.innerHTML.includes('Haz clic')) {
                renderizarPasoMagpylib();
            }
        }, 300);
    }
    if (numPaso === 9) {
        // Al entrar en Magpylib Global, renderizar si no está
        setTimeout(() => {
            const contGlobal = document.getElementById('magpylib-resultados-global');
            if (contGlobal && contGlobal.innerHTML.includes('Haz clic')) {
                renderizarPasoMagpylibGlobal();
            }
        }, 300);
    }
    if (numPaso === 12) {
        if (typeof renderizarAnimacionDinamica === 'function') {
            actualizarAnimacionManual(); // Inicializa y pinta
        }
    } else {
        // Detener animación al salir del paso 12
        if (typeof animacionCorriendo !== 'undefined' && animacionCorriendo) {
            toggleAnimacionGlobal(); 
        }
    }
    if (numPaso === 13) {
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
    // Al usar MathML y CSS avanzado, la mejor manera y de mayor fidelidad
    // de generar el PDF es a través del sistema nativo del navegador.
    alert("Se va a abrir el diálogo de impresión. Por favor, selecciona 'Guardar como PDF' como destino.");
    
    // Guardamos el estado original
    const oldTitle = document.title;
    document.title = "Memoria_Tecnica_Motor_Mendocino";
    
    // Añadimos una clase al body temporalmente para ocultar todo menos el informe
    document.body.classList.add('imprimiendo-informe');
    
    // Ejecutar impresión
    window.print();
    
    // Restaurar
    document.body.classList.remove('imprimiendo-informe');
    document.title = oldTitle;
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

    const pasos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

    pasos.forEach((numPaso) => {
        const indicador = document.getElementById(`ind-${numPaso}`);
        if (!indicador) return;

        const permitido = config.pasosPermitidos.includes(numPaso);

        indicador.style.opacity = permitido ? '1' : '0.4';
        indicador.style.pointerEvents = permitido ? 'auto' : 'none';
        indicador.title = permitido ? '' : 'Bloqueado para tu configuración actual';
        
        // Mostrar siempre todas las pestañas, pero atenuadas si no están permitidas
        indicador.style.display = 'flex';
    });

    // Control de la pestaña de Montaje e Impresión 3D
    const tabMontaje = document.getElementById('tab-montaje');
    if (tabMontaje) {
        if (usuarioActual.nivel === 'basico') {
            tabMontaje.style.opacity = '0.4';
            tabMontaje.style.pointerEvents = 'none';
            tabMontaje.title = 'Requiere nivel Avanzado o Experto';
        } else {
            tabMontaje.style.opacity = '1';
            tabMontaje.style.pointerEvents = 'auto';
            tabMontaje.title = '';
        }
    }

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
    const esRealAdmin = esAdmin || (sessionActiva && EMAILS_ADMIN_FALLBACK.includes(sessionActiva.user.email));

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
            esAdmin = esAdmin || (profile.rol === 'admin');
            usuarioActual.nombre = profile.nombre || user.email;
            usuarioActual.nivel = profile.nivel || NIVELES_USUARIO.EXPERTO;
            usuarioActual.permisos_pasos = profile.permisos_pasos || null;
        } else {
            profileActual = null;
            usuarioActual.nombre = user.user_metadata?.nombre || user.email || 'Alumno';
            usuarioActual.nivel = NIVELES_USUARIO.EXPERTO;
            usuarioActual.permisos_pasos = null;
        }
    } catch (err) {
        console.error("DEBUG [Perfil]: Error crítico cargando perfil:", err);
        profileActual = null;
        usuarioActual.nombre = user.email || 'Usuario';
        usuarioActual.nivel = NIVELES_USUARIO.EXPERTO;
    } finally {
        actualizarPanelAdminUI();
        actualizarMensajeNivel();
        
        // --- Lógica para revelar el selector del Generador de Marx ---
        const emailsMarx = ["cmillan@unizar.es", "smartin@unizar.es"];
        if (user && user.email && emailsMarx.includes(user.email.trim().toLowerCase())) {
            const selector = document.getElementById("maquina-selector");
            if(selector) selector.style.display = "block";
        }
    }
}

// --- LOGICA DE CAMBIO DE MÁQUINA ---
window.cambiarMaquina = function(maquina) {
    const sidebarMendocino = document.getElementById('sidebar-context-calc');
    const sidebarMarx = document.getElementById('sidebar-context-marx');
    const sidebarTesla = document.getElementById('sidebar-context-tesla');
    const pageMendocino = document.getElementById('page-calc');
    const pageMarx = document.getElementById('page-calc-marx');
    const pageTesla = document.getElementById('page-calc-tesla');

    // Ocultar todos por defecto
    if (sidebarMendocino) sidebarMendocino.style.display = 'none';
    if (sidebarMarx) sidebarMarx.style.display = 'none';
    if (sidebarTesla) sidebarTesla.style.display = 'none';
    if (pageMendocino) { pageMendocino.classList.remove('active'); pageMendocino.style.display = 'none'; }
    if (pageMarx) { pageMarx.classList.remove('active'); pageMarx.style.display = 'none'; }
    if (pageTesla) { pageTesla.classList.remove('active'); pageTesla.style.display = 'none'; }

    // Ocultar pantalla de construcción si existe
    let pageConstruccion = document.getElementById('page-construccion');
    if (pageConstruccion) pageConstruccion.style.display = 'none';

    if (maquina === 'marx') {
        if (sidebarMarx) sidebarMarx.style.display = 'block';
        if (pageMarx) { pageMarx.classList.add('active'); pageMarx.style.display = 'block'; }
        if (typeof calcularMarxPaso1 === 'function') calcularMarxPaso1();
    } else if (maquina === 'tesla') {
        if (sidebarTesla) sidebarTesla.style.display = 'block';
        if (pageTesla) { pageTesla.classList.add('active'); pageTesla.style.display = 'block'; }
    } else if (maquina === 'mendocino') {
        if (sidebarMendocino) sidebarMendocino.style.display = 'block';
        if (pageMendocino) { pageMendocino.classList.add('active'); pageMendocino.style.display = 'block'; }
    } else {
        // Mostrar el menú lateral específico del nuevo simulador
        const specificSidebar = document.getElementById(`sidebar-context-${maquina}`);
        if (specificSidebar) specificSidebar.style.display = 'block';

        // Definir títulos específicos para cada simulador nuevo
        const titulosNuevos = {
            'lifter': { title: 'Diseño de LIFTER Electrostático', sub: 'Simulador de levitación electrostática de alta tensión' },
            'mag_atraccion': { title: 'Diseño de Levitador por Atracción', sub: 'Simulador de levitación magnética activa' },
            'mag_sustentacion': { title: 'Diseño de Levitador por Sustentación', sub: 'Simulador de levitación magnética pasiva' },
            'wimshurst': { title: 'Diseño de Generador Wimshurst', sub: 'Simulador de generador electrostático de influencia' },
            'plasma': { title: 'Diseño de Bola de Plasma', sub: 'Simulador de descargas en gases nobles a alta frecuencia' },
            'coche': { title: 'Diseño de Coche Electromagnético', sub: 'Simulador de propulsión y tracción electromagnética' },
            'transferencia': { title: 'Diseño de Transferencia de Energía', sub: 'Simulador de acoplamiento inductivo resonante' }
        };

        const configInfo = titulosNuevos[maquina] || { title: 'Módulo en Desarrollo', sub: 'Simulación próximamente disponible' };

        // Mostrar "En construcción" pero con el estilo de cabecera estándar
        if (!pageConstruccion) {
            pageConstruccion = document.createElement('div');
            pageConstruccion.id = 'page-construccion';
            pageConstruccion.className = 'page-container active';
            const mainContent = document.querySelector('.app-main-content');
            if (mainContent) mainContent.appendChild(pageConstruccion);
        }
        
        pageConstruccion.innerHTML = `
            <div class="card" style="width: 100%;">
                <div class="header">
                    <h1>${configInfo.title} <span style="font-size: 0.5em; color: #94a3b8;">v1.0</span></h1>
                    <p>${configInfo.sub}</p>
                </div>
                <div class="content" style="display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 100px 20px;">
                    <h2 style="color: #2c3e50; font-size: 28px; margin-bottom: 15px;">🚧 Módulo en Construcción</h2>
                    <p style="color: #64748b; font-size: 16px;">Este simulador se añadirá a la plataforma próximamente.</p>
                </div>
            </div>
        `;
        pageConstruccion.style.display = 'block';
    }
};

window.cambiarPasoMarx = function(paso) {
    document.querySelectorAll('#sidebar-context-marx .step-indicator').forEach(ind => ind.classList.remove('active'));
    const activo = document.getElementById(`ind-marx-${paso}`);
    if(activo) activo.classList.add('active');
    
    document.querySelectorAll('#page-calc-marx .step-container').forEach(container => container.classList.remove('active'));
    const contenedorActivo = document.getElementById(`step-marx-${paso}`);
    if (contenedorActivo) contenedorActivo.classList.add('active');

    console.log("Cambiando al paso Marx:", paso);
    
    if (window.renderMathInElement) {
        window.renderMathInElement(document.getElementById('page-calc-marx'), {
            delimiters: [
                {left: "$$", right: "$$", display: true},
                {left: "\\[", right: "\\]", display: true},
                {left: "$", right: "$", display: false},
                {left: "\\(", right: "\\)", display: false}
            ]
        });
    }
};

window.cambiarPasoTesla = function(paso) {
    document.querySelectorAll('#sidebar-context-tesla .step-indicator').forEach(ind => ind.classList.remove('active'));
    const activo = document.getElementById(`ind-tesla-${paso}`);
    if(activo) activo.classList.add('active');
    
    document.querySelectorAll('#page-calc-tesla .step-container').forEach(container => container.classList.remove('active'));
    const contenedorActivo = document.getElementById(`step-tesla-${paso}`);
    if (contenedorActivo) contenedorActivo.classList.add('active');
};

window.calcularMarxPaso1 = function() {
    const C_nf = parseFloat(document.getElementById('marx-cap-nf').value) || 0;
    const V_nom_kv = parseFloat(document.getElementById('marx-volt-kv').value) || 0;
    const R_mohm = parseFloat(document.getElementById('marx-res-mohm').value) || 0;
    const etapas = parseInt(document.getElementById('marx-etapas').value) || 2;
    const V_in_kv = parseFloat(document.getElementById('marx-vin-kv') ? document.getElementById('marx-vin-kv').value : 5) || 0;
    
    // Si la tensión de entrada supera la nominal, podríamos mostrar una alerta visual, pero por ahora solo calculamos
    const V_real_kv = Math.min(V_in_kv, V_nom_kv); // O quizás asumimos que puede sobrecargar. Lo lógico es usar V_in_kv.
    
    // C en faradios: C_nf * 1e-9
    // V en voltios: V_in_kv * 1000
    const E_joules = 0.5 * (C_nf * 1e-9) * Math.pow(V_in_kv * 1000, 2);
    const Q_coulombs = (C_nf * 1e-9) * (V_in_kv * 1000);
    const Q_microcoulombs = Q_coulombs * 1e6;
    
    document.getElementById('res-marx-energia-etapa').innerText = E_joules.toFixed(2) + " J";
    document.getElementById('res-marx-carga-etapa').innerText = Q_microcoulombs.toFixed(2) + " µC";
    
    // Totales
    const V_out_kv = V_in_kv * etapas;
    const E_total = E_joules * etapas;
    
    const elVoltajeTotal = document.getElementById('res-marx-voltaje-total');
    if (elVoltajeTotal) elVoltajeTotal.innerText = V_out_kv.toFixed(1) + " kV";
    
    const elEnergiaTotal = document.getElementById('res-marx-energia-total');
    if (elEnergiaTotal) elEnergiaTotal.innerText = E_total.toFixed(2) + " J";

    actualizarEsquemaMarx(etapas, C_nf, R_mohm);
};

function actualizarEsquemaMarx(etapas, C_nf, R_mohm) {
    const svgContainer = document.getElementById('svg-marx-container');
    if (!svgContainer) return;
    
    const stageHeight = 60;
    const width = 160;
    // Añadimos un poco más de margen superior para la flecha de salida
    const totalHeight = etapas * stageHeight + 60;
    
    let svgHTML = `
        <svg viewBox="0 0 ${width} ${totalHeight}" style="width: 100%; max-width: 250px; height: auto;">
            <defs>
                <marker id="arrowhead-out" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#1e293b" />
                </marker>
            </defs>
    `;
    
    const startY = totalHeight - 20;
    
    // Bottom Source Terminals
    svgHTML += `
        <text x="${width/2}" y="${startY + 15}" font-family="sans-serif" font-size="10" font-weight="bold" fill="#334155" text-anchor="middle">HV DC</text>
        <text x="30" y="${startY + 15}" font-family="sans-serif" font-size="12" font-weight="bold" fill="#334155" text-anchor="middle">+</text>
        <text x="130" y="${startY + 15}" font-family="sans-serif" font-size="14" font-weight="bold" fill="#334155" text-anchor="middle">-</text>
        
        <line x1="30" y1="${startY}" x2="30" y2="${startY - 10}" stroke="#334155" stroke-width="2"/>
        <line x1="130" y1="${startY}" x2="130" y2="${startY - 10}" stroke="#334155" stroke-width="2"/>
        <!-- Flechas de entrada -->
        <line x1="30" y1="${startY}" x2="30" y2="${startY + 5}" stroke="#334155" stroke-width="2" marker-end="url(#arrowhead-out)"/>
        <line x1="130" y1="${startY}" x2="130" y2="${startY + 5}" stroke="#334155" stroke-width="2" marker-end="url(#arrowhead-out)"/>
    `;
    
    // Draw stages
    for (let i = 0; i < etapas; i++) {
        let yBottom = startY - 10 - i * stageHeight;
        let yTop = yBottom - stageHeight;
        
        // Capacitor (horizontal) - se dibuja en yBottom
        svgHTML += `
            <line x1="30" y1="${yBottom}" x2="75" y2="${yBottom}" stroke="#334155" stroke-width="2"/>
            <line x1="75" y1="${yBottom - 10}" x2="75" y2="${yBottom + 10}" stroke="#334155" stroke-width="2"/>
            <line x1="85" y1="${yBottom - 10}" x2="85" y2="${yBottom + 10}" stroke="#334155" stroke-width="2"/>
            <line x1="85" y1="${yBottom}" x2="130" y2="${yBottom}" stroke="#334155" stroke-width="2"/>
        `;
        
        // Nodos del capacitor
        svgHTML += `
            <circle cx="30" cy="${yBottom}" r="3" fill="#1e293b"/>
            <circle cx="130" cy="${yBottom}" r="3" fill="#1e293b"/>
        `;
        
        // Si no es la última etapa, dibujamos resistencias hacia la etapa superior y el explosor
        if (i < etapas - 1) {
            // Left resistor
            svgHTML += `
                <line x1="30" y1="${yBottom}" x2="30" y2="${yBottom - 10}" stroke="#334155" stroke-width="2"/>
                <polyline points="30,${yBottom - 10} 25,${yBottom - 15} 35,${yBottom - 25} 25,${yBottom - 35} 35,${yBottom - 45} 30,${yBottom - 50}" fill="none" stroke="#334155" stroke-width="2"/>
                <line x1="30" y1="${yBottom - 50}" x2="30" y2="${yTop}" stroke="#334155" stroke-width="2"/>
            `;
            
            // Right resistor
            svgHTML += `
                <line x1="130" y1="${yBottom}" x2="130" y2="${yBottom - 10}" stroke="#334155" stroke-width="2"/>
                <polyline points="130,${yBottom - 10} 125,${yBottom - 15} 135,${yBottom - 25} 125,${yBottom - 35} 135,${yBottom - 45} 130,${yBottom - 50}" fill="none" stroke="#334155" stroke-width="2"/>
                <line x1="130" y1="${yBottom - 50}" x2="130" y2="${yTop}" stroke="#334155" stroke-width="2"/>
            `;
            
            // Spark gap (diagonal from left yBottom to right yTop)
            // Calculamos coordenadas para dejar un gap en el medio
            let gapStartX1 = 30;
            let gapStartY1 = yBottom;
            let gapEndX1 = 70;
            let gapEndY1 = yBottom - 24; // sube 24px
            
            let gapStartX2 = 130;
            let gapStartY2 = yTop;
            let gapEndX2 = 90;
            let gapEndY2 = yTop + 24; // baja 24px
            
            svgHTML += `
                <!-- Electrodo izquierdo (inferior) -->
                <line x1="${gapStartX1}" y1="${gapStartY1}" x2="${gapEndX1}" y2="${gapEndY1}" stroke="#1e293b" stroke-width="2"/>
                <circle cx="${gapEndX1}" cy="${gapEndY1}" r="3.5" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
                
                <!-- Electrodo derecho (superior) -->
                <line x1="${gapStartX2}" y1="${gapStartY2}" x2="${gapEndX2}" y2="${gapEndY2}" stroke="#1e293b" stroke-width="2"/>
                <circle cx="${gapEndX2}" cy="${gapEndY2}" r="3.5" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
            `;
        }
        
        // Labels for first stage only
        if (i === 0) {
            svgHTML += `
                <text x="12" y="${yBottom - 25}" font-family="sans-serif" font-size="10" fill="#334155" transform="rotate(-90 12,${yBottom - 25})">${R_mohm} MΩ</text>
                <text x="148" y="${yBottom - 25}" font-family="sans-serif" font-size="10" fill="#334155" transform="rotate(-90 148,${yBottom - 25})">${R_mohm} MΩ</text>
                <text x="80" y="${yBottom - 15}" font-family="sans-serif" font-size="10" font-weight="bold" fill="#334155" text-anchor="middle">${C_nf} nF</text>
            `;
        }
    }
    
    // Top Output Arrow (from left node of the topmost capacitor)
    const yTopmost = startY - 10 - (etapas - 1) * stageHeight;
    svgHTML += `
        <!-- Flecha de salida de alta tensión -->
        <line x1="30" y1="${yTopmost}" x2="60" y2="${yTopmost - 35}" stroke="#1e293b" stroke-width="2.5" marker-end="url(#arrowhead-out)"/>
        <text x="75" y="${yTopmost - 35}" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1e293b">⚡ V_out</text>
    `;
    
    svgHTML += `</svg>`;
    svgContainer.innerHTML = svgHTML;
}

async function cerrarSesion() {
    try {
        console.log("Iniciando cierre de sesión robusto...");
        
        // 1. Limpieza local inmediata de sesión (sin borrar datos de simulador guardados)
        // Eliminamos las claves de sesión sin hacer un clear() total
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
                localStorage.removeItem(key);
            }
        }
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
            // Paso 1
            'ensayo-nombre-panel', 'ensayo-l-panel', 'ensayo-a-panel',
            'ensayo-proveedor', 'ensayo-precio', 'ensayo-peso',
            
            // Paso 2
            'caras', 'margen-placa', 'ranura-ancho', 'ranura-alto', 'ranura-tipo', 'diametro-eje', 
            
            // Paso 3
            'material-hilo', 'dia-hilo-select', 'calidad-bobinado', 
            
            // Paso 4
            'campo-b', 'radio-efectivo-mm', 'iman-orientacion', 'iman-polaridad', 'iman-distancia',
            
            // Paso 5
            'lum-conexion', 'lum-giro', 'lum-angulo-luz',
            
            // Paso 8
            'equil-masa-adicional', 'equil-radio-masa', 'equil-angulo-masa',
            
            // Paso 9
            'lev-base-x', 'lev-base-y', 'lev-sust-sep-x', 'lev-sust-sep-y', 'lev-sust-inclinacion', 'lev-sust-z',
            'lev-sust-pol-izq', 'lev-sust-pol-der',
            'lev-rotor-pol-izq', 'lev-rotor-pol-der',
            'lev-rotor-offset-izq', 'lev-rotor-offset-der',
            'lev-apoyo-dist',
            
            // Paso 10
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

        // Guardar nombre de elementos seleccionados desde selectores dinámicos
        const selectoresDinamicos = [
            { id: 'panel', key: 'panelNombre' },
            { id: 'ensayo-historial-select', key: 'ensayoHistorialNombre' },
            { id: 'iman-motor', key: 'imanMotorNombre' },
            { id: 'lev-sust-iman', key: 'levSustImanNombre' },
            { id: 'lev-rotor-iman', key: 'levRotorImanNombre' }
        ];

        selectoresDinamicos.forEach(selector => {
            const el = document.getElementById(selector.id);
            if (el && el.selectedIndex >= 0) {
                estado.valores[selector.key] = el.options[el.selectedIndex].text;
            }
        });

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

        // 2.5 Restaurar selectores dinámicos por nombre
        const selectoresDinamicos = [
            { id: 'panel', key: 'panelNombre' },
            { id: 'ensayo-historial-select', key: 'ensayoHistorialNombre' },
            { id: 'iman-motor', key: 'imanMotorNombre' },
            { id: 'lev-sust-iman', key: 'levSustImanNombre' },
            { id: 'lev-rotor-iman', key: 'levRotorImanNombre' }
        ];

        selectoresDinamicos.forEach(selector => {
            const nombreGuardado = estado.valores[selector.key];
            const el = document.getElementById(selector.id);
            if (el && nombreGuardado) {
                for (let i = 0; i < el.options.length; i++) {
                    const optText = el.options[i].text;
                    if (optText === nombreGuardado || optText.includes(nombreGuardado) || nombreGuardado.includes(optText)) {
                        el.selectedIndex = i;
                        // Si es el panel o ensayo, podríamos necesitar disparar su onchange explícitamente
                        if (selector.id === 'panel') actualizarResumenPaso1();
                        if (selector.id === 'ensayo-historial-select' && typeof cargarEnsayoDesdeHistorial === 'function') {
                            // En lugar de disparar el evento aquí, marcamos que se debe cargar, 
                            // o lo cargamos si los datos ya están listos.
                            // Para no interferir, se dispara el evento 'change'.
                            const event = new Event('change');
                            el.dispatchEvent(event);
                        }
                        break;
                    }
                }
            }
        });

        // 3. Restaurar el paso
        if (estado.pasoActual > 1) {
            cambiarPaso(estado.pasoActual);
        }

        // Forzar recalcular todo para que los gráficos y resultados se sincronicen
        if (typeof actualizarResumenPaso1 === 'function') actualizarResumenPaso1();
        if (typeof calcularDimensionesRotor === 'function') calcularDimensionesRotor();
        if (typeof calcularDevanado === 'function') calcularDevanado();
        if (typeof calcularFuerzasPaso4 === 'function') calcularFuerzasPaso4();
        if (typeof calcularPasoLuminico === 'function') calcularPasoLuminico();
        if (typeof actualizarGraficoRotor === 'function') actualizarGraficoRotor();
        if (typeof actualizarVistasLevitacion === 'function') actualizarVistasLevitacion();
        if (typeof calcularFcemYPerdidas === 'function') calcularFcemYPerdidas();
        
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

// === PASO 7: MAGPYLIB ===
async function renderizarPasoMagpylib() {
    const contenedorResultados = document.getElementById('magpylib-resultados');
    if (!contenedorResultados) return;
    
    // Verificación de requisitos previos
    if (!EstadoDiseno.espirasPorDevanado || !EstadoDiseno.intensidadPanel_mA) {
        if (typeof mostrarToast === 'function') {
            mostrarToast("⚠️ Error: Faltan datos eléctricos. Debes calcular el Devanado (Paso 2) y el Ensayo Solar (Paso 1).", "error");
        } else {
            alert("⚠️ Error: Faltan datos eléctricos. Debes calcular el Devanado (Paso 2) y el Ensayo Solar (Paso 1).");
        }
        return;
    }
    
    // UI enhancements
    contenedorResultados.innerHTML = `
        <div class="loading-container">
            <div class="spinner-simulacion"></div>
            <span>Calculando física avanzada en el servidor...</span>
        </div>
    `;

    try {
        // Recopilar parámetros reales
        const diametro = EstadoDiseno.diametroRotor || 20;
        const longitud = EstadoDiseno.longitudPanel || 30;
        const orientacion = document.getElementById('iman-orientacion')?.value || 'long';
        const distancia = parseFloat(document.getElementById('iman-distancia')?.value || 2.0);
        
        // Calcular corriente por la bobina activa
        // La tensión depende del área del panel iluminado, usamos el amperaje ya estimado
        const corrienteTotal = (EstadoDiseno.intensidadPanel_mA || 1000) / 1000;
        const vueltas = EstadoDiseno.espirasPorDevanado || 100;
        
        // Obtener datos del imán seleccionado en el Paso 3
        const selIman = document.getElementById('iman-motor')?.value;
        const imanData = typeof dbImanes !== 'undefined' ? dbImanes[Number(selIman)] : null;
        
        let dimIman = [30, 15, 5]; // Dimensiones por defecto [Largo, Ancho, Grosor]
        let magnetizacion = 1.20;  // Magnetización por defecto (T)

        if (imanData) {
            // Extraer dimensiones y asegurar que el grosor sea la Z
            const dims = [Number(imanData.l), Number(imanData.a), Number(imanData.h)];
            const T = Math.min(...dims); // espesor (Z)
            const baseDims = dims.filter((_, i) => i !== dims.indexOf(T));
            dimIman = [Math.max(...baseDims), Math.min(...baseDims), T];
            // Convertir Remanencia Br (Teslas)
            magnetizacion = Number(imanData.br) || 1.20;
        }
        
        const polaridad = parseInt(document.getElementById('iman-polaridad')?.value) || 1;
        
        let imanesBasePayload = [];
        // Posición Z del centro del imán: - (radio_rotor + entrehierro + mitad_grosor_iman)
        const z_pos = - (diametro/2 + distancia + dimIman[2]/2);
        
        const magZ = magnetizacion * polaridad;

        if (orientacion === 'long') {
            imanesBasePayload.push({ dimension: dimIman, magnetizacion: [0, 0, magZ], posicion: [0, 0, z_pos] });
        } else {
            imanesBasePayload.push({ dimension: [dimIman[1], dimIman[0], dimIman[2]], magnetizacion: [0, 0, magZ], posicion: [0, 0, z_pos] });
        }

        // Generar todas las bobinas del rotor
        const caras = EstadoDiseno?.numeroCaras || parseInt(document.getElementById('caras')?.value || 4);
        const numDevanados = Math.max(1, Math.floor(caras / 2));
        const bobinasPayload = [];
        
        let currents = null;
        if (window.estadoLuminico && window.estadoLuminico.currents && window.estadoLuminico.currents.length >= caras) {
            currents = window.estadoLuminico.currents;
        }
        
        for (let i = 0; i < numDevanados; i++) {
            let bobinaCorriente = 0;
            if (currents) {
                // currents[i] ya tiene el signo correcto según el flujo lumínico calculado en el Paso 4
                bobinaCorriente = corrienteTotal * currents[i];
            } else {
                bobinaCorriente = i === 0 ? corrienteTotal : 0;
            }
            
            if (Math.abs(bobinaCorriente) < 1e-5) bobinaCorriente = 0.000001;

            // Sincronizar perfectamente con SVG (rotación inversa y desfase de ranura)
            const giro_deg = (window.estadoLuminico && window.estadoLuminico.giro !== undefined) ? window.estadoLuminico.giro : parseFloat(document.getElementById('lum-giro')?.value || document.getElementById('giro_motor')?.value || 0);
            const offset_ranura = 180 / caras;
            const angulo_final = - (i * (360 / caras) + offset_ranura + giro_deg);

            bobinasPayload.push({
                dimension: [longitud, diametro],
                vueltas: vueltas,
                corriente: bobinaCorriente, // Corriente real para que coincida con la física de SVG
                angulo_x: angulo_final,
                posicion: [0, 0, 0]
            });
        }

        const style2d = document.getElementById('magpylib-style-forces')?.value || 'scifi';

        const payload = {
            imanes_base: imanesBasePayload,
            bobinas: bobinasPayload,
            style_2d: style2d
        };
        
        window._lastMagpylibPayload = payload;

        const response = await fetch('https://magpylib-api-mendocino.onrender.com/api/magpylib-forces', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor Python.');
        }

        const data = await response.json();
        
        const formatNum = (num) => {
            if (num === 0) return "0.000";
            if (Math.abs(num) < 0.001) return num.toExponential(2);
            return num.toFixed(3);
        };

        let B_mag_val = Math.sqrt(data.b_field[0]**2 + data.b_field[1]**2 + data.b_field[2]**2);
        let F_mag_val = Math.sqrt(data.force_vector[0]**2 + data.force_vector[1]**2 + data.force_vector[2]**2);
        
        let B_mag = formatNum(B_mag_val);
        let F_mag = formatNum(F_mag_val);

        let resultadoHTML = `
            <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 15px 0; color: #1e293b; font-size: 16px;">📊 Datos Numéricos de la Simulación</h4>
                <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                    <div style="flex: 1 1 200px; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                        <span style="display: block; color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">Vector Campo B (T)</span>
                        <span style="color: #0f172a; font-family: monospace; font-size: 13px;">[${data.b_field[0].toFixed(5)}, ${data.b_field[1].toFixed(5)}, ${data.b_field[2].toFixed(5)}]</span>
                    </div>
                    <div style="flex: 1 1 200px; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                        <span style="display: block; color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">Fuerza Lorentz (N)</span>
                        <span style="color: #0f172a; font-family: monospace; font-size: 13px;">[${formatNum(data.force_vector[0])}, ${formatNum(data.force_vector[1])}, ${formatNum(data.force_vector[2])}]</span>
                    </div>
                </div>
            </div>

            <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; align-items: start;">
                ${data.image_base64 ? `
                <div style="flex: 1 1 350px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                    <div style="background: #f1f5f9; border-bottom: 1px solid #e2e8f0; padding: 12px;">
                        <h4 style="margin: 0; color: #334155; font-size: 13px; font-weight: 600;">VISUALIZACIÓN 3D DEL ROTOR</h4>
                    </div>
                    <div style="padding: 15px;">
                        <img src="data:image/png;base64,${data.image_base64}" style="max-width: 100%; display: block; margin: 0 auto;" alt="Representación 3D de Magpylib">
                    </div>
                </div>
                ` : ''}

                ${data.streamplot_base64 ? `
                <div style="flex: 1 1 350px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                    <div style="background: #f1f5f9; border-bottom: 1px solid #e2e8f0; padding: 12px;">
                        <h4 style="margin: 0; color: #334155; font-size: 13px; font-weight: 600;">LÍNEAS DE CAMPO MAGNÉTICO</h4>
                    </div>
                    <div style="padding: 15px;">
                        <img src="data:image/png;base64,${data.streamplot_base64}" style="max-width: 100%; display: block; margin: 0 auto;" alt="Líneas de campo magnético">
                    </div>
                </div>
                ` : ''}
            </div>
            
            ${data.plotly_html ? `
            <div style="margin-top: 25px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div style="background: #f1f5f9; border-bottom: 1px solid #e2e8f0; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <h4 style="margin: 0; color: #334155; font-size: 13px; font-weight: 600;">VISOR 3D INTERACTIVO (Plotly)</h4>
                    <span style="font-size: 11px; color: #64748b; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">Interactúa: Click + Arrastrar para rotar, Rueda para Zoom</span>
                </div>
                <div style="padding: 0px; width: 100%; height: 600px; display: flex; justify-content: center; align-items: center;">
                    <div style="width: 100%; height: 100%;">
                        ${data.plotly_html}
                    </div>
                </div>
            </div>
            ` : ''}
        `;
        
        contenedorResultados.innerHTML = resultadoHTML;
        
        // Ejecutar los scripts incrustados de Plotly
        if (data.plotly_html) {
            cargarScriptsSecuencialmente(contenedorResultados);
        }

    } catch (error) {
        contenedorResultados.innerHTML = `
            <div style="background: rgba(248, 113, 113, 0.1); border-radius: 8px; padding: 15px; border-left: 4px solid #f87171;">
                <h4 style="margin: 0 0 10px 0; color: #f87171; display: flex; align-items: center; gap: 8px;">
                    ⚠️ Error de conexión
                </h4>
                <p style="margin: 0; font-size: 13px; color: #ccc;">¿El servidor remoto de Render está suspendido? Espera ~50s e inténtalo de nuevo.</p>
                <div style="margin-top: 10px; font-size: 11px; color: #888; font-family: monospace; background: rgba(0,0,0,0.5); padding: 8px; border-radius: 4px;">
                    Detalles: ${error.message}
                </div>
            </div>
        `;
    }
}


// ==========================================
// ====== PASO 8: CONEXIONADO ELECTRICO =====
// ==========================================

function generarOpcionesConexionado() {
    const carasInput = document.getElementById('caras');
    const numCaras = (carasInput ? parseInt(carasInput.value) : EstadoDiseno.numeroCaras) || 4;
    EstadoDiseno.numeroCaras = numCaras; // Sync back just in case
    const container = document.getElementById('conexion-par-list');
    if (!container) return;
    
    container.innerHTML = '';
    const numPares = numCaras / 2;
    
    if (!window.parSeleccionadoStep8 || window.parSeleccionadoStep8 > numPares) {
        window.parSeleccionadoStep8 = 1;
    }
    
    for (let i = 1; i <= numPares; i++) {
        const caraOpuesta = i + numPares;
        const btn = document.createElement('div');
        btn.textContent = `Par ${i}: C${i} (Superior) y C${caraOpuesta} (Inferior)`;
        btn.style.padding = '10px 15px';
        btn.style.border = '2px solid';
        btn.style.borderRadius = '6px';
        btn.style.cursor = 'pointer';
        btn.style.fontWeight = 'bold';
        btn.style.transition = 'all 0.2s';
        btn.style.textAlign = 'center';
        
        if (i === window.parSeleccionadoStep8) {
            btn.style.borderColor = '#3498db';
            btn.style.backgroundColor = '#ebf5fb';
            btn.style.color = '#2980b9';
        } else {
            btn.style.borderColor = '#cbd5e1';
            btn.style.backgroundColor = 'white';
            btn.style.color = '#64748b';
            
            // Hover effect
            btn.onmouseover = () => btn.style.backgroundColor = '#f8fafc';
            btn.onmouseout = () => btn.style.backgroundColor = 'white';
        }
        
        btn.onclick = () => {
            window.parSeleccionadoStep8 = i;
            generarOpcionesConexionado(); // Re-render to update selection style
        };
        
        container.appendChild(btn);
    }
    
    dibujarConexionado();
}

function dibujarConexionado() {
    const svg = document.getElementById('conexionado-svg');
    const svg3d = document.getElementById('rotor-3d-conexionado-svg');
    if (!svg) return;
    
    const carasInput = document.getElementById('caras');
    const numCaras = (carasInput ? parseInt(carasInput.value) : EstadoDiseno.numeroCaras) || 4;
    EstadoDiseno.numeroCaras = numCaras;
    
    const idx = window.parSeleccionadoStep8 || 1;
    const numPares = numCaras / 2;
    const caraTop = parseInt(idx);
    const caraBot = caraTop + numPares;
    
    // --- 3D ROTOR ---
    if (svg3d) {
        const R = 45; // Radio
        const dx = 100; // Extrusión X
        const dy = -40; // Extrusión Y
        const cx3d = 90;
        const cy3d = 100;
        
        let vFront = [];
        let vBack = [];
        
        // Un polígono de N caras tiene un vértice inicial rotado para que la Cara 1 quede arriba plana.
        const giroGlobal = document.getElementById('anim-giro-step8') ? parseFloat(document.getElementById('anim-giro-step8').value) : 0;
        const giroRad = giroGlobal * Math.PI / 180;
        const offsetAng = -Math.PI / 2 - Math.PI / numCaras + giroRad;
        
        for (let i = 0; i < numCaras; i++) {
            let ang = offsetAng + (i * 2 * Math.PI / numCaras);
            let px = cx3d + R * Math.cos(ang);
            let py = cy3d + R * Math.sin(ang);
            vFront.push({x: px, y: py});
            vBack.push({x: px + dx, y: py + dy});
        }
        
        // Determinar qué caras miran hacia la cámara (front-facing)
        let carasFront = [];
        let carasBack = [];
        
        for (let i = 0; i < numCaras; i++) {
            const next = (i + 1) % numCaras;
            const numCara = i + 1;
            
            let p1 = vFront[i];
            let p2 = vFront[next];
            let p3 = vBack[next];
            let cross = (p2.x - p1.x) * (p3.y - p2.y) - (p2.y - p1.y) * (p3.x - p2.x);
            
            if (cross < 0) {
                carasFront.push({num: numCara, idx: i, next: next});
            } else {
                carasBack.push({num: numCara, idx: i, next: next});
            }
        }
        
        let html3d = '';
        
        // --- Dibujar imán base (N/S) ---
        let magH = 10; // Altura de cada mitad
        let magY = cy3d + R + 25; // Debajo del rotor
        let pM1 = {x: cx3d - 15, y: magY};
        let pM2 = {x: cx3d + 45, y: magY};
        let pM3 = {x: cx3d + 45 + dx, y: magY + dy};
        let pM4 = {x: cx3d - 15 + dx, y: magY + dy};
        
        // Norte (Rojo)
        // Cara superior N
        html3d += `<polygon points="${pM1.x},${pM1.y} ${pM2.x},${pM2.y} ${pM3.x},${pM3.y} ${pM4.x},${pM4.y}" fill="#e74c3c" stroke="#c0392b" stroke-width="1" opacity="0.9"/>`;
        // Cara frontal N
        html3d += `<polygon points="${pM1.x},${pM1.y} ${pM2.x},${pM2.y} ${pM2.x},${pM2.y+magH} ${pM1.x},${pM1.y+magH}" fill="#e74c3c" stroke="#c0392b" stroke-width="1" opacity="0.9"/>`;
        // Cara lateral derecha N
        html3d += `<polygon points="${pM2.x},${pM2.y} ${pM3.x},${pM3.y} ${pM3.x},${pM3.y+magH} ${pM2.x},${pM2.y+magH}" fill="#c0392b" stroke="#a93226" stroke-width="1" opacity="0.9"/>`;
        
        // Sur (Azul)
        let sY = pM1.y + magH;
        let sYback = pM3.y + magH;
        // Cara frontal S
        html3d += `<polygon points="${pM1.x},${sY} ${pM2.x},${sY} ${pM2.x},${sY+magH} ${pM1.x},${sY+magH}" fill="#3498db" stroke="#2980b9" stroke-width="1" opacity="0.9"/>`;
        // Cara lateral derecha S
        html3d += `<polygon points="${pM2.x},${sY} ${pM3.x},${sYback} ${pM3.x},${sYback+magH} ${pM2.x},${sY+magH}" fill="#2980b9" stroke="#2471a3" stroke-width="1" opacity="0.9"/>`;
        
        // Textos N y S en la cara frontal
        let textX = (pM1.x + pM2.x) / 2;
        let textNy = pM1.y + magH/2 + 4; // Centro de la mitad superior
        let textSy = sY + magH/2 + 4;    // Centro de la mitad inferior
        
        html3d += `<text x="${textX}" y="${textNy}" fill="#fff" font-size="10" font-weight="bold" font-family="sans-serif" text-anchor="middle">N</text>`;
        html3d += `<text x="${textX}" y="${textSy}" fill="#fff" font-size="10" font-weight="bold" font-family="sans-serif" text-anchor="middle">S</text>`;
        
        // Líneas de campo magnético eliminadas por simplicidad visual
        
        const anguloLuz = document.getElementById('lum-angulo-luz') ? parseFloat(document.getElementById('lum-angulo-luz').value) : 0;
        const luzRad = anguloLuz * Math.PI / 180;
        
        // --- 0. DIBUJAR FUENTE DE LUZ (SOL) ---
        let midRotorX = cx3d + dx/2;
        let midRotorY = cy3d + dy/2;
        let solDist = 120;
        let solX = midRotorX + solDist * Math.sin(luzRad);
        let solY = midRotorY - solDist * Math.cos(luzRad);
        
        // Dibujar la fuente de luz seleccionada
        const selectLuz = document.getElementById('ensayo-fuente-luz');
        const tipoLuz = selectLuz ? selectLuz.value : 'halogena';
        const iconoLuz = window.generarSVGIconoFuenteLuz(tipoLuz);
        
        let solGroup = `<g transform="translate(${solX}, ${solY}) rotate(${anguloLuz})">`;
        solGroup += iconoLuz.svg;
        solGroup += `</g>`;
        html3d += solGroup;
        
        // Rayos de luz direccionales hacia el rotor
        for (let offset of [-25, 0, 25]) {
            let ox = offset * Math.cos(luzRad);
            let oy = offset * Math.sin(luzRad);
            // Empezar los rayos un poco separados del sol
            let rSx = solX - 25 * Math.sin(luzRad) + ox;
            let rSy = solY + 25 * Math.cos(luzRad) + oy;
            let rayDist = solDist - R - 20;
            let rEx = rSx - rayDist * Math.sin(luzRad);
            let rEy = rSy + rayDist * Math.cos(luzRad);
            
            html3d += `<line x1="${rSx}" y1="${rSy}" x2="${rEx}" y2="${rEy}" stroke="#f1c40f" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.6"/>`;
            
            let arrLen = 6;
            let ux = -Math.sin(luzRad);
            let uy = Math.cos(luzRad);
            let px1 = rEx - ux*arrLen - uy*arrLen*0.6;
            let py1 = rEy - uy*arrLen + ux*arrLen*0.6;
            let px2 = rEx - ux*arrLen + uy*arrLen*0.6;
            let py2 = rEy - uy*arrLen - ux*arrLen*0.6;
            html3d += `<polygon points="${rEx},${rEy} ${px1},${py1} ${px2},${py2}" fill="#f1c40f" opacity="0.8"/>`;
        }
        
        // 1. Eje central completo (calculado en la misma dirección que la extrusión dx, dy)
        let len = Math.sqrt(dx*dx + dy*dy);
        let ux = dx / len;
        let uy = dy / len;
        let axisFrontX = cx3d - 30 * ux;
        let axisFrontY = cy3d - 30 * uy;
        let axisBackX = cx3d + dx + 30 * ux;
        let axisBackY = cy3d + dy + 30 * uy;
        
        // Eje trasero (sobresale por detrás, sólido)
        html3d += `<line x1="${cx3d + dx}" y1="${cy3d + dy}" x2="${axisBackX}" y2="${axisBackY}" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>`;
        
        // Eje interior (atraviesa el rotor, punteado)
        html3d += `<line x1="${cx3d}" y1="${cy3d}" x2="${cx3d + dx}" y2="${cy3d + dy}" stroke="#64748b" stroke-width="2" stroke-dasharray="6,3"/>`;

        // 2. Hexágono trasero (transparente)
        let ptsBack = vBack.map(v => `${v.x},${v.y}`).join(' ');
        html3d += `<polygon points="${ptsBack}" fill="none" stroke="#94a3b8" stroke-width="1"/>`;
        
        // Función auxiliar para dibujar paneles
        const dibujarPanel = (c, isFrontFacing) => {
            const i = c.idx;
            const next = c.next;
            const numCara = c.num;
            const isHighlighted = (numCara === caraTop || numCara === caraBot);
            
            let fill = isFrontFacing ? "rgba(226, 232, 240, 0.4)" : "rgba(241, 245, 249, 0.2)";
            let stroke = isFrontFacing ? "rgba(100, 116, 139, 0.6)" : "rgba(148, 163, 184, 0.3)";
            let strokeW = isFrontFacing ? 1.5 : 1;
            
            if (isHighlighted) {
                fill = isFrontFacing ? "#3b82f6" : "rgba(59, 130, 246, 0.85)";
                stroke = isFrontFacing ? "#1e40af" : "#2563eb";
                strokeW = 2;
            }
            
            const pts = `${vFront[i].x},${vFront[i].y} ${vFront[next].x},${vFront[next].y} ${vBack[next].x},${vBack[next].y} ${vBack[i].x},${vBack[i].y}`;
            html3d += `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>`;
            
            // Dibujar rejilla (grid) de la placa solar si está iluminada/seleccionada
            if (isHighlighted && isFrontFacing) {
                // Línea central a lo largo
                let mxFront = (vFront[i].x + vFront[next].x) / 2;
                let myFront = (vFront[i].y + vFront[next].y) / 2;
                let mxBack = (vBack[i].x + vBack[next].x) / 2;
                let myBack = (vBack[i].y + vBack[next].y) / 2;
                html3d += `<line x1="${mxFront}" y1="${myFront}" x2="${mxBack}" y2="${myBack}" stroke="#93c5fd" stroke-width="1.5" opacity="0.7"/>`;
                
                // Líneas transversales
                for (let j = 1; j <= 3; j++) {
                    let f = j / 4;
                    let p1x = vFront[i].x + (vBack[i].x - vFront[i].x) * f;
                    let p1y = vFront[i].y + (vBack[i].y - vFront[i].y) * f;
                    let p2x = vFront[next].x + (vBack[next].x - vFront[next].x) * f;
                    let p2y = vFront[next].y + (vBack[next].y - vFront[next].y) * f;
                    html3d += `<line x1="${p1x}" y1="${p1y}" x2="${p2x}" y2="${p2y}" stroke="#93c5fd" stroke-width="1.5" opacity="0.7"/>`;
                }
            }
        };
        
        // 3. Dibujar caras TRASERAS
        for (let c of carasBack) dibujarPanel(c, false);
        
        // --- BOBINA: CALCULAR VERTICES ---
        const selectConexion = document.getElementById('lum-conexion');
        const valConexion = selectConexion ? selectConexion.value : "0";
        let vIdx = (caraTop - 1) % numCaras;
        if (valConexion === "0") {
            vIdx = (vIdx + 1) % numCaras; // Derecha
        }
        let vIdxOp = (vIdx + numCaras / 2) % numCaras;
        
        let cvFront1 = vFront[vIdx];
        let cvBack1 = vBack[vIdx];
        let cvFront2 = vFront[vIdxOp];
        let cvBack2 = vBack[vIdxOp];
        
        let v1Visible = carasFront.some(c => c.idx === vIdx || c.next === vIdx);
        let v2Visible = carasFront.some(c => c.idx === vIdxOp || c.next === vIdxOp);
        
        // Bobina: Parte Trasera (Siempre tapada por el interior)
        html3d += `<line x1="${cvBack1.x}" y1="${cvBack1.y}" x2="${cvBack2.x}" y2="${cvBack2.y}" stroke="#d35400" stroke-width="3.5" stroke-linecap="round"/>`;
        html3d += `<line x1="${cvBack1.x}" y1="${cvBack1.y}" x2="${cvBack2.x}" y2="${cvBack2.y}" stroke="#f39c12" stroke-width="1.5" stroke-linecap="round"/>`;
        
        // Bobina: Lados longitudinales (invisibles)
        if (!v1Visible) {
            html3d += `<line x1="${cvFront1.x}" y1="${cvFront1.y}" x2="${cvBack1.x}" y2="${cvBack1.y}" stroke="#d35400" stroke-width="3.5" stroke-linecap="round"/>`;
            html3d += `<line x1="${cvFront1.x}" y1="${cvFront1.y}" x2="${cvBack1.x}" y2="${cvBack1.y}" stroke="#f39c12" stroke-width="1.5" stroke-linecap="round"/>`;
        }
        if (!v2Visible) {
            html3d += `<line x1="${cvFront2.x}" y1="${cvFront2.y}" x2="${cvBack2.x}" y2="${cvBack2.y}" stroke="#d35400" stroke-width="3.5" stroke-linecap="round"/>`;
            html3d += `<line x1="${cvFront2.x}" y1="${cvFront2.y}" x2="${cvBack2.x}" y2="${cvBack2.y}" stroke="#f39c12" stroke-width="1.5" stroke-linecap="round"/>`;
        }
        
        // 4. Hexágono frontal (Rotor detallado)
        const Wp = EstadoDiseno.anchoPanel || 50;
        const Ws = EstadoDiseno.anchoRanura_mm || 5;
        const Ds = EstadoDiseno.altoRanura_mm || 4;
        let angP = EstadoDiseno.anguloPanel;
        let angS = EstadoDiseno.anguloRanura;
        if (!angP || !angS) {
            const WpTotal = Wp + (2 * (EstadoDiseno.margenMarco_mm || 3));
            const sumaAnchuras = WpTotal + Ws;
            const anguloTotalRadianes = (2 * Math.PI) / numCaras;
            angP = anguloTotalRadianes * (WpTotal / sumaAnchuras);
            angS = anguloTotalRadianes * (Ws / sumaAnchuras);
        }

        const radioCircunscrito = EstadoDiseno.radioCircunscrito || 25;
        const escalaPx = R / radioCircunscrito;
        const profPx = Ds * escalaPx;
        const RfondoPx = Math.max( R * 0.35, R - profPx );
        const tipoRanura = document.getElementById('ranura-tipo')?.value || 'rect';

        const strokeColor = getComputedStyle(document.documentElement).getPropertyValue('--svg-stroke-color').trim() || "#333";
        const colorImpresion3D = getComputedStyle(document.documentElement).getPropertyValue('--svg-panel-color').trim() || "#fdebd0";

        let dRotor = "";
        
        for (let i = 0; i < numCaras; i++) {
            const angCenter = (i * 2 * Math.PI / numCaras) - Math.PI / 2 + giroRad;
            const theta1 = angCenter - (angP / 2);
            const theta2 = angCenter + (angP / 2);
            const theta3 = theta2 + angS;

            const p1x = cx3d + R * Math.cos(theta1); const p1y = cy3d + R * Math.sin(theta1);
            const p2x = cx3d + R * Math.cos(theta2); const p2y = cy3d + R * Math.sin(theta2);
            const p3x = cx3d + R * Math.cos(theta3); const p3y = cy3d + R * Math.sin(theta3);

            if (i === 0) dRotor += `M ${p1x} ${p1y} `;
            else dRotor += `L ${p1x} ${p1y} `;
            dRotor += `L ${p2x} ${p2y} `;

            if (tipoRanura === 'trapecio') {
                const s1x = cx3d + RfondoPx * Math.cos(theta2); const s1y = cy3d + RfondoPx * Math.sin(theta2);
                const s2x = cx3d + RfondoPx * Math.cos(theta3); const s2y = cy3d + RfondoPx * Math.sin(theta3);
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
        
        html3d += `<path d="${dRotor}" fill="${colorImpresion3D}" stroke="${strokeColor}" stroke-width="1.5" opacity="0.95"/>`;

        // Placas solares frontales
        const WpTotal_p = Wp + (2 * (EstadoDiseno.margenMarco_mm || 3));
        const proporcionPlaca = WpTotal_p > 0 ? (Wp / WpTotal_p) : 1;
        const angPlacaReal = angP * proporcionPlaca;

        for (let i = 0; i < numCaras; i++) {
            const angCenter = (i * 2 * Math.PI / numCaras) - Math.PI / 2 + giroRad;
            const theta1 = angCenter - (angPlacaReal / 2);
            const theta2 = angCenter + (angPlacaReal / 2);

            const p1x = cx3d + R * Math.cos(theta1);
            const p1y = cy3d + R * Math.sin(theta1);
            const p2x = cx3d + R * Math.cos(theta2);
            const p2y = cy3d + R * Math.sin(theta2);

            html3d += `<line x1="${p1x}" y1="${p1y}" x2="${p2x}" y2="${p2y}" stroke="#2c3e50" stroke-width="2.5" stroke-linecap="round"/>`;
        }
        
        // 5. Dibujar caras FRONTALES
        for (let c of carasFront) dibujarPanel(c, true);
        
        // Bobina: Lados longitudinales (visibles)
        if (v1Visible) {
            html3d += `<line x1="${cvFront1.x}" y1="${cvFront1.y}" x2="${cvBack1.x}" y2="${cvBack1.y}" stroke="#d35400" stroke-width="3.5" stroke-linecap="round"/>`;
            html3d += `<line x1="${cvFront1.x}" y1="${cvFront1.y}" x2="${cvBack1.x}" y2="${cvBack1.y}" stroke="#f39c12" stroke-width="1.5" stroke-linecap="round"/>`;
        }
        if (v2Visible) {
            html3d += `<line x1="${cvFront2.x}" y1="${cvFront2.y}" x2="${cvBack2.x}" y2="${cvBack2.y}" stroke="#d35400" stroke-width="3.5" stroke-linecap="round"/>`;
            html3d += `<line x1="${cvFront2.x}" y1="${cvFront2.y}" x2="${cvBack2.x}" y2="${cvBack2.y}" stroke="#f39c12" stroke-width="1.5" stroke-linecap="round"/>`;
        }
        
        // Bobina: Parte Delantera (Siempre por delante del frontal)
        html3d += `<line x1="${cvFront1.x}" y1="${cvFront1.y}" x2="${cvFront2.x}" y2="${cvFront2.y}" stroke="#d35400" stroke-width="3.5" stroke-linecap="round"/>`;
        html3d += `<line x1="${cvFront1.x}" y1="${cvFront1.y}" x2="${cvFront2.x}" y2="${cvFront2.y}" stroke="#f39c12" stroke-width="1.5" stroke-linecap="round"/>`;
        
        // 6. Eje central (parte delantera y agujero a escala)
        html3d += `<line x1="${axisFrontX}" y1="${axisFrontY}" x2="${cx3d}" y2="${cy3d}" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>`;
        const diametroEje_mm = EstadoDiseno?.diametroEje || 8;
        const rEjePx = (diametroEje_mm / 2) * escalaPx;
        html3d += `<circle cx="${cx3d}" cy="${cy3d}" r="${rEjePx}" fill="#fff" stroke="${strokeColor}" stroke-width="1"/>`;
        
        // 7. Textos indicadores alrededor de la cara frontal
        for (let i = 0; i < numCaras; i++) {
            const numCara = i + 1;
            const isHighlighted = (numCara === caraTop || numCara === caraBot);
            
            // Ángulo medio de la cara i
            let angMid = offsetAng + (i + 0.5) * (2 * Math.PI / numCaras);
            let textX = cx3d + (R + 15) * Math.cos(angMid);
            let textY = cy3d + (R + 15) * Math.sin(angMid);
            
            let textColor = isHighlighted ? "#d35400" : "#64748b";
            let weight = isHighlighted ? "bold" : "normal";
            
            html3d += `<text x="${textX}" y="${textY + 4}" fill="${textColor}" font-size="12" font-weight="${weight}" text-anchor="middle">C${numCara}</text>`;
        }
        
        // 8. Flecha de dirección de corriente (Demostración de la Conmutación)
        // La cara activa es la que está más cerca de la luz
        // Ángulo de la cara seleccionada (caraTop) respecto al cenit
        const idxPar = caraTop - 1;
        const anguloCaraSeleccionada = giroRad + idxPar * (2 * Math.PI / numCaras);
        const cosCara = Math.cos(anguloCaraSeleccionada - luzRad);
        const currentMagnitude = Math.abs(cosCara);
        
        // Solo dibujar si hay corriente significativa
        if (currentMagnitude > 0.05) {
            // Por defecto asume que caraTop es activa
            let arrowStart = cvFront1;
            let arrowEnd = cvFront2;
            
            // Si la cara opuesta recibe la luz (cosCara negativo), la corriente se invierte
            if (cosCara < 0) {
                arrowStart = cvFront2;
                arrowEnd = cvFront1;
            }
            
            let midX = (arrowStart.x + arrowEnd.x) / 2;
            let midY = (arrowStart.y + arrowEnd.y) / 2;
            let vecX = arrowEnd.x - arrowStart.x;
            let vecY = arrowEnd.y - arrowStart.y;
            let lenA = Math.sqrt(vecX*vecX + vecY*vecY) || 1;
            let uxA = vecX / lenA;
            let uyA = vecY / lenA;
            
            // Tamaño dinámico basado en la cantidad de luz (tamaño base 3 + multiplicador 13)
            let aSize = 3 + 13 * currentMagnitude;
            let aOpac = 0.2 + 0.8 * currentMagnitude;
            
            let p1A = { x: midX + uxA * aSize, y: midY + uyA * aSize };
            let p2A = { x: midX - uxA * aSize - uyA * aSize*0.7, y: midY - uyA * aSize + uxA * aSize*0.7 };
            let p3A = { x: midX - uxA * aSize + uyA * aSize*0.7, y: midY - uyA * aSize - uxA * aSize*0.7 };
            
            html3d += `<polygon points="${p1A.x},${p1A.y} ${p2A.x},${p2A.y} ${p3A.x},${p3A.y}" fill="#e74c3c" stroke="#c0392b" stroke-width="1.5" stroke-linejoin="round" opacity="${aOpac}"/>`;
        }
        
        svg3d.innerHTML = html3d;
    }
    
    // --- ESQUEMA ELECTRICO ---
    
    // Dimensiones
    const cx = 150;
    const pw = 120; // Panel width
    const ph = 25;  // Panel height
    
    // Top panel pos
    const ty = 40;
    // Bottom panel pos
    const by = 260;
    
    // Nodos
    const jxL = 60;  // Junction X left
    const jxR = 240; // Junction X right
    const jy = 150;  // Junction Y center
    
    let html = '';
    
    // Función para dibujar panel solar 2D con rejilla
    const drawSolarPanel2D = (x, y, label) => {
        let pHtml = `<rect x="${x - pw/2}" y="${y - ph/2}" width="${pw}" height="${ph}" fill="#3b82f6" rx="4" stroke="#1e40af" stroke-width="1.5"/>`;
        // Rejilla de células
        const cols = 5;
        const rows = 2;
        const cellW = pw / cols;
        const cellH = ph / rows;
        for (let i = 1; i < cols; i++) {
            pHtml += `<line x1="${x - pw/2 + i*cellW}" y1="${y - ph/2}" x2="${x - pw/2 + i*cellW}" y2="${y + ph/2}" stroke="#93c5fd" stroke-width="1"/>`;
        }
        for (let i = 1; i < rows; i++) {
            pHtml += `<line x1="${x - pw/2}" y1="${y - ph/2 + i*cellH}" x2="${x + pw/2}" y2="${y - ph/2 + i*cellH}" stroke="#93c5fd" stroke-width="1"/>`;
        }
        // Etiqueta con fondo semitransparente para mejor legibilidad
        pHtml += `<rect x="${x - 14}" y="${y - 8}" width="28" height="16" fill="rgba(0,0,0,0.5)" rx="3"/>`;
        pHtml += `<text x="${x}" y="${y + 4}" fill="#fff" font-size="12" font-weight="bold" text-anchor="middle">C${label}</text>`;
        return pHtml;
    };

    // Dibujar los dos paneles
    html += drawSolarPanel2D(cx, ty, caraTop);
    html += drawSolarPanel2D(cx, by, caraBot);
    
    // Terminals on Top Panel
    // Left (Positive - Red)
    const tLx = cx - pw/2;
    html += `<circle cx="${tLx}" cy="${ty}" r="4" fill="#e74c3c"/>`;
    html += `<text x="${tLx - 14}" y="${ty - 8}" fill="#e74c3c" font-size="16" font-weight="bold" text-anchor="middle">+</text>`;
    // Right (Negative - Black)
    const tRx = cx + pw/2;
    html += `<circle cx="${tRx}" cy="${ty}" r="4" fill="#34495e"/>`;
    html += `<text x="${tRx + 14}" y="${ty - 8}" fill="#34495e" font-size="18" font-weight="bold" text-anchor="middle">-</text>`;
    
    // Terminals on Bottom Panel (Rotated 180 deg -> Left is Negative, Right is Positive)
    // Left (Negative - Black)
    const bLx = cx - pw/2;
    html += `<circle cx="${bLx}" cy="${by}" r="4" fill="#34495e"/>`;
    html += `<text x="${bLx - 14}" y="${by + 16}" fill="#34495e" font-size="18" font-weight="bold" text-anchor="middle">-</text>`;
    // Right (Positive - Red)
    const bRx = cx + pw/2;
    html += `<circle cx="${bRx}" cy="${by}" r="4" fill="#e74c3c"/>`;
    html += `<text x="${bRx + 14}" y="${by + 16}" fill="#e74c3c" font-size="16" font-weight="bold" text-anchor="middle">+</text>`;
    
    // Wires Top
    // Top Left (Red) to Junction Left
    html += `<path d="M ${tLx} ${ty} L ${jxL} ${ty} L ${jxL} ${jy}" stroke="#e74c3c" stroke-width="3" fill="none" stroke-linejoin="round"/>`;
    // Top Right (Black) to Junction Right
    html += `<path d="M ${tRx} ${ty} L ${jxR} ${ty} L ${jxR} ${jy}" stroke="#34495e" stroke-width="3" fill="none" stroke-linejoin="round"/>`;
    
    // Wires Bottom
    // Bottom Left (Black) to Junction Left
    html += `<path d="M ${bLx} ${by} L ${jxL} ${by} L ${jxL} ${jy}" stroke="#34495e" stroke-width="3" fill="none" stroke-linejoin="round"/>`;
    // Bottom Right (Red) to Junction Right
    html += `<path d="M ${bRx} ${by} L ${jxR} ${by} L ${jxR} ${jy}" stroke="#e74c3c" stroke-width="3" fill="none" stroke-linejoin="round"/>`;
    
    // Junction Dots
    html += `<circle cx="${jxL}" cy="${jy}" r="5" fill="#7f8c8d"/>`;
    html += `<circle cx="${jxR}" cy="${jy}" r="5" fill="#7f8c8d"/>`;
    
    // Coil between junctions
    html += `<line x1="${jxL}" y1="${jy}" x2="${cx - 40}" y2="${jy}" stroke="#d35400" stroke-width="3"/>`;
    html += `<line x1="${jxR}" y1="${jy}" x2="${cx + 40}" y2="${jy}" stroke="#d35400" stroke-width="3"/>`;
    
    // Draw Coil symbol (a zigzag or loops)
    let coilPath = `M ${cx - 40} ${jy}`;
    for (let i = 0; i < 4; i++) {
        let lx = (cx - 40) + i * 20;
        coilPath += ` C ${lx + 5} ${jy - 15}, ${lx + 15} ${jy - 15}, ${lx + 20} ${jy}`;
    }
    html += `<path d="${coilPath}" stroke="#d35400" stroke-width="3" fill="none"/>`;
    // Flechas dinámicas de corriente para el esquema 2D
    const anguloLuz2D = document.getElementById('lum-angulo-luz') ? parseFloat(document.getElementById('lum-angulo-luz').value) : 0;
    const luzRad2D = anguloLuz2D * Math.PI / 180;
    const giroGlobal2D = document.getElementById('anim-giro-step8') ? parseFloat(document.getElementById('anim-giro-step8').value) : 0;
    const giroRad2D = giroGlobal2D * Math.PI / 180;
    const idxPar2D = caraTop - 1;
    const angCara2D = giroRad2D + idxPar2D * (2 * Math.PI / numCaras);
    const cosCara2D = Math.cos(angCara2D - luzRad2D);
    const currentMag2D = Math.abs(cosCara2D);
    
    if (currentMag2D > 0.05) {
        let aSize2D = 3 + 13 * currentMag2D;
        let aOpac2D = 0.2 + 0.8 * currentMag2D;
        
        // Función auxiliar para flechas verticales
        const draw2DArrowVert = (x, y, dirY) => {
            let py1 = y + dirY * aSize2D;
            let p1 = { x: x, y: py1 };
            let p2 = { x: x - aSize2D*0.7, y: y - dirY * aSize2D*0.7 };
            let p3 = { x: x + aSize2D*0.7, y: y - dirY * aSize2D*0.7 };
            return `<polygon points="${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}" fill="#e74c3c" stroke="#c0392b" stroke-width="1.5" stroke-linejoin="round" opacity="${aOpac2D}"/>`;
        };
        
        // Función auxiliar para flechas horizontales
        const draw2DArrowHoriz = (x, y, dirX) => {
            let px1 = x + dirX * aSize2D;
            let p1 = { x: px1, y: y };
            let p2 = { x: x - dirX * aSize2D*0.7, y: y - aSize2D*0.7 };
            let p3 = { x: x - dirX * aSize2D*0.7, y: y + aSize2D*0.7 };
            return `<polygon points="${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}" fill="#e74c3c" stroke="#c0392b" stroke-width="1.5" stroke-linejoin="round" opacity="${aOpac2D}"/>`;
        };
        
        if (cosCara2D > 0) {
            // Cara superior activa (iluminada)
            // Flecha en cable izquierdo (baja de C_top a bobina)
            html += draw2DArrowVert(jxL, ty + (jy - ty)/2, 1);
            // Flecha en cable derecho (sube de bobina a C_top)
            html += draw2DArrowVert(jxR, ty + (jy - ty)/2, -1);
            
            // Flechas horizontales (corriente va de Izquierda a Derecha)
            html += draw2DArrowHoriz(jxL + 25, jy, 1);
            html += draw2DArrowHoriz(jxR - 25, jy, 1);
        } else {
            // Cara inferior activa (iluminada)
            // Flecha en cable izquierdo (baja de bobina a C_bot)
            html += draw2DArrowVert(jxL, by - (by - jy)/2, 1);
            // Flecha en cable derecho (sube de C_bot a bobina)
            html += draw2DArrowVert(jxR, by - (by - jy)/2, -1);
            
            // Flechas horizontales (corriente va de Derecha a Izquierda)
            html += draw2DArrowHoriz(jxR - 25, jy, -1);
            html += draw2DArrowHoriz(jxL + 25, jy, -1);
        }
    }
    
    html += `<text x="${cx}" y="${jy + 35}" fill="#d35400" font-size="12" font-weight="bold" text-anchor="middle">BOBINA C${caraTop}-C${caraBot}</text>`;
    
    svg.innerHTML = html;
}

// ==========================================
// ==========================================
// ====== PASO 9: EQUILIBRADO DE MASAS ======
// ==========================================

function generarInputsEquilibrado() {
    const carasInput = document.getElementById('caras');
    const numCaras = (carasInput ? parseInt(carasInput.value) : EstadoDiseno.numeroCaras) || 4;
    const contenedor = document.getElementById('contenedor-masas-caras');
    
    const elInfo = document.getElementById('info-peso-espira');
    if (elInfo) {
        const diam = parseFloat(EstadoDiseno.diametroHilo_mm) || 0;
        const lon = parseFloat(EstadoDiseno.longitudEspira_m) || 0;
        if (diam > 0 && lon > 0) {
            const r_cm = diam / 20;
            const vol = Math.PI * r_cm * r_cm * (lon * 100);
            const masaGr = vol * 8.96; // Densidad del cobre en g/cm3
            elInfo.innerHTML = `💡 <strong>Referencia: Espira = ${masaGr.toFixed(3)} g | Media espira = ${(masaGr/2).toFixed(3)} g</strong><br>Aunque una espira entera añade masa simétricamente a caras opuestas (no desequilibra), <strong>una media vuelta de hilo adicional sí genera desequilibrio real</strong> (ej: cuando los cables de conexión quedan en lados opuestos del eje).`;
        } else {
            elInfo.innerHTML = `💡 <strong>Referencia:</strong> Debes configurar los Devanados (Paso 3) para conocer el peso de una espira.`;
        }
    }

    if (!contenedor) return;
    
    // Solo regenerar los inputs si el número de caras ha cambiado (ahora guardamos 2 caras por fila)
    if (contenedor.children.length === numCaras / 2) return;
    
    contenedor.innerHTML = '';
    
    const numPares = numCaras / 2;
    for (let j = 1; j <= numPares; j++) {
        // Cara actual
        const i1 = j;
        // Cara opuesta
        const i2 = j + numPares;
        
        const carasAAgregar = [i1, i2];
        
        const rowDiv = document.createElement('div');
        rowDiv.style.display = 'flex';
        rowDiv.style.width = '100%';
        rowDiv.style.gap = '10px';
        rowDiv.style.marginBottom = '6px';
        
        carasAAgregar.forEach(i => {
            let angulo = ((360 / numCaras) * (i - 1)).toFixed(0);
            
            const div = document.createElement('div');
            div.style.flex = '1';
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.justifyContent = 'space-between';
            div.style.padding = '6px 10px';
            div.style.backgroundColor = '#f8fafc';
            div.style.border = '1px solid #e2e8f0';
            div.style.borderRadius = '6px';
            div.style.boxSizing = 'border-box';
            
            div.innerHTML = `
                <label style="margin: 0; font-size: 13px; font-weight: 500; color: #475569; white-space: nowrap;">C${i} (${angulo}°)</label>
                <input type="number" id="masa-c${i}" value="0" step="0.1" oninput="calcularEquilibradoMasas()" style="width: 60px; min-width: 60px; margin: 0; padding: 4px; text-align: right; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box;">
            `;
            rowDiv.appendChild(div);
        });
        contenedor.appendChild(rowDiv);
    }
}

function calcularEquilibradoMasas() {
    const carasInput = document.getElementById('caras');
    const numCaras = (carasInput ? parseInt(carasInput.value) : EstadoDiseno.numeroCaras) || 4;
    EstadoDiseno.numeroCaras = numCaras;
    
    generarInputsEquilibrado(); // Asegurar que los inputs existan
    
    const R = (EstadoDiseno.diametroRotor || 20) / 2000; // metros. Fallback a 10mm (0.01m)
    
    let M = 0; // Masa total extra en kg
    let Xcm = 0;
    let Ycm = 0;
    
    for (let i = 1; i <= numCaras; i++) {
        const input = document.getElementById(`masa-c${i}`);
        const masaKg = parseFloat(input?.value || 0) / 1000;
        
        if (masaKg > 0) {
            M += masaKg;
            const rad_fisica = ((360 / numCaras) * (i - 1)) * Math.PI / 180;
            // Coordenadas para cálculo físico (C1 en 0° real)
            Xcm += masaKg * R * Math.cos(rad_fisica);
            Ycm += masaKg * R * Math.sin(rad_fisica);
        }
    }
    
    let Rcm = 0, theta_cm = 0;
    if (M > 0) {
        Xcm = Xcm / M;
        Ycm = Ycm / M;
        Rcm = Math.sqrt(Xcm*Xcm + Ycm*Ycm);
        
        // Tolerancia para errores de punto flotante
        if (Rcm < 1e-9) {
            Rcm = 0;
            Xcm = 0;
            Ycm = 0;
        }
        
        theta_cm = Math.atan2(Ycm, Xcm);
    }
    
    EstadoDiseno.masaExtra_kg = M;
    EstadoDiseno.Rcm_m = Rcm;
    EstadoDiseno.theta_cm_rad = theta_cm;
    
    const masaGramos = M * 1000;
    document.getElementById('res-masa-neta').textContent = masaGramos.toFixed(2) + ' g';
    document.getElementById('res-masa-distancia').textContent = (Rcm * 1000).toFixed(2) + ' mm';
    document.getElementById('res-masa-angulo').textContent = (theta_cm * 180 / Math.PI).toFixed(0) + '°';
    
    // Dibujar SVG Rotor Equilibrado superponiendo sobre el rotor azul original
    const svgRotor = document.getElementById('rotor-equilibrado-svg');
    if (svgRotor) {
        // Forzar dibujo limpio del rotor azul
        if (typeof window.dibujarRotorSVG === 'function') {
            window.dibujarRotorSVG(); 
        }
        
        let svgHtml = svgRotor.innerHTML; // Conservar el rotor azul
        const radioSVG = 90; // Mismo radio que usar dibujarRotorSVG
        
        // Ejes
        svgHtml += `<line x1="-10" y1="100" x2="210" y2="100" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="2,2"/>`;
        svgHtml += `<line x1="100" y1="-10" x2="100" y2="210" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="2,2"/>`;
        
        // Caras y Masas
        for (let i = 1; i <= numCaras; i++) {
            let rad = ((360 / numCaras) * (i - 1)) * Math.PI / 180 - (Math.PI / 2);
            let cx = 100 + radioSVG * Math.cos(rad);
            let cy = 100 + radioSVG * Math.sin(rad); // En SVG, y crece hacia abajo
            
            // Texto Cara (Dibujado en el interior para no salirse del viewBox 0 0 200 200)
            let tx = 100 + (radioSVG - 25) * Math.cos(rad);
            let ty = 100 + (radioSVG - 25) * Math.sin(rad) + 4;
            svgHtml += `<text x="${tx}" y="${ty}" font-size="12" fill="#1e3a8a" opacity="0.6" text-anchor="middle" font-weight="bold">C${i}</text>`;
            
            // Masa si > 0
            const input = document.getElementById(`masa-c${i}`);
            const masaKg = parseFloat(input?.value || 0) / 1000;
            if (masaKg > 0) {
                let rDot = Math.min(12, Math.max(5, masaKg * 1000 * 3));
                svgHtml += `<circle cx="${cx}" cy="${cy}" r="${rDot}" fill="#ef4444" opacity="0.95" stroke="#fff" stroke-width="2"/>`;
            }
        }
        
        // Vector CM
        if (M > 0 && Rcm > 0) {
            let theta_cm_svg = theta_cm - (Math.PI / 2); // Ajuste visual para que C1 esté arriba
            let cxm = (Rcm / R) * radioSVG * Math.cos(theta_cm_svg);
            let cym = (Rcm / R) * radioSVG * Math.sin(theta_cm_svg); 
            
            let distSVG = Math.sqrt(cxm*cxm + cym*cym);
            if (distSVG < 20 && distSVG > 0) {
                let scale = 20 / distSVG;
                cxm *= scale;
                cym *= scale;
            }
            
            let finalX = 100 + cxm;
            let finalY = 100 + cym;
            
            svgHtml += `<line x1="100" y1="100" x2="${finalX}" y2="${finalY}" stroke="#3b82f6" stroke-width="2"/>`;
            svgHtml += `<circle cx="${finalX}" cy="${finalY}" r="4" fill="#3b82f6"/>`;
            svgHtml += `<text x="${finalX > 100 ? finalX+8 : finalX-8}" y="${finalY > 100 ? finalY+10 : finalY-5}" font-size="10" font-weight="bold" fill="#2563eb" text-anchor="${finalX > 100 ? 'start' : 'end'}">CM</text>`;
        }
        
        svgRotor.innerHTML = svgHtml;
    }
    
    // Preparar gráfica (0 a 360 grados)
    const angulos = [];
    const tau_mag = [];
    const tau_freno = [];
    
    // Asumimos un Par Magnético medio calculado en el Paso 7 o Paso 4
    let parMedio = EstadoDiseno.par_Nm || 0.0001; 
    if (parMedio === 0) parMedio = 0.0001;
    
    let arranca = true;
    let anguloAtasco = -1;
    let maxFreno = 0;
    
    const g = 9.81;
    
    for (let a = 0; a <= 360; a += 5) {
        let rad = a * Math.PI / 180;
        angulos.push(a);
        
        // Par magnético (rizado dinámico según número de caras)
        let polosEfectivos = numCaras;
        let mag = parMedio * (0.9 + 0.1 * Math.cos(polosEfectivos * rad));
        tau_mag.push(mag * 1e6); // Micro-Newtons metro (µNm)
        
        // Freno gravitatorio: Mg * Rcm * cos(theta_cm + theta)
        // Cos() porque el freno máximo (positivo) es cuando la masa extra está levantándose por el lado derecho (asumiendo theta=0 es "Cara 1 a la derecha")
        let freno = M * g * Rcm * Math.cos(theta_cm + rad);
        tau_freno.push(freno * 1e6);
        
        if (freno > maxFreno) maxFreno = freno;
        
        if (freno > mag && arranca) {
            arranca = false;
            anguloAtasco = a;
        }
    }
    
    // Actualizar Diagnóstico
    const diagEl = document.getElementById('diagnostico-equilibrado');
    if (M === 0) {
        diagEl.innerHTML = "Rotor perfectamente equilibrado. 🟢";
        diagEl.style.backgroundColor = "#f0fdf4";
        diagEl.style.color = "#166534";
    } else if (arranca) {
        diagEl.innerHTML = `✅ El motor arrancará (El par magnético vence al desequilibrio de ${masaGramos.toFixed(1)}g).`;
        diagEl.style.backgroundColor = "#f0fdf4";
        diagEl.style.color = "#166534";
    } else {
        diagEl.innerHTML = `❌ El motor se atascará cerca de ${anguloAtasco}° (El freno gravitatorio supera al motor).`;
        diagEl.style.backgroundColor = "#fef2f2";
        diagEl.style.color = "#991b1b";
    }
    
    // Dibujar con Plotly
    const traceMag = {
        x: angulos,
        y: tau_mag,
        type: 'scatter',
        mode: 'lines',
        name: 'Fuerza Motor (µNm)',
        line: {color: '#10b981', width: 3}
    };
    
    const traceFreno = {
        x: angulos,
        y: tau_freno,
        type: 'scatter',
        mode: 'lines',
        name: 'Resistencia Peso (µNm)',
        line: {color: '#ef4444', width: 2, dash: 'dot'}
    };
    
    const layout = {
        margin: {t: 20, r: 20, b: 70, l: 50},
        xaxis: {title: 'Ángulo de Giro (Grados)', range: [0, 360]},
        yaxis: {title: 'Par (µNm)'},
        legend: {
            orientation: 'h', 
            y: -0.4, 
            x: 0.5, 
            xanchor: 'center'
        },
        hovermode: 'x unified',
        height: 280
    };
    
    const div = document.getElementById('grafica-equilibrado');
    const drawPlot = () => {
        try {
            if (!document.getElementById('grafica-equilibrado')) return;
            Plotly.purge('grafica-equilibrado');
            Plotly.newPlot('grafica-equilibrado', [traceMag, traceFreno], layout, {responsive: true});
        } catch (e) {
            console.error("Plotly error:", e);
            if (div) div.innerHTML = `<div style="padding:20px; color:red;">Error renderizando gráfica: ${e.message}</div>`;
        }
    };

    if (div && div.offsetWidth > 0) {
        drawPlot();
    } else {
        // Fallback robusto con reintentos si el contenedor no está visible
        let retries = 0;
        const checkAndDraw = () => {
            const el = document.getElementById('grafica-equilibrado');
            if (el && el.offsetWidth > 0) {
                drawPlot();
            } else if (retries < 10) {
                retries++;
                setTimeout(checkAndDraw, 100);
            } else {
                drawPlot(); // Forzar dibujo aunque sea 0x0
            }
        };
        setTimeout(checkAndDraw, 100);
    }
}

// Sobrescribimos el paso 8 en cambiarPaso para que llame a esta función si entra
const originalCambiarPasoEquil = window.cambiarPaso;
window.cambiarPaso = function(numPaso) {
    originalCambiarPasoEquil(numPaso);
    if (numPaso === 8) {
        setTimeout(() => {
            generarOpcionesConexionado();
        }, 100);
    }
    if (numPaso === 10) {
        setTimeout(() => {
            generarInputsEquilibrado();
            calcularEquilibradoMasas();
        }, 100);
    }
};

let animacionGlobalId = null;
let animacionCorriendo = false;
window.animacionAnguloRotor = 0;
let lastAnimTime = 0;

window.velocidadAngularSimulada = 0; // en grados/s

function toggleAnimacionGlobal() {
    animacionCorriendo = !animacionCorriendo;
    const btns = [document.getElementById('btn-anim-play'), document.getElementById('btn-anim-play-step8'), document.getElementById('btn-anim-play-step9')];
    
    // Deslizadores de giro manual
    const slidersGiro = [document.getElementById('anim-giro'), document.getElementById('lum-giro'), document.getElementById('anim-giro-step8')];
    
    if (animacionCorriendo) {
        btns.forEach(btn => {
            if (btn) {
                btn.innerHTML = '🛑 Cortar Corriente (Inercia)';
                btn.style.background = '#e74c3c';
            }
        });
        slidersGiro.forEach(slider => {
            if (slider) slider.disabled = true;
        });
        
        if (!animacionGlobalId) {
            lastAnimTime = performance.now();
            animacionGlobalId = requestAnimationFrame(bucleAnimacionGlobal);
        }
    } else {
        btns.forEach(btn => {
            if (btn) {
                btn.innerHTML = '⚡ Arrancar Motor';
                btn.style.background = '#2c3e50';
            }
        });
        
        // No los habilitamos de inmediato para evitar pelear contra la inercia
        // Se habilitarán cuando se detenga por completo en el bucle
        
        // IMPORTANTE: Ya no cancelamos la animación aquí. El bucle se encargará
        // de decelerar por inercia y auto-cancelarse cuando se detenga del todo.
        if (!animacionGlobalId) {
            lastAnimTime = performance.now();
            animacionGlobalId = requestAnimationFrame(bucleAnimacionGlobal);
        }
    }
}

window.obtenerDireccionGiro = function() {
    // Si Magpylib ha calculado el par físico 3D, usamos ese como "fuente de verdad absoluta"
    if (typeof EstadoDiseno !== 'undefined' && EstadoDiseno.par_Nm_X !== undefined && Math.abs(EstadoDiseno.par_Nm_X) > 0.0001) {
        // En Magpylib, par_Nm_X > 0 es Antihorario (SVG -1), < 0 es Horario (SVG 1)
        return EstadoDiseno.par_Nm_X >= 0 ? -1 : 1; 
    }
    // Fallback determinista inmediato basado en interfaz (mientras el servidor responde)
    const conexion = document.getElementById('lum-conexion')?.value || '0';
    const polaridad = parseInt(document.getElementById('iman-polaridad')?.value) || 1;
    return ((conexion === '-1') ? 1 : -1) * polaridad;
};

function bucleAnimacionGlobal(time) {
    const dt = Math.min((time - lastAnimTime) / 1000, 0.1); 
    lastAnimTime = time;
    
    const rpmInput1 = document.getElementById('anim-rpm');
    const rpmInput2 = document.getElementById('anim-rpm-step8');
    const rpmObjetivo = parseFloat(rpmInput1 ? rpmInput1.value : (rpmInput2 ? rpmInput2.value : 60)) || 60;
    
    const dirGiro = window.obtenerDireccionGiro();
    const degPerSecObjetivo = rpmObjetivo * 6 * dirGiro;
    
    if (typeof window.velocidadAngularSimulada === 'undefined') window.velocidadAngularSimulada = 0;
    
    let aceleracion = 0;
    const M_kg = EstadoDiseno.masaExtra_kg || 0;
    
    // Leer factores de fricción del Sandbox
    const aeroInput = document.getElementById('anim-fis-aero');
    const friccionAero = aeroInput ? parseFloat(aeroInput.value) : 0.08;
    
    const mecInput = document.getElementById('anim-fis-mec');
    const friccionMec = mecInput ? parseFloat(mecInput.value) : 0.02;
    
    // Calcular pérdida por fricción total (aerodinámica proporcional a v, mecánica casi constante pero opuesta al giro)
    const friccionTotal = (friccionAero * window.velocidadAngularSimulada) + (Math.sign(window.velocidadAngularSimulada) * friccionMec * 100);
    
    if (animacionCorriendo) {
        // Motor impulsado: el error de velocidad genera aceleración, pero la fricción se opone
        const error = degPerSecObjetivo - window.velocidadAngularSimulada;
        aceleracion = (error * 5.0) - friccionTotal; 
    } else {
        // Motor libre: Solo actúa la fricción y el péndulo gravitatorio
        aceleracion = -friccionTotal;
        
        const Rcm_m = EstadoDiseno.Rcm_m || 0;
        
        if (M_kg > 0 && Rcm_m > 0) {
            const theta_cm_rad = EstadoDiseno.theta_cm_rad || 0;
            const anguloFisicoCM = (window.animacionAnguloRotor * Math.PI / 180) - (Math.PI / 2) + theta_cm_rad;
            
            const g = 9.81;
            // Torque: máximo cuando está a la derecha o izquierda, 0 cuando está vertical
            const tau_g = M_kg * g * Rcm_m * Math.cos(anguloFisicoCM);
            
            // Inercia baja para asegurar que la masa predomine sobre la fricción
            const inercia = 0.00001; 
            const alfa_rad = tau_g / inercia; 
            const alfa_deg = alfa_rad * 180 / Math.PI;
            
            aceleracion += alfa_deg;
        }
    }
    
    window.velocidadAngularSimulada += aceleracion * dt;
    window.animacionAnguloRotor = (((window.animacionAnguloRotor + (window.velocidadAngularSimulada * dt)) % 360) + 360) % 360;
    
    // Parada final más permisiva para no matar el péndulo
    if (!animacionCorriendo) {
        if (M_kg === 0) {
            if (Math.abs(window.velocidadAngularSimulada) < 0.2) window.velocidadAngularSimulada = 0;
        } else {
            // El péndulo solo muere si de verdad ya no tiene fuerza ni velocidad
            if (Math.abs(window.velocidadAngularSimulada) < 0.5 && Math.abs(aceleracion) < 2.0) {
                window.velocidadAngularSimulada = 0;
            }
        }
    }
    
    window.sincronizarGiroGlobal(Math.round(window.animacionAnguloRotor), true);
    
    // Asegurar que el bucle continúe mientras haya movimiento o aceleración
    if (animacionCorriendo || Math.abs(window.velocidadAngularSimulada) > 0 || Math.abs(aceleracion) > 1.0) {
        animacionGlobalId = requestAnimationFrame(bucleAnimacionGlobal);
    } else {
        animacionGlobalId = null;
        // Motor completamente detenido (inercia terminada), reactivamos los controles manuales
        const slidersGiro = [document.getElementById('anim-giro'), document.getElementById('lum-giro'), document.getElementById('anim-giro-step8')];
        slidersGiro.forEach(slider => {
            if (slider) slider.disabled = false;
        });
    }
}

function actualizarAnimacionManual() {
    if (animacionCorriendo) toggleAnimacionGlobal();
    window.animacionAnguloRotor = parseFloat(document.getElementById('anim-giro').value) || 0;
    renderizarAnimacionDinamica();
}

function renderizarAnimacionDinamica() {
    const svg = document.getElementById('svg-simulacion-dinamica');
    if (!svg) return;
    svg.innerHTML = ''; // Limpiar lienzo
    
    const cx = 0;
    const cy = 0;
    
    // Leer Parámetros
    const luz_deg = parseFloat(document.getElementById('anim-luz').value) || 0;
    const dist_iman = parseFloat(document.getElementById('anim-dist').value) || 15;
    const factorEscalaFuerza = (parseFloat(document.getElementById('anim-escala-fuerza')?.value) || 10) / 10;
    const giro = window.animacionAnguloRotor;
    
    const animBobEspiras = document.getElementById('anim-bob-espiras-readout');
    if(animBobEspiras) animBobEspiras.innerText = Math.round(EstadoDiseno?.espirasPorDevanado || 0);
    
    const animGeoDiam = document.getElementById('anim-geo-diam-readout');
    if(animGeoDiam) animGeoDiam.innerText = (EstadoDiseno?.diametroRotor || 0).toFixed(1);
    
    const N = EstadoDiseno?.numeroCaras || 4;
    const R_mm = (EstadoDiseno?.diametroRotor || 50) / 2;
    // Factor de escala visual: R_mm -> 100px
    const escala = 100 / R_mm;
    const radioExterior = R_mm * escala;
    
    // --- 1. FONDO Y LUZ (Estilo Paso 4) ---
    const luz_rad = (luz_deg - 90) * Math.PI / 180;
    const radioOrbita = 150;
    const solX = cx + Math.cos(luz_rad) * radioOrbita;
    const solY = cy + Math.sin(luz_rad) * radioOrbita;
    
    // Dibujar la fuente de luz seleccionada
    const selectLuz = document.getElementById('ensayo-fuente-luz');
    const tipoLuz = selectLuz ? selectLuz.value : 'halogena';
    const iconoLuz = window.generarSVGIconoFuenteLuz(tipoLuz);
    
    const solGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    solGroup.setAttribute("transform", `translate(${solX}, ${solY}) scale(1.5) rotate(${luz_deg})`);
    if (!animacionCorriendo) solGroup.setAttribute("opacity", "0.3");
    solGroup.innerHTML = iconoLuz.svg;
    svg.appendChild(solGroup);
    
    // Rayos direccionales (paralelos)
    if (animacionCorriendo) {
        for(let j=-2; j<=2; j++) {
            const offsetAng = j * 8; // Separación de rayos en grados
            const r_ang = (luz_deg - 90 + offsetAng) * Math.PI / 180;
            const rx_s = cx + (radioOrbita - 5) * Math.cos(r_ang);
            const ry_s = cy + (radioOrbita - 5) * Math.sin(r_ang);
            
            let dirX = -Math.cos(luz_rad);
            let dirY = -Math.sin(luz_rad);
            
            const ray = document.createElementNS("http://www.w3.org/2000/svg", "line");
            ray.setAttribute('x1', rx_s); ray.setAttribute('y1', ry_s);
            ray.setAttribute('x2', rx_s + dirX * 40); ray.setAttribute('y2', ry_s + dirY * 40);
            ray.setAttribute('stroke', '#f39c12');
            ray.setAttribute('stroke-width', '2');
            ray.setAttribute('stroke-dasharray', '5,5');
            ray.setAttribute('opacity', '0.7');
            solGroup.appendChild(ray);
        }
    }
    svg.appendChild(solGroup);

    // --- 1.5. LÍNEAS DE FLUJO MAGNÉTICO (Estilo Magpylib/Físico) ---
    let styleDef = svg.querySelector('style#flujoStyle');
    if (!styleDef) {
        styleDef = document.createElementNS("http://www.w3.org/2000/svg", "style");
        styleDef.setAttribute('id', 'flujoStyle');
        styleDef.textContent = `
            @keyframes flujoMagneticoAnimPos {
                to { stroke-dashoffset: -24; }
            }
            @keyframes flujoMagneticoAnimNeg {
                to { stroke-dashoffset: 24; }
            }
        `;
        svg.appendChild(styleDef);
    }

    const fieldGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    
    const imanW = 120;
    const imanH = 24;
    const yImanTop = radioExterior + (dist_iman * escala);
    const yImanBot = yImanTop + imanH;
    const yImanMid = (yImanTop + yImanBot) / 2;
    
    const animPolaridad = parseInt(document.getElementById('iman-polaridad')?.value) || 1;
    const animName = animPolaridad === 1 ? 'flujoMagneticoAnimPos' : 'flujoMagneticoAnimNeg';

    const numLineasLado = 9;
    for (let i = 1; i <= numLineasLado; i++) {
        let t = i / numLineasLado;
        // La distribución exponencial concentra más líneas cerca de los bordes del imán
        let f = Math.pow(t, 0.7); 

        let x = (imanW / 2) * f;
        let far = Math.pow(1 - f, 2); 

        // H = Altura a la que sube la curva antes de doblar (las centrales suben más)
        let H = 15 + 250 * far;
        // x_out = Anchura máxima del lazo (las centrales llegan más lejos)
        let x_out = (imanW / 2) + 12 + 150 * far;
        // H_apex = Curvatura en el ecuador
        let H_apex = 12 + 150 * far;

        // Opacidad: líneas lejanas (f pequeño) son más tenues
        let opacidad = (0.15 + 0.4 * f).toFixed(2);

        // Path Lado Derecho
        // Sale del Norte (Top), curva hasta el ecuador (Mid), entra al Sur (Bot), y cierra por el interior (Top)
        const pathDer = document.createElementNS("http://www.w3.org/2000/svg", "path");
        let dDer = `M ${x} ${yImanTop} 
                    C ${x} ${yImanTop - H}, ${x_out} ${yImanMid - H_apex}, ${x_out} ${yImanMid}
                    C ${x_out} ${yImanMid + H_apex}, ${x} ${yImanBot + H}, ${x} ${yImanBot}
                    L ${x} ${yImanTop}`;
        pathDer.setAttribute("d", dDer);
        pathDer.setAttribute("fill", "none");
        pathDer.setAttribute("stroke", "#8e44ad"); // Morado magnético
        pathDer.setAttribute("stroke-width", "1.5");
        pathDer.setAttribute("stroke-dasharray", "12, 12");
        pathDer.setAttribute("opacity", opacidad);
        if (animacionCorriendo) {
            pathDer.style.animation = `${animName} 1s linear infinite`;
        }
        fieldGroup.appendChild(pathDer);

        // Path Lado Izquierdo
        const pathIzq = document.createElementNS("http://www.w3.org/2000/svg", "path");
        let dIzq = `M ${-x} ${yImanTop} 
                    C ${-x} ${yImanTop - H}, ${-x_out} ${yImanMid - H_apex}, ${-x_out} ${yImanMid}
                    C ${-x_out} ${yImanMid + H_apex}, ${-x} ${yImanBot + H}, ${-x} ${yImanBot}
                    L ${-x} ${yImanTop}`;
        pathIzq.setAttribute("d", dIzq);
        pathIzq.setAttribute("fill", "none");
        pathIzq.setAttribute("stroke", "#8e44ad");
        pathIzq.setAttribute("stroke-width", "1.5");
        pathIzq.setAttribute("stroke-dasharray", "12, 12");
        pathIzq.setAttribute("opacity", opacidad);
        if (animacionCorriendo) {
            pathIzq.style.animation = `${animName} 1s linear infinite`;
        }
        fieldGroup.appendChild(pathIzq);
    }
    
    svg.appendChild(fieldGroup);
    
    // --- 2. IMÁN BASE (Estilo Limpio Paso 3) ---
    const imanWidth = 120;
    const imanHeight = 24;
    const hMedio = imanHeight / 2;
    const y_iman_sup = radioExterior + (dist_iman * escala);
    
    const polaridad = parseInt(document.getElementById('iman-polaridad')?.value) || 1;
    
    // Parte Superior
    const colorSup = polaridad === 1 ? '#e74c3c' : '#3498db';
    const borderSup = polaridad === 1 ? '#c0392b' : '#2980b9';
    const textSup = polaridad === 1 ? 'N' : 'S';
    
    const rectSup = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rectSup.setAttribute('x', -imanWidth/2); rectSup.setAttribute('y', y_iman_sup);
    rectSup.setAttribute('width', imanWidth); rectSup.setAttribute('height', hMedio);
    rectSup.setAttribute('fill', colorSup); rectSup.setAttribute('stroke', borderSup);
    rectSup.setAttribute('stroke-width', '1'); rectSup.setAttribute('rx', '1');
    svg.appendChild(rectSup);

    const txtSup = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txtSup.setAttribute('x', 0); txtSup.setAttribute('y', y_iman_sup + hMedio - 2);
    txtSup.setAttribute('font-size', '10'); txtSup.setAttribute('fill', 'white');
    txtSup.setAttribute('font-weight', 'bold'); txtSup.setAttribute('text-anchor', 'middle');
    txtSup.textContent = textSup;
    svg.appendChild(txtSup);

    // Parte Inferior
    const colorInf = polaridad === 1 ? '#3498db' : '#e74c3c';
    const borderInf = polaridad === 1 ? '#2980b9' : '#c0392b';
    const textInf = polaridad === 1 ? 'S' : 'N';
    
    const rectInf = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rectInf.setAttribute('x', -imanWidth/2); rectInf.setAttribute('y', y_iman_sup + hMedio);
    rectInf.setAttribute('width', imanWidth); rectInf.setAttribute('height', hMedio);
    rectInf.setAttribute('fill', colorInf); rectInf.setAttribute('stroke', borderInf);
    rectInf.setAttribute('stroke-width', '1'); rectInf.setAttribute('rx', '1');
    svg.appendChild(rectInf);

    const txtInf = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txtInf.setAttribute('x', 0); txtInf.setAttribute('y', y_iman_sup + imanHeight - 2);
    txtInf.setAttribute('font-size', '10'); txtInf.setAttribute('fill', 'white');
    txtInf.setAttribute('font-weight', 'bold'); txtInf.setAttribute('text-anchor', 'middle');
    txtInf.textContent = textInf;
    svg.appendChild(txtInf);
    
    // --- 3. CÁLCULO DE CORRIENTES ---
    let effs = [];
    for(let i=0; i<N; i++) {
        let anguloPanel = (i * 360 / N) - 90 + giro;
        let delta = anguloPanel - (luz_deg - 90);
        delta = ((delta % 360) + 360) % 360;
        if (delta > 180) delta -= 360;
        let cosInc = Math.cos(delta * Math.PI / 180);
        effs.push(Math.max(0, cosInc));
    }
    
    let currents = new Array(N).fill(0);
    const conexion = document.getElementById('lum-conexion')?.value || '0';
    const off = parseInt(conexion);
    
    if (animacionCorriendo) {
        for (let i = 0; i < N / 2; i++) {
            let iOpp = i + (N / 2);
            let netEff = effs[i] - effs[iOpp];
            let k = (i + off + N) % N;
            let kOpp = (k + (N / 2)) % N;
            currents[k] = netEff;
            currents[kOpp] = -netEff;
        }
    }
    
    // --- 4. ROTOR POLIGONAL CON EJE (Estilo Paso 3) ---
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

    const profPx = Ds * escala;
    const RfondoPx = Math.max( radioExterior * 0.35, radioExterior - profPx );
    const tipoRanura = document.getElementById('ranura-tipo')?.value || 'rect';
    let dRotor = "";

    const rotOffset = (giro * Math.PI / 180) - (angP + angS) / 2;

    for (let i = 0; i < N; i++) {
        const anguloCentroPanel = i * (angP + angS) - (Math.PI / 2) + rotOffset;
        const theta1 = anguloCentroPanel - (angP / 2);
        const theta2 = anguloCentroPanel + (angP / 2);
        const theta3 = theta2 + angS;

        const p1x = radioExterior * Math.cos(theta1); const p1y = radioExterior * Math.sin(theta1);
        const p2x = radioExterior * Math.cos(theta2); const p2y = radioExterior * Math.sin(theta2);
        const p3x = radioExterior * Math.cos(theta3); const p3y = radioExterior * Math.sin(theta3);

        if (i === 0) dRotor += `M ${p1x} ${p1y} `;
        else dRotor += `L ${p1x} ${p1y} `;
        dRotor += `L ${p2x} ${p2y} `;

        if (tipoRanura === 'trapecio') {
            const s1x = RfondoPx * Math.cos(theta2); const s1y = RfondoPx * Math.sin(theta2);
            const s2x = RfondoPx * Math.cos(theta3); const s2y = RfondoPx * Math.sin(theta3);
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
    circuloExt.setAttribute("cx", 0); circuloExt.setAttribute("cy", 0);
    circuloExt.setAttribute("r", radioExterior);
    circuloExt.setAttribute("fill", "none"); circuloExt.setAttribute("stroke", "#ccc");
    circuloExt.setAttribute("stroke-dasharray", "3");
    svg.appendChild(circuloExt);

    const pathRotor = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathRotor.setAttribute("d", dRotor);
    pathRotor.setAttribute("fill", "#ecf0f1");
    pathRotor.setAttribute("stroke", "#bdc3c7");
    pathRotor.setAttribute("stroke-width", "3");
    svg.appendChild(pathRotor);

    // Eje central
    const ejeCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    ejeCircle.setAttribute("cx", 0); ejeCircle.setAttribute("cy", 0);
    ejeCircle.setAttribute("r", radioExterior * 0.15);
    ejeCircle.setAttribute("fill", "#fff");
    ejeCircle.setAttribute("stroke", "#95a5a6");
    ejeCircle.setAttribute("stroke-width", "2");
    svg.appendChild(ejeCircle);
    
    // --- 5. DEVANADOS Y FUERZAS ---
    let parNeto = 0;
    let fVerticalTotal = 0; // Fuerza radial neta (cabeceo / levitación)
    let fHorizontalTotal = 0; // Fuerza lateral neta (empuje horizontal en el eje)
    const I_max = (EstadoDiseno?.intensidadPanel_mA || 300) / 1000;
    const L_m = EstadoDiseno?.longitudActiva_m || 0.05;
    const numEspiras = EstadoDiseno?.espirasPorDevanado || 50;
    const B_campo_base = EstadoDiseno?.campoB_T || 0.18;
    
    const maxDevanadoR = (radioExterior - RfondoPx) / 2;
    const devanadoR = Math.max(3, Math.min(8, maxDevanadoR));
    
    for(let i=0; i<N; i++) {
        // La ranura i está centrada en la muesca
        const aRanura = i * (angP + angS) + rotOffset + (angP + angS) / 2 - (Math.PI / 2);
        const sx = (RfondoPx + devanadoR) * Math.cos(aRanura);
        const sy = (RfondoPx + devanadoR) * Math.sin(aRanura);
        
        const I_inst = currents[i] || 0;
        
        // Dibujar ranura activa
        const devCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        devCircle.setAttribute('cx', sx); devCircle.setAttribute('cy', sy);
        devCircle.setAttribute('r', devanadoR);
        
        let colorFondo = '#7f8c8d'; // Gris/cobre inactivo por defecto
        if (I_inst > 0.01) colorFondo = '#e74c3c'; // Rojo (entra)
        else if (I_inst < -0.01) colorFondo = '#2980b9'; // Azul (sale)
        
        devCircle.setAttribute('fill', colorFondo); 
        devCircle.setAttribute('stroke', '#d35400');
        svg.appendChild(devCircle);
        
        // Símbolo Corriente (⊗ o ⊙)
        const csz = Math.max(2, devanadoR * 0.4);
        if (I_inst > 0.01) { // Entra (X)
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
        } else if (I_inst < -0.01) { // Sale (dot)
            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot.setAttribute('cx', sx); dot.setAttribute('cy', sy);
            dot.setAttribute('r', csz * 0.7);
            dot.setAttribute('fill', 'none');
            dot.setAttribute('stroke', '#fff'); dot.setAttribute('stroke-width', '1.2');
            svg.appendChild(dot);
            const dotFill = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dotFill.setAttribute('cx', sx); dotFill.setAttribute('cy', sy);
            dotFill.setAttribute('r', 1.5);
            dotFill.setAttribute('fill', '#fff');
            svg.appendChild(dotFill);
        }
        
        // --- FUERZAS DE LORENTZ EN TODAS LAS ESPIRAS INFERIORES ---
        if (Math.abs(I_inst) > 0.01) {
            const dist_real_mm = ((y_iman_sup - sy) / escala);
            
            if(sy > 0) { // Sólo consideramos fuerzas si la ranura está en la mitad inferior (cerca del imán)
                // Distancia horizontal al centro del imán
                const distHorizontal = Math.abs(sx);
                // Amortiguación B_efectivo como en Paso 3
                const damping_lateral = Math.exp(-Math.pow(distHorizontal / (imanWidth * 0.8), 2));
                const pol = parseInt(document.getElementById('iman-polaridad')?.value) || 1;
                const B_efectivo = pol * B_campo_base * Math.pow(10 / Math.max(5, dist_real_mm), 2) * damping_lateral;
                
                const F_local = I_inst * L_m * numEspiras * B_efectivo;
                
                if (Math.abs(F_local) > 0.0001) {
                    // UNIFICACIÓN: Forzamos la dirección de la fuerza para que el torque visual
                    // siempre cuadre exactamente con la "fuente de verdad" (Magpylib).
                    const giroGlobal = window.obtenerDireccionGiro();
                    // FÍSICA ESTRICTA MAGPYLIB: 
                    // Si el giro es Antihorario (-1), el vector inferior debe empujar a la DERECHA (+1)
                    // Si el giro es Horario (+1), el vector inferior debe empujar a la IZQUIERDA (-1)
                    const dirF = -giroGlobal; 
                    // El par local no lo necesitamos pintar más como arco, 
                    // pero lo calculamos para el registro o variables
                    const magnitudPar = Math.abs(F_local * (radioExterior/escala)/1000);
                    const parLocal = (giroGlobal === 1) ? magnitudPar : -magnitudPar; 
                    parNeto += parLocal;
                    
                    const F_px = Math.abs(F_local) * 8000 * factorEscalaFuerza;
                    
                    // Componente horizontal (tangencial / empuje X visual) - dibujada en verde oscuro
                    if (F_px > 1) {
                        const len = Math.min(100, F_px);
                        const endX = sx + (dirF > 0 ? len : -len);
                        
                        const arr = document.createElementNS("http://www.w3.org/2000/svg", "line");
                        arr.setAttribute("x1", sx); arr.setAttribute("y1", sy);
                        arr.setAttribute("x2", endX); arr.setAttribute("y2", sy);
                        arr.setAttribute("stroke", "#27ae60"); 
                        arr.setAttribute("stroke-width", "2");
                        arr.setAttribute("stroke-dasharray", "3,2");
                        svg.appendChild(arr);
                        
                        const head = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                        if(dirF > 0) head.setAttribute("points", `${endX},${sy} ${endX-6},${sy-4} ${endX-6},${sy+4}`);
                        else head.setAttribute("points", `${endX},${sy} ${endX+6},${sy-4} ${endX+6},${sy+4}`);
                        head.setAttribute("fill", "#27ae60");
                        svg.appendChild(head);
                    }
                    
                    // F_vertical local (Cabeceo Y visual)
                    // Esta fuerza tiende a separar o atraer el rotor del imán
                    const F_vertical_local = - Math.abs(I_inst) * (sx - cx) * 0.5 * (Math.abs(F_local) * 2000) * factorEscalaFuerza * pol;
                    
                    const FV_px = Math.abs(F_vertical_local) * 2;
                    if (FV_px > 1) {
                        const lenV = Math.min(80, FV_px);
                        const dirFV = F_vertical_local > 0 ? 1 : -1; // >0 significa hacia abajo en SVG
                        const endY = sy + (dirFV > 0 ? lenV : -lenV);
                        
                        const arrV = document.createElementNS("http://www.w3.org/2000/svg", "line");
                        arrV.setAttribute("x1", sx); arrV.setAttribute("y1", sy);
                        arrV.setAttribute("x2", sx); arrV.setAttribute("y2", endY);
                        arrV.setAttribute("stroke", "#d35400"); 
                        arrV.setAttribute("stroke-width", "2");
                        arrV.setAttribute("stroke-dasharray", "3,2");
                        svg.appendChild(arrV);
                        
                        const headV = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                        if(dirFV > 0) headV.setAttribute("points", `${sx},${endY} ${sx-4},${endY-6} ${sx+4},${endY-6}`);
                        else headV.setAttribute("points", `${sx},${endY} ${sx-4},${endY+6} ${sx+4},${endY+6}`);
                        headV.setAttribute("fill", "#d35400");
                        svg.appendChild(headV);
                    }
                    
                    fVerticalTotal += F_vertical_local;
                    fHorizontalTotal += (dirF > 0 ? 1 : -1) * F_px;
                }
            }
        }
    }
    
    // --- 6. ARCO DE TORQUE NETO (ELIMINADO) ---
    // A petición del usuario, como el rotor ya se ve girar,
    // no pintamos el sentido de giro (arco morado) en la simulación dinámica.
    
    // --- 7. DIBUJAR VECTOR DE CABECEO (FUERZA VERTICAL NETA MAGPYLIB) ---
    // Magpylib Z es el eje vertical. +Z es hacia arriba (SVG -Y).
    const fMagpylibZ = EstadoDiseno?.fuerzaLorentz_Z || 0;
    const fVertVisual = fMagpylibZ * factorEscalaFuerza * 1000; 
    if (Math.abs(fVertVisual) > 0.5) {
        const len = Math.max(15, Math.abs(fVertVisual));
        const endY = cy + (fMagpylibZ > 0 ? -len : len); // Z>0 sube en la pantalla (y menor)
        
        const arrV = document.createElementNS("http://www.w3.org/2000/svg", "line");
        arrV.setAttribute("x1", cx); arrV.setAttribute("y1", cy);
        arrV.setAttribute("x2", cx); arrV.setAttribute("y2", endY);
        arrV.setAttribute("stroke", "#e67e22"); // Naranja
        arrV.setAttribute("stroke-width", "4");
        svg.appendChild(arrV);
        
        const headV = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        if(fMagpylibZ > 0) headV.setAttribute("points", `${cx},${endY} ${cx-6},${endY+8} ${cx+6},${endY+8}`);
        else headV.setAttribute("points", `${cx},${endY} ${cx-6},${endY-8} ${cx+6},${endY-8}`);
        headV.setAttribute("fill", "#e67e22");
        svg.appendChild(headV);
    }
    
    // --- 8. DIBUJAR VECTOR LATERAL (FUERZA HORIZONTAL NETA MAGPYLIB) ---
    // Magpylib Y es el eje lateral. +Y es hacia la derecha (SVG +X).
    const fMagpylibY = EstadoDiseno?.fuerzaLorentz_Y || 0;
    const fHorizVisual = fMagpylibY * factorEscalaFuerza * 1000;
    if (Math.abs(fHorizVisual) > 0.5) {
        const len = Math.max(15, Math.abs(fHorizVisual));
        const endX = cx + (fMagpylibY > 0 ? len : -len); // Y>0 derecha
        
        const arrH = document.createElementNS("http://www.w3.org/2000/svg", "line");
        arrH.setAttribute("x1", cx); arrH.setAttribute("y1", cy);
        arrH.setAttribute("x2", endX); arrH.setAttribute("y2", cy);
        arrH.setAttribute("stroke", "#3498db"); // Azul
        arrH.setAttribute("stroke-width", "4");
        svg.appendChild(arrH);
        
        const headH = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        if(fMagpylibY > 0) headH.setAttribute("points", `${endX},${cy} ${endX-8},${cy-6} ${endX-8},${cy+6}`);
        else headH.setAttribute("points", `${endX},${cy} ${endX+8},${cy-6} ${endX+8},${cy+6}`);
        headH.setAttribute("fill", "#3498db");
        svg.appendChild(headH);
    }
    
    // Mostrar estadísticas
    const strSentido = Math.abs(parNeto) < 1e-6 ? "Neutro" : (parNeto < 0 ? "Antihorario" : "Horario");
    document.getElementById('anim-par-neto').innerText = parNeto.toExponential(2) + " N·m";
    document.getElementById('anim-sentido').innerText = strSentido;
}


// --- LÓGICA PASO 1: ENSAYO PLACAS SOLARES ---
let datosEnsayoSolar = JSON.parse(localStorage.getItem('mendocino_ensayo_actual')) || [];

function guardarEnsayoLocal() {
    localStorage.setItem('mendocino_ensayo_actual', JSON.stringify(datosEnsayoSolar));
}

function limpiarEnsayoSolar(force = false) {
    if (force || confirm('¿Estás seguro de que quieres borrar todos los datos del ensayo actual?')) {
        datosEnsayoSolar = [];
        window.ensayoEsPropietario = true;
        if (typeof toggleEdicionEnsayo === 'function') toggleEdicionEnsayo(true);
        guardarEnsayoLocal();
        actualizarTablaEnsayo();
        document.getElementById('ensayo-nombre-panel').value = '';
        document.getElementById('ensayo-l-panel').value = '';
        document.getElementById('ensayo-a-panel').value = '';
        const select = document.getElementById('ensayo-historial-select');
        if (select) select.value = '';
        
        // Limpiar nuevos campos
        const p1 = document.getElementById('ensayo-proveedor'); if (p1) p1.value = '';
        const p2 = document.getElementById('ensayo-precio'); if (p2) p2.value = '';
        const p3 = document.getElementById('ensayo-peso'); if (p3) p3.value = '';
    }
}

function agregarMedidaEnsayo() {
    const vInput = document.getElementById('ensayo-v');
    const iInput = document.getElementById('ensayo-i');
    
    const v = parseFloat(vInput.value);
    const i = parseFloat(iInput.value);
    
    if (isNaN(v) || isNaN(i) || v <= 0 || i <= 0) {
        mostrarToast('Introduce valores válidos y positivos.', 'error');
        return;
    }
    
    // V está en mV (10^-3 V), I en mA (10^-3 A)
    // P = V * I = 10^-6 W = microW. Para mW, dividimos entre 1000.
    const p = (v * i) / 1000; // mW
    
    // R = V_mV / I_mA = Ohmios. Para mOhmios multiplicamos por 1000.
    const r = (v / i) * 1000; // mOhm
    
    datosEnsayoSolar.push({ v, i, p, r });
    datosEnsayoSolar.sort((a, b) => a.v - b.v);
    
    guardarEnsayoLocal();
    actualizarTablaEnsayo();
    
    vInput.value = '';
    iInput.value = '';
    vInput.focus();
}

function actualizarTablaEnsayo() {
    const tbody = document.getElementById('tabla-ensayo-body');
    if (!tbody) return;
    
    if (datosEnsayoSolar.length === 0) {
        tbody.innerHTML = '<tr id="ensayo-no-data"><td colspan="5" style="padding: 15px; color: #94a3b8;">No hay datos registrados.</td></tr>';
        if (typeof renderizarResultadosFase1 === 'function') {
            renderizarResultadosFase1();
        }
        dibujarGraficaEnsayo();
        return;
    }
    
    let html = '';
    let maxP = -1;
    let pmpData = null;
    
    datosEnsayoSolar.forEach((d) => {
        if (d.p > maxP) {
            maxP = d.p;
            pmpData = d;
        }
    });
    
    datosEnsayoSolar.forEach((d, index) => {
        const isMax = (d === pmpData);
        // Base styling for the whole row
        const rowStyle = isMax ? 'border-bottom: 2px solid #fbbf24; font-weight: bold;' : 'border-bottom: 1px solid #e2e8f0;';
        
        // Specific styling per column block (Measurement vs Calculation)
        const cellStyleMeasure = isMax ? 'background-color: #f0f9ff; color: #0369a1;' : 'background-color: #f8fafc; color: #334155;';
        const cellStyleCalc = isMax ? 'background-color: #fef3c7; color: #b45309;' : 'background-color: #fffbeb; color: #78350f;';
        const isOwner = (typeof window.ensayoEsPropietario === 'undefined' || window.ensayoEsPropietario);
        const btnStyle = isOwner 
            ? 'background: none; border: none; color: #ef4444; cursor: pointer; font-size: 16px;' 
            : 'background: none; border: none; color: #ef4444; cursor: not-allowed; font-size: 16px; opacity: 0.4;';
        
        html += `
            <tr style="${rowStyle}">
                <td style="padding: 8px; ${cellStyleMeasure} border-right: 1px solid #e0f2fe;">${d.v.toFixed(2)}</td>
                <td style="padding: 8px; ${cellStyleMeasure} border-right: 1px solid #e2e8f0;">${d.i.toFixed(2)}</td>
                <td style="padding: 8px; ${cellStyleCalc} border-right: 1px solid #fef3c7;">${d.p.toFixed(2)}</td>
                <td style="padding: 8px; ${cellStyleCalc} border-right: 1px solid #e2e8f0;">${d.r.toFixed(2)}</td>
                <td style="padding: 8px; background-color: #f8fafc;">
                    <button style="${btnStyle}" onclick="eliminarMedidaEnsayo(${index})" title="Eliminar fila" ${!isOwner ? 'disabled' : ''}>🗑️</button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // Llamar a la nueva función de resultados globales
    if (typeof renderizarResultadosFase1 === 'function') {
        renderizarResultadosFase1();
    }
    
    dibujarGraficaEnsayo();
}

function eliminarMedidaEnsayo(index) {
    datosEnsayoSolar.splice(index, 1);
    guardarEnsayoLocal();
    actualizarTablaEnsayo();
}

function dibujarGraficaEnsayo() {
    const svg = document.getElementById('grafica-ensayo-svg');
    if (!svg) return;
    
    const w = 300, h = 200;
    const margin = 35;
    
    if (datosEnsayoSolar.length === 0) {
        svg.innerHTML = `
            <line x1="${margin}" y1="${h-margin}" x2="${w-10}" y2="${h-margin}" stroke="#cbd5e1" stroke-width="1"/>
            <line x1="${margin}" y1="${h-margin}" x2="${margin}" y2="10" stroke="#cbd5e1" stroke-width="1"/>
            <text x="${w/2}" y="${h/2}" font-size="12" fill="#94a3b8" text-anchor="middle">Añade datos para ver la curva</text>
            <text x="${w-10}" y="${h-15}" font-size="9" fill="#64748b" text-anchor="end">V [mV]</text>
            <text x="${margin-10}" y="35" font-size="9" fill="#64748b" text-anchor="middle" transform="rotate(-90 ${margin-10},35)">P [mW]</text>
        `;
        return;
    }
    
    let maxV = Math.max(...datosEnsayoSolar.map(d => d.v), 100);
    let maxP = Math.max(...datosEnsayoSolar.map(d => d.p), 1);
    
    // Leer valores directos de Voc e Isc si existen
    const inputVoc = document.getElementById('ensayo-voc');
    const inputIsc = document.getElementById('ensayo-isc');
    const explicitVoc = inputVoc && !isNaN(parseFloat(inputVoc.value)) ? parseFloat(inputVoc.value) : 0;
    const explicitIsc = inputIsc && !isNaN(parseFloat(inputIsc.value)) ? parseFloat(inputIsc.value) : 0;
    
    // Calcular P. Teórica Ideal para ajustar la escala Y
    const vocMax = explicitVoc > 0 ? explicitVoc : Math.max(...datosEnsayoSolar.map(d => d.v));
    const iscMax = explicitIsc > 0 ? explicitIsc : Math.max(...datosEnsayoSolar.map(d => d.i));
    const pIdeal = (vocMax * iscMax) / 1000;
    
    if (vocMax > maxV) maxV = vocMax;
    
    if (pIdeal > maxP) {
        maxP = pIdeal;
    }
    
    maxV = maxV * 1.1;
    maxP = maxP * 1.15;
    
    const toX = (val) => margin + (val / maxV) * (w - margin * 1.5);
    const toY = (val) => (h - margin) - (val / maxP) * (h - margin * 1.5);
    
    const puntos = [[toX(0), toY(0)]];
    datosEnsayoSolar.forEach(d => puntos.push([toX(d.v), toY(d.p)]));

    let pathD = `M ${puntos[0][0]} ${puntos[0][1]} `;
    const smoothing = 0.2; // Tensión de la curva
    for (let i = 1; i < puntos.length; i++) {
        const p_prev2 = puntos[i - 2] || puntos[i - 1] || puntos[0];
        const p_prev1 = puntos[i - 1];
        const p_curr = puntos[i];
        const p_next = puntos[i + 1] || puntos[i];

        let control1_x = p_prev1[0] + (p_curr[0] - p_prev2[0]) * smoothing;
        let control1_y = p_prev1[1] + (p_curr[1] - p_prev2[1]) * smoothing;

        let control2_x = p_curr[0] - (p_next[0] - p_prev1[0]) * smoothing;
        let control2_y = p_curr[1] - (p_next[1] - p_prev1[1]) * smoothing;

        // Evitar que la curva se hunda por debajo del eje X visual (rebase de p=0)
        const ejeY0 = toY(0);
        if (control1_y > ejeY0) control1_y = ejeY0;
        if (control2_y > ejeY0) control2_y = ejeY0;

        pathD += `C ${control1_x},${control1_y} ${control2_x},${control2_y} ${p_curr[0]},${p_curr[1]} `;
    }
    
    let puntosHtml = '';
    let pmpData = null;
    let currentMaxP = -1;
    
    datosEnsayoSolar.forEach(d => {
        if (d.p > currentMaxP) {
            currentMaxP = d.p;
            pmpData = d;
        }
    });
    
    datosEnsayoSolar.forEach(d => {
        const isMax = (d === pmpData);
        const color = isMax ? '#d97706' : '#3b82f6';
        const radio = isMax ? 4.5 : 2.5;
        const opacidad = isMax ? '1' : '0.8';
        puntosHtml += `<circle cx="${toX(d.v)}" cy="${toY(d.p)}" r="${radio}" fill="${color}" opacity="${opacidad}" cursor="pointer"><title>V: ${d.v} mV | P: ${d.p.toFixed(2)} mW</title></circle>`;
    });
    
    // Cálculo del Factor de Forma (FF)
    const ff = pmpData ? (pmpData.p / pIdeal) : 0;
    
    let html = `
        <line x1="${margin}" y1="${h-margin}" x2="${w-10}" y2="${h-margin}" stroke="#94a3b8" stroke-width="1"/>
        <line x1="${margin}" y1="${h-margin}" x2="${margin}" y2="10" stroke="#94a3b8" stroke-width="1"/>
        
        <text x="${w-10}" y="${h-15}" font-size="9" fill="#64748b" text-anchor="end">Tensión [mV]</text>
        <text x="${margin-10}" y="40" font-size="9" fill="#64748b" text-anchor="middle" transform="rotate(-90 ${margin-10},40)">Potencia [mW]</text>
        
        <!-- Línea Potencia Teórica Ideal (Voc x Isc) -->
        ${pIdeal > 0 ? `
            <line x1="${margin}" y1="${toY(pIdeal)}" x2="${w-10}" y2="${toY(pIdeal)}" stroke="#10b981" stroke-width="1" stroke-dasharray="4,4" opacity="0.6"/>
            <text x="${w-10}" y="${toY(pIdeal) - 4}" font-size="9" fill="#059669" text-anchor="end">P. Teórica (Voc×Isc)</text>
            <text x="${w-10}" y="${toY(pIdeal) + 10}" font-size="9" fill="#059669" text-anchor="end" font-weight="bold">FF: ${ff.toFixed(2)}</text>
        ` : ''}

        <!-- Líneas guía PMP -->
        ${pmpData ? `
            <line x1="${toX(pmpData.v)}" y1="${toY(pmpData.p)}" x2="${toX(pmpData.v)}" y2="${h-margin}" stroke="#fcd34d" stroke-width="1" stroke-dasharray="2,2"/>
            <line x1="${margin}" y1="${toY(pmpData.p)}" x2="${toX(pmpData.v)}" y2="${toY(pmpData.p)}" stroke="#fcd34d" stroke-width="1" stroke-dasharray="2,2"/>
            <text x="${toX(pmpData.v)}" y="${toY(pmpData.p) - 8}" font-size="9" font-weight="bold" fill="#b45309" text-anchor="middle">PMP</text>
        ` : ''}
        
        <path d="${pathD}" stroke="#60a5fa" stroke-width="2" fill="none" opacity="0.8"/>
        
        ${puntosHtml}
    `;
    
    svg.innerHTML = html;
}

async function guardarPanelEnsayoDB() {
    if (datosEnsayoSolar.length === 0) {
        mostrarToast('No hay datos de ensayo para guardar.', 'error');
        return;
    }
    
    const nombre = document.getElementById('ensayo-nombre-panel').value.trim();
    const l = parseFloat(document.getElementById('ensayo-l-panel').value);
    const a = parseFloat(document.getElementById('ensayo-a-panel').value);
    
    if (!nombre || isNaN(l) || isNaN(a) || l <= 0 || a <= 0) {
        mostrarToast('Por favor, indica un nombre y las dimensiones (Largo y Ancho).', 'aviso');
        return;
    }
    
    // Calcular Vmp, Imp del Punto de Máxima Potencia
    let maxP = -1;
    let pmpData = null;
    datosEnsayoSolar.forEach(d => {
        if (d.p > maxP) {
            maxP = d.p;
            pmpData = d;
        }
    });
    
    // Convertimos de mV a V
    const vmp = pmpData.v / 1000;
    // Imp se queda en mA
    const imp = pmpData.i;
    
    // Estimar Voc e Isc
    // Estimar Voc e Isc o cogerlos de los inputs directos
    const inputVoc = document.getElementById('ensayo-voc');
    const inputIsc = document.getElementById('ensayo-isc');
    
    let voc = Math.max(...datosEnsayoSolar.map(d => d.v));
    if (inputVoc && !isNaN(parseFloat(inputVoc.value)) && parseFloat(inputVoc.value) > 0) {
        voc = parseFloat(inputVoc.value);
    }
    voc = voc / 1000; // Convert to V
    
    let isc = Math.max(...datosEnsayoSolar.map(d => d.i));
    if (inputIsc && !isNaN(parseFloat(inputIsc.value)) && parseFloat(inputIsc.value) > 0) {
        isc = parseFloat(inputIsc.value);
    }
    
    const inputLSil = document.getElementById('ensayo-l-silicio');
    const inputASil = document.getElementById('ensayo-a-silicio');
    const selectLuz = document.getElementById('ensayo-fuente-luz');
    const inputDist = document.getElementById('ensayo-distancia');
    const inputLux = document.getElementById('ensayo-lux');
    const inputProveedor = document.getElementById('ensayo-proveedor');
    const inputPrecio = document.getElementById('ensayo-precio');
    const inputPeso = document.getElementById('ensayo-peso');

    const datosPanel = {
        nombre: nombre,
        l: l,
        a: a,
        voc: voc,
        isc: isc,
        v: vmp,
        i: imp,
        ensayo_data: {
            puntos: [...datosEnsayoSolar],
            l_sil: inputLSil ? inputLSil.value : '',
            a_sil: inputASil ? inputASil.value : '',
            luz: selectLuz ? selectLuz.value : 'halogena',
            distancia: inputDist ? inputDist.value : '156',
            lux: inputLux ? inputLux.value : '',
            proveedor: inputProveedor ? inputProveedor.value : '',
            precio: inputPrecio ? inputPrecio.value : '',
            peso: inputPeso ? inputPeso.value : ''
        }
    };
    
    // Comprobar si ya existe un panel con este nombre
    const idxExistente = dbPaneles.findIndex(p => p.nombre === nombre);
    let panelExistente = null;
    let esPropietario = true;

    if (idxExistente >= 0) {
        panelExistente = dbPaneles[idxExistente];
        // Verificar si tiene ID de la nube (si es local puro, asumimos que es suyo)
        if (panelExistente.id) {
            if (window.sessionActiva && window.sessionActiva.user) {
                if (panelExistente.usuario_id !== window.sessionActiva.user.id && !window.esAdmin) {
                    esPropietario = false;
                }
            } else {
                esPropietario = false; // Sin sesión no puede sobrescribir algo de la nube
            }
        }
    }

    if (panelExistente && !esPropietario) {
        mostrarToast('Este panel es público y no te pertenece. Cambia el nombre para guardarlo como uno nuevo.', 'aviso');
        document.getElementById('ensayo-nombre-panel').value = nombre + ' (Copia)';
        return;
    }

    if (panelExistente) {
        // ACTUALIZAR EXISTENTE
        dbPaneles[idxExistente] = { ...panelExistente, ...datosPanel };
        guardarDatos();
        
        if (window.dbMendocinoClient && typeof sessionActiva !== 'undefined' && sessionActiva && panelExistente.id) {
            try {
                const { error } = await window.dbMendocinoClient.from('paneles').update(datosPanel).eq('id', panelExistente.id);
                if (error) throw error;
                mostrarToast(`¡Panel "${nombre}" actualizado correctamente!`, 'ok');
            } catch (e) {
                console.error("Error actualizando panel", e);
                mostrarToast('Error en la nube: ' + (e.message || 'Desconocido'), 'error');
            }
        } else {
            mostrarToast(`Panel "${nombre}" actualizado localmente.`, 'ok');
        }
    } else {
        // INSERTAR NUEVO
        if (window.dbMendocinoClient && typeof sessionActiva !== 'undefined' && sessionActiva) {
            const pParaSubir = { ...datosPanel, usuario_id: sessionActiva.user.id, es_publico: false };
            try {
                const { data, error } = await window.dbMendocinoClient.from('paneles').insert([pParaSubir]).select();
                if (error) throw error;
                
                if (data && data.length > 0) {
                    dbPaneles.push(data[0]); // Guardar con el ID real devuelto por la BD
                } else {
                    dbPaneles.push(pParaSubir);
                }
                guardarDatos();
                mostrarToast(`¡Panel "${nombre}" creado en la base de datos!`, 'ok');
            } catch (e) {
                console.error("Error subiendo panel", e);
                dbPaneles.push(pParaSubir);
                guardarDatos();
                mostrarToast('Error en la nube: ' + (e.message || 'Desconocido'), 'error');
            }
        } else {
            dbPaneles.push(datosPanel);
            guardarDatos();
            mostrarToast(`Panel "${nombre}" guardado localmente para ti.`, 'ok');
        }
    }
    
    // Seleccionar automáticamente el panel en el Paso 2
    setTimeout(() => {
        const selectPanel = document.getElementById('panel');
        if (selectPanel) {
            // Repoblar para asegurar (guardarDatos() ya llama a renderizarUI, pero por si acaso)
            poblarPanelesDropdown();
            // Seleccionar el último (el nuestro recién añadido)
            const options = selectPanel.options;
            for (let i = 0; i < options.length; i++) {
                if (options[i].text === nombre) {
                    selectPanel.selectedIndex = i;
                    break;
                }
            }
            actualizarResumenPaso1();
        }
    }, 500);
}

function actualizarEsquemaEnsayo() {
    const svg = document.getElementById('esquema-electrico-svg');
    if (!svg) return;
    
    const tipoLuz = document.getElementById('ensayo-fuente-luz') ? document.getElementById('ensayo-fuente-luz').value : 'halogena';
    const distancia = document.getElementById('ensayo-distancia') ? document.getElementById('ensayo-distancia').value : 156;
    
    // Inmediatamente heredar la fuente de luz en el estado global para sincronizar todas las vistas
    if (!window.EstadoDiseno) window.EstadoDiseno = {};
    if (!window.EstadoDiseno.ensayo_data) window.EstadoDiseno.ensayo_data = {};
    window.EstadoDiseno.ensayo_data.luz = tipoLuz;
    
    // Forzar el repintado de las demás pantallas donde aparezca la luz
    if (typeof dibujarInteraccionLuminicaSVG === 'function') dibujarInteraccionLuminicaSVG();
    if (typeof dibujarConexionado === 'function') dibujarConexionado();
    if (typeof dibujarSimulacionDinamica === 'function') dibujarSimulacionDinamica();
    
    const fuente = window.generarSVGIconoFuenteLuz(tipoLuz);
    const svgFuenteLuz = `<g transform="translate(100, 25)">${fuente.svg}</g>`;
    const colorRayo = fuente.color;
    
    // Panel Solar (80x16)
    const px = 60, py = 97, pw = 80, ph = 16;
    
    const html = `
        <!-- FUENTE DE LUZ -->
        ${svgFuenteLuz}
        
        <!-- RAYOS DE LUZ Y COTA DISTANCIA -->
        <g stroke="${colorRayo}" stroke-width="2" stroke-dasharray="4,4">
            <line x1="85" y1="45" x2="85" y2="${py - 5}" />
            <line x1="100" y1="45" x2="100" y2="${py - 5}" />
            <line x1="115" y1="45" x2="115" y2="${py - 5}" />
        </g>
        
        <!-- COTA DE DISTANCIA -->
        <line x1="160" y1="30" x2="160" y2="${py}" stroke="#94a3b8" stroke-width="1"/>
        <line x1="155" y1="30" x2="165" y2="30" stroke="#94a3b8" stroke-width="1"/>
        <line x1="155" y1="${py}" x2="165" y2="${py}" stroke="#94a3b8" stroke-width="1"/>
        <text x="165" y="${(30+py)/2}" font-size="10" fill="#64748b" dominant-baseline="middle">d=${distancia}mm</text>
        
        <!-- PANEL SOLAR -->
        <!-- Marco protector -->
        <rect x="${px-2}" y="${py-2}" width="${pw+4}" height="${ph+4}" fill="#f1f5f9" rx="3" stroke="#cbd5e1" stroke-width="1.5"/>
        <!-- Silicio (azul más claro y brillante) -->
        <rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="#3b82f6" rx="1"/>
        
        <!-- Separación entre celdas (grid vertical) -->
        <line x1="${px+16}" y1="${py}" x2="${px+16}" y2="${py+ph}" stroke="#1e40af" stroke-width="1.5"/>
        <line x1="${px+32}" y1="${py}" x2="${px+32}" y2="${py+ph}" stroke="#1e40af" stroke-width="1.5"/>
        <line x1="${px+48}" y1="${py}" x2="${px+48}" y2="${py+ph}" stroke="#1e40af" stroke-width="1.5"/>
        <line x1="${px+64}" y1="${py}" x2="${px+64}" y2="${py+ph}" stroke="#1e40af" stroke-width="1.5"/>
        
        <!-- Busbars plateadas horizontales -->
        <line x1="${px}" y1="${py+5}" x2="${px+pw}" y2="${py+5}" stroke="#bfdbfe" stroke-width="0.8" opacity="0.9"/>
        <line x1="${px}" y1="${py+11}" x2="${px+pw}" y2="${py+11}" stroke="#bfdbfe" stroke-width="0.8" opacity="0.9"/>
        
        <!-- Terminales Panel -->
        <line x1="30" y1="${py+ph/2}" x2="${px}" y2="${py+ph/2}" stroke="#dc2626" stroke-width="2"/>
        <line x1="140" y1="${py+ph/2}" x2="170" y2="${py+ph/2}" stroke="#0f172a" stroke-width="2"/>
        
        <!-- Etiquetas de Polaridad -->
        <text x="48" y="${py-2}" font-size="18" font-weight="bold" fill="#dc2626" text-anchor="middle">+</text>
        <text x="152" y="${py-2}" font-size="20" font-weight="bold" fill="#0f172a" text-anchor="middle">-</text>
        
        <!-- CABLEADO PRINCIPAL -->
        <!-- Rama izquierda (Roja / Positivo) -->
        <line x1="30" y1="${py+ph/2}" x2="30" y2="250" stroke="#dc2626" stroke-width="2"/>
        <line x1="30" y1="250" x2="86" y2="250" stroke="#dc2626" stroke-width="2"/>
        <!-- Rama derecha (Negra / Negativo) -->
        <line x1="114" y1="250" x2="170" y2="250" stroke="#0f172a" stroke-width="2"/>
        <line x1="170" y1="${py+ph/2}" x2="170" y2="190" stroke="#0f172a" stroke-width="2"/>
        <line x1="170" y1="220" x2="170" y2="250" stroke="#0f172a" stroke-width="2"/>
        
        <!-- VOLTÍMETRO (En paralelo al panel) -->
        <line x1="30" y1="150" x2="86" y2="150" stroke="#dc2626" stroke-width="1.5"/>
        <line x1="114" y1="150" x2="170" y2="150" stroke="#0f172a" stroke-width="1.5"/>
        <circle cx="30" cy="150" r="2.5" fill="#dc2626"/>
        <circle cx="170" cy="150" r="2.5" fill="#0f172a"/>
        <circle cx="100" cy="150" r="14" fill="white" stroke="#0f172a" stroke-width="2"/>
        <text x="100" y="154" font-size="12" font-weight="bold" font-family="monospace" text-anchor="middle" fill="#0f172a">V</text>
        
        <!-- AMPERÍMETRO (En serie) -->
        <circle cx="100" cy="250" r="14" fill="white" stroke="#0f172a" stroke-width="2"/>
        <text x="100" y="254" font-size="12" font-weight="bold" font-family="monospace" text-anchor="middle" fill="#0f172a">A</text>
        
        <!-- POTENCIÓMETRO (~100 Ohm) -->
        <!-- Resistencia variable en la rama derecha -->
        <polyline points="170,190 162,194 178,199 162,204 178,209 162,214 170,220" fill="none" stroke="#0f172a" stroke-width="2"/>
        <line x1="150" y1="215" x2="185" y2="195" stroke="#0f172a" stroke-width="1.5"/>
        <polygon points="185,195 180,193 182,198" fill="#0f172a"/>
        <text x="190" y="205" font-size="10" fill="#334155" dominant-baseline="middle">~100Ω</text>
    `;
    
    svg.innerHTML = html;
}

window.mostrarInstruccionesMontaje = function() {
    const modal = document.getElementById('modal-dialogo');
    const t = document.getElementById('modal-dialogo-titulo');
    const m = document.getElementById('modal-dialogo-mensaje');
    const iCont = document.getElementById('modal-dialogo-input-cont');
    const btnAceptar = document.getElementById('modal-dialogo-btn-aceptar');
    const btnCancelar = document.getElementById('modal-dialogo-btn-cancelar');

    if (modal && t && m && btnAceptar) {
        t.innerText = "Instrucciones de Montaje";
        m.innerHTML = `
            <div style="text-align: left; font-size: 14px; color: #334155;">
                <p>Sigue estos pasos para realizar el ensayo eléctrico:</p>
                <ol style="padding-left: 20px; margin-bottom: 0;">
                    <li style="margin-bottom: 8px;">Coloca la placa alineada con la luz y a la distancia del ensayo.</li>
                    <li style="margin-bottom: 8px;">Conecta el cable <b style="color: #dc2626;">rojo</b> al terminal positivo <b>(+)</b> de la placa.</li>
                    <li style="margin-bottom: 8px;">Conecta el cable <b style="color: #0f172a;">negro</b> al terminal negativo <b>(-)</b> de la placa.</li>
                    <li style="margin-bottom: 8px;">Conecta el <b>Voltímetro (V)</b> en paralelo a la placa (entre los cables rojo y negro) para medir la Tensión.</li>
                    <li style="margin-bottom: 8px;">Conecta el <b>Amperímetro (A)</b> en serie con el circuito para medir la Corriente.</li>
                    <li style="margin-bottom: 8px;">Cierra el circuito con el <b>Potenciómetro</b> variable y enciende la luz para comenzar a tomar mediciones.</li>
                </ol>
                <div style="margin-top: 15px; padding: 12px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 6px;">
                    <strong style="color: #b45309; display: flex; align-items: center; gap: 5px;">🔥 Advertencia: Riesgo Térmico</strong>
                    <p style="margin-top: 5px; margin-bottom: 8px; font-size: 13px; line-height: 1.4;">
                        Utiliza un potenciómetro bobinado de al menos <b>2W (Vatios)</b>. Uno de carbón estándar (0.25W) se quemará al acercarse a 0&Omega; (cortocircuito).
                    </p>
                    <div style="font-size: 12px; color: #78350f; background: rgba(253, 230, 138, 0.4); padding: 8px; border-radius: 4px;">
                        <b>¿Por qué ocurre esto?</b><br>
                        El límite de corriente de un potenciómetro de 100&Omega; y 0.25W es apenas <b>50 mA</b> \\( (I = \\sqrt{\\frac{0.25}{100}}) \\). Si ajustas la resistencia a casi cero (ej. 0.5&Omega;), el panel solar entregará toda su corriente de cortocircuito (<b>133 mA</b>).<br><br>
                        Aunque la potencia total disipada sea ínfima \\( (P = I^2 \\cdot R = 0.133^2 \\cdot 0.5 = 0.008 \\text{ W}) \\), esa corriente <b>supera el límite de densidad</b> de la minúscula pista de carbón por la que pasa y la fundirá. Uno de 2W soporta 141 mA en toda su pista y resistirá sin problemas.
                    </div>
                </div>
            </div>
        `;
        if (iCont) iCont.style.display = 'none';
        if (btnCancelar) btnCancelar.style.display = 'none';
        
        btnAceptar.innerText = "¡Entendido!";
        btnAceptar.onclick = () => {
            modal.style.display = 'none';
            if (btnCancelar) btnCancelar.style.display = 'block'; // Restaurar botón
            m.innerHTML = '¿Estás seguro de realizar esta acción?'; // Limpiar mensaje
            t.innerText = 'Confirmación'; // Limpiar título
        };
        modal.style.display = 'flex';
        setTimeout(() => {
            if(window.renderizarMatematicas) window.renderizarMatematicas();
        }, 10);
    } else {
        alert("INSTRUCCIONES:\\n1. Conecta el cable rojo al (+)\\n2. Conecta el cable negro al (-)\\n3. Conecta el Voltímetro en paralelo\\n4. Conecta el Amperímetro en serie.");
    }
};

// Llamar al dibujar la primera vez
document.addEventListener('DOMContentLoaded', () => {
    // ...
    setTimeout(() => {
        if (typeof actualizarEsquemaEnsayo === 'function') {
            actualizarEsquemaEnsayo();
        }
        if (typeof actualizarSelectorHistorial === 'function') {
            actualizarSelectorHistorial();
        }
    }, 1000);
});

// --- HISTORIAL DE ENSAYOS LOCAL ---
// Eliminado para depender exclusivamente de la base de datos

function actualizarSelectorHistorial() {
    const select = document.getElementById('ensayo-historial-select');
    if (!select) return;
    
    // Obtener paneles de la DB que contengan ensayo_data
    const panelesDBConEnsayo = (typeof dbPaneles !== 'undefined' ? dbPaneles : [])
        .filter(p => p && p.ensayo_data && p.ensayo_data.puntos && p.ensayo_data.puntos.length > 0);
        
    // Obtener paneles genéricos sin ensayo, filtrando los que ya tienen ensayo guardado
    const panelesDBSinEnsayo = (typeof dbPaneles !== 'undefined' ? dbPaneles : [])
        .filter(p => {
            if (!p || !p.nombre) return false;
            if (p.ensayo_data && p.ensayo_data.puntos && p.ensayo_data.puntos.length > 0) return false;
            const existeEnDB = panelesDBConEnsayo.some(pdb => pdb.nombre === p.nombre);
            return !existeEnDB;
        });
    
    let html = '<option value="">📂 Cargar ensayo guardado...</option>';
    
    if (panelesDBConEnsayo.length > 0) {
        html += '<optgroup label="Ensayos en Base de Datos (Públicos/Propios)">';
        panelesDBConEnsayo.forEach(p => {
            html += `<option value="db_${p.nombre}">${p.nombre} (DB)</option>`;
        });
        html += '</optgroup>';
    }
    
    if (panelesDBSinEnsayo.length > 0) {
        html += '<optgroup label="Placas Disponibles (Sin ensayo)">';
        panelesDBSinEnsayo.forEach(p => {
            if(p && p.nombre) {
                html += `<option value="placa_${p.nombre}">${p.nombre}</option>`;
            }
        });
        html += '</optgroup>';
    }
    
    select.innerHTML = html;

    // Restaurar valor previo si existe en progresoMendocino
    try {
        const progreso = JSON.parse(localStorage.getItem('progresoMendocino'));
        if (progreso && progreso.valores && progreso.valores.ensayoHistorialNombre) {
            const nombreGuardado = progreso.valores.ensayoHistorialNombre;
            for (let i = 0; i < select.options.length; i++) {
                if (select.options[i].text === nombreGuardado) {
                    select.selectedIndex = i;
                    cargarEnsayoDesdeHistorial();
                    break;
                }
            }
        }
    } catch (e) {
        console.error("Error restaurando selector historial:", e);
    }
}

function cargarEnsayoDesdeHistorial() {
    const select = document.getElementById('ensayo-historial-select');
    if (!select || !select.value) return;
    
    const valorSeleccionado = select.value;
    let itemParaCargar = null;
    let nombreCargar = "";
    let esPropietario = true;
    
    if (valorSeleccionado.startsWith('db_')) {
        nombreCargar = valorSeleccionado.substring(3);
        const panelDB = dbPaneles.find(p => p.nombre === nombreCargar);
        if (panelDB && panelDB.ensayo_data) {
            itemParaCargar = {
                ...panelDB.ensayo_data,
                l: panelDB.l,
                a: panelDB.a,
                voc: panelDB.voc,
                isc: panelDB.isc
            };
            
            // Check ownership
            if (panelDB.id) {
                if (window.sessionActiva && window.sessionActiva.user) {
                    esPropietario = (panelDB.usuario_id === window.sessionActiva.user.id || window.esAdmin);
                } else {
                    esPropietario = false;
                }
            }
        }
    } else if (valorSeleccionado.startsWith('placa_')) {
        nombreCargar = valorSeleccionado.substring(6);
        const panelDB = dbPaneles.find(p => p.nombre === nombreCargar);
        if (panelDB) {
            itemParaCargar = {
                l: panelDB.l,
                a: panelDB.a,
                voc: panelDB.voc,
                isc: panelDB.isc,
                puntos: [] // Sin puntos de ensayo
            };
            // Al ser solo los datos base de una placa, permitimos "esPropietario" para que el usuario 
            // pueda rellenar el formulario, hacer un ensayo y guardarlo como suyo.
            esPropietario = true; 
        }
    }
    
    window.ensayoEsPropietario = esPropietario;
    
    if (itemParaCargar) {
        if (Array.isArray(itemParaCargar)) {
            // Compatibilidad con versión antigua
            datosEnsayoSolar = [...itemParaCargar];
        } else {
            // Nueva versión con metadatos
            datosEnsayoSolar = [...(itemParaCargar.puntos || [])];
            
            const inputL = document.getElementById('ensayo-l-panel');
            const inputA = document.getElementById('ensayo-a-panel');
            const inputLSil = document.getElementById('ensayo-l-silicio');
            const inputASil = document.getElementById('ensayo-a-silicio');
            const selectLuz = document.getElementById('ensayo-fuente-luz');
            const inputDist = document.getElementById('ensayo-distancia');
            const inputLux = document.getElementById('ensayo-lux');
            const inputVoc = document.getElementById('ensayo-voc');
            const inputIsc = document.getElementById('ensayo-isc');
            const inputProveedor = document.getElementById('ensayo-proveedor');
            const inputPrecio = document.getElementById('ensayo-precio');
            const inputPeso = document.getElementById('ensayo-peso');
            
            if (inputL) { inputL.value = itemParaCargar.l || ''; inputL.dispatchEvent(new Event('input')); }
            if (inputA) { inputA.value = itemParaCargar.a || ''; inputA.dispatchEvent(new Event('input')); }
            if (inputLSil) { inputLSil.value = itemParaCargar.l_sil || ''; inputLSil.dispatchEvent(new Event('input')); }
            if (inputASil) { inputASil.value = itemParaCargar.a_sil || ''; inputASil.dispatchEvent(new Event('input')); }
            if (selectLuz && itemParaCargar.luz) { selectLuz.value = itemParaCargar.luz; selectLuz.dispatchEvent(new Event('change')); }
            if (inputDist && itemParaCargar.distancia) { inputDist.value = itemParaCargar.distancia; inputDist.dispatchEvent(new Event('input')); }
            if (inputLux && itemParaCargar.lux !== undefined) { inputLux.value = itemParaCargar.lux; inputLux.dispatchEvent(new Event('input')); }
            if (inputVoc && itemParaCargar.voc !== undefined) { inputVoc.value = (itemParaCargar.voc * 1000).toFixed(0); inputVoc.dispatchEvent(new Event('input')); }
            if (inputIsc && itemParaCargar.isc !== undefined) { inputIsc.value = itemParaCargar.isc; inputIsc.dispatchEvent(new Event('input')); }
            if (inputProveedor && itemParaCargar.proveedor !== undefined) { inputProveedor.value = itemParaCargar.proveedor; inputProveedor.dispatchEvent(new Event('input')); }
            if (inputPrecio && itemParaCargar.precio !== undefined) { inputPrecio.value = itemParaCargar.precio; inputPrecio.dispatchEvent(new Event('input')); }
            if (inputPeso && itemParaCargar.peso !== undefined) { inputPeso.value = itemParaCargar.peso; inputPeso.dispatchEvent(new Event('input')); }
        }
        
        guardarEnsayoLocal();
        actualizarTablaEnsayo();
        renderizarResultadosFase1();
        if (typeof actualizarEsquemaEnsayo === 'function') actualizarEsquemaEnsayo();
        
        // Auto-rellenar nombre
        const inputNombre = document.getElementById('ensayo-nombre-panel');
        if (inputNombre) {
            inputNombre.value = nombreCargar;
            inputNombre.dispatchEvent(new Event('input'));
        }
        
        if (typeof toggleEdicionEnsayo === 'function') toggleEdicionEnsayo(esPropietario);
        
        // Sincronizar hacia el Paso 2
        const elPanel2 = document.getElementById('panel');
        if (elPanel2 && nombreCargar) {
            for (let i = 0; i < elPanel2.options.length; i++) {
                if (elPanel2.options[i].text === nombreCargar) {
                    if (elPanel2.selectedIndex !== i) {
                        elPanel2.selectedIndex = i;
                        if (typeof actualizarResumenPaso1 === 'function') actualizarResumenPaso1(true);
                    }
                    break;
                }
            }
        }
        
        mostrarToast(`Ensayo "${nombreCargar}" cargado correctamente.`, 'ok');
    }
}

window.toggleEdicionEnsayo = function(esPropietario) {
    const inputs = [
        'ensayo-nombre-panel', 'ensayo-l-panel', 'ensayo-a-panel',
        'ensayo-l-silicio', 'ensayo-a-silicio', 'ensayo-fuente-luz',
        'ensayo-distancia', 'ensayo-lux', 'ensayo-voc', 'ensayo-isc',
        'ensayo-v', 'ensayo-i', 'ensayo-proveedor', 'ensayo-precio', 'ensayo-peso'
    ];
    
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = !esPropietario;
    });

    const btnAdd = document.querySelector('button[onclick="agregarMedidaEnsayo()"]');
    if (btnAdd) btnAdd.disabled = !esPropietario;
    
    let alertEl = document.getElementById('ensayo-alerta-publico');
    if (!esPropietario) {
        if (!alertEl) {
            alertEl = document.createElement('div');
            alertEl.id = 'ensayo-alerta-publico';
            alertEl.style.cssText = 'background: #fff3cd; color: #856404; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-size: 13px; border-left: 4px solid #ffeeba;';
            alertEl.innerHTML = '<strong>⚠️ Modo Lectura:</strong> Este ensayo es público y no te pertenece. Puedes visualizar sus datos, pero no puedes editarlo. Si quieres hacer uno nuevo, usa "Limpiar".';
            
            const tituloEnsayo = document.querySelector('#step-1 h3');
            if (tituloEnsayo && tituloEnsayo.parentNode) {
                tituloEnsayo.parentNode.insertBefore(alertEl, tituloEnsayo.nextSibling);
            }
        } else {
            alertEl.style.display = 'block';
        }
    } else {
        if (alertEl) alertEl.style.display = 'none';
    }
};

async function borrarEnsayoDelHistorial() {
    const select = document.getElementById('ensayo-historial-select');
    if (!select || !select.value) {
        mostrarToast('Selecciona primero el ensayo que quieres borrar.', 'aviso');
        return;
    }
    
    const valorSeleccionado = select.value;
    
    let nombreCargar = "";
    if (valorSeleccionado.startsWith('db_')) nombreCargar = valorSeleccionado.substring(3);
    else if (valorSeleccionado.startsWith('placa_')) nombreCargar = valorSeleccionado.substring(6);
    else return;
    
    const panelDB = dbPaneles.find(p => p.nombre === nombreCargar);
    if (!panelDB) return;
    
    let esPropietario = false;
    if (panelDB.id) {
        if (window.sessionActiva && window.sessionActiva.user) {
            esPropietario = (panelDB.usuario_id === window.sessionActiva.user.id || window.esAdmin);
        }
    }
    
    if (!esPropietario) {
        mostrarToast('No puedes borrar una placa que es pública o no te pertenece.', 'error');
        return;
    }
    
    if (confirm(`¿Estás seguro de que quieres borrar completamente la placa "${nombreCargar}"?\n\nEsto la eliminará tanto del ensayo como del Gestor de Componentes.`)) {
        try {
            if (window.dbMendocinoClient && panelDB.id) {
                const { error } = await window.dbMendocinoClient
                    .from('paneles')
                    .delete()
                    .eq('id', panelDB.id);
                    
                if (error) throw error;
            }
            
            // Actualizar array local eliminando la placa
            const index = dbPaneles.findIndex(p => p.id === panelDB.id);
            if (index > -1) dbPaneles.splice(index, 1);
            
            guardarDatos();
            actualizarSelectorHistorial();
            mostrarToast(`Placa "${nombreCargar}" borrada por completo.`, 'ok');
            
            // Limpiar pantalla
            limpiarEnsayoSolar(true);
            select.value = "";
            
        } catch (err) {
            console.error("Error borrando placa:", err);
            mostrarToast('Error en la nube: ' + err.message, 'error');
        }
    }
}

// --- NUEVAS FUNCIONES DE LA FASE 1 ---

function renderizarResultadosFase1() {
    const display = document.getElementById('panel-resultados-ensayo');
    if (!display) return;
    
    if (datosEnsayoSolar.length === 0) {
        display.innerHTML = '<div style="text-align: center; color: #64748b; font-size: 13px;">Añade datos para calcular...</div>';
        return;
    }
    
    let maxV = 0;
    let maxI = 0;
    let maxP = -1;
    let pmpData = null;
    
    datosEnsayoSolar.forEach(d => {
        if (d.v > maxV) maxV = d.v;
        if (d.i > maxI) maxI = d.i;
        if (d.p > maxP) {
            maxP = d.p;
            pmpData = d;
        }
    });
    
    if (!pmpData || maxP <= 0) {
        display.innerHTML = '<div style="text-align: center; color: #64748b; font-size: 13px;">Añade datos para calcular...</div>';
        return;
    }

    const inputVoc = document.getElementById('ensayo-voc');
    const inputIsc = document.getElementById('ensayo-isc');
    
    const explicitVoc = inputVoc && !isNaN(parseFloat(inputVoc.value)) ? parseFloat(inputVoc.value) : 0;
    const explicitIsc = inputIsc && !isNaN(parseFloat(inputIsc.value)) ? parseFloat(inputIsc.value) : 0;
    
    const finalVoc = explicitVoc > 0 ? explicitVoc : maxV;
    const finalIsc = explicitIsc > 0 ? explicitIsc : maxI;

    // FF Calculation: Pmax (mW) / (Voc(mV) * Isc(mA) / 1000)
    const pTeorica = (finalVoc * finalIsc) / 1000;
    const ff = pTeorica > 0 ? (maxP / pTeorica) : 0;
    
    let htmlContent = `
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px; margin-bottom: 8px; align-items: center;">
            <span style="color: #334155;">Tensión de Vacío (Voc):</span>
            <span style="font-weight: bold; color: #1e40af; text-align: right;">${(finalVoc / 1000).toFixed(2)} V</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px; margin-bottom: 8px; align-items: center;">
            <span style="color: #334155;">Corriente Cortocircuito (Isc):</span>
            <span style="font-weight: bold; color: #1e40af; text-align: right;">${finalIsc.toFixed(1)} mA</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px; margin-bottom: 8px; align-items: center;">
            <span style="color: #334155;">Tensión P. Máx. (Vmp):</span>
            <span style="font-weight: bold; color: #1e40af; text-align: right;">${(pmpData.v / 1000).toFixed(2)} V</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px; margin-bottom: 8px; align-items: center;">
            <span style="color: #334155;">Corriente P. Máx. (Imp):</span>
            <span style="font-weight: bold; color: #1e40af; text-align: right;">${pmpData.i.toFixed(1)} mA</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px; margin-bottom: 8px; align-items: center;">
            <span style="color: #334155;">Potencia Máxima (Pmax):</span>
            <span style="font-weight: bold; color: #d97706; text-align: right;">${maxP.toFixed(2)} mW</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px; margin-bottom: 8px; align-items: center;">
            <span style="color: #334155;">Factor de Forma (FF):</span>
            <span style="font-weight: bold; color: #1e40af; text-align: right;">${ff.toFixed(3)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px; margin-bottom: 8px; align-items: center;">
            <span style="color: #334155;">Resistencia Óptima:</span>
            <span style="font-weight: bold; color: #1e40af; text-align: right;">${(pmpData.r / 1000).toFixed(2)} Ω</span>
        </div>
    `;

    // Calculation of Efficiency
    const l_ext = parseFloat(document.getElementById('ensayo-l-panel').value);
    const a_ext = parseFloat(document.getElementById('ensayo-a-panel').value);
    const l_sil = parseFloat(document.getElementById('ensayo-l-silicio').value);
    const a_sil = parseFloat(document.getElementById('ensayo-a-silicio').value);
    
    let area = 0;
    let tipo = '';
    if (!isNaN(l_sil) && !isNaN(a_sil) && l_sil > 0 && a_sil > 0) {
        area = l_sil * a_sil;
        tipo = 'Neta';
    } else if (!isNaN(l_ext) && !isNaN(a_ext) && l_ext > 0 && a_ext > 0) {
        area = l_ext * a_ext;
        tipo = 'Bruta';
    }
    
    if (area > 0) {
        const eficienciaSTC = (maxP / area) * 100;
        htmlContent += `
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px; margin-bottom: 8px; align-items: center; margin-top: 15px;">
            <span style="color: #334155;">Eficiencia STC (${tipo}):</span>
            <span style="font-weight: bold; color: #059669; text-align: right;">${eficienciaSTC.toFixed(2)}%</span>
        </div>`;
        
        const inputLux = document.getElementById('ensayo-lux');
        const luxVal = inputLux ? parseFloat(inputLux.value) : NaN;
        
        if (!isNaN(luxVal) && luxVal > 0) {
            const irradiacionRealMwMm2 = luxVal * 0.00001;
            const pRealEntrada = area * irradiacionRealMwMm2;
            const eficienciaReal = (maxP / pRealEntrada) * 100;
            
            htmlContent += `
            <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px; margin-bottom: 8px; align-items: center;">
                <span style="color: #334155;">Eficiencia Real (${luxVal} Lux):</span>
                <span style="font-weight: bold; color: #d97706; text-align: right;">${eficienciaReal.toFixed(2)}%</span>
            </div>`;
        }
    }
    
    display.innerHTML = htmlContent;
}

function exportarEnsayoCSV() {
    if (datosEnsayoSolar.length === 0) {
        mostrarToast('No hay datos para exportar.', 'aviso');
        return;
    }
    
    let csv = 'V [mV],I [mA],P [mW],R [mOhm]\n';
    datosEnsayoSolar.forEach(d => {
        csv += `${d.v.toFixed(2)},${d.i.toFixed(2)},${d.p.toFixed(2)},${d.r.toFixed(2)}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'ensayo_panel_solar.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    mostrarToast('Archivo CSV descargado.', 'ok');
}




// --- LÓGICA PASO 9: LEVITACIÓN MAGNÉTICA ---
async function ejecutarMagpylibLevitacion() {
    const contenedor = document.getElementById('res-magpylib-levitacion');
    if (!contenedor) return;
    
    // Verificación de requisitos previos
    if (!EstadoDiseno.masaTotal) {
        if (typeof mostrarToast === 'function') {
            mostrarToast("⚠️ Error: Debes completar y calcular los pasos anteriores (Geometría y Masa) para conocer el peso real del rotor.", "error");
        } else {
            alert("⚠️ Error: Debes completar y calcular los pasos anteriores (Geometría y Masa) para conocer el peso real del rotor.");
        }
        return;
    }

    contenedor.innerHTML = `
        <div class="loading-container">
            <div class="spinner-simulacion"></div>
            <span>Calculando punto de equilibrio exacto en el servidor...</span>
        </div>
    `;
    
    try {
        // Recoger variables geométricas
        let sustL = 20, sustW = 10, sustH = 5, brSust = 1200;
        const selLevSust = document.getElementById('lev-sust-iman')?.value;
        if (typeof dbImanes !== 'undefined' && selLevSust !== undefined && dbImanes[Number(selLevSust)]) {
            const iman = dbImanes[Number(selLevSust)];
            sustL = parseFloat(iman.l) || 20;
            sustW = parseFloat(iman.a) || 10;
            sustH = parseFloat(iman.h) || 5;
            brSust = parseFloat(iman.br) * 1000 || 1200; // a mT
        }
        const sepX = parseFloat(document.getElementById('lev-sust-sep-x')?.value) || 100;
        const sepY = parseFloat(document.getElementById('lev-sust-sep-y')?.value) || 40;
        const inclinacion = parseFloat(document.getElementById('lev-sust-inclinacion')?.value) || 0;
        const elevZ = parseFloat(document.getElementById('lev-sust-z')?.value) || 0;
        
        const polIzq = document.getElementById('lev-sust-pol-izq')?.value || "1";
        const polDer = document.getElementById('lev-sust-pol-der')?.value || "-1";

        const base_mags_data = [];
        const posBase = [
            [-sepX/2, -sepY/2], [sepX/2, -sepY/2], // Lado Izquierdo (Y < 0)
            [-sepX/2, sepY/2], [sepX/2, sepY/2]    // Lado Derecho (Y > 0)
        ];
        
        posBase.forEach((p, idx) => {
            const isLeftSupport = p[0] < 0; // Eje X determina si es el soporte izquierdo o derecho
            const isFrontMagnet = p[1] < 0; // Eje Y determina si es el imán delantero o trasero de ese soporte
            
            const polVal = isLeftSupport ? (polIzq === "1" ? brSust : -brSust) : (polDer === "1" ? brSust : -brSust);
            // Magpylib usa la regla de la mano derecha. Para que inclinacion > 0 signifique "abrir hacia afuera" (como en el SVG),
            // el imán delantero (Y < 0) debe rotar en positivo, y el trasero (Y > 0) en negativo.
            const anguloRot = isFrontMagnet ? inclinacion : -inclinacion;
            
            base_mags_data.push({
                dimension: [sustH, sustW, sustL], // X, Y, Z
                posicion: [p[0], p[1], elevZ + sustL/2], 
                magnetizacion: [polVal, 0, 0],
                // El eje Z en Magpylib apunta hacia arriba, y la base está en Z=0.
                // El ancla de rotación es la parte inferior del imán (elevZ).
                rotacion: { angle: anguloRot, axis: 'x', anchor: [p[0], p[1], elevZ] }
            });
        });

        let rIman = 7.5, wIman = 3, brRotor = 1200;
        const selLevRotor = document.getElementById('lev-rotor-iman')?.value;
        if (typeof dbImanes !== 'undefined' && selLevRotor !== undefined && dbImanes[Number(selLevRotor)]) {
            const iman = dbImanes[Number(selLevRotor)];
            rIman = (parseFloat(iman.d || iman.l) || 15) / 2;
            wIman = parseFloat(iman.h || iman.a) || 3;
            brRotor = parseFloat(iman.br) * 1000 || 1200; // a mT
        }

        const orientacionRotorIzq = document.getElementById('lev-rotor-pol-izq')?.value || "1";
        const orientacionRotorDer = document.getElementById('lev-rotor-pol-der')?.value || "1";
        const realPolRotorIzq = orientacionRotorIzq === "1" ? polIzq : (polIzq === "1" ? "-1" : "1");
        const realPolRotorDer = orientacionRotorDer === "1" ? polDer : (polDer === "1" ? "-1" : "1");

        const rotor_mags_data = [
            { x: -sepX/2, y: 0, r: rIman, w: wIman, pol_x: realPolRotorIzq === "1" ? brRotor : -brRotor },
            { x: sepX/2,  y: 0, r: rIman, w: wIman, pol_x: realPolRotorDer === "1" ? brRotor : -brRotor }
        ];

        const masaKg = (EstadoDiseno.masaTotal || 50) / 1000;
        const weight_N = masaKg * 9.81;

        const distApoyo = parseFloat(document.getElementById('lev-apoyo-dist')?.value) || 15;

        // We can just use the input if possible, but let's safely read baseX/Y
        const baseX = parseFloat(document.getElementById('lev-base-x')?.value) || 120;
        const baseY = parseFloat(document.getElementById('lev-base-y')?.value) || 80;
        const diamEje = parseFloat(document.getElementById('diametro-eje')?.value) || EstadoDiseno.diametroEje || 8;
        
        const style2d = document.getElementById('magpylib-style')?.value || 'scifi';
        
        const payload = {
            imanes_sustentacion: base_mags_data,
            imanes_rotor: rotor_mags_data,
            rotor_weight_N: weight_N,
            style_2d: style2d,
            rotor_body: {
                diametro: parseFloat(document.getElementById('diametro')?.value) || EstadoDiseno.diametroRotor || 20,
                longitud: (EstadoDiseno.longitudPanel || 30) + 2 * (EstadoDiseno.margenMarco_mm || 0),
                caras: parseInt(document.getElementById('caras')?.value) || EstadoDiseno.numeroCaras || 4
            },
            shaft: {
                diametro: diamEje,
                longitud: baseX
            },
            base_plate: {
                x: baseX,
                y: baseY,
                z_pos: -2.5 // Base plate at Z=0, con grosor de 5mm, su centro es -2.5
            }
        };
        const response = await fetch('https://magpylib-api-mendocino.onrender.com/api/magpylib-levitation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Error en el servidor Python calculando levitación.');
        const data = await response.json();
        
        let html = '<div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">';
        html += '<h4 style="margin-top:0; color: #1e293b;">🎯 Resultado del Equilibrio</h4>';
        
        if (data.levita) {
            // Sincronización automática del entrehierro del Paso 4
            // Nota: elevZ y sustL ya están definidos correctamente arriba.
            const R = (parseFloat(document.getElementById('diametro')?.value) || 30) / 2;
            
            const selImanMotor = document.getElementById('iman-motor')?.value;
            let indH = 5;
            if (typeof dbImanes !== 'undefined' && selImanMotor !== undefined && dbImanes[Number(selImanMotor)]) {
                indH = parseFloat(dbImanes[Number(selImanMotor)].h) || 5;
            }
            
            // Altura absoluta del eje respecto a la base de apoyo (mesa Z=0)
            // Como ahora base_mags_data.posicion Z es positiva, equilibrio_z ES la altura absoluta.
            const h_eje_base = data.equilibrio_z;
            EstadoDiseno.equilibrio_z = data.equilibrio_z;
            // Entrehierro físico = altura del eje - radio rotor - grosor imán motor
            const gap_fisico = h_eje_base - R - indH;
            
            const inputGap = document.getElementById('iman-distancia');
            if (inputGap) {
                inputGap.value = Math.max(0, gap_fisico).toFixed(1);
                if (gap_fisico < 0) {
                    inputGap.style.color = '#dc2626';
                    inputGap.title = "¡El rotor choca con el imán del motor! Aumenta la Elevación Z o cambia el imán de sustentación.";
                } else {
                    inputGap.style.color = '';
                    inputGap.title = "Calculado automáticamente desde Levitación (Paso 9)";
                }
                if (typeof actualizarResumenPaso1 === 'function') actualizarResumenPaso1();
            }

            if (gap_fisico < 0) {
                html += `<div style="background: #fef2f2; color: #dc2626; padding: 10px; border-radius: 6px; font-weight: bold; margin-bottom: 10px; border: 1px solid #fecaca;">⚠️ ¡Alerta: El rotor choca con el imán inferior! Sube la Elevación Z.</div>`;
            } else {
                html += `<div style="background: #dcfce7; color: #166534; padding: 10px; border-radius: 6px; font-weight: bold; margin-bottom: 10px;">¡Levitación conseguida!</div>`;
            }
            
            html += `<p><strong>Altura del eje (Z):</strong> <span style="font-family:monospace; font-size:1.1em; color: #16a34a;">${h_eje_base.toFixed(2)} mm</span> (desde la base)</p>`;
            
            const gapColor = gap_fisico < 0 ? '#dc2626' : '#d97706';
            html += `<p><strong>Entrehierro resultante (Paso 4):</strong> <span style="font-family:monospace; font-size:1.1em; color: ${gapColor}; font-weight: ${gap_fisico < 0 ? 'bold' : 'normal'};">${gap_fisico.toFixed(2)} mm</span></p>`;
            html += `<p><strong>Peso del Rotor:</strong> <span style="font-family:monospace;">${weight_N.toFixed(4)} N</span></p>`;
            html += `<p style="font-size: 13px; color: #64748b; margin-top: 10px;">El algoritmo de búsqueda binaria ha encontrado el punto exacto donde la repulsión iguala a la gravedad.</p>`;
        } else {
            html += `<div style="background: #fee2e2; color: #991b1b; padding: 10px; border-radius: 6px; font-weight: bold; margin-bottom: 10px;">La levitación falla</div>`;
            html += `<p>${data.mensaje}</p>`;
        }
        
        html += `<div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; align-items: start;">`;
        
        if (data.streamplot_base64) {
            html += `
            <div style="flex: 1 1 350px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02); margin-top: 15px;">
                <div style="background: #f1f5f9; border-bottom: 1px solid #e2e8f0; padding: 12px;">
                    <h4 style="margin: 0; color: #334155; font-size: 13px; font-weight: 600;">LÍNEAS DE CAMPO MAGNÉTICO (Corte Central)</h4>
                </div>
                <div style="padding: 15px;">
                    <img src="data:image/png;base64,${data.streamplot_base64}" style="max-width: 100%; display: block; margin: 0 auto;" alt="Líneas de campo magnético">
                </div>
            </div>`;
        }
        
        html += `</div>`; // Close row
        
        if (data.plotly_html) {
             html += `
             <div style="margin-top: 25px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                 <div style="background: #f1f5f9; border-bottom: 1px solid #e2e8f0; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                     <h4 style="margin: 0; color: #334155; font-size: 13px; font-weight: 600;">VISOR 3D INTERACTIVO (Plotly)</h4>
                     <span style="font-size: 11px; color: #64748b; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">Interactúa: Click + Arrastrar para rotar, Rueda para Zoom</span>
                 </div>
                 <div style="padding: 0px; width: 100%; height: 500px; display: flex; justify-content: center; align-items: center;">
                     <div style="width: 100%; height: 100%;">
                         ${data.plotly_html}
                     </div>
                 </div>
             </div>`;
        } else if (data.image_base64) {
             html += `<div style="text-align:center; margin-top:15px;"><img src="data:image/png;base64,${data.image_base64}" style="max-width: 100%; border-radius:8px; border:1px solid #cbd5e1;" alt="Vista 3D Isométrica"></div>`;
        }
        
        html += '</div>';
        contenedor.innerHTML = html;
        
        // Ejecutar los scripts incrustados de Plotly
        if (data.plotly_html) {
            cargarScriptsSecuencialmente(contenedor);
        }
        
    } catch (error) {
        contenedor.innerHTML = `<div style="padding: 15px; color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">Error: ${error.message}. El servidor remoto en Render podría estar arrancando, espera 1 minuto y vuelve a intentar.</div>`;
    }
}


// --- PASO 9: SIMULACION GLOBAL MAGPYLIB ---
async function renderizarPasoMagpylibGlobal() {
    const contenedor = document.getElementById('magpylib-resultados-global');
    if (!contenedor) return;
    
    // Verificaciones de requisitos previos
    if (!window._lastMagpylibPayload) {
        if (typeof mostrarToast === 'function') {
            mostrarToast("⚠️ Error: Debes calcular primero el Paso 8 (Simulación Magpylib) para definir el motor base.", "error");
        } else {
            alert("⚠️ Error: Debes calcular primero el Paso 8 (Simulación Magpylib) para definir el motor base.");
        }
        return;
    }
    
    if (!EstadoDiseno.equilibrio_z) {
        if (typeof mostrarToast === 'function') {
            mostrarToast("⚠️ Error: Debes simular primero el Paso 4 (Levitación) para hallar la altura de equilibrio.", "error");
        } else {
            alert("⚠️ Error: Debes simular primero el Paso 4 (Levitación) para hallar la altura de equilibrio.");
        }
        return;
    }
    
    contenedor.innerHTML = `
        <div class="loading-container">
            <div class="spinner-simulacion"></div>
            <span>Calculando interacción magnética global en el servidor...</span>
        </div>
    `;
    
    try {
        // 1. Recoger Imán Base (Inducción) y Bobinas (igual que Paso 8)
        const payloadForces = window._lastMagpylibPayload;
        
        // 2. Recoger Imanes de Levitación
        let sustL = 20, sustW = 10, sustH = 5, brSust = 1200;
        const selLevSust = document.getElementById('lev-sust-iman')?.value;
        if (typeof dbImanes !== 'undefined' && selLevSust !== undefined && dbImanes[Number(selLevSust)]) {
            const iman = dbImanes[Number(selLevSust)];
            sustL = parseFloat(iman.l) || 20;
            sustW = parseFloat(iman.a) || 10;
            sustH = parseFloat(iman.h) || 5;
            brSust = parseFloat(iman.br) * 1000 || 1200;
        }
        const sepX = parseFloat(document.getElementById('lev-sust-sep-x')?.value) || 100;
        const sepY = parseFloat(document.getElementById('lev-sust-sep-y')?.value) || 40;
        const inclinacion = parseFloat(document.getElementById('lev-sust-inclinacion')?.value) || 0;
        const elevZ = parseFloat(document.getElementById('lev-sust-z')?.value) || 0;
        const polIzqSust = document.getElementById('lev-sust-pol-izq')?.value || "1";
        const polDerSust = document.getElementById('lev-sust-pol-der')?.value || "-1";

        const imanes_sustentacion = [];
        const posBase = [
            [-sepX/2, -sepY/2], [-sepX/2, sepY/2],
            [sepX/2, -sepY/2], [sepX/2, sepY/2]
        ];
        posBase.forEach((p, i) => {
            const isLeftSupport = p[0] < 0;
            const isFrontMagnet = p[1] < 0;
            
            const polVal = isLeftSupport ? (polIzqSust === "1" ? brSust : -brSust) : (polDerSust === "1" ? brSust : -brSust);
            const anguloRot = isFrontMagnet ? inclinacion : -inclinacion;
            
            imanes_sustentacion.push({
                dimension: [sustH, sustW, sustL], // X, Y, Z
                posicion: [p[0], p[1], elevZ + sustL/2], 
                magnetizacion: [polVal, 0, 0],
                rotacion: { angle: anguloRot, axis: 'x', anchor: [p[0], p[1], elevZ] }
            });
        });

        // 3. Imanes del Rotor
        let rIman = 15/2, wIman = 3, brRotor = 1200;
        const selLevRotor = document.getElementById('lev-rotor-iman')?.value;
        if (typeof dbImanes !== 'undefined' && selLevRotor !== undefined && dbImanes[Number(selLevRotor)]) {
            const iman = dbImanes[Number(selLevRotor)];
            rIman = (parseFloat(iman.d || iman.l) || 15) / 2;
            wIman = parseFloat(iman.h || iman.a) || 3;
            brRotor = parseFloat(iman.br) * 1000 || 1200;
        }
        const orientacionRotorIzq = document.getElementById('lev-rotor-pol-izq')?.value || "1";
        const orientacionRotorDer = document.getElementById('lev-rotor-pol-der')?.value || "1";
        const realPolRotorIzq = orientacionRotorIzq === "1" ? polIzqSust : (polIzqSust === "1" ? "-1" : "1");
        const realPolRotorDer = orientacionRotorDer === "1" ? polDerSust : (polDerSust === "1" ? "-1" : "1");

        // Obtenemos la altura del eje desde el backend si está disponible
        const h_eje_base = EstadoDiseno.equilibrio_z || 22.45; // Default estimación

        const imanes_rotor = [
            { x: -sepX/2, y: 0, z: h_eje_base, r: rIman, w: wIman, pol_x: realPolRotorIzq === "1" ? brRotor : -brRotor },
            { x: sepX/2,  y: 0, z: h_eje_base, r: rIman, w: wIman, pol_x: realPolRotorDer === "1" ? brRotor : -brRotor }
        ];

        const baseX = parseFloat(document.getElementById('lev-base-x')?.value) || 120;
        const baseY = parseFloat(document.getElementById('lev-base-y')?.value) || 80;
        const diamEje = parseFloat(document.getElementById('diametro-eje')?.value) || EstadoDiseno.diametroEje || 8;

        const imanes_base_elevados = payloadForces.imanes_base.map(iman => {
            const p = iman.posicion || [0, 0, 0];
            return { ...iman, posicion: [p[0], p[1], p[2] + h_eje_base] };
        });

        const bobinas_elevadas = payloadForces.bobinas.map(bobina => {
            const p = bobina.posicion || [0, 0, 0];
            return { ...bobina, posicion: [p[0], p[1], p[2] + h_eje_base] };
        });

        const payloadGlobal = {
            imanes_base: imanes_base_elevados,
            bobinas: bobinas_elevadas,
            imanes_sustentacion: imanes_sustentacion,
            imanes_rotor: imanes_rotor,
            style_2d: document.getElementById('magpylib-style-global')?.value || 'scifi',
            rotor_body: {
                diametro: parseFloat(document.getElementById('diametro')?.value) || EstadoDiseno.diametroRotor || 20,
                longitud: (EstadoDiseno.longitudPanel || 30) + 2 * (EstadoDiseno.margenMarco_mm || 0),
                z_pos: h_eje_base
            },
            shaft: {
                diametro: diamEje,
                longitud: baseX,
                z_pos: h_eje_base
            },
            base_plate: {
                x: baseX,
                y: baseY,
                z_pos: -2.5
            }
        };

        const response = await fetch('https://magpylib-api-mendocino.onrender.com/api/magpylib-global', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadGlobal)
        });

        if (!response.ok) throw new Error('Error en el servidor Python simulando el circuito global.');
        const dataGlobal = await response.json();
        
        let html = '<div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">';
        html += '<h4 style="margin-top:0; color: #1e293b;">🪐 Análisis de Fuerzas Global</h4>';
        
        const realTorqueGlobal = dataGlobal.torque_x || 0;
        const torqueBase = EstadoDiseno.par_Nm || 0;
        
        const diffTorque = Math.abs(realTorqueGlobal) - torqueBase;
        const diffPercent = torqueBase > 0 ? (diffTorque / torqueBase * 100).toFixed(2) : 0;
        const diffColor = diffTorque < 0 ? '#dc2626' : (diffTorque > 0 ? '#16a34a' : '#64748b');
        const diffSign = diffTorque > 0 ? '+' : '';
        
        html += `<div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 20px;">`;
        html += `
            <div style="flex: 1; min-width: 200px; background: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                <div style="font-size: 12px; color: #64748b; font-weight: 600; margin-bottom: 5px;">PAR MOTRIZ TEÓRICO (Paso 8)</div>
                <div style="font-size: 24px; font-weight: bold; color: #3b82f6; font-family: monospace;">${torqueBase.toExponential(3)} N·m</div>
                <div style="font-size: 11px; color: #94a3b8; margin-top: 5px;">Solo imán base</div>
            </div>`;
        html += `
            <div style="flex: 1; min-width: 200px; background: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                <div style="font-size: 12px; color: #64748b; font-weight: 600; margin-bottom: 5px;">PAR MOTRIZ GLOBAL (Con Levitación)</div>
                <div style="font-size: 24px; font-weight: bold; color: #8e44ad; font-family: monospace;">${Math.abs(realTorqueGlobal).toExponential(3)} N·m</div>
                <div style="font-size: 13px; color: ${diffColor}; font-weight: 600; margin-top: 5px;">
                    Diferencia: ${diffSign}${diffTorque.toExponential(2)} N·m (${diffSign}${diffPercent}%)
                </div>
            </div>`;
        html += `</div>`;
        
        if (dataGlobal.plotly_html) {
             html += `
             <div style="margin-top: 15px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                 <div style="background: #f1f5f9; border-bottom: 1px solid #e2e8f0; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                     <h4 style="margin: 0; color: #334155; font-size: 13px; font-weight: 600;">VISOR 3D GLOBAL (MENDOCINO COMPLETO)</h4>
                 </div>
                 <div style="padding: 0px; width: 100%; height: 500px; display: flex; justify-content: center; align-items: center;">
                     <div style="width: 100%; height: 100%;">
                         ${dataGlobal.plotly_html}
                     </div>
                 </div>
             </div>`;
        }
        
        if (dataGlobal.streamplot_base64) {
             html += `
             <div style="margin-top: 15px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                 <div style="background: #f1f5f9; border-bottom: 1px solid #e2e8f0; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                     <h4 style="margin: 0; color: #334155; font-size: 13px; font-weight: 600;">VISOR 2D GLOBAL (Corte lateral X-Z)</h4>
                 </div>
                 <div style="padding: 20px; width: 100%; display: flex; justify-content: center; align-items: center; background-color: ${document.getElementById('magpylib-style-global')?.value === 'scifi' ? '#0f172a' : '#ffffff'};">
                     <img src="data:image/png;base64,${dataGlobal.streamplot_base64}" style="max-width: 100%; height: auto; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                 </div>
             </div>`;
        }
        
        if (dataGlobal.streamplot_base64_xy_base) {
             html += `
             <div style="margin-top: 15px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                 <div style="background: #f1f5f9; border-bottom: 1px solid #e2e8f0; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                     <h4 style="margin: 0; color: #334155; font-size: 13px; font-weight: 600;">VISOR 2D ESTATOR (Vista Superior X-Y a la altura del eje)</h4>
                 </div>
                 <div style="padding: 20px; width: 100%; display: flex; justify-content: center; align-items: center; background-color: ${document.getElementById('magpylib-style-global')?.value === 'scifi' ? '#0f172a' : '#ffffff'};">
                     <img src="data:image/png;base64,${dataGlobal.streamplot_base64_xy_base}" style="max-width: 100%; height: auto; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                 </div>
             </div>`;
        }

        if (dataGlobal.streamplot_base64_xy_rotor) {
             html += `
             <div style="margin-top: 15px; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                 <div style="background: #f1f5f9; border-bottom: 1px solid #e2e8f0; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                     <h4 style="margin: 0; color: #334155; font-size: 13px; font-weight: 600;">VISOR 2D ROTOR (Vista Superior X-Y a la altura del eje)</h4>
                 </div>
                 <div style="padding: 20px; width: 100%; display: flex; justify-content: center; align-items: center; background-color: ${document.getElementById('magpylib-style-global')?.value === 'scifi' ? '#0f172a' : '#ffffff'};">
                     <img src="data:image/png;base64,${dataGlobal.streamplot_base64_xy_rotor}" style="max-width: 100%; height: auto; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                 </div>
             </div>`;
        }
        
        html += '</div>';
        contenedor.innerHTML = html;
        
        if (dataGlobal.plotly_html) {
            cargarScriptsSecuencialmente(contenedor);
        }
        
    } catch (error) {
        contenedor.innerHTML = `<div style="padding: 15px; color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">Error: ${error.message}.</div>`;
    }
}

// --- LEVITACIÓN MAGNÉTICA (PASO 9) ---
function actualizarVistasLevitacion() {
    let sustL = 20, sustW = 10, sustH = 5;
    const selLevSust = document.getElementById('lev-sust-iman')?.value;
    const imanSustData = (typeof dbImanes !== 'undefined' && selLevSust !== undefined && dbImanes[Number(selLevSust)]) ? dbImanes[Number(selLevSust)] : null;
    
    if (imanSustData) {
        sustL = parseFloat(imanSustData.l) || 20;
        sustW = parseFloat(imanSustData.a) || 10;
        sustH = parseFloat(imanSustData.h) || 5;
        const infoSust = document.getElementById('info-lev-sust-iman');
        if (infoSust) {
            infoSust.innerHTML = `Dimensiones: ${sustL} x ${sustW} x ${sustH} mm | Campo Br: ${imanSustData.br} T`;
        }
    }
    const sepX = parseFloat(document.getElementById('lev-sust-sep-x')?.value) || 100;
    const sepY = parseFloat(document.getElementById('lev-sust-sep-y')?.value) || 40;
    const inclinacion = parseFloat(document.getElementById('lev-sust-inclinacion')?.value) || 0;
    const elevZ = parseFloat(document.getElementById('lev-sust-z')?.value) || 0;
    const distApoyo = parseFloat(document.getElementById('lev-apoyo-dist')?.value) || 15;
    
    // Imán del Rotor (Anular/Disco)
    let rIman = 15/2, wIman = 3; // Radio y grosor del imán
    const selLevRotor = document.getElementById('lev-rotor-iman')?.value;
    const imanRotorData = (typeof dbImanes !== 'undefined' && selLevRotor !== undefined && dbImanes[Number(selLevRotor)]) ? dbImanes[Number(selLevRotor)] : null;
    
    if (imanRotorData) {
        const diametro = parseFloat(imanRotorData.d || imanRotorData.l) || 15;
        rIman = diametro / 2;
        wIman = parseFloat(imanRotorData.h || imanRotorData.a) || 3;
        
        const infoRotor = document.getElementById('info-lev-rotor-iman');
        if (infoRotor) {
            infoRotor.innerHTML = `Diámetro: ${diametro} mm | Grosor: ${wIman} mm | Campo Br: ${imanRotorData.br} T`;
        }
    }
    const dIman = wIman; 

    // Imán de Inducción desde Paso 4
    let indL = 40, indW = 20, indH = 5;
    const selImanMotor = document.getElementById('iman-motor')?.value;
    const imanData = (typeof dbImanes !== 'undefined' && selImanMotor !== undefined && dbImanes[Number(selImanMotor)]) ? dbImanes[Number(selImanMotor)] : null;
    let orientacionInd = document.getElementById('iman-orientacion')?.value || "long";
    
    if (imanData) {
        indL = parseFloat(imanData.l) || 40;
        indW = parseFloat(imanData.a) || 20;
        indH = parseFloat(imanData.h) || 5;
        const infoSpan = document.getElementById('info-iman-induccion');
        if (infoSpan) {
            infoSpan.innerHTML = `Imán base seleccionado: <b>${imanData.nombre}</b> (${indL}x${indW}x${indH} mm)<br>Orientación: ${orientacionInd === 'long' ? 'Largo paralelo al eje' : 'Ancho paralelo al eje'}`;
        }
    }
    
    let indX = indL;
    let indY = indW;
    if (orientacionInd === "trans") {
        indX = indW;
        indY = indL;
    }

    // --- CÁLCULO DINÁMICO DE LA BASE ---
    const apoyoAncho = 1; // Grosor físico real del cristal
    const R_edge = (sepX/2) + distApoyo + apoyoAncho + 10;
    const L_edge = -(sepX/2) - (sustH/2) - 10;
    const baseX = Math.ceil(R_edge - L_edge);
    const centerX = (R_edge + L_edge) / 2;
    
    const radY = Math.abs(inclinacion * Math.PI / 180);
    const wProjY = sustW * Math.cos(radY) + sustL * Math.sin(radY);
    const dispY = (sustL / 2) * Math.sin(radY);
    const max_sust_Y = (sepY/2) + dispY + (wProjY/2);
    const max_ind_Y = indY / 2;
    const baseY = Math.ceil(2 * Math.max(max_sust_Y + 10, max_ind_Y + 10));

    const inBaseX = document.getElementById('lev-base-x');
    const inBaseY = document.getElementById('lev-base-y');
    if (inBaseX) inBaseX.value = baseX;
    if (inBaseY) inBaseY.value = baseY;

    const polaridadInd = document.getElementById('iman-polaridad')?.value || "1";
    const indFill = polaridadInd === "1" ? "#ef4444" : "#3b82f6";
    const indStroke = polaridadInd === "1" ? "#b91c1c" : "#1d4ed8";

    const topSvg = document.getElementById('svg-lev-top');
    const frontSvg = document.getElementById('svg-lev-front');
    if(!topSvg || !frontSvg) return;

    // --- VISTA SUPERIOR (TOP) ---
    // X = eje del rotor, Y = transversal
    let topHtml = `<rect x="${L_edge}" y="${-baseY/2}" width="${baseX}" height="${baseY}" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2" rx="4"/>`;
    
    // Imán inducción
    topHtml += `<rect x="${-indX/2}" y="${-indY/2}" width="${indX}" height="${indY}" fill="${indFill}" stroke="${indStroke}" stroke-width="0.3" rx="2"/>`;
    
    // Imanes de sustentación
    const pos = [
        [-sepX/2, -sepY/2], [sepX/2, -sepY/2],
        [-sepX/2, sepY/2], [sepX/2, sepY/2]
    ];
    const polIzq = document.getElementById('lev-sust-pol-izq')?.value || "1";
    const polDer = document.getElementById('lev-sust-pol-der')?.value || "-1";

    pos.forEach((p, idx) => {
        const isLeft = (idx === 0 || idx === 2);
        const pol = isLeft ? polIzq : polDer;
        
        // Si pol == "1" (Norte +X): cara +X (derecha) es Roja, cara -X (izquierda) es Azul.
        // Si pol == "-1" (Sur +X): cara +X (derecha) es Azul, cara -X (izquierda) es Roja.
        const colorNegX = pol === "1" ? "#3b82f6" : "#ef4444"; // Mitad izquierda
        const colorPosX = pol === "1" ? "#ef4444" : "#3b82f6"; // Mitad derecha
        
        const rad = inclinacion * Math.PI / 180;
        const wProj = sustW * Math.abs(Math.cos(rad)) + sustL * Math.abs(Math.sin(rad));
        
        // Si inclinacion > 0 (hacia afuera), el centro se desplaza hacia afuera
        // p[1] es -sepY/2 (izq) o +sepY/2 (der).
        const disp = (sustL / 2) * Math.sin(Math.abs(rad));
        const dir = p[1] < 0 ? -1 : 1; 
        // Si inclinacion > 0, desplaza hacia afuera (mismo signo que p[1])
        // Si inclinacion < 0, desplaza hacia adentro (signo opuesto)
        const sign = inclinacion >= 0 ? 1 : -1;
        const cy = p[1] + (dir * sign * disp);
        
        topHtml += `<rect x="${p[0] - sustH/2}" y="${cy - wProj/2}" width="${sustH/2}" height="${wProj}" fill="${colorNegX}" stroke="none"/>`;
        topHtml += `<rect x="${p[0]}" y="${cy - wProj/2}" width="${sustH/2}" height="${wProj}" fill="${colorPosX}" stroke="none"/>`;
        topHtml += `<rect x="${p[0] - sustH/2}" y="${cy - wProj/2}" width="${sustH}" height="${wProj}" fill="none" stroke="#1e293b" stroke-width="0.3" rx="1"/>`;
    });

    // Apoyo del eje (Tope de Fricción / Cristal)
    // El imán derecho está en x = sepX/2
    const xApoyo = sepX/2 + distApoyo;
    const apoyoAlto = 15; // En vista superior, representa el ancho del cristal

    // Dibujar el apoyo en Vista Superior
    topHtml += `<rect x="${xApoyo}" y="${-apoyoAlto/2}" width="${apoyoAncho}" height="${apoyoAlto}" fill="#bae6fd" stroke="#7dd3fc" stroke-width="0.5" rx="0.5" opacity="0.6"/>`;

    // Eje del rotor (Cilindro central semi-transparente con un extremo en punta)
    const diamEje = EstadoDiseno.diametroEje || 8;
    const puntaLargo = diamEje; // La punta ocupa un largo proporcional al diámetro
    
    // La punta toca exactamente la cara izquierda del cristal de apoyo
    const xDchaPunta = xApoyo;
    const xDchaRecta = xDchaPunta - puntaLargo;
    
    // Asumimos un eje simétrico o que sobresale por la izquierda la misma distancia total
    // o simplemente un largo base más un margen. Hagamos que por la izquierda asome un poco más de la base:
    const xIzq = L_edge - 15;
    
    const yArr = -diamEje/2;
    const yAba = diamEje/2;
    
    const puntosEje = `${xIzq},${yArr} ${xDchaRecta},${yArr} ${xDchaPunta},0 ${xDchaRecta},${yAba} ${xIzq},${yAba}`;
    topHtml += `<polygon points="${puntosEje}" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2" opacity="0.4"/>`;
    // Cuerpo del rotor (Cilindro circunscrito semi-transparente)
    const largoTotalRotor = (EstadoDiseno.longitudPanel || 30) + 2 * (EstadoDiseno.margenMarco_mm || 0);
    const diamRotor = EstadoDiseno.diametroRotor || 20;
    topHtml += `<rect x="${-largoTotalRotor/2}" y="${-diamRotor/2}" width="${largoTotalRotor}" height="${diamRotor}" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1" stroke-dasharray="2,2" opacity="0.4"/>`;
    
    // Colores basados en polaridad para imanes de levitación del rotor
    const orientacionRotorIzq = document.getElementById('lev-rotor-pol-izq')?.value || "1";
    const orientacionRotorDer = document.getElementById('lev-rotor-pol-der')?.value || "1";

    // Si orientacion es 1 (Alineado), tiene la MISMA polaridad que la sustentación.
    // Si orientacion es -1 (Invertido), invertimos la polaridad lógica.
    const realPolRotorIzq = orientacionRotorIzq === "1" ? polIzq : (polIzq === "1" ? "-1" : "1");
    const realPolRotorDer = orientacionRotorDer === "1" ? polDer : (polDer === "1" ? "-1" : "1");

    const colorNegX_izq = realPolRotorIzq === "1" ? "#3b82f6" : "#ef4444";
    const colorPosX_izq = realPolRotorIzq === "1" ? "#ef4444" : "#3b82f6";
    
    const colorNegX_der = realPolRotorDer === "1" ? "#3b82f6" : "#ef4444";
    const colorPosX_der = realPolRotorDer === "1" ? "#ef4444" : "#3b82f6";

    // Leer desplazamiento axial de los imanes del rotor
    const offsetRotorIzq = parseFloat(document.getElementById('lev-rotor-offset-izq')?.value) || 0;
    const offsetRotorDer = parseFloat(document.getElementById('lev-rotor-offset-der')?.value) || 0;

    // Imán anular izquierdo
    topHtml += `<rect x="${-sepX/2 - wIman/2 + offsetRotorIzq}" y="${-rIman}" width="${wIman/2}" height="${rIman*2}" fill="${colorNegX_izq}" stroke="none" opacity="0.9"/>`;
    topHtml += `<rect x="${-sepX/2 + offsetRotorIzq}" y="${-rIman}" width="${wIman/2}" height="${rIman*2}" fill="${colorPosX_izq}" stroke="none" opacity="0.9"/>`;
    topHtml += `<rect x="${-sepX/2 - wIman/2 + offsetRotorIzq}" y="${-rIman}" width="${wIman}" height="${rIman*2}" fill="none" stroke="#1e293b" stroke-width="0.5"/>`;

    // Imán anular derecho
    topHtml += `<rect x="${sepX/2 - wIman/2 + offsetRotorDer}" y="${-rIman}" width="${wIman/2}" height="${rIman*2}" fill="${colorNegX_der}" stroke="none" opacity="0.9"/>`;
    topHtml += `<rect x="${sepX/2 + offsetRotorDer}" y="${-rIman}" width="${wIman/2}" height="${rIman*2}" fill="${colorPosX_der}" stroke="none" opacity="0.9"/>`;
    topHtml += `<rect x="${sepX/2 - wIman/2 + offsetRotorDer}" y="${-rIman}" width="${wIman}" height="${rIman*2}" fill="none" stroke="#1e293b" stroke-width="0.5"/>`;
    
    // Ajuste dinámico de vista superior (Top View)
    const maxTopW = Math.max(baseX, sepX + sustH) + 60;
    const maxTopH = Math.max(baseY, sepY + sustW) + 60;
    topSvg.setAttribute('viewBox', `${centerX - maxTopW/2} ${-maxTopH/2} ${maxTopW} ${maxTopH}`);
    
    topSvg.innerHTML = topHtml;

    // --- VISTA FRONTAL (FRONT) ---
    // Y = transversal, Z = altura
    
    // Calcular profundidad máxima de los imanes en la base
    const radFrontal = inclinacion * Math.PI / 180;
    const yCorners = [
        (-sustW/2) * Math.sin(radFrontal),
        (sustW/2) * Math.sin(radFrontal),
        (-sustW/2) * Math.sin(radFrontal) - sustL * Math.cos(radFrontal),
        (sustW/2) * Math.sin(radFrontal) - sustL * Math.cos(radFrontal)
    ];
    const maxDescenso = Math.max(...yCorners); // Cuánto baja respecto al pivote
    const profundidadTotal = -elevZ + maxDescenso; // Profundidad desde la superficie de la base
    
    let baseH = 10; // Altura mínima por defecto
    if (profundidadTotal + 5 > baseH) {
        baseH = profundidadTotal + 5; // Adaptar la base si el imán excede
    }
    
    const airgap = 10; // Gap entre sustentación y rotor
    
    // Suelo
    const maxFrontW = Math.max(baseY, sepY + sustW) + 60;
    
    // Máscara para hacer translúcidos los objetos hundidos en la base
    let frontHtml = `
    <defs>
        <mask id="mask-base">
            <rect x="-1000" y="-1000" width="2000" height="${1000 - baseH/2}" fill="white"/>
            <rect x="-1000" y="${-baseH/2}" width="2000" height="2000" fill="white" fill-opacity="0.3"/>
        </mask>
    </defs>`;
    
    frontHtml += `<line x1="${-maxFrontW/2}" y1="${baseH/2}" x2="${maxFrontW/2}" y2="${baseH/2}" stroke="#cbd5e1" stroke-width="2"/>`;
    
    // Base frontal (solo el ancho Y) con aristas superiores redondeadas
    const rBaseFront = 6;
    const x0 = -baseY/2;
    const y0 = -baseH/2;
    const x1 = baseY/2;
    const y1 = baseH/2;
    const pathBaseFront = `M ${x0},${y1} L ${x0},${y0 + rBaseFront} A ${rBaseFront},${rBaseFront} 0 0 1 ${x0 + rBaseFront},${y0} L ${x1 - rBaseFront},${y0} A ${rBaseFront},${rBaseFront} 0 0 1 ${x1},${y0 + rBaseFront} L ${x1},${y1} Z`;
    frontHtml += `<path d="${pathBaseFront}" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2"/>`;
    
    // Imán inducción (vemos la dimensión transversal Y y su altura real)
    const indBotColor = polaridadInd === "1" ? "#3b82f6" : "#ef4444";
    frontHtml += `<rect x="${-indY/2}" y="${-baseH/2 - indH}" width="${indY}" height="${indH/2}" fill="${indFill}" stroke="none"/>`;
    frontHtml += `<rect x="${-indY/2}" y="${-baseH/2 - indH/2}" width="${indY}" height="${indH/2}" fill="${indBotColor}" stroke="none"/>`;
    frontHtml += `<rect x="${-indY/2}" y="${-baseH/2 - indH}" width="${indY}" height="${indH}" fill="none" stroke="#1e293b" stroke-width="0.5"/>`;
    
    // Generamos los imanes de sustentación en un string para añadirlos AL FINAL
    let frontSustHtml = "";
    const xs = [-sepY/2 - sustW/2, sepY/2 - sustW/2];
    xs.forEach((x, idx) => {
        const caraFrontal = polIzq === "1" ? "#3b82f6" : "#ef4444";
        const cxPivot = x + sustW/2;
        const cyPivot = -baseH/2 - elevZ; // Punto de pivote en la base + elevacion
        // Si idx == 0 (izquierda), un angulo negativo (antihorario) lo abre hacia afuera.
        // Queremos que inclinacion > 0 signifique "abrir hacia afuera"
        const anguloRot = idx === 0 ? -inclinacion : inclinacion;
        
        // El bloque se dibuja elevZ por encima de la base
        frontSustHtml += `<rect x="${x}" y="${-baseH/2 - elevZ - sustL}" width="${sustW}" height="${sustL}" fill="${caraFrontal}" stroke="${caraFrontal === '#3b82f6' ? '#1d4ed8' : '#b91c1c'}" stroke-width="0.5" transform="rotate(${anguloRot}, ${cxPivot}, ${cyPivot})"/>`;
    });

    // Rotor frontal (sección transversal)
    // El rotor descansa sobre los imanes de sustentación.
    // La altura máxima de los imanes de sustentación depende de su inclinación y elevación.
    const rad = inclinacion * Math.PI / 180;
    const alturaSustEfectiva = sustL * Math.cos(rad);
    const rotorZ = -baseH/2 - elevZ - alturaSustEfectiva - airgap - dIman;
    
    // Geometría del rotor basada en el Paso 2
    const N = EstadoDiseno.numeroCaras || 4;
    const tipoRanura = document.getElementById('ranura-tipo')?.value || 'rect';
    const Ds = EstadoDiseno.altoRanura_mm || 5;
    const R = EstadoDiseno.radioCircunscrito || dIman + Ds;
    const angP = EstadoDiseno.anguloPanel || (Math.PI * 2 / N * 0.8);
    const angS = EstadoDiseno.anguloRanura || (Math.PI * 2 / N * 0.2);
    
    let dRotor = "";
    const Rfondo = Math.max(R - Ds, 2);
    for (let i = 0; i < N; i++) {
        const anguloCentroPanel = i * (angP + angS) - (Math.PI / 2); 
        const theta1 = anguloCentroPanel - (angP / 2); 
        const theta2 = anguloCentroPanel + (angP / 2); 
        const theta3 = theta2 + angS;                  

        const p1x = R * Math.cos(theta1);
        const p1y = rotorZ + R * Math.sin(theta1);
        const p2x = R * Math.cos(theta2);
        const p2y = rotorZ + R * Math.sin(theta2);
        const p3x = R * Math.cos(theta3);
        const p3y = rotorZ + R * Math.sin(theta3);

        if (i === 0) dRotor += `M ${p1x} ${p1y} `;
        else dRotor += `L ${p1x} ${p1y} `;
        
        dRotor += `L ${p2x} ${p2y} `;

        if (tipoRanura === 'trapecio') {
            const s1x = Rfondo * Math.cos(theta2);
            const s1y = rotorZ + Rfondo * Math.sin(theta2);
            const s2x = Rfondo * Math.cos(theta3);
            const s2y = rotorZ + Rfondo * Math.sin(theta3);
            dRotor += `L ${s1x} ${s1y} L ${s2x} ${s2y} `;
        } else { 
            const thetaBisectriz = (theta2 + theta3) / 2;
            const dirX = Math.cos(thetaBisectriz);
            const dirY = Math.sin(thetaBisectriz);
            
            const s1x = p2x - dirX * Ds;
            const s1y = p2y - dirY * Ds;
            const s2x = p3x - dirX * Ds;
            const s2y = p3y - dirY * Ds;
            dRotor += `L ${s1x} ${s1y} L ${s2x} ${s2y} `;
        }
    }
    dRotor += "Z";
    
    const colorRotor = getComputedStyle(document.documentElement).getPropertyValue('--svg-panel-color').trim() || "#93c5fd";
    frontHtml += `<path d="${dRotor}" fill="${colorRotor}" stroke="#64748b" stroke-width="0.3"/>`;
    
    // --- DIBUJO DEL BOBINADO ---
    const fo = EstadoDiseno.factorOcupacion || 0;
    if (fo > 0) {
        const esExceso = fo >= 1.0;
        const colorBobinado = esExceso ? "#e74c3c" : "#d35400";
        const opacidadBobinado = esExceso ? "1.0" : "0.8"; 
        const profBobinado = Ds * Math.min(fo, 1.2); 
        
        for (let i = 0; i < N; i++) {
            const anguloCentroPanel = i * (angP + angS) - (Math.PI / 2);
            const theta2 = anguloCentroPanel + (angP / 2); 
            const theta3 = theta2 + angS;
            const thetaBisectriz = (theta2 + theta3) / 2;
            const dirX = Math.cos(thetaBisectriz);
            const dirY = Math.sin(thetaBisectriz);

            let pVbob = "";

            if (tipoRanura === 'trapecio') {
                const f1x = Rfondo * Math.cos(theta2);
                const f1y = rotorZ + Rfondo * Math.sin(theta2);
                const f2x = Rfondo * Math.cos(theta3);
                const f2y = rotorZ + Rfondo * Math.sin(theta3);

                const rExt = Rfondo + profBobinado;
                const o1x = rExt * Math.cos(theta2);
                const o1y = rotorZ + rExt * Math.sin(theta2);
                const o2x = rExt * Math.cos(theta3);
                const o2y = rotorZ + rExt * Math.sin(theta3);
                
                pVbob = `${f1x},${f1y} ${o1x},${o1y} ${o2x},${o2y} ${f2x},${f2y}`;
            } else {
                const p2x = R * Math.cos(theta2);
                const p2y = rotorZ + R * Math.sin(theta2);
                const p3x = R * Math.cos(theta3);
                const p3y = rotorZ + R * Math.sin(theta3);

                const f1x = p2x - dirX * Ds;
                const f1y = p2y - dirY * Ds;
                const f2x = p3x - dirX * Ds;
                const f2y = p3y - dirY * Ds;

                const o1x = f1x + dirX * profBobinado;
                const o1y = f1y + dirY * profBobinado;
                const o2x = f2x + dirX * profBobinado;
                const o2y = f2y + dirY * profBobinado;

                pVbob = `${f1x},${f1y} ${o1x},${o1y} ${o2x},${o2y} ${f2x},${f2y}`;
            }
            frontHtml += `<polygon points="${pVbob}" fill="${colorBobinado}" opacity="${opacidadBobinado}"/>`;
        }
    }

    // --- DIBUJO DE PLACAS SOLARES ---
    const Wp = EstadoDiseno.anchoPanel || 20;
    for (let i = 0; i < N; i++) {
        const anguloCentroPanel = i * (angP + angS) - (Math.PI / 2);
        
        const WpTotal = Wp + (2 * (EstadoDiseno.margenMarco_mm || 0));
        const proporcionPlaca = WpTotal > 0 ? (Wp / WpTotal) : 1;
        const angPlacaReal = angP * proporcionPlaca;

        const theta1 = anguloCentroPanel - (angPlacaReal / 2);
        const theta2 = anguloCentroPanel + (angPlacaReal / 2);

        const p1x = R * Math.cos(theta1);
        const p1y = rotorZ + R * Math.sin(theta1);
        const p2x = R * Math.cos(theta2);
        const p2y = rotorZ + R * Math.sin(theta2);

        frontHtml += `<line x1="${p1x}" y1="${p1y}" x2="${p2x}" y2="${p2y}" stroke="#2c3e50" stroke-width="0.8"/>`;
    }

    // --- DIBUJO DEL EJE ---
    const rEje = (EstadoDiseno.diametroEje || 8) / 2;
    frontHtml += `<circle cx="0" cy="${rotorZ}" r="${rEje}" fill="#ffffff" stroke="#64748b" stroke-width="0.3"/>`;

    // Imán anular en el eje (visto de frente es un círculo)
    // Usamos realPolRotorDer ya que la vista frontal mira desde +X hacia el origen
    const orientacionRotorDerFront = document.getElementById('lev-rotor-pol-der')?.value || "1";
    const polDerRotorFront = orientacionRotorDerFront === "1" ? (document.getElementById('lev-sust-pol-der')?.value || "-1") : ((document.getElementById('lev-sust-pol-der')?.value || "-1") === "1" ? "-1" : "1");
    
    const colorFrontalRotor = polDerRotorFront === "1" ? "#ef4444" : "#3b82f6";
    const strokeFrontalRotor = polDerRotorFront === "1" ? "#b91c1c" : "#1d4ed8";
    frontHtml += `<circle cx="0" cy="${rotorZ}" r="${rIman}" fill="${colorFrontalRotor}" stroke="${strokeFrontalRotor}" stroke-width="0.5" opacity="0.9"/>`;
    frontHtml += `<circle cx="0" cy="${rotorZ}" r="2" fill="#333"/>`; // centro oscuro del eje

    // Cristal de apoyo frontal (Vista Frontal)
    const cristalWFront = 15;
    const cristalHFront = Math.abs(rotorZ + baseH/2) + 25; // 15mm por encima del rotor, 10mm por debajo de la superficie
    const cristalYFront = rotorZ - 15;
    frontSustHtml += `<rect x="${-cristalWFront/2}" y="${cristalYFront}" width="${cristalWFront}" height="${cristalHFront}" fill="#bae6fd" stroke="#7dd3fc" stroke-width="1" rx="2" opacity="0.6"/>`;

    // AHORA añadimos los imanes de sustentación y el cristal para que queden en primer plano (superpuestos y enmascarados)
    frontHtml += `<g mask="url(#mask-base)">${frontSustHtml}</g>`;

    // Ajuste dinámico de vista frontal (Front View)
    const minFrontY = rotorZ - rIman - 20; // Y en SVG, que es altura Z física (negativa)
    const maxFrontY = baseH/2 + 20;
    const maxFrontH = maxFrontY - minFrontY;
    const centerFrontY = (maxFrontY + minFrontY) / 2;
    frontSvg.setAttribute('viewBox', `${-maxFrontW/2} ${centerFrontY - maxFrontH/2} ${maxFrontW} ${maxFrontH}`);

    frontSvg.innerHTML = frontHtml;

    // --- ACTUALIZAR ENTREHIERRO EN PASO 4 ---
    // NOTA: Se ha eliminado la sobreescritura del entrehierro aquí porque 
    // estaba machacando el cálculo físico real de Magpylib con un "airgap" fijo de 10mm.
    // El entrehierro solo debe actualizarse cuando el servidor Python devuelve el equilibrio real.
}

// Llamar a la inicialización cuando se cambie al paso 9
document.addEventListener('DOMContentLoaded', () => {
    // Si la función cambiarPaso existe, podemos inyectarle la actualización visual
    const originalCambiarPaso = window.cambiarPaso;
    window.cambiarPaso = function(paso) {
        if(originalCambiarPaso) originalCambiarPaso(paso);
        if(paso === 9) {
            setTimeout(actualizarVistasLevitacion, 100);
        }
    };
    setTimeout(actualizarVistasLevitacion, 1000);
});

// --- FUNCIONES PARA MEMORIA TÉCNICA (INFORME) ---
window.poblarSelectProyectosInforme = function() {
    const select = document.getElementById('select-proyecto-informe');
    if(!select) return;
    
    // vaciar salvo la primera
    select.innerHTML = '<option value="">(Diseño actual de la calculadora en curso...)</option>';
    
    if (window.proyectosCargados && window.proyectosCargados.length > 0) {
        window.proyectosCargados.forEach((p, index) => {
            select.innerHTML += `<option value="${index}">${p.titulo || 'Proyecto sin título'}</option>`;
        });
    }
};

window.cargarProyectoEnInforme = function() {
    const select = document.getElementById('select-proyecto-informe');
    const container = document.getElementById('informe-automatico-html');
    
    // Validar si intentan generar la memoria del diseño actual sin haber calculado nada
    if (select && select.value === "") {
        if (!window.EstadoDiseno || window.EstadoDiseno.par_Nm === 0) {
            alert("⚠️ AVISO: El diseño actual en curso aún no ha sido simulado.\n\nPara que la Memoria Técnica contenga datos físicos reales, debes recorrer las fases de la calculadora y pulsar en 'Evaluar Motor' (Paso 10). Opcionalmente, también puedes seleccionar un proyecto guardado del desplegable.");
            return;
        }
    }

    // Feedback visual inmediato
    if (container) {
        container.innerHTML = '<div style="text-align:center; padding: 60px; font-family: sans-serif; color: #3b82f6; font-size: 20px; font-weight: bold;">⚙️ Recalculando físicas y generando Memoria Técnica...<br><span style="font-size:14px; color:#64748b; font-weight:normal; display:block; margin-top:10px;">Por favor espera unos instantes</span></div>';
        container.style.opacity = '0.5';
    }

    if(select && select.value !== "") {
        const p = window.proyectosCargados[select.value];
        // Utilizamos la función cargarMotor global
        window.cargarMotor(p.config, p.id_unico, p.titulo);
        // Esperamos a que los cálculos de la calculadora se actualicen (Fase 1..10)
        setTimeout(() => {
            if (typeof window.inyectarMemoriaTecnica === 'function') {
                window.inyectarMemoriaTecnica();
                if (typeof window.renderizarMatematicas === 'function') window.renderizarMatematicas();
            }
            if (container) container.style.opacity = '1';
        }, 1000);
    } else {
        // Generar informe con lo actual
        setTimeout(() => {
            if (typeof window.inyectarMemoriaTecnica === 'function') {
                window.inyectarMemoriaTecnica();
                if (typeof window.renderizarMatematicas === 'function') window.renderizarMatematicas();
            }
            if (container) container.style.opacity = '1';
        }, 500);
    }
};

// --- SISTEMA DE REGISTRO DE VISITAS ---
document.addEventListener('DOMContentLoaded', () => {
    let idVisitaActual = null;
    const horaEntrada = new Date();

    async function registrarEntrada() {
        // Esperamos a que el cliente de Supabase esté inicializado
        let intentos = 0;
        while (!window.dbMendocinoClient && intentos < 10) {
            await new Promise(r => setTimeout(r, 500));
            intentos++;
        }
        
        if (!window.dbMendocinoClient) return;

        let usuarioId = null;
        if (window.sessionActiva && window.sessionActiva.user) {
            usuarioId = window.sessionActiva.user.id;
        } else {
            // Re-verificamos la sesión actual por si tardó en cargar
            const { data } = await window.dbMendocinoClient.auth.getUser();
            if (data && data.user) usuarioId = data.user.id;
        }

        const { data, error } = await window.dbMendocinoClient
            .from('registro_visitas')
            .insert([{ hora_entrada: horaEntrada.toISOString(), usuario_id: usuarioId }])
            .select();
            
        if (data && data.length > 0) {
            idVisitaActual = data[0].id;
        }
    }

    // Iniciar el registro con un ligero retraso para asegurar que la autenticación ha cargado
    setTimeout(registrarEntrada, 1000);

    // Actualizar el tiempo al salir de la página
    window.addEventListener('beforeunload', () => {
        if (idVisitaActual && window.dbMendocinoClient) {
            const horaSalida = new Date();
            const tiempoSegundos = Math.round((horaSalida - horaEntrada) / 1000);
            
            window.dbMendocinoClient
                .from('registro_visitas')
                .update({ hora_salida: horaSalida.toISOString(), tiempo_total_segundos: tiempoSegundos })
                .eq('id', idVisitaActual)
                .then(() => {}); 
        }
    });
});
