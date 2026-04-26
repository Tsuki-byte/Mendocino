
function inyectarMemoriaTecnica() {
    const contenedor = document.getElementById("informe-automatico-html");
    if (!contenedor) return;

    // --- 1. Extracción de variables reales del simulador ---
    const N = parseInt(document.getElementById("caras")?.value) || window.EstadoDiseno?.numeroCaras || 6;
    
    let L = 53, W = 18;
    if (window.EstadoDiseno?.longitudPanel) L = window.EstadoDiseno.longitudPanel;
    if (window.EstadoDiseno?.anchoPanel) W = window.EstadoDiseno.anchoPanel;
    const T = 2; // Grosor
    
    const diametroHilo = window.EstadoDiseno?.diametroHilo_mm || parseFloat(document.getElementById("diametro-hilo")?.value) || 0.315;
    
    // --- 2. Cálculos físicos en tiempo real ---
    const R_circ = W / (2 * Math.sin(Math.PI / N));
    const Apotema = R_circ * Math.cos(Math.PI / N);
    
    const V_placa = L * W * T;
    const M_paneles = N * (V_placa * 0.0025);
    const M_eje = 11.0;
    const M_carcasa = 10.0;
    const M_base = M_paneles + M_eje + M_carcasa;

    const htmlString = `<style>
    #informe-automatico-html {
        font-family: 'Segoe UI', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        width: 100%;
        margin: 0;
        padding: 0 10px;
    }
    #informe-automatico-html h1 {
        color: #2c3e50;
        border-bottom: 2px solid #3498db;
        padding-bottom: 10px;
        font-size: 28px;
    }
    #informe-automatico-html h2 {
        color: #2980b9;
        margin-top: 40px;
        font-size: 22px;
    }
    #informe-automatico-html h3 {
        color: #16a085;
        margin-top: 30px;
        font-size: 18px;
    }
    #informe-automatico-html p {
        margin-bottom: 15px;
        text-align: justify;
    }
    #informe-automatico-html ul {
        margin-bottom: 20px;
        padding-left: 20px;
    }
    #informe-automatico-html li {
        margin-bottom: 8px;
    }
    #informe-automatico-html .imagen-placeholder {
        background-color: #f1f5f9;
        border: 2px dashed #94a3b8;
        padding: 20px;
        text-align: center;
        color: #64748b;
        font-weight: bold;
        margin: 20px 0;
        border-radius: 8px;
    }
    #informe-automatico-html .math {
        background-color: #f8f9fa;
        padding: 15px 20px;
        border-left: 4px solid #2c3e50;
        font-family: 'Cambria Math', 'Times New Roman', serif;
        font-size: 18px;
        margin: 20px 0;
        color: #1a202c;
    }
    #informe-automatico-html .math-line {
        margin-bottom: 6px;
    }
        margin: 15px 0;
    }
    #informe-automatico-html hr {
        border: 0;
        border-top: 1px solid #eee;
        margin: 40px 0;
    }
    #informe-automatico-html .nota {
        background-color: #fff3cd;
        border-left: 4px solid #ffc107;
        padding: 15px;
        margin: 20px 0;
    }
    #informe-automatico-html .io-box {
        background-color: #eef2f5;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 15px;
        margin-top: 15px;
        margin-bottom: 25px;
    }
    #informe-automatico-html .io-title {
        font-weight: bold;
        color: #374151;
        margin-bottom: 8px;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    #informe-automatico-html .io-entry {
        margin-bottom: 6px;
        font-size: 15px;
    }
    #informe-automatico-html .io-in::before { content: '➡️ '; }
    #informe-automatico-html .io-out::before { content: '✔️ '; }
</style>

<h1>Memoria Técnica y Cálculos de Diseño: Motor Mendocino</h1>

<p>Este documento constituye la memoria técnica que desglosa el diseño, la parametrización geométrica y los cálculos físicos del prototipo de motor Mendocino que ha configurado. Sirve como registro de ingeniería detallado sobre la viabilidad, el equilibrio de masas, así como las fuerzas electrodinámicas de levitación y rotación de este modelo específico.</p>

<hr>

<h2>1. Introducción Teórica al Motor Mendocino</h2>

<p>El motor Mendocino es una máquina eléctrica que destaca por dos características singulares: <strong>levitación magnética pasiva</strong> y <strong>conmutación óptica pasiva</strong>.</p>
<p>A diferencia de los motores convencionales que utilizan escobillas mecánicas o conmutadores electrónicos (controladores brushless), el motor Mendocino utiliza paneles solares montados en el propio rotor. La luz incidente (por ejemplo, el sol) activa únicamente el panel que se encuentra iluminado en ese instante. Este panel inyecta corriente en la bobina diametralmente opuesta, generando un campo electromagnético que interactúa con un imán permanente situado en la base, produciendo el par motriz. Al girar, un nuevo panel entra en la zona de luz, conmutando la corriente de forma continua.</p>

<p>Para minimizar la fricción y permitir que potencias tan diminutas (del orden de milivatios) logren hacer girar el sistema, el rotor levita gracias a la repulsión de imanes permanentes de Neodimio situados en sus extremos. Sin embargo, por el <strong>Teorema de Earnshaw</strong>, la levitación magnética pasiva estática es inestable en al menos un eje, por lo que el motor requiere un levísimo punto de apoyo mecánico en uno de sus extremos (normalmente un cristal o espejo) para estabilizar el eje longitudinal.</p>

<p>El <strong>Simulador de Motores Mendocino</strong> virtualiza todos estos fenómenos mediante cálculo matricial y simulación por elementos finitos (a través de la librería científica Magpylib).</p>

<hr>

<h2>2. Desglose Teórico y Operativo de las Fases del Simulador</h2>

<p>A continuación, se describe cada una de las fases de la herramienta, detallando la base teórica y diferenciando exactamente qué información requiere la aplicación (<strong>Entradas</strong>) y qué información resuelve (<strong>Salidas</strong>). Cabe destacar que, de forma complementaria a este informe final, la propia interfaz de la calculadora incluye un pequeño panel de resumen técnico en cada uno de sus pasos para guiar el proceso de diseño en tiempo real.</p>

<h3>Fase 1: Ensayo de Placas Solares (Fuente de Energía)</h3>
<p>El motor no se conecta a una red; su única fuente de energía son las células fotovoltaicas. Las células solares no son fuentes de tensión ni de corriente ideales, sino que operan bajo una <strong>curva característica I-V</strong> no lineal.</p>
<p><strong>Concepto Físico:</strong> En esta fase, se procesan datos empíricos obtenidos iluminando la placa y variando su resistencia de carga (desde circuito abierto a cortocircuito). Del análisis de la curva se extraen los siguientes parámetros fundamentales:</p>
<ul>
    <li><strong>Tensión de Vacío (Voc):</strong> Voltaje máximo de la placa cuando no hay carga conectada.</li>
    <li><strong>Corriente de Cortocircuito (Isc):</strong> Intensidad máxima que fluye cuando se unen los terminales sin resistencia.</li>
    <li><strong>Tensión e Intensidad P. Máx. (Vmp, Imp):</strong> Valores óptimos de operación donde la placa entrega la mayor cantidad de energía.</li>
    <li><strong>Potencia Máxima (Pmax):</strong> La energía máxima extraíble, calculada por la ley de Watt:</li>
</ul>
<div class="math-container" style="background-color: #f8f9fa; padding: 10px 20px; border-left: 4px solid #2c3e50; margin: 10px 0;">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <msub><mi>P</mi><mi>max</mi></msub>
  <mo>=</mo>
  <msub><mi>V</mi><mi>mpp</mi></msub>
  <mo>&sdot;</mo>
  <msub><mi>I</mi><mi>mpp</mi></msub>
</math>
</div>
<ul>
    <li><strong>Factor de Forma (FF):</strong> Indicador de calidad de la célula solar que relaciona la potencia máxima real con el máximo teórico (Voc &times; Isc).</li>
    <li><strong>Resistencia Óptima:</strong> El valor de la bobina (&Omega;) que permitirá al motor extraer la máxima potencia de la placa solar.</li>
    <li><strong>Eficiencia STC (Neta):</strong> Rendimiento global de conversión de energía lumínica a potencia eléctrica.</li>
</ul>

<div class="io-box">
    <div class="io-title">Variables de la Fase 1</div>
    <div class="io-entry io-in"><strong>Entrada:</strong> Parejas de valores tabulados de Tensión (Voltios) e Intensidad (Miliamperios).</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Curva característica trazada por interpolación.</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Gráfica de Potencia Eléctrica en milivatios (mW).</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Punto de Máxima Potencia (MPP), que define la Tensión e Intensidad óptimas que usará el motor.</div>
</div>

<div style="text-align:center; margin: 30px 0;">
    <img src="Imagenes_informe/Fase_1.jpg" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" alt="Fase 1">
</div>

<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-top: 20px; margin-bottom: 30px;">
    <h4 style="margin-top: 0; color: #0f172a; font-size: 16px;">Protocolo de Montaje del Ensayo Eléctrico</h4>
    <p style="font-size: 14px; margin-bottom: 10px;">Para obtener la curva empírica de una placa real y alimentar la herramienta con datos propios, se requiere el siguiente procedimiento en banco de pruebas:</p>
    <ol style="font-size: 14px; padding-left: 20px; margin-bottom: 15px;">
        <li style="margin-bottom: 6px;">Colocar la placa alineada perpendicularmente a la fuente de luz que se usará.</li>
        <li style="margin-bottom: 6px;">Conectar el cable <strong style="color: #dc2626;">rojo</strong> al terminal positivo <strong>(+)</strong> de la placa y el cable <strong style="color: #0f172a;">negro</strong> al terminal negativo <strong>(-)</strong>.</li>
        <li style="margin-bottom: 6px;">Conectar el <strong>Voltímetro (V)</strong> en paralelo a la placa para medir la caída de Tensión.</li>
        <li style="margin-bottom: 6px;">Conectar el <strong>Amperímetro (A)</strong> en serie con el circuito para medir la Corriente.</li>
        <li style="margin-bottom: 6px;">Cerrar el circuito con un <strong>Potenciómetro variable</strong> e ir disminuyendo la resistencia paso a paso para trazar los puntos de la curva.</li>
    </ol>
    <div style="padding: 15px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 6px;">
        <strong style="color: #b45309; display: flex; align-items: center; gap: 5px; font-size: 15px;">⚠️ Advertencia de Seguridad: Riesgo Térmico</strong>
        <p style="margin-top: 8px; margin-bottom: 10px; font-size: 14px; line-height: 1.5;">
            Debe utilizarse un potenciómetro bobinado o cerámico de al menos <strong>2W (Vatios)</strong>. Un potenciómetro de carbón estándar (0.25W) se quemará irremediablemente al acercarse a 0&Omega; (zona de cortocircuito).
        </p>
        <div style="font-size: 13px; color: #78350f; background: rgba(253, 230, 138, 0.4); padding: 12px; border-radius: 4px;">
            <strong>Justificación Técnica:</strong><br>
            El límite de corriente de un potenciómetro común de 100&Omega; y 0.25W es de apenas <strong>50 mA</strong> <math xmlns="http://www.w3.org/1998/Math/MathML" display="inline"><mo>(</mo><mi>I</mi><mo>=</mo><msqrt><mfrac><mn>0.25</mn><mn>100</mn></mfrac></msqrt><mo>)</mo></math>. Si ajustamos la resistencia casi a cero (ej. 0.5&Omega;), el panel solar se liberará y entregará toda su corriente de cortocircuito (que suele rondar los 130-150 mA).<br><br>
            Aunque la potencia total disipada por la Ley de Joule sea ínfima <math xmlns="http://www.w3.org/1998/Math/MathML" display="inline"><mo>(</mo><mi>P</mi><mo>=</mo><msup><mi>I</mi><mn>2</mn></msup><mo>&sdot;</mo><mi>R</mi><mo>=</mo><msup><mn>0.133</mn><mn>2</mn></msup><mo>&sdot;</mo><mn>0.5</mn><mo>=</mo><mn>0.008</mn><mtext>&nbsp;W</mtext><mo>)</mo></math>, esa intensidad <strong>supera drásticamente el límite de densidad de carga</strong> de la finísima pista de carbón por la que atraviesa, fundiéndola de inmediato (como el filamento de una bombilla). Un potenciómetro de 2W cuenta con hilo grueso que soporta corrientes elevadas en cualquier punto de su pista.
        </div>
    </div>
</div>

<h3>Fase 2: Geometría del Motor (Mecánica Estructural)</h3>
<p>El rotor de un motor Mendocino tiene forma de prisma poligonal regular, dictado por el número de paneles solares (N).</p>
<p><strong>Concepto Teórico:</strong> Un diseño de 4 caras (cuadrado) es común, pero configuraciones de 6 caras (hexágono) u 8 caras ofrecen un par motriz más suave a expensas de mayor peso. Adicionalmente, al modelar la geometría de cada panel, el simulador distingue rigurosamente entre su <strong>área total física</strong> y su <strong>área efectiva de silicio</strong> (representada visualmente en los esquemas con un patrón rayado). El borde exterior del panel constituye un margen estructural de resina o plástico, el cual es una zona muerta no sensible a la luz, pero que resulta fundamental para calcular el encaje mecánico real de las piezas. Con todas estas dimensiones, el simulador recurre a la trigonometría de polígonos regulares para resolver el radio del rotor:</p>
<div class="math-container" style="background-color: #f8f9fa; padding: 10px 20px; border-left: 4px solid #2c3e50; margin: 10px 0;">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <msub><mi>R</mi><mi>circ</mi></msub>
  <mo>=</mo>
  <mfrac>
    <mi>W</mi>
    <mrow>
      <mn>2</mn><mo>&sdot;</mo><mi>sin</mi><mo>(</mo><mfrac><mi>&pi;</mi><mi>N</mi></mfrac><mo>)</mo>
    </mrow>
  </mfrac>
</math>
</div>

<div class="io-box">
    <div class="io-title">Variables de la Fase 2</div>
    <div class="io-entry io-in"><strong>Entrada:</strong> Número de caras o paneles solares (N).</div>
    <div class="io-entry io-in"><strong>Entrada:</strong> Dimensiones de una placa: Longitud (L), Anchura (W), Grosor (T).</div>
    <div class="io-entry io-in"><strong>Entrada:</strong> Geometría del eje central (longitud y diámetro) y tamaño de la estructura/marco plástico.</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Circunradio (radio exterior para que las placas encajen en el polígono sin solaparse).</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Diámetro exterior total de la carcasa generada.</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Volumen individual y sumado de los paneles de silicio.</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Modelo transversal en vista SVG 2D.</div>
</div>

<div style="text-align:center; margin: 30px 0;">
    <img src="Imagenes_informe/Fase_2.jpg" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" alt="Fase 2">
</div>

<h3>Fase 3: Devanados (Electromagnetismo Circuital)</h3>
<p>El motor basa su empuje en la Fuerza de Lorentz, la cual requiere corriente eléctrica viajando por espiras conductoras.</p>
<p><strong>Concepto Teórico:</strong> El espacio físico delimita la "ventana de bobinado". El compromiso entre el diámetro del hilo y el número de espiras viene regido por la Ley de Pouillet para la resistencia eléctrica del conductor. Este cálculo es el corazón del diseño eléctrico porque, según el <strong>Teorema de Máxima Transferencia de Potencia</strong> (Teorema de Jacobi), el motor solo conseguirá extraer el 100% de la energía disponible de la fuente de luz si conseguimos que la resistencia final de esta bobina iguale exactamente la "resistencia óptima" del panel calculada en la Fase 1:</p>
<div class="math-container" style="background-color: #f8f9fa; padding: 10px 20px; border-left: 4px solid #2c3e50; margin: 10px 0;">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mi>R</mi>
  <mo>=</mo>
  <mi>&rho;</mi>
  <mo>&sdot;</mo>
  <mfrac>
    <mi>L</mi>
    <mi>S</mi>
  </mfrac>
</math>
</div>

<p>Adicionalmente, se ejecuta un <strong>análisis volumétrico de ocupación</strong>. La calculadora evalúa la <strong>superficie útil de la ranura</strong> (el espacio libre real bajo el panel, restando marcos y ejes) y la compara con la sección total de cobre que estamos intentando introducir. Este indicador visual advertirá en color <strong>rojo</strong> si el porcentaje de ocupación supera el 100%, alertando de que las espiras físicamente desbordarían el espacio disponible y chocarían con el panel solar.</p>

<div class="io-box">
    <div class="io-title">Variables de la Fase 3</div>
    <div class="io-entry io-in"><strong>Entrada:</strong> Diámetro estandarizado del conductor (mm).</div>
    <div class="io-entry io-in"><strong>Entrada:</strong> Material (Cobre puro con resistividad ρ=0.0171 o Aluminio).</div>
    <div class="io-entry io-in"><strong>Entrada:</strong> Margen de holgura y aislamientos.</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Sección transversal (Área en mm²) del hilo.</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Resistencia lineal eléctrica (Ohmios por metro).</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Número máximo exacto de espiras (N_esp) que caben físicamente bajo la placa solar en una sola ranura.</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Resistencia total de cada bobina (Ω) y Peso del metal añadido (gramos).</div>
</div>
<div style="text-align:center; margin: 30px 0;">
    <img src="Imagenes_informe/Fase_3.jpg" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" alt="Fase 3">
</div>

<h3>Fase 4: Levitación Magnética (Eje Z)</h3>
<p>Para un giro ultra-eficiente se suprime el rozamiento convencional usando campos magnéticos estacionarios.</p>
<p><strong>Concepto Físico:</strong> En lugar de apoyarse sobre rodamientos mecánicos que generan fricción, el motor "flota" en el aire gracias a la repulsión de imanes de Neodimio enfrentados por polos iguales. Funciona como una balanza invisible: el rotor cae empujado por la gravedad hasta acercarse a los imanes de la base. Cuanto más se acerca, más fuerte es el "colchón magnético" que lo rechaza. Cuando este empuje hacia arriba iguala exactamente al peso total del bloque, el sistema se detiene y levita de forma estable a una altura <math xmlns="http://www.w3.org/1998/Math/MathML" display="inline"><mi>Z</mi></math>:</p>
<div class="math-container" style="background-color: #f8f9fa; padding: 10px 20px; border-left: 4px solid #2c3e50; margin: 10px 0;">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mtext>Fuerza Magnética Repulsiva (&#8593;)</mtext>
  <mo>=</mo>
  <mtext>Peso Total del Rotor (&#8595;)</mtext>
</math>
</div>

<div class="io-box">
    <div class="io-title">Variables de la Fase 4</div>
    <div class="io-entry io-in"><strong>Entrada:</strong> Elección del imán insertado en el rotor (Diámetro, largo, Grado/Potencia coercitiva).</div>
    <div class="io-entry io-in"><strong>Entrada:</strong> Elección del imán colocado en la bancada/base.</div>
    <div class="io-entry io-in"><strong>Entrada:</strong> Distancia de separación (Base X) entre ambos pilares de la base magnética.</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Peso gravitatorio estructural completo a levantar.</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Fuerza repulsiva vectorial en el eje Z de los imanes según su curva.</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Altura de Levitación (Punto Z donde Repulsión Magnética = Gravedad). Alerta si el rotor no levita.</div>
</div>

<div style="text-align:center; margin: 30px 0;">
    <img src="Imagenes_informe/Fase_4.png" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" alt="Fase 4">
</div>

<h3>Fase 5: Campo Estator y Fuerza de Lorentz (Dinámica Motriz)</h3>
<p>Una vez que el motor está levitando sin fricción, necesita un impulso constante para comenzar a rotar y mantener la inercia. Este empuje rotacional nace puramente de la interacción electromagnética central.</p>
<p><strong>Concepto Físico:</strong> En el centro de la base del motor se sitúa un imán adicional, comúnmente llamado "estator", cuya única misión es irradiar un campo magnético permanente hacia arriba (<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline"><mi>B</mi></math>), atravesando el espacio por donde giran las bobinas. Cuando la fuente de luz incide en un panel solar superior (Fase 1), se inyecta una corriente eléctrica intensa (<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline"><mi>I</mi></math>) a través del hilo de cobre enrollado en la parte inferior del rotor (Fase 3). Al cruzarse esta corriente eléctrica perpendicularmente con el flujo magnético del estator, la física fundamental interviene generando una fuerza perpendicular a ambas variables, conocida como la <strong>Fuerza de Lorentz</strong>. Esta fuerza "fantasmal" empuja los cables de cobre de forma lateral. Como los cables están fuertemente solidarios a la estructura, este empuje lineal se convierte de inmediato en un par de torsión (torque) que fuerza a todo el motor Mendocino a girar de forma limpia e inagotable mientras reciba energía lumínica.</p>
<div class="math-container" style="background-color: #f8f9fa; padding: 10px 20px; border-left: 4px solid #2c3e50; margin: 10px 0;">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mover><mi>F</mi><mo>&rarr;</mo></mover>
  <mo>=</mo>
  <mi>I</mi>
  <mo>&sdot;</mo>
  <mo>(</mo>
  <mover><mi>L</mi><mo>&rarr;</mo></mover>
  <mo>&times;</mo>
  <mover><mi>B</mi><mo>&rarr;</mo></mover>
  <mo>)</mo>
</math>
</div>

<div class="io-box">
    <div class="io-title">Variables de la Fase 5</div>
    <div class="io-entry io-in"><strong>Entrada:</strong> Características físicas del imán central motriz (Estator).</div>
    <div class="io-entry io-in"><strong>Entrada:</strong> Posición vertical (gap) y proximidad del imán central respecto al barrido de las bobinas.</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Intensidad del Campo Magnético radiado en la zona de rotación (Tesla).</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Magnitud y vector transversal de la Fuerza de Lorentz.</div>
</div>

<div style="text-align:center; margin: 30px 0;">
    <img src="Imagenes_informe/Fase_5.jpg" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" alt="Fase 5">
</div>

<h3>Fase 6: Interacción Lumínica (Conmutación Óptica)</h3>
<p>El sol (o la fuente de luz artificial) y la geometría poliédrica de la carcasa actúan como un sistema de conmutación óptica pasiva, haciendo el trabajo que en otros motores realizarían unas escobillas mecánicas.</p>
<p><strong>Dinámica Interactiva del Simulador:</strong> En esta fase, la calculadora permite interactuar dinámicamente tanto con el <strong>ángulo de rotación del motor</strong> como con la <strong>posición cenital de la fuente de luz</strong>. Al arrastrar los controles y hacer girar manualmente el rotor virtual en pantalla, se puede observar en tiempo real cómo fluye la corriente eléctrica a través de los distintos devanados. El diagrama reacciona de forma visual: las bobinas dibujadas adoptan un <strong>color rojo más intenso</strong> conforme la corriente inyectada por su panel solar asociado se hace más fuerte (alcanzando su máximo cuando la placa se alinea de forma perpendicular a la luz).</p>
<p>Esta simulación paso a paso resulta reveladora para comprender el rendimiento del motor, ya que permite detectar a simple vista qué bobina tiene los "efectos más directos". Quedará patente que el par motriz óptimo ocurre cuando la bobina que recibe la corriente más intensa coincide exactamente con su paso por la parte inferior de la estructura, es decir, cuando transita a milímetros del imán central de la base (Estator) cortando sus líneas de campo magnético perpendicularmente.</p>
<p><strong>Concepto Teórico:</strong> Matemáticamente, la energía lumínica interceptada obedece a la <strong>Ley de Lambert</strong> (Ley del Coseno), la cual modela cómo decae la radiación absorbida cuando los rayos de luz no caen rectos. Este valor también se ve fuertemente mitigado por el fenómeno geométrico del "auto-sombreado": al girar, las propias aristas del rotor proyectan sombras variables sobre los paneles vecinos, recortando dinámicamente el área iluminada efectiva:</p>
<div class="math-container" style="background-color: #f8f9fa; padding: 10px 20px; border-left: 4px solid #2c3e50; margin: 10px 0;">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <msub><mi>E</mi><mi>incidente</mi></msub>
  <mo>&prop;</mo>
  <mi>cos</mi><mo>(</mo><mi>&theta;</mi><mo>)</mo>
  <mo>&sdot;</mo>
  <msub><mi>A</mi><mi>iluminada</mi></msub>
</math>
</div>

<div class="io-box">
    <div class="io-title">Variables de la Fase 6</div>
    <div class="io-entry io-in"><strong>Entrada:</strong> Ángulo actual (theta) de la rotación del motor.</div>
    <div class="io-entry io-in"><strong>Entrada:</strong> Posición angular teórica de la fuente de luz.</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Área real iluminada de cada placa solar tras sustraer la sombra.</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Intensidad de corriente inyectada en cada mili-segundo a los devanados.</div>
</div>
<div style="text-align:center; margin: 30px 0;">
    <img src="Imagenes_informe/Fase_6.jpg" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" alt="Fase 6">
</div>

<h3>Fase 7: FCEM y Velocidad</h3>
<p>Todo motor eléctrico genera su propio voltaje "freno" al rodar. Sin él, aceleraría hasta desintegrarse.</p>
<p><strong>Concepto Teórico:</strong> Al pasar por el campo magnético del imán central, la Ley de Faraday-Lenz induce una <em>Fuerza Contraelectromotriz</em> opuesta que actúa como freno asintótico de velocidad:</p>
<div class="math-container" style="background-color: #f8f9fa; padding: 10px 20px; border-left: 4px solid #2c3e50; margin: 10px 0;">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mi>&epsilon;</mi>
  <mo>=</mo>
  <mo>-</mo><mi>N</mi>
  <mo>&sdot;</mo>
  <mfrac>
    <mrow><mi>d</mi><mi>&Phi;</mi></mrow>
    <mrow><mi>d</mi><mi>t</mi></mrow>
  </mfrac>
</math>
</div>

<div class="io-box">
    <div class="io-title">Variables de la Fase 7</div>
    <div class="io-entry io-in"><strong>Entrada:</strong> Tensión máxima del circuito (Fase 1).</div>
    <div class="io-entry io-in"><strong>Entrada:</strong> Flujo magnético interceptado y constante geométrica del estator.</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Tensión de FCEM.</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Límite termodinámico teórico de Velocidad en vacío (R.P.M.).</div>
</div>
<div style="text-align:center; margin: 30px 0;">
    <img src="Imagenes_informe/Fase_7.jpg" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" alt="Fase 7">
</div>

<h3>Fase 8 y 9: Par Motriz y Simulación Global (Motor Físico Magpylib en 3D)</h3>
<p>El centro de gravedad computacional de esta herramienta: cálculos exhaustivos de elementos finitos para derivar la verdadera fuerza mecánica.</p>
<p><strong>Concepto Teórico:</strong> El simulador segmenta cada espira en microvectores, aplicando la Ley de Lorentz (Fase 8). En la <strong>Fase 9 (Global)</strong> se calcula la superposición tensorial de todos los imanes, incluyendo el frenado magnético de los imanes de levitación.</p>
<div class="math-container" style="background-color: #f8f9fa; padding: 10px 20px; border-left: 4px solid #2c3e50; margin: 10px 0;">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mover><mi>F</mi><mo>&rarr;</mo></mover>
  <mo>=</mo>
  <mo>&int;</mo>
  <mi>I</mi>
  <mo>(</mo>
  <mi>d</mi><mover><mi>l</mi><mo>&rarr;</mo></mover>
  <mo>&times;</mo>
  <mover><mi>B</mi><mo>&rarr;</mo></mover>
  <mo>)</mo>
</math>
</div>

<div class="io-box">
    <div class="io-title">Variables de las Fases 8 y 9</div>
    <div class="io-entry io-in"><strong>Entrada:</strong> Posicionamiento tridimensional absoluto del imán inductor base (y de los apoyos en F9).</div>
    <div class="io-entry io-in"><strong>Entrada:</strong> Posición de la matriz de espiras respecto al rotor en ese instante.</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Tensor de Campo Magnético en 3D (B_x, B_y, B_z).</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Vector fuerza final F de Lorentz (newtons).</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Par Motriz o Momento de Torsión (Torque en miliNewton·metro), que dicta cuán fuerte es el giro.</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Renderizado 3D Interactivo para la inspección visual (Plotly).</div>
</div>

<div style="text-align:center; margin: 30px 0; display: flex; flex-direction: column; gap: 20px; align-items: center;">
    <img src="Imagenes_informe/Fase_8.jpg" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" alt="Fase 8">
    <img src="Imagenes_informe/Fase_9.jpg" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" alt="Fase 9">
</div>

<h3>Fase 10: Conexionado Eléctrico</h3>
<p>Determina la dirección de los flujos de corriente y polos electromagnéticos en base a cómo se sueldan las placas solares.</p>
<div class="io-box">
    <div class="io-title">Variables de la Fase 10</div>
    <div class="io-entry io-in"><strong>Entrada:</strong> Tipo de cableado (En estrella/cruz, o en bucle/polígono continuo).</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Sentido de la corriente inyectada (+/-).</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Polaridad geométrica generada en el rotor (Cara Norte / Cara Sur magnética).</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Determinación de si el motor rotará en sentido horario (CW) o antihorario (CCW).</div>
</div>
<div style="text-align:center; margin: 30px 0;">
    <img src="Imagenes_informe/Fase_10.jpg" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" alt="Fase 10">
</div>

<h3>Fase 11 y 12: Equilibrado de Masas y Simulación Dinámica</h3>
<p>Un rotor asimétrico girará de forma excéntrica, se desequilibrará buscando su centro de gravedad y se detendrá oscilando como un péndulo físico amortiguado:</p>
<div class="math-container" style="background-color: #f8f9fa; padding: 10px 20px; border-left: 4px solid #2c3e50; margin: 10px 0;">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mi>&tau;</mi>
  <mo>=</mo>
  <mi>I</mi>
  <mo>&sdot;</mo>
  <mi>&alpha;</mi>
  <mo>=</mo>
  <mo>-</mo><mi>M</mi><mi>g</mi><mi>L</mi><mo>&sdot;</mo><mi>sin</mi><mo>(</mo><mi>&theta;</mi><mo>)</mo>
</math>
</div>
<div class="io-box">
    <div class="io-title">Variables de las Fases 11 y 12</div>
    <div class="io-entry io-in"><strong>Entrada:</strong> Desviaciones de tolerancia en masa de los hilos de cobre.</div>
    <div class="io-entry io-in"><strong>Entrada:</strong> Clic en 'Start / Stop' de animación.</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Coordenadas (X, Y) del Centro de Gravedad desfasado.</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Momento de Inercia del conjunto.</div>
    <div class="io-entry io-out"><strong>Salida:</strong> Simulación dinámica visual: efecto pendular bajo gravedad si la masa no está equilibrada perfectamente.</div>
</div>

<div style="text-align:center; margin: 30px 0; display: flex; flex-direction: column; gap: 20px; align-items: center;">
    <img src="Imagenes_informe/Fase_11.jpg" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" alt="Fase 11">
    <img src="Imagenes_informe/Fase_12.jpg" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" alt="Fase 12">
</div>

<hr>

<h2>3. ESTUDIO ANALÍTICO DESARROLLADO: "${N} Caras - Placas ${L.toFixed(1)}x${W.toFixed(1)}x${T.toFixed(1)} - Hilo ${diametroHilo.toFixed(3)}"</h2>

<p>A petición del usuario, desarrollaremos paso a paso los números detrás de un diseño característico alojado en la base de datos pública del simulador.</p>

<h3>3.1. Especificaciones del Modelo Físico</h3>
<ul>
    <li><strong>Rotor (N)</strong>: ${N} caras.</li>
    <li><strong>Paneles Solares</strong>: Longitud L = ${L.toFixed(1)} mm, Anchura W = ${W.toFixed(1)} mm, Grosor T = ${T.toFixed(1)} mm.</li>
    <li><strong>Hilo Conductor</strong>: Diámetro d = ${diametroHilo.toFixed(3)} mm.</li>
</ul>

<h3>3.2. Geometría Hexagonal (Cálculo Espacial)</h3>
<p>Para un polígono de ${N} caras, el ángulo central subtendido por cada lado es 360º / ${N} = ${(360/N).toFixed(1)}º.</p>
<p>El circunradio (distancia del centro a los vértices) se calcula con la fórmula:</p>
<div class="math-container" style="background-color: #f8f9fa; padding: 10px 20px; border-left: 4px solid #2c3e50; margin: 20px 0;">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <msub><mi>R</mi><mi>circ</mi></msub>
  <mo>=</mo>
  <mfrac>
    <mi>W</mi>
    <mrow>
      <mn>2</mn><mo>&sdot;</mo><mi>sin</mi><mo>(</mo><mfrac><mrow><mn>180</mn><mo>&deg;</mo></mrow><mi>N</mi></mfrac><mo>)</mo>
    </mrow>
  </mfrac>
</math>
<br>
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <msub><mi>R</mi><mi>circ</mi></msub>
  <mo>=</mo>
  <mfrac>
    <mn>${W.toFixed(1)}</mn>
    <mrow>
      <mn>2</mn><mo>&sdot;</mo><mi>sin</mi><mo>(</mo>${(180/N).toFixed(1)}<mo>&deg;</mo><mo>)</mo>
    </mrow>
  </mfrac>
  <mo>=</mo>
  <mn>${R_circ.toFixed(2)}</mn>
  <mtext>&nbsp;mm</mtext>
</math>
</div>
<p>Por tanto, el <strong>diámetro exterior máximo de las placas será de ${(R_circ*2).toFixed(1)} mm</strong>.</p>
<p>La apotema (distancia del centro a la placa) se calcula con la fórmula:</p>
<div class="math-container" style="background-color: #f8f9fa; padding: 10px 20px; border-left: 4px solid #2c3e50; margin: 20px 0;">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mi>Apotema</mi>
  <mo>=</mo>
  <msub><mi>R</mi><mi>circ</mi></msub>
  <mo>&sdot;</mo>
  <mi>cos</mi><mo>(</mo><mfrac><mrow><mn>180</mn><mo>&deg;</mo></mrow><mi>N</mi></mfrac><mo>)</mo>
</math>
<br>
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mi>Apotema</mi>
  <mo>=</mo>
  <mn>${R_circ.toFixed(2)}</mn>
  <mo>&sdot;</mo>
  <mi>cos</mi><mo>(</mo>${(180/N).toFixed(1)}<mo>&deg;</mo><mo>)</mo>
  <mo>&approx;</mo>
  <mn>${Apotema.toFixed(2)}</mn>
  <mtext>&nbsp;mm</mtext>
</math>
</div>
<p>Si el eje de acero tiene 6 mm de diámetro (radio 3 mm), la <strong>profundidad de la ventana de bobinado</strong> disponible por cara es ${Apotema.toFixed(2)} - 3 = ${(Apotema-3).toFixed(2)} mm.</p>

<h3>3.3. Estudio de Masas (Gravitatorio)</h3>
<p><strong>Volumen geométrico de una placa:</strong></p>
<div class="math-container" style="background-color: #f8f9fa; padding: 10px 20px; border-left: 4px solid #2c3e50; margin: 10px 0;">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <msub><mi>V</mi><mi>placa</mi></msub>
  <mo>=</mo>
  <mi>L</mi><mo>&sdot;</mo><mi>W</mi><mo>&sdot;</mo><mi>T</mi>
</math>
<br>
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <msub><mi>V</mi><mi>placa</mi></msub>
  <mo>=</mo>
  <mn>${L.toFixed(1)}</mn><mo>&sdot;</mo><mn>${W.toFixed(1)}</mn><mo>&sdot;</mo><mn>${T.toFixed(1)}</mn>
  <mo>=</mo>
  <mn>${V_placa.toFixed(1)}</mn>
  <mtext>&nbsp;</mtext><msup><mi>mm</mi><mn>3</mn></msup>
</math>
</div>

<p><strong>Masa de los paneles solares</strong> (asumiendo densidad del silicio y cristal &rho; &approx; 0.0025 g/mm³):</p>
<div class="math-container" style="background-color: #f8f9fa; padding: 10px 20px; border-left: 4px solid #2c3e50; margin: 10px 0;">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <msub><mi>M</mi><mi>paneles</mi></msub>
  <mo>=</mo>
  <mi>N</mi><mo>&sdot;</mo><mo>(</mo><msub><mi>V</mi><mi>placa</mi></msub><mo>&sdot;</mo><msub><mi>&rho;</mi><mi>silicio</mi></msub><mo>)</mo>
</math>
<br>
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <msub><mi>M</mi><mi>paneles</mi></msub>
  <mo>=</mo>
  <mn>${N}</mn><mo>&sdot;</mo><mo>(</mo><mn>${V_placa.toFixed(1)}</mn><mo>&sdot;</mo><mn>0.0025</mn><mo>)</mo>
  <mo>&approx;</mo>
  <mn>${M_paneles.toFixed(1)}</mn>
  <mtext>&nbsp;g</mtext>
</math>
</div>

<p><strong>Masa Estructural Base</strong> (sumando la masa de un eje de acero y las tapas plásticas impresas):</p>
<div class="math-container" style="background-color: #f8f9fa; padding: 10px 20px; border-left: 4px solid #2c3e50; margin: 10px 0;">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <msub><mi>M</mi><mi>base</mi></msub>
  <mo>=</mo>
  <msub><mi>M</mi><mi>paneles</mi></msub>
  <mo>+</mo>
  <msub><mi>M</mi><mi>eje</mi></msub>
  <mo>+</mo>
  <msub><mi>M</mi><mi>carcasa</mi></msub>
</math>
<br>
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <msub><mi>M</mi><mi>base</mi></msub>
  <mo>=</mo>
  <mn>${M_paneles.toFixed(1)}</mn>
  <mo>+</mo>
  <mn>11.0</mn>
  <mo>+</mo>
  <mn>10.0</mn>
  <mo>&approx;</mo>
  <mn>${M_base.toFixed(1)}</mn>
  <mtext>&nbsp;g</mtext>
</math>
</div>

<h3>3.4. Electromagnetismo (Devanados y Resistencia)</h3>
<ul>
    <li><strong>Sección Transversal (<i>S</i>)</strong>: 
        <div class="math-container" style="background-color: #f8f9fa; padding: 10px 20px; border-left: 4px solid #2c3e50; margin: 10px 0;">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mi>S</mi>
  <mo>=</mo>
  <mi>&pi;</mi>
  <mo>&sdot;</mo>
  <msup>
    <mrow><mo>(</mo><mfrac><mi>d</mi><mn>2</mn></mfrac><mo>)</mo></mrow>
    <mn>2</mn>
  </msup>
</math>
<br>
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mi>S</mi>
  <mo>=</mo>
  <mi>&pi;</mi>
  <mo>&sdot;</mo>
  <msup>
    <mrow><mo>(</mo><mfrac><mn>0.315</mn><mn>2</mn></mfrac><mo>)</mo></mrow>
    <mn>2</mn>
  </msup>
  <mo>&approx;</mo>
  <mn>0.0779</mn>
  <mtext>&nbsp;</mtext>
  <msup><mi>mm</mi><mn>2</mn></msup>
</math>
        </div>
    </li>
    <li><strong>Resistencia por Metro Lineal (<i>R<sub>L</sub></i>)</strong> (Resistividad Cobre = 0.0171 Ω·mm²/m):
        <div class="math-container" style="background-color: #f8f9fa; padding: 10px 20px; border-left: 4px solid #2c3e50; margin: 10px 0;">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <msub><mi>R</mi><mi>L</mi></msub>
  <mo>=</mo>
  <mfrac><mi>&rho;</mi><mi>S</mi></mfrac>
</math>
<br>
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <msub><mi>R</mi><mi>L</mi></msub>
  <mo>=</mo>
  <mfrac><mn>0.0171</mn><mn>0.0779</mn></mfrac>
  <mo>&approx;</mo>
  <mn>0.219</mn>
  <mtext>&nbsp;&Omega;/m</mtext>
</math>
        </div>
    </li>
    <li><strong>Longitud Media de Espira (<i>L<sub>m</sub></i>)</strong>:
        <div class="math-container" style="background-color: #f8f9fa; padding: 10px 20px; border-left: 4px solid #2c3e50; margin: 10px 0;">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <msub><mi>L</mi><mi>m</mi></msub>
  <mo>=</mo>
  <mn>2</mn><mi>L</mi>
  <mo>+</mo>
  <mn>2</mn><msub><mi>D</mi><mi>ext</mi></msub>
</math>
<br>
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <msub><mi>L</mi><mi>m</mi></msub>
  <mo>=</mo>
  <mn>2</mn><mo>(</mo><mn>53</mn><mo>)</mo>
  <mo>+</mo>
  <mn>2</mn><mo>(</mo><mn>36</mn><mo>)</mo>
  <mo>=</mo>
  <mn>178</mn>
  <mtext>&nbsp;mm</mtext>
</math>
        </div>
    </li>
    <li>Si el espacio volumétrico de la Fase 2 admite <strong>100 espiras</strong> encajadas por bobina diametral:
        <ul>
            <li>Longitud total = 100 × 0.178 = 17.8 metros de hilo.</li>
            <li><strong>Resistencia de la Bobina</strong> = 17.8 m × 0.219 Ω/m = 3.9 Ω.</li>
        </ul>
    </li>
</ul>

<h3>3.5. Generación de Par Motriz Teórico (Fuerza de Lorentz)</h3>
<p>Asumimos que el ensayo de la Fase 1 demostró que el panel bajo luz inyecta <strong>200 mA (0.2 A)</strong> a la bobina debido a los 3.9 Ω. Si el imán inductor genera un campo intenso perpendicular de <strong>0.15 Teslas</strong> frente a la cara activa (50 mm):</p>
<ul>
    <li>Corriente total del paquete: 100 espiras × 0.2 A = 20 Amperios·vuelta.</li>
</ul>
<p>Fuerza de Lorentz empujando tangencialmente:</p>
<div class="math-container" style="background-color: #f8f9fa; padding: 10px 20px; border-left: 4px solid #2c3e50; margin: 20px 0;">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <msub><mi>F</mi><mi>L</mi></msub>
  <mo>=</mo>
  <msub><mi>I</mi><mi>total</mi></msub>
  <mo>&sdot;</mo>
  <msub><mi>L</mi><mi>activa</mi></msub>
  <mo>&sdot;</mo>
  <mi>B</mi>
</math>
<br>
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <msub><mi>F</mi><mi>L</mi></msub>
  <mo>=</mo>
  <mn>20</mn><mtext>&nbsp;A</mtext>
  <mo>&sdot;</mo>
  <mn>0.05</mn><mtext>&nbsp;m</mtext>
  <mo>&sdot;</mo>
  <mn>0.15</mn><mtext>&nbsp;T</mtext>
  <mo>=</mo>
  <mn>0.15</mn>
  <mtext>&nbsp;N</mtext>
</math>
</div>
<p>El Par Motriz (Torque) a un radio exterior de 18 mm (0.018 m) será:</p>
<div class="math-container" style="background-color: #f8f9fa; padding: 10px 20px; border-left: 4px solid #2c3e50; margin: 20px 0;">
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mi>&tau;</mi>
  <mo>=</mo>
  <msub><mi>F</mi><mi>L</mi></msub>
  <mo>&sdot;</mo>
  <msub><mi>R</mi><mi>ext</mi></msub>
</math>
<br>
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mi>&tau;</mi>
  <mo>=</mo>
  <mn>0.15</mn><mtext>&nbsp;N</mtext>
  <mo>&sdot;</mo>
  <mn>0.018</mn><mtext>&nbsp;m</mtext>
  <mo>=</mo>
  <mn>0.0027</mn>
  <mtext>&nbsp;N&middot;m</mtext>
</math>
</div>
<p>Este par motriz inicial de 2.7 mN·m acelerará el motor desde el reposo hasta que la fuerza contraelectromotriz (Fase 7) y la fricción aerodinámica equilibren el sistema termodinámico.</p>

<div style="text-align:center; margin: 40px 0;">
    <img src="Imagenes_informe/Fase_13.jpg" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" alt="Fase 13">
</div>

<div class="nota">
    <strong>Nota Final de Uso en MS Word:</strong> Para migrar este documento manteniendo la estética intacta, simplemente selecciona todo (<code>Ctrl+A</code>), cópialo (<code>Ctrl+C</code>) y pégalo directamente en un documento de <strong>Microsoft Word</strong> o en un PDF. Las imágenes insertadas se mantendrán automáticamente.
</div>


`;
    
    contenedor.innerHTML = htmlString;
}
