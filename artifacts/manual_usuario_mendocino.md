# Manual de Usuario Avanzado y Fundamentos Teóricos: Simulador de Motores Mendocino

Este manual constituye la guía definitiva para comprender no solo el manejo del **Simulador de Motores Mendocino**, sino también los profundos principios físicos y matemáticos que rigen cada uno de sus cálculos. Está diseñado para estudiantes, ingenieros y entusiastas que deseen profundizar en la electrodinámica, la mecánica y la geometría aplicada a este fascinante motor solar levitado.

---

## 1. Introducción Teórica al Motor Mendocino

El motor Mendocino es una máquina eléctrica que destaca por dos características singulares: **levitación magnética pasiva** y **conmutación óptica pasiva**. 
A diferencia de los motores convencionales que utilizan escobillas mecánicas o conmutadores electrónicos (controladores brushless), el motor Mendocino utiliza paneles solares montados en el propio rotor. La luz incidente (por ejemplo, el sol) activa únicamente el panel que se encuentra iluminado en ese instante. Este panel inyecta corriente en la bobina diametralmente opuesta, generando un campo electromagnético que interactúa con un imán permanente situado en la base, produciendo el par motriz. Al girar, un nuevo panel entra en la zona de luz, conmutando la corriente de forma continua y natural.

Para minimizar la fricción y permitir que potencias tan diminutas (del orden de milivatios) logren hacer girar el sistema, el rotor levita gracias a la repulsión de imanes permanentes de Neodimio situados en sus extremos. Sin embargo, por el **Teorema de Earnshaw**, la levitación magnética pasiva estática es inestable en al menos un eje, por lo que el motor requiere un levísimo punto de apoyo mecánico en uno de sus extremos (normalmente un cristal o espejo) para estabilizar el eje longitudinal.

El **Simulador de Motores Mendocino** virtualiza todos estos fenómenos mediante cálculo matricial y simulación por elementos finitos (a través de la librería científica Magpylib), permitiendo iterar diseños sin gastar material real.

---

## 2. Desglose Teórico y Operativo de las Fases del Simulador

A continuación, se describe con exhaustividad cada una de las fases de la herramienta.

### Fase 1: Ensayo de Placas Solares (Fuente de Energía)
El motor no se conecta a una red; su única fuente de energía son las células fotovoltaicas. Las células solares no son fuentes de tensión ni de corriente ideales, sino que operan bajo una **curva característica I-V** no lineal.
- **Concepto Físico:** En esta fase, el usuario introduce datos empíricos de tensión (V) e intensidad (I) obtenidos bajo iluminación constante.
- **Cálculo:** El simulador realiza una interpolación polinómica o spline para trazar la curva. Se halla el punto donde el producto $P = V \times I$ es máximo (Punto de Máxima Potencia o MPP). Esta potencia es el límite termodinámico de la fuerza que el motor podrá ejercer.

`[IMAGEN: Captura de pantalla de la gráfica de ensayo de placas solares]`

### Fase 2: Geometría del Motor (Mecánica Estructural)
El rotor de un motor Mendocino tiene forma de prisma poligonal regular, dictado por el número de paneles solares ($N$).
- **Concepto Teórico:** Un diseño de 4 caras (cuadrado) es común, pero configuraciones de 6 caras (hexágono) u 8 caras (octógono) ofrecen un par motriz más suave (menor "ripple" o rizado de torque) a expensas de mayor peso y menor área útil por cara.
- **Trigonometría Poligonal:** Si la placa tiene una anchura $W$, para que $N$ placas formen un prisma cerrado sin solaparse, el radio exterior del rotor (Circunradio $R$) debe ser exactamente:
  $$ R = \frac{W}{2 \cdot \sin(\frac{180^\circ}{N})} $$
- El simulador genera dinámicamente un modelo SVG de esta sección transversal, ubicando el centro de gravedad inicial.

`[IMAGEN: Captura de la geometría del rotor generada (Ej. polígono de 6 caras)]`

