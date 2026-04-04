        // --- UTILIDADES ---
        function parsearNumero(valor) {
            if (!valor) return NaN;
            return parseFloat(valor.replace(',', '.'));
        }


        function cargarMotor(config) {
            cambiarPagina('calc');

            document.getElementById('caras').value = config.caras;

            const panelSelect = document.getElementById('panel');
            let panelValue = config.panel;

            if (config.panelNombre) {
                const idxPorNombre = dbPaneles.findIndex(p => p.nombre === config.panelNombre);
                if (idxPorNombre >= 0) {
                    panelValue = String(idxPorNombre);
                }
            }

            if (panelValue !== undefined && panelValue !== null) {
                panelSelect.value = panelValue;
            }

            document.getElementById('margen-placa').value = config.margen;
            document.getElementById('ranura-ancho').value = config.ranuraAncho;
            document.getElementById('ranura-alto').value = config.ranuraAlto;
            document.getElementById('ranura-tipo').value = config.ranuraTipo;

            actualizarResumenPaso1();

            document.getElementById('material-hilo').value = config.material;
            actualizarListaHilos();
            document.getElementById('dia-hilo-select').value = config.hilo;

            if (config.calidad) {
                document.getElementById('calidad-bobinado').value = config.calidad;
            }

            calcularPaso2();
            calcularPaso3();
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
                alert("Base de datos restaurada.");
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
            alert(`¡Hilo de Ø ${dia} mm añadido correctamente!`);
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
            alert(`¡Panel '${nombre}' añadido correctamente!`);
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
            alert(`¡Imán '${nombre}' añadido correctamente!`);
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

        function cambiarPaso(paso) {
            document.querySelectorAll('.step-container').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.step-indicator').forEach(el => {
                el.classList.remove('active');
                el.classList.remove('completed');
            });

            document.getElementById('step-' + paso).classList.add('active');
            document.getElementById('ind-' + paso).classList.add('active');

            for (let i = 1; i < paso; i++) {
                document.getElementById('ind-' + i).classList.add('completed');
            }

            if (paso === 2) calcularPaso2();
            if (paso === 3) calcularPaso3();
        }

        // --- LÓGICA DE CÁLCULO ---
            const MATERIALES = {
            cobre: { nombre: "Cobre", densidad: 8.95, resistividad: 1.75e-8, colorUI: "#d35400" },   // Naranja/Cobrizo
            aluminio: { nombre: "Aluminio", densidad: 2.70, resistividad: 2.82e-8, colorUI: "#7f8c8d" } // Gris/Plateado
        };

        // Variables globales de diseño
        let gRPlaca=0, gDiametroRotor=0, gLadoL=0, gLadoA=0, gNumCaras=0;
        let gIPanel = 0; 
        let gEspiras = 0; 
        let gDiaHilo = 0; 
        let gRanuraAncho = 0, gRanuraAlto = 0, gAreaRanura = 0;
        let gMargen = 0; 

        // --- PASO 1: GEOMETRÍA ---
        function actualizarResumenPaso1() {
            if (dbPaneles.length === 0) return;

            gNumCaras = parseInt(document.getElementById('caras').value); 
            const indexPanel = document.getElementById('panel').value;
            const panel = dbPaneles[indexPanel];
            if (!panel) return;

            gLadoL = panel.l; 
            gLadoA = panel.a; 
            gIPanel = panel.i; 

            const inputMargen = document.getElementById('margen-placa');
            gMargen = inputMargen ? (parseFloat(inputMargen.value) || 0) : 0;

            gRanuraAncho = parseFloat(document.getElementById('ranura-ancho').value) || 0;
            gRanuraAlto = parseFloat(document.getElementById('ranura-alto').value) || 0;
            const tipoRanura = document.getElementById('ranura-tipo').value;

            const Wp = gLadoA;
            const WpTotal = Wp + (2 * gMargen);
            const Ws = gRanuraAncho;
            const Ds = gRanuraAlto;

            const sumaAnchuras = WpTotal + Ws;
            if (gNumCaras <= 0 || sumaAnchuras <= 0) {
                document.getElementById('diametro').value = '0.00 mm';
                gDiametroRotor = 0;
                gAreaRanura = 0;
                return;
            }

            const proporcionPanel = WpTotal / sumaAnchuras;
            const proporcionRanura = Ws / sumaAnchuras;

            const anguloTotalRadianes = (2 * Math.PI) / gNumCaras;
            const angP = anguloTotalRadianes * proporcionPanel;
            const angS = anguloTotalRadianes * proporcionRanura;

            const seno = Math.sin(angP / 2);
            if (seno === 0) {
                document.getElementById('diametro').value = '0.00 mm';
                gDiametroRotor = 0;
                gAreaRanura = 0;
                return;
            }

            const radioCircunscrito = WpTotal / (2 * seno);
            gDiametroRotor = radioCircunscrito * 2;
            document.getElementById('diametro').value = gDiametroRotor.toFixed(2) + ' mm';

            if (tipoRanura === 'trapecio') {
                const baseMenor = 2 * (radioCircunscrito - Ds) * Math.sin(angS / 2);
                gAreaRanura = ((Ws + baseMenor) / 2) * Ds;
                if (gAreaRanura < 0) gAreaRanura = 0; 
            } else {
                gAreaRanura = Ws * Ds;
            }

            gRPlaca = panel.v / (panel.i / 1000); 
            const p_mW = panel.v * panel.i;
            const ff = (panel.v * panel.i) / (panel.voc * panel.isc) || 0;

            document.getElementById('res-medidas').textContent = `${panel.l} x ${panel.a} mm`;
            document.getElementById('res-panel-voc').textContent = panel.voc.toFixed(2) + ' V';
            document.getElementById('res-panel-isc').textContent = panel.isc.toFixed(1) + ' mA';
            document.getElementById('res-panel-v').textContent = panel.v.toFixed(2) + ' V';
            document.getElementById('res-panel-i').textContent = panel.i.toFixed(1) + ' mA';
            document.getElementById('res-panel-p').textContent = p_mW.toFixed(1) + ' mW';
            document.getElementById('res-panel-ff').textContent = ff.toFixed(3);
            document.getElementById('res-panel-r').textContent = gRPlaca.toFixed(2) + ' Ω';

            dibujarRotorSVG(gNumCaras, tipoRanura, Wp, Ws, Ds, radioCircunscrito, angP, angS);
            // Dibujar la vista superior del panel
            dibujarPanelSVG(gLadoL, Wp, gMargen);
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
                
                const WpTotal = Wp + (2 * gMargen);
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
            const material = MATERIALES[idMaterial];
            const diaHilo = parseFloat(selHilo.value);
            
            gDiaHilo = diaHilo;

            // --- NUEVO: Cambio de color visual en la Interfaz ---
            const leyenda = document.getElementById('leyenda-ranura');
            if (leyenda) leyenda.style.backgroundColor = material.colorUI;
            
            const txtNombreMat = document.getElementById('res-mat-nombre');
            if (txtNombreMat) {
                txtNombreMat.style.color = material.colorUI;
                txtNombreMat.style.fontWeight = "bold";
            }

            const radioHilo = diaHilo / 2;
            const seccionHilo = Math.PI * Math.pow(radioHilo, 2); 
            document.getElementById('sec-hilo').value = seccionHilo.toFixed(5);

            if (seccionHilo > 0) {
                const densidad = (gIPanel / 1000) / seccionHilo;
                document.getElementById('densidad-corriente').value = densidad.toFixed(2);
                
                const alertaDensidad = document.getElementById('alerta-densidad');
                if(densidad > 5) {
                    alertaDensidad.style.display = 'block';
                    document.getElementById('densidad-corriente').style.color = '#c0392b';
                } else {
                    alertaDensidad.style.display = 'none';
                    document.getElementById('densidad-corriente').style.color = 'black';
                }

                const distanciaMediaRanuras = gDiametroRotor - gRanuraAlto;
                const largoTotalRotor = gLadoL + (2 * gMargen); 
                const lonEspira = (2 * largoTotalRotor + 2 * distanciaMediaRanuras) / 1000; 
                
                document.getElementById('lon-espira').value = lonEspira.toFixed(4);

                const lonTotalIdeal = (gRPlaca * (seccionHilo * 1e-6)) / material.resistividad;
                const espirasCalculadas = Math.round(lonTotalIdeal / lonEspira);
                document.getElementById('espiras').value = espirasCalculadas;
                
                gEspiras = espirasCalculadas;

                document.getElementById('res-espiras-final').textContent = espirasCalculadas;

                const fmm = espirasCalculadas * (gIPanel / 1000);
                document.getElementById('res-fmm').textContent = fmm.toFixed(2) + ' Av';

                const lonTotalReal = espirasCalculadas * lonEspira;
                document.getElementById('lon-total').value = lonTotalReal.toFixed(2);

                const rReal = (material.resistividad * lonTotalReal) / (seccionHilo * 1e-6);
                document.getElementById('res-devanado').value = rReal.toFixed(2);

                const numDevanados = gNumCaras / 2;
                document.getElementById('num-devanados').value = numDevanados;

                const volumen1_cm3 = seccionHilo * (lonTotalReal * 1000) / 1000;
                const masa1_g = volumen1_cm3 * material.densidad;
                const masaTotal_g = masa1_g * numDevanados;

                document.getElementById('res-mat-nombre').textContent = material.nombre;
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
            const anchoReal = gRanuraAncho;
            const altoReal = gRanuraAlto;

            if (anchoReal > 0 && altoReal > 0 && gDiaHilo > 0 && gEspiras > 0) {
                const conductoresCapa = Math.floor(anchoReal / gDiaHilo);

                if (conductoresCapa <= 0) {
                    document.getElementById('alerta-ranura').style.display = 'block';
                    document.getElementById('alerta-ranura').innerHTML = "<strong>⚠️ Error:</strong> El hilo es más grueso que el ancho de la ranura.";
                    return;
                }

                const numCapas = Math.ceil(gEspiras / conductoresCapa);

                let espirasUltima = gEspiras % conductoresCapa;
                if (espirasUltima === 0) espirasUltima = conductoresCapa;

                const anchoOcupado = (gEspiras < conductoresCapa ? gEspiras : conductoresCapa) * gDiaHilo;
                const altoOcupado = numCapas * gDiaHilo;

                const areaCobre = gEspiras * Math.PI * Math.pow(gDiaHilo / 2, 2);
                const calidad = parseFloat(document.getElementById("calidad-bobinado").value);
                const areaEfectiva = areaCobre * (1 + calidad);
                const areaRanura = gAreaRanura;
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
            const datos = localStorage.getItem('listaMotoresMendocino');
            return datos ? JSON.parse(datos) : {}; // Devuelve un diccionario o uno vacío si no hay nada
        }

        function guardarConfiguracionLocal() {
            // 1. Preguntamos el nombre al usuario
            const nombreMotor = prompt("📝 Ponle un nombre a esta configuración (ej: 'Motor rápido 4 caras'):");
            
            // Si el usuario cancela o lo deja en blanco, paramos
            if (!nombreMotor || nombreMotor.trim() === "") return;

            // 2. Recopilamos todos los valores actuales
            const panelSelect = document.getElementById('panel');
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
                calidad: document.getElementById('calidad-bobinado').value
            };

            // 3. Lo añadimos a la lista existente y guardamos
            const misMotores = obtenerMotoresGuardados();
            misMotores[nombreMotor] = miConfiguracion;
            localStorage.setItem('listaMotoresMendocino', JSON.stringify(misMotores));
            
            alert(`¡Motor "${nombreMotor}" guardado correctamente! 💾`);
        }

        function cargarConfiguracionLocal() {
            const misMotores = obtenerMotoresGuardados();
            const listaDiv = document.getElementById('lista-configs');
            listaDiv.innerHTML = ''; // Limpiamos la lista visual

            const nombresDeMotores = Object.keys(misMotores);

            if (nombresDeMotores.length === 0) {
                listaDiv.innerHTML = '<p style="text-align:center; color:#7f8c8d;">No tienes ninguna configuración guardada todavía.</p>';
            } else {
                // Por cada motor guardado, creamos un renglón con sus botones
                nombresDeMotores.forEach(nombre => {
                    const renglon = document.createElement('div');
                    renglon.style.display = 'flex';
                    renglon.style.justifyContent = 'space-between';
                    renglon.style.alignItems = 'center';
                    renglon.style.padding = '10px 0';
                    renglon.style.borderBottom = '1px solid #f1f2f6';

                    // Nombre del motor
                    const titulo = document.createElement('span');
                    titulo.textContent = '⚙️ ' + nombre;
                    titulo.style.fontWeight = 'bold';
                    titulo.style.flex = '1';

                    // Contenedor para los botones
                    const cajaBotones = document.createElement('div');
                    
                    // Botón de Cargar
                    const btnCargar = document.createElement('button');
                    btnCargar.textContent = 'Cargar';
                    btnCargar.style.backgroundColor = 'var(--primary-color)';
                    btnCargar.style.color = 'white';
                    btnCargar.style.border = 'none';
                    btnCargar.style.padding = '6px 12px';
                    btnCargar.style.borderRadius = '4px';
                    btnCargar.style.cursor = 'pointer';
                    btnCargar.style.marginRight = '8px';
                    btnCargar.style.fontWeight = 'bold';
                    btnCargar.onclick = function() {
                        cargarMotor(misMotores[nombre]);
                        cerrarModalConfigs(); // Cerramos la ventana al cargar
                    };

                    // Botón de Borrar
                    const btnBorrar = document.createElement('button');
                    btnBorrar.innerHTML = '🗑️';
                    btnBorrar.style.backgroundColor = '#e74c3c';
                    btnBorrar.style.color = 'white';
                    btnBorrar.style.border = 'none';
                    btnBorrar.style.padding = '6px 10px';
                    btnBorrar.style.borderRadius = '4px';
                    btnBorrar.style.cursor = 'pointer';
                    btnBorrar.onclick = function() {
                        if (confirm(`¿Seguro que quieres borrar la configuración "${nombre}"?`)) {
                            delete misMotores[nombre]; // Lo borramos de la memoria
                            localStorage.setItem('listaMotoresMendocino', JSON.stringify(misMotores));
                            cargarConfiguracionLocal(); // Refrescamos la lista visualmente
                        }
                    };

                    cajaBotones.appendChild(btnCargar);
                    cajaBotones.appendChild(btnBorrar);
                    renglon.appendChild(titulo);
                    renglon.appendChild(cajaBotones);
                    listaDiv.appendChild(renglon);
                });
            }

            // Finalmente, mostramos la ventana flotante
            document.getElementById('modal-configs').style.display = 'flex';
        }

        function cerrarModalConfigs() {
            document.getElementById('modal-configs').style.display = 'none';
        }

        // --- INICIALIZACIÓN ---
        window.onload = function() {
            renderizarUI();
        };


        function finalizarConfiguracion() {
            guardarConfiguracionLocal();
        }

    
