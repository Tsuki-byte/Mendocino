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

    let panelValue = config.panel;
    if (config.panelNombre) {
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

    actualizarResumenPaso1();

    if (materialHilo) materialHilo.value = config.material ?? 'cobre';
    actualizarListaHilos();

    if (diaHilo && config.hilo !== undefined) {
        diaHilo.value = String(config.hilo);
    }

    if (calidad && config.calidad) {
        calidad.value = config.calidad;
    }

    calcularPaso2();
    calcularPaso3();

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

    cambiarPaso(1);
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


        const proyectosDestacados = [
            {
                id: 'proyecto-rapido-4c',
                titulo: 'Rotor de 4 caras · alta velocidad',
                subtitulo: 'Diseño ligero, rápido y muy sensible a la iluminación.',
                video: 'videos/motor1.mp4',
                etiquetas: ['Alta velocidad', 'Baja inercia', 'Arranque suave'],
                ficha: {
                    panel: '53x18 · 0,4V 101mA',
                    hilo: 'Cu Ø 0.15 mm',
                    espiras: '28',
                    velocidad: '~2027 RPM',
                    peso: '~38 g'
                },
                notas: [
                    'Tiene pocas espiras, así que la resistencia del devanado es baja y la respuesta es muy viva.',
                    'La baja masa del rotor favorece que acelere con rapidez y que reaccione enseguida a la luz.',
                    'A cambio, el par disponible es menor que en configuraciones con más cobre.'
                ],
                explicacion: 'Gira más deprisa porque combina poca inercia con una oposición eléctrica reducida. Es ideal cuando se busca velocidad visual y respuesta rápida.',
                config: { caras: 4, panel: 1, material: 'cobre', hilo: 0.15, margen: 0, ranuraAncho: 6.5, ranuraAlto: 3.5, ranuraTipo: 'trapecio', calidad: '0.40' }
            },
            {
                id: 'proyecto-equilibrado-4c',
                titulo: 'Rotor de 4 caras · equilibrio potencia/velocidad',
                subtitulo: 'Muy buen compromiso entre velocidad, par y facilidad de construcción.',
                video: 'videos/motor2.mp4',
                etiquetas: ['Equilibrado', 'Uso general', 'Par medio'],
                ficha: {
                    panel: '53x18 · 0,4V 101mA',
                    hilo: 'Cu Ø 0.25 mm',
                    espiras: '79',
                    velocidad: '~1997 RPM',
                    peso: '~53 g'
                },
                notas: [
                    'Más espiras mejoran la fuerza magnetomotriz y el par.',
                    'Sigue siendo un rotor razonablemente ligero, por lo que no pierde demasiada velocidad.',
                    'Es una base excelente para quien fabrica su primer Mendocino serio.'
                ],
                explicacion: 'No es el más rápido ni el más lento: funciona tan bien porque reparte de forma muy equilibrada masa, cobre y empuje magnético.',
                config: { caras: 4, panel: 1, material: 'cobre', hilo: 0.25, margen: 0, ranuraAncho: 6.5, ranuraAlto: 3.5, ranuraTipo: 'trapecio', calidad: '0.40' }
            },
            {
                id: 'proyecto-par-4c',
                titulo: 'Rotor de 4 caras · más par y menos velocidad',
                subtitulo: 'Configuración orientada a un giro más reposado y con más empuje.',
                video: 'videos/motor3.mp4',
                etiquetas: ['Mayor par', 'Menos velocidad', 'Arranque estable'],
                ficha: {
                    panel: '53x18 · 0,4V 101mA',
                    hilo: 'Cu Ø 0.28 mm',
                    espiras: '99',
                    velocidad: '~1253 RPM',
                    peso: '~60 g'
                },
                notas: [
                    'El aumento de espiras sube la capacidad de generar campo magnético.',
                    'La velocidad baja porque aumenta la masa y la energía se reparte en más cobre.',
                    'Resulta útil para entender cómo cambia el comportamiento al priorizar par frente a RPM.'
                ],
                explicacion: 'Corre menos porque hay más cobre y más inercia, pero gana estabilidad y empuje magnético. Es una versión muy didáctica para comparar comportamientos.',
                config: { caras: 4, panel: 1, material: 'cobre', hilo: 0.28, margen: 0, ranuraAncho: 6.5, ranuraAlto: 3.5, ranuraTipo: 'trapecio', calidad: '0.40' }
            },
            {
                id: 'proyecto-16c-inercia',
                titulo: 'Rotor de 16 caras · gran inercia y giro muy suave',
                subtitulo: 'Rotor masivo, muy vistoso y con comportamiento estable.',
                video: 'videos/motor4.mp4',
                etiquetas: ['Gran inercia', 'Muy suave', 'Baja velocidad'],
                ficha: {
                    panel: '157x13 · 0,35V 134mA',
                    hilo: 'Cu Ø 0.55 mm',
                    espiras: '64',
                    velocidad: '~110 RPM',
                    peso: '~1359 g'
                },
                notas: [
                    'Las muchas caras suavizan la entrega de par y el giro parece muy continuo.',
                    'La inercia es enorme, por eso tarda más en arrancar pero también mantiene mejor el movimiento.',
                    'Es un diseño ideal para mostrar cómo influye la masa del rotor en la dinámica.'
                ],
                explicacion: 'Gira más despacio porque el panel mueve una masa mucho mayor. Su punto fuerte no es la rapidez sino la estabilidad del giro y el efecto visual.',
                config: { caras: 16, panel: 12, material: 'cobre', hilo: 0.550, margen: 2.7, ranuraAncho: 5.4, ranuraAlto: 7, ranuraTipo: 'trapecio', calidad: '0.40' }
            }
        ];

        // --- CARGA DE DATOS ---
        let dbPaneles, dbHilos, dbImanes;
        try {
            dbPaneles = JSON.parse(localStorage.getItem('dbPaneles')) || [...defaultPaneles];
            dbHilos = JSON.parse(localStorage.getItem('dbHilos')) || [...defaultHilos];
            dbImanes = JSON.parse(localStorage.getItem('dbImanes')) || [...defaultImanes];
        } catch (e) {
            dbPaneles = [...defaultPaneles]; dbHilos = [...defaultHilos]; dbImanes = [...defaultImanes];
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
                    return `<li>
                        <div style="width:100%;">
                            <strong>${p.nombre}</strong> (${p.l}x${p.a}mm) 
                            <button class="btn-delete" style="float:right;" onclick="borrarPanel(${i})">X</button><br>
                            <small>Voc: ${p.voc}V | Isc: ${p.isc}mA | V: ${p.v}V | I: ${p.i}mA</small><br>
                            <small style="color:var(--primary-color);"><strong>P:</strong> ${p_mW.toFixed(1)}mW | <strong>R ideal:</strong> ${r_ohm.toFixed(1)}Ω | <strong>FF:</strong> ${ff.toFixed(3)}</small>
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
                renderizarProyectos();
            } catch (e) {
                console.error("Error al renderizar UI:", e);
            }
        }

        function añadirHilo() {
            const inputVal = document.getElementById('db-hilo-dia').value;
            const dia = parsearNumero(inputVal);
            if (isNaN(dia) || dia <= 0) { alert("Error: Introduce un diámetro válido."); return; }
            if (dbHilos.includes(dia)) { alert("Error: Este diámetro ya existe."); return; }
            dbHilos.push(dia);
            guardarDatos();
            document.getElementById('db-hilo-dia').value = '';
            mostrarToast(`Hilo Ø ${dia} mm añadido correctamente.`, 'ok');
        }

        function añadirPanel() {
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

            dbPaneles.push({ nombre, voc, isc, v, i, l, a });
            guardarDatos();
            document.querySelectorAll('#page-db input').forEach(inpt => inpt.value = '');
            mostrarToast(`Panel "${nombre}" añadido correctamente.`, 'ok');
        }

        function añadirIman() {
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

            dbImanes.push({ nombre, forma, l, a, h, br });
            guardarDatos();
            document.querySelectorAll('#db-iman-nombre, #db-iman-br, #db-iman-l, #db-iman-a, #db-iman-h').forEach(el => el.value = '');
            mostrarToast(`Imán "${nombre}" añadido correctamente.`, 'ok');
        }

        function borrarPanel(index) { dbPaneles.splice(index, 1); guardarDatos(); }
        function borrarHilo(index) { dbHilos.splice(index, 1); guardarDatos(); }
        function borrarIman(index) { dbImanes.splice(index, 1); guardarDatos(); }

        // --- NAVEGACIÓN ---
        function cambiarPagina(pagina) {
            document.querySelectorAll('.page-container').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
            document.getElementById('page-' + pagina).classList.add('active');
            document.getElementById('tab-' + pagina).classList.add('active');
        }


        // --- LÓGICA DE CÁLCULO ---
            const MATERIALES_CONDUCTORES = {
            cobre: { nombre: "Cobre", densidad: 8.95, resistividad: 1.75e-8, colorUI: "#d35400" },   // Naranja/Cobrizo
            aluminio: { nombre: "Aluminio", densidad: 2.70, resistividad: 2.82e-8, colorUI: "#7f8c8d" } // Gris/Plateado
        };

        const EstadoDiseno = {
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
            margenMarco_mm: 0
        };

        // --- PASO 1: GEOMETRÍA ---
        function actualizarResumenPaso1() {
            if (dbPaneles.length === 0) return;

            EstadoDiseno.numeroCaras = parseInt(document.getElementById('caras').value); 
            const indexPanel = document.getElementById('panel').value;
            const panel = dbPaneles[indexPanel];
            if (!panel) return;

            EstadoDiseno.longitudPanel = panel.l; 
            EstadoDiseno.anchoPanel = panel.a; 
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

            dibujarRotorSVG(EstadoDiseno.numeroCaras, tipoRanura, Wp, Ws, Ds, radioCircunscrito, angP, angS);
            // Dibujar la vista superior del panel
            dibujarPanelSVG(EstadoDiseno.longitudPanel, Wp, EstadoDiseno.margenMarco_mm);
            calcularPaso2();
        }

        // --- DIBUJO GEOMÉTRICO (SVG) ---
        function dibujarRotorSVG(N, tipoRanura, Wp, Ws, Ds, R, angP, angS) {
            const svg = document.getElementById('rotor-svg');
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
            // Cambiamos el color a un gris más oscuro (ej. #777 o #333)
            circuloExt.setAttribute("stroke", "#777"); 
            // Añadimos grosor a la línea
            circuloExt.setAttribute("stroke-width", "1"); 
            // Puedes jugar con estos números para cambiar el espaciado de las rayas (ej. "5,5")
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
        }



// --- DIBUJO DE LA VISTA SUPERIOR DEL PANEL ---
        // --- DIBUJO DE LA VISTA SUPERIOR DEL PANEL ---
        function dibujarPanelSVG(Lp, Wp, margen) {
            const svg = document.getElementById('panel-svg');
            if(!svg) return;
            svg.innerHTML = '';
            
            const L_total = Lp + (2 * margen);
            const W_total = Wp + (2 * margen);
            
            if(L_total <= 0 || W_total <= 0) return;

            // Usamos la dimensión mayor para que el 'padding' sea siempre uniforme y nada se deforme
            const maxDim = Math.max(L_total, W_total);
            const pad = maxDim * 0.30; // 30% de espacio extra alrededor para que quepan holgadamente los textos
            
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
                // Lo subimos un poco más (0.5) para que el texto grande no pise la línea
                txtMargen.setAttribute("y", yCotaMargen - (fontSize * 0.5));
                // Quitamos la reducción y lo hacemos un 10% más grande que el resto (1.1)
                txtMargen.setAttribute("style", `font-size: ${fontSize * 1.1}px; font-family: sans-serif; fill: #e74c3c; text-anchor: middle; font-weight: bold;`);
                txtMargen.textContent = "m:" + margen;
                svg.appendChild(txtMargen);
            }
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

            // --- NUEVO: Cambio de color visual en la Interfaz ---
            const leyenda = document.getElementById('leyenda-ranura');
            if (leyenda) leyenda.style.backgroundColor = materialConductor.colorUI;
            
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

                const lonTotalIdeal = (EstadoDiseno.resistenciaPanelObjetivo * (seccionHilo * 1e-6)) / materialConductor.resistividad;
                const espirasCalculadas = Math.round(lonTotalIdeal / lonEspira);
                document.getElementById('espiras').value = espirasCalculadas;
                
                EstadoDiseno.espirasPorDevanado = espirasCalculadas;

                document.getElementById('res-espiras-final').textContent = espirasCalculadas;

                const fmm = espirasCalculadas * (EstadoDiseno.intensidadPanel_mA / 1000);
                document.getElementById('res-fmm').textContent = fmm.toFixed(2) + ' Av';

                const lonTotalReal = espirasCalculadas * lonEspira;
                document.getElementById('lon-total').value = lonTotalReal.toFixed(2);

                const rReal = (materialConductor.resistividad * lonTotalReal) / (seccionHilo * 1e-6);
                document.getElementById('res-devanado').value = rReal.toFixed(2);

                const numDevanados = EstadoDiseno.numeroCaras / 2;
                document.getElementById('num-devanados').value = numDevanados;

                const volumen1_cm3 = seccionHilo * (lonTotalReal * 1000) / 1000;
                const masa1_g = volumen1_cm3 * materialConductor.densidad;
                const masaTotal_g = masa1_g * numDevanados;

                document.getElementById('res-mat-nombre').textContent = materialConductor.nombre;
                document.getElementById('res-lon-espira-resumen').textContent = lonEspira.toFixed(4) + ' m';
                document.getElementById('res-lon-devanado').textContent = lonTotalReal.toFixed(2) + ' m';
                document.getElementById('res-peso-devanado').textContent = masa1_g.toFixed(1) + ' g';
                document.getElementById('res-lon-total-todos').textContent = (lonTotalReal * numDevanados).toFixed(2) + ' m';
                document.getElementById('res-peso-total-todos').textContent = masaTotal_g.toFixed(1) + ' g';
                
                calcularPaso3();
            }
        }

        // --- PASO 3: ENCAJE EN RANURA ---
        function calcularPaso3() {
            const anchoReal = EstadoDiseno.anchoRanura_mm;
            const altoReal = EstadoDiseno.altoRanura_mm;

            if (anchoReal > 0 && altoReal > 0 && EstadoDiseno.diametroHilo_mm > 0 && EstadoDiseno.espirasPorDevanado > 0) {
                const conductoresCapa = Math.floor(anchoReal / EstadoDiseno.diametroHilo_mm);

                if (conductoresCapa <= 0) {
                    document.getElementById('alerta-ranura').style.display = 'block';
                    document.getElementById('alerta-ranura').innerHTML = "<strong>⚠️ Error:</strong> El hilo es más grueso que el ancho de la ranura.";
                    return;
                }

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

                const alerta = document.getElementById('alerta-ranura');
                const cabePorArea = areaEfectiva <= areaRanura;

                if (altoOcupado > altoReal || !cabePorArea) {
                    alerta.style.display = 'block';
                    alerta.innerHTML =
                    "<strong>⚠️ No cabe en la ranura:</strong><br>" +
                    "El volumen de cobre (más holgura manual) supera el espacio útil disponible.<br><br>" +
                    "• Área cobre estimado: " + areaEfectiva.toFixed(2) + " mm²<br>" +
                    "• Área útil ranura: " + areaRanura.toFixed(2) + " mm²<br><br>" +
                    "Soluciones posibles:<br>" +
                    "• Usar hilo más fino<br>" +
                    "• Reducir número de espiras<br>" +
                    "• Volver al Paso 1 y aumentar dimensiones de la ranura";
                    
                    document.getElementById('res-factor').style.color = '#e74c3c'; 
                } else {
                    alerta.style.display = 'none';
                    if (factorRelleno > 75) {
                        document.getElementById('res-factor').style.color = '#e67e22'; 
                    } else if (factorRelleno > 60) {
                         document.getElementById('res-factor').style.color = '#f1c40f'; 
                    } else {
                        document.getElementById('res-factor').style.color = '#27ae60'; 
                    }
                }
            }
        }


        // --- FUNCIONES PARA GUARDAR Y CARGAR LOCALMENTE ---

                        // --- FUNCIONES AVANZADAS PARA GUARDAR/CARGAR VARIOS MOTORES ---

        // Función de apoyo para leer la base de datos del navegador
        function obtenerMotoresGuardados() {
            try {
                const datos = localStorage.getItem('listaMotoresMendocino');
                return datos ? JSON.parse(datos) : {};
            } catch (e) {
                console.error("Error leyendo configuraciones guardadas:", e);
                return {};
            }
        }

        
        function guardarConfiguracionLocal() {
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

    const misMotores = obtenerMotoresGuardados();
    misMotores[nombreMotor] = miConfiguracion;
    localStorage.setItem('listaMotoresMendocino', JSON.stringify(misMotores));

    mostrarToast(`Motor "${nombreMotor}" guardado correctamente.`, 'ok');
}

    function cargarConfiguracionLocal() {
    const misMotores = obtenerMotoresGuardados();

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

        function renderizarProyectos() {
            const contenedor = obtenerElemento('contenedor-proyectos');
            if (!contenedor) return;

            const valoraciones = obtenerValoracionesProyectos();
            const votosUsuario = obtenerVotosUsuario();

            contenedor.innerHTML = proyectosDestacados.map((proyecto) => {
                const resumen = calcularResumenVotos(valoraciones[proyecto.id]);
                const votoUsuario = votosUsuario[proyecto.id] || 0;

                return `
                    <article class="proyecto-card">
                        <div class="proyecto-card__media">
                            <video controls preload="metadata">
                                <source src="${proyecto.video}" type="video/mp4">
                                Tu navegador no soporta el video.
                            </video>
                        </div>
                        <div class="proyecto-card__body">
                            <h3 class="proyecto-card__title">${proyecto.titulo}</h3>
                            <p class="proyecto-card__subtitle">${proyecto.subtitulo}</p>

                            <div class="proyecto-badges">
                                ${proyecto.etiquetas.map(tag => `<span class="proyecto-badge">${tag}</span>`).join('')}
                            </div>

                            <div class="proyecto-bloque">
                                <h4>⚙️ Características generales</h4>
                                <div class="proyecto-ficha">
                                    <div class="proyecto-ficha__fila"><span>Panel</span><strong>${proyecto.ficha.panel}</strong></div>
                                    <div class="proyecto-ficha__fila"><span>Hilo</span><strong>${proyecto.ficha.hilo}</strong></div>
                                    <div class="proyecto-ficha__fila"><span>Espiras</span><strong>${proyecto.ficha.espiras}</strong></div>
                                    <div class="proyecto-ficha__fila"><span>Velocidad</span><strong>${proyecto.ficha.velocidad}</strong></div>
                                    <div class="proyecto-ficha__fila"><span>Peso</span><strong>${proyecto.ficha.peso}</strong></div>
                                </div>
                            </div>

                            <div class="proyecto-bloque">
                                <h4>🧠 Notas técnicas anexas</h4>
                                <ul>
                                    ${proyecto.notas.map(nota => `<li>${nota}</li>`).join('')}
                                </ul>
                            </div>

                            <div class="proyecto-bloque">
                                <h4>🔬 Comentario técnico general</h4>
                                <p>${proyecto.explicacion}</p>
                            </div>

                            <div class="proyecto-bloque proyecto-acciones">
                                <h4>⭐ Ranking de la comunidad</h4>
                                <div class="proyecto-votos">
                                    ${[1,2,3,4,5].map(n => `<button class="btn-voto ${votoUsuario === n ? 'activo' : ''}" onclick="votarProyecto('${proyecto.id}', ${n})">${n}★</button>`).join('')}
                                </div>
                                <div class="proyecto-ranking">
                                    <strong>${resumen.total ? resumen.media.toFixed(2) : 'Sin votos'}</strong>
                                    ${resumen.total ? `<small> · ${resumen.total} voto${resumen.total === 1 ? '' : 's'}</small>` : ''}
                                </div>
                                <a href="${proyecto.video}" download class="btn-download">⬇️ Descargar vídeo</a>
                                <button class="btn-config" onclick='cargarMotor(${JSON.stringify(proyecto.config)})'>⚙️ Cargar config</button>
                            </div>
                        </div>
                    </article>
                `;
            }).join('');
        }

        // --- INICIALIZACIÓN ---
        window.onload = function() {
            inicializarNavegacionProfesional();
            renderizarUI();
            renderizarProyectos();
        };


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
        [ 4. COMPORTAMIENTO ]
        Tipo de rotor: ${tipoRotor}

        Arranque:
        ${arranque}

        Velocidad:
        ${velocidad}

        ──────────────────────────────────────────────
        [ 5. ALERTAS ]
        ${bloqueAlertas}

        ──────────────────────────────────────────────
        [ 6. RECOMENDACIONES ]
        ${bloqueRecomendaciones}

        ──────────────────────────────────────────────
        [ 7. INTERPRETACIÓN FÍSICA ]
        La energía luminosa se convierte en energía eléctrica mediante el panel solar.
        La corriente circula por las bobinas generando interacción con el campo magnético.
        Esto produce el par que hace girar el rotor.
        La FCEM estabiliza el sistema al aumentar la velocidad.

        ──────────────────────────────────────────────
        [ 8. CONCLUSIÓN ]
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

function cambiarPaso(numPaso) {

    // Ocultar todos los pasos
    document.querySelectorAll('.step-container').forEach(step => {
        step.classList.remove('active');
    });

    // Quitar estado activo a los indicadores
    document.querySelectorAll('.step-indicator').forEach(ind => {
        ind.classList.remove('active');
    });

    // Activar el paso actual
    const paso = document.getElementById(`step-${numPaso}`);
    const indicador = document.getElementById(`ind-${numPaso}`);

    if (paso) paso.classList.add('active');
    if (indicador) indicador.classList.add('active');
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