### Fase 3: Devanados (Electromagnetismo Circuital)
El motor basa su empuje en la Fuerza de Lorentz, la cual requiere corriente eléctrica viajando por espiras conductoras.
- **Concepto Teórico:** El espacio físico entre las caras del prisma y el eje interno delimita la "ventana de bobinado". El hilo de cobre esmaltado ocupa espacio no solo por su metal, sino por el esmalte y el aire intersticial (Factor de Llenado, $\approx 0.6$).
- **Resistencia y Masa:** A mayor diámetro del hilo, menor resistencia (mayor corriente, más fuerza), pero menor cantidad de espiras (menor fuerza) y mayor masa (más peso, difícil de levitar). El simulador calcula la resistencia usando la ley de Pouillet: $R = \rho \frac{L}{S}$, cruzándolo con la tensión de la placa para hallar la corriente real.

### Fase 4 y 5: Levitación e Interacción Magnética (Estática)
- **Concepto Teórico:** Se emplea la ley de fuerzas dipolares magnéticas. Los imanes de sustentación (en la bancada) repelen a los imanes del rotor.
- **Cálculo Avanzado:** El simulador ejecuta un algoritmo de **Búsqueda Binaria**. Mueve iterativamente el rotor en el eje Z virtual, calculando la fuerza repulsiva ascendente $F_z$ en cada milímetro. El punto exacto de levitación se encuentra cuando $\sum F_z = m_{total} \cdot g$. Si el peso excede la capacidad magnética, el simulador alerta de que el rotor caerá físicamente.

`[IMAGEN: Visor de Levitación Magnética mostrando los vectores de fuerza ascendente]`

### Fase 6: Interacción Lumínica (Conmutación Óptica)
- **Geometría de Sombras:** Cuando la luz incide desde arriba (ej. a 90º), no todos los paneles se iluminan por igual. En un hexágono, un panel puede estar perpendicular al sol (100% de eficiencia), mientras los adyacentes están a 60º (eficiencia reducida por el coseno del ángulo de incidencia). Las esquinas del polígono proyectan sombras. El simulador integra estas áreas efectivas para determinar la corriente inyectada en cada instante $\theta$ del giro.

### Fase 7: FCEM y Velocidad (Dinámica de Fluidos y Electromagnetismo)
- **Fuerza Contraelectromotriz (FCEM):** Según la Ley de Faraday, cuando la bobina gira dentro del campo magnético del imán base, se induce una tensión que *se opone* a la tensión de la placa solar. $E_{inducido} = - \frac{d\Phi}{dt}$.
- **Velocidad Límite:** El motor acelerará hasta que la tensión inducida (FCEM) más las pérdidas por fricción aerodinámica igualen la tensión de la placa solar. El simulador estima estas revoluciones por minuto (RPM) máximas teóricas.

### Fase 8 y 9: Par Motriz y Simulación Global (Magpylib en 3D)
Aquí reside el núcleo de cálculo numérico de la aplicación.
- **Método Científico:** La librería Magpylib en el backend segmenta cada espira en cientos de pequeños vectores $\vec{dl}$. Para cada segmento, aplica la ecuación de fuerza de Lorentz $d\vec{F} = I (\vec{dl} \times \vec{B})$, donde $\vec{B}$ es el campo magnético vectorial exacto generado por los imanes permanentes en ese punto del espacio (calculado integrando modelos de cargas magnéticas superficiales).
- **Simulación Global:** La Fase 9 integra todo. Ya no solo calcula la fuerza motriz del imán inductor, sino la interacción parásita de los campos magnéticos de los imanes de *levitación* sobre las bobinas, calculando el "frenado magnético" indeseado.

`[IMAGEN: Espectacular Visor 3D Interactivo de la Simulación Global]`

### Fase 10 y 11: Conexionado y Equilibrado de Masas
- Si el rotor es asimétrico en masa (incluso por unos pocos gramos debido a variaciones en el cobre o en el adhesivo), el Centro de Masas (CM) se desplaza del eje de rotación.
- **Gravedad Pendular:** Al dejar el motor libre, buscará su posición de mínima energía potencial, girando como un péndulo hasta dejar la cara más pesada hacia abajo. El simulador dibuja la desviación de este CM geométricamente.

`[IMAGEN: Diagrama SVG transversal del Equilibrado de Masas]`

---

## 3. ESTUDIO ANALÍTICO DESARROLLADO: "6 Caras - Placas 53x18x2 - Hilo 0,315"

A petición del usuario, desarrollaremos paso a paso, con rigor matemático, los números detrás de un diseño característico que ya se encuentra como modelo público en la base de datos de la calculadora.

### 3.1. Especificaciones del Modelo Físico
- **Rotor ($N$)**: 6 caras (Hexagonal).
- **Paneles Solares**: Longitud $L_p = 53$ mm, Anchura $W_p = 18$ mm, Grosor $T_p = 2$ mm.
- **Hilo Conductor**: Diámetro del conductor $d_{cu} = 0.315$ mm (esmalte despreciable para cálculos gruesos).

### 3.2. Geometría Hexagonal (Cálculo Espacial)
Debemos saber qué diámetro tendrá la carcasa poligonal interior para que las placas asienten perfectamente sobre ella.
Para un polígono de 6 caras, el ángulo central subtendido por cada lado es $\alpha = \frac{360^\circ}{6} = 60^\circ$.

El circunradio (distancia del centro a los vértices) para que las placas encajen se calcula con:
$$ R_{circ} = \frac{W_p}{2 \cdot \sin(30^\circ)} = \frac{18}{2 \cdot 0.5} = 18 \text{ mm} $$
Por tanto, el **diámetro exterior máximo de las placas será de 36 mm**.
La apotema (distancia del centro a la placa) es:
$$ Apotema = R_{circ} \cdot \cos(30^\circ) = 18 \cdot 0.866 \approx 15.58 \text{ mm} $$
Si el eje central de acero/aluminio tiene 6 mm de diámetro ($r_{eje} = 3$ mm), la **profundidad de la ventana de bobinado** disponible por cara es $15.58 - 3 = 12.58 \text{ mm}$.

### 3.3. Estudio de Masas (Gravitatorio)
El peso total es vital para saber si los imanes repulsivos podrán soportar el rotor.
- **Volumen de 1 Placa**: $53 \text{ mm} \times 18 \text{ mm} \times 2 \text{ mm} = 1908 \text{ mm}^3$.
- Asumiendo una densidad del panel encapsulado (vidrio/silicio) de $\rho \approx 2.5 \text{ g/cm}^3$ (o $0.0025 \text{ g/mm}^3$):
  - Peso 1 placa $= 1908 \times 0.0025 \approx 4.77$ gramos.
  - Peso de las 6 placas $= 6 \times 4.77 = 28.6$ gramos.
- Si sumamos un eje estándar de 150 mm de longitud y 6 mm de diámetro en aluminio ($\approx 11$ g) y la carcasa plástica (PLA, $\approx 10$ g), el peso estructural antes del bobinado ronda los **50 gramos**.

### 3.4. Electromagnetismo (Devanados y Resistencia)
Utilizamos hilo de cobre estandarizado de $0.315$ mm de diámetro.
- **Sección Transversal ($S$)**: 
  $$ S = \pi \cdot \left(\frac{d_{cu}}{2}\right)^2 = \pi \cdot \left(\frac{0.315}{2}\right)^2 \approx 0.0779 \text{ mm}^2 $$
- **Resistencia por Metro Lineal ($R_L$)**:
  La resistividad del cobre puro a 20ºC es $\rho = 0.0171 \, \Omega\cdot\text{mm}^2/\text{m}$.
  $$ R_L = \frac{0.0171}{0.0779} \approx 0.219 \, \Omega/\text{metro} $$
- **Longitud Media de Espira ($L_m$)**:
  Cada espira cruza el rotor a lo largo (53 mm), baja por el frente (diámetro $\approx 36$ mm), vuelve por la cara opuesta (53 mm) y sube (36 mm).
  $$ L_m = 2 \cdot 53 + 2 \cdot 36 = 106 + 72 = 178 \text{ mm} = 0.178 \text{ m} $$
- Si el espacio admite **100 espiras** por bobina diametral:
  La longitud total del hilo en una bobina es $100 \times 0.178 = 17.8$ metros.
  - **Masa de Cobre Añadida**: Densidad Cu = $8.96 \text{ g/cm}^3$. Masa = $17.8 \text{ m} \times 0.0779 \text{ mm}^2 \times 8.96 \text{ g/cm}^3 \approx 12.4$ gramos por bobina.
  - **Resistencia de la Bobina ($R_b$)**: $17.8 \text{ m} \times 0.219 \, \Omega/\text{m} = 3.9 \, \Omega$.

### 3.5. Interacción Lumínica y Eléctrica
Al recibir radiación solar directa (ej. $1000 \text{ W/m}^2$), asumamos que el ensayo de la fase 1 determinó que la placa opera a $V = 1.2 \text{ V}$ con una corriente $I_p$ disponible.
Por la ley de Ohm (si el motor está frenado, en arranque):
$$ I_{arranque} = \frac{V}{R_b} = \frac{1.2 \text{ V}}{3.9 \, \Omega} \approx 0.307 \text{ Amperios (307 mA)} $$
*Nota: Si la placa solo puede suministrar 200 mA en cortocircuito (Isc), el panel "caerá" su tensión para adaptarse a la carga. Asumiremos $I = 200 \text{ mA}$.*

### 3.6. Cálculo del Par Motriz Teórico (Fuerza de Lorentz)
El momento de fuerza o Par ($\tau$) que hará rotar el motor depende de la intensidad total, la longitud activa que está bajo influencia magnética, el campo del imán y la distancia al eje (brazo de palanca).

- Corriente total del paquete (Amperios-Vuelta): $N_{esp} \times I = 100 \times 0.2 \text{ A} = 20 \text{ A} \cdot \text{vueltas}$.
- Supongamos que el imán permanente de la base genera un campo perpendicular magnético intenso promedio de $B = 0.15 \text{ Teslas}$ a la altura de la bobina inferior.
- Longitud activa de los hilos frente al imán (solo cuenta el recorrido longitudinal frente al polo): asumamos $L_{act} = 50 \text{ mm} = 0.05 \text{ m}$.

Fuerza de Lorentz empujando tangencialmente la bobina:
$$ F = I_{total} \times L_{act} \times B = 20 \times 0.05 \times 0.15 = 0.15 \text{ Newtons} $$

Dado que la bobina inferior está a una distancia aproximada del radio exterior ($R = 18 \text{ mm} = 0.018 \text{ m}$) desde el eje de rotación:
$$ \text{Par Motriz } (\tau) = F \times R = 0.15 \text{ N} \times 0.018 \text{ m} = 0.0027 \text{ N}\cdot\text{m} \text{ (2.7 mN}\cdot\text{m)} $$

Este par de $2.7 \text{ mN}\cdot\text{m}$ debe vencer la minúscula fricción de rodadura del tope mecánico de cristal y la resistencia aerodinámica. Al ser la fricción magnética casi nula, el motor acelera rápidamente. Magpylib en la **Fase 8 y 9** se encarga de integrar esto en 3D para evitar las aproximaciones groseras ("promedios de B") que acabamos de hacer algebraicamente, proporcionando una asombrosa precisión científica final.

---
> [!NOTE]
> Este documento ha sido estructurado siguiendo estándares de redacción técnica. Puede ser copiado íntegramente a un procesador de textos como Microsoft Word; los formatos de negrita, tablas e índices se mantendrán. Recuerde reemplazar las líneas marcadas como `[IMAGEN: ...]` por sus propias capturas de la aplicación para finalizar su guía de usuario profesional.
