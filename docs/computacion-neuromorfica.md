# Curso Intensivo: Computación Neuromórfica

La **Computación Neuromórfica** es un paradigma de diseño de hardware y software que emula la arquitectura física y el funcionamiento bioeléctrico del cerebro humano, procesando información mediante impulsos eléctricos (*spikes*) asíncronos para lograr eficiencias energéticas órdenes de magnitud superiores a la arquitectura convencional.

---

## Módulo 1: El Cuello de Botella de Von Neumann

Las computadoras modernas (CPUs y GPUs) separan físicamente la unidad de procesamiento de la memoria. Transferir datos constantemente entre la memoria RAM y el procesador consume la mayor parte de la energía y tiempo del sistema (el llamado *cuello de botella de Von Neumann*).

```
Arquitectura Tradicional:  [ Memoria ] <== Bus de Datos (Consumo Alto) ==> [ Procesador ]
Arquitectura Neuromórfica:  [ Neurona + Memoria Local ] === Interconexión Asíncrona ===> [ Neurona + Memoria Local ]
```

### Comparativa de Paradigmas

| Característica | Computación Tradicional (Von Neumann) | Computación Neuromórfica |
| --- | --- | --- |
| **Estructura** | Procesador y memoria separados | Memoria (sinapsis) y cómputo (neurona) coubicados |
| **Reloj** | Sincrónico (frecuencia de reloj fija) | Asincrónico (event-driven, impulsado por eventos) |
| **Procesamiento** | Operaciones matemáticas continuas secuenciales/paralelas | Redes de impulsos dispersos (*sparse spikes*) |
| **Consumo Energético** | Elevado (decenas a cientos de vatios) | Ultrabajo (miliwatts a microwatts) |

---

## Módulo 2: Redes Neuronales de Impulsos (SNNs)

A diferencia de las redes neuronales artificiales de aprendizaje profundo (ANNs) que utilizan valores numéricos continuos (como $0.85$ o $-1.2$), las **Spiking Neural Networks (SNNs)** operan en el dominio temporal.

* **Potencial de Membrana:** Cada neurona artificial mantiene un voltaje interno $V(t)$ que se acumula con las entradas recibidas.
* **Umbral de Disparo ($\theta$):** Cuando $V(t) \ge \theta$, la neurona emite un impulso discreto (*spike*) a sus vecinas y reinicia su voltaje a un valor base.
* **Codificación por Tiempo:** La información no reside en la intensidad del número, sino en el **momento exacto** y la **frecuencia** de los impulsos. Si no hay cambios en la entrada, las neuronas no consumen energía.

---

## Módulo 3: Sensores Event-Based y Hardware Dedicado

Para aprovechar al máximo el hardware neuromórfico, los datos de entrada deben capturarse en formato de eventos.

### Cámaras de Eventos (Dynamic Vision Sensors - DVS)

Una cámara tradicional captura fotogramas completos (ej. 60 FPS), procesando todos los píxeles independientemente de si cambiaron o no.

* Una cámara DVS monitorea cada píxel de forma independiente.
* Solo transmite un paquete de datos cuando la luminancia en un píxel cambia en una magnitud mayor a un umbral determinado ($\Delta I > \theta$).
* **Resultado:** Latencia de microsegundos, rango dinámico masivo y reducción drástica en el volumen de datos.

### Chips Neuromórficos Destacados

1. **Intel Loihi 2:** Diseñado con 1 millón de neuronas programables por chip, permite aprendizaje continuo en el dispositivo (*on-chip learning*).
2. **BrainChip Akida:** Orientado a procesamiento de IA en dispositivos de borde (*Edge AI*) sin conexión a la nube.
3. **SpiNNaker:** Supercomputadora neuromórfica capaz de simular redes biológicas a escala en tiempo real.

---

## Módulo 4: Desafíos y Estado del Arte

A pesar de sus ventajas revolucionarias en consumo de energía, la computación neuromórfica enfrenta retos estructurales:

1. **Ausencia de Backpropagation Directo:** Dado que las funciones de disparo por impulsos son discontinuas (no derivables), el algoritmo estándar de propagación hacia atrás no se aplica directamente.
2. **Métodos de Entrenamiento Alternativos:**
   * **Surrogate Gradients:** Aproximación de la derivada del impulso durante el entrenamiento.
   * **STDP (Spike-Timing-Dependent Plasticity):** Regla de aprendizaje biológico donde la fuerza sináptica cambia según la correlación temporal entre el disparo de la neurona presináptica y la postsináptica.

### Aplicaciones de Impacto Inmediato

* **Procesamiento en el Espacio y Drones:** Detección de colisiones a ultra-alta velocidad con baterías diminutas.
* **Interfaces Cerebro-Computadora (BCI):** Decodificación de señales neuronales biológicas en tiempo real debido a la compatibilidad del lenguaje de impulsos.
* **Robótica Autónoma:** Control motor adaptable y reactivo sin sobrecalentamiento informático.

---

# Plasticidad Dependiente del Tiempo de Disparo (STDP)

La **STDP (Spike-Timing-Dependent Plasticity)** es una regla de aprendizaje biológico no supervisado donde el peso de una conexión sináptica $w$ se actualiza según la diferencia temporal milimétrica entre el disparo de la neurona presináptica ($t_{\text{pre}}$) y la neurona postsináptica ($t_{\text{post}}$).

Refina el principio de Hebb (*"las neuronas que se activan juntas, se conectan"*), introduciendo la **causalidad temporal**.

---

## 1. Principio Fisiológico

* **Causalidad (LTP - Potenciación a Largo Plazo):** Si la neurona presináptica dispara **antes** que la postsináptica, significa que contribuyó a provocar el disparo. La conexión se fortalece ($\Delta w > 0$).
* **Acausalidad (LTD - Depresión a Largo Plazo):** Si la neurona presináptica dispara **después** que la postsináptica, su impulso no tuvo impacto funcional. La conexión se debilita ($\Delta w < 0$).

---

## 2. Modelo Matemático Formal

La diferencia de tiempo entre los disparos se define como:

$$\Delta t = t_{\text{post}} - t_{\text{pre}}$$

La versión clásica exponencial y asimétrica de la STDP modela la variación del peso $\Delta w$ mediante la función por partes:

$$\Delta w = \begin{cases} A_+ \exp\left(-\frac{\Delta t}{\tau_+}\right) & \text{si } \Delta t > 0 \quad (\text{Potenciación / LTP}) \\ -A_- \exp\left(\frac{\Delta t}{\tau_-}\right) & \text{si } \Delta t < 0 \quad (\text{Depresión / LTD}) \end{cases}$$

### Parámetros del Modelo

* $A_+$ y $A_-$: Amplitudes máximas de modificación del peso para potenciación y depresión, respectivamente.
* $\tau_+$ y $\tau_-$: Constantes de tiempo de descomposición (típicamente entre 10 ms y 20 ms), que determinan la ventana temporal de plasticidad.

```
       Δw (Cambio de Peso)
        ▲
        │       * (A+)
   LTP  │      *
(Gana)  │    *
        │  *
────────┼─────────────► Δt = t_post - t_pre (ms)
        │ *
   LTD  │   *
(Pierde)│     *
        │       * (-A-)
```

---

## 3. Ejemplo Numérico Paso a Paso

Supongamos una sinapsis con las siguientes condiciones iniciales:

* Peso inicial: $w = 0.500$
* Amplitud de potenciación: $A_+ = 0.100$
* Amplitud de depresión: $A_- = 0.120$ (es habitual que $A_- > A_+$ para evitar la saturación de los pesos)
* Constantes de tiempo: $\tau_+ = \tau_- = 20\text{ ms}$

---

### Caso A: Potenciación a Largo Plazo (Causal)

* Disparo presináptico: $t_{\text{pre}} = 100\text{ ms}$
* Disparo postsináptico: $t_{\text{post}} = 105\text{ ms}$

**1. Calcular la diferencia de tiempo:**

$$\Delta t = 105 - 100 = +5\text{ ms}$$

Como $\Delta t > 0$, aplicamos la ecuación de LTP:

$$\Delta w = 0.100 \cdot \exp\left(-\frac{5}{20}\right) = 0.100 \cdot \exp(-0.25) \approx 0.100 \cdot 0.7788 = +0.0779$$

**2. Actualizar el peso sináptico:**

$$w_{\text{nuevo}} = w_{\text{actual}} + \Delta w = 0.5000 + 0.0779 = 0.5779$$

La sinapsis se ha fortalecido un **15.58%**.

---

### Caso B: Depresión a Largo Plazo (Acausal)

* Disparo presináptico: $t_{\text{pre}} = 200\text{ ms}$
* Disparo postsináptico: $t_{\text{post}} = 180\text{ ms}$

**1. Calcular la diferencia de tiempo:**

$$\Delta t = 180 - 200 = -20\text{ ms}$$

Como $\Delta t < 0$, aplicamos la ecuación de LTD:

$$\Delta w = -0.120 \cdot \exp\left(\frac{-20}{20}\right) = -0.120 \cdot \exp(-1) \approx -0.120 \cdot 0.3679 = -0.0441$$

**2. Actualizar el peso sináptico:**

$$w_{\text{nuevo}} = w_{\text{actual}} + \Delta w = 0.5779 - 0.0441 = 0.5338$$

La sinapsis se ha debilitado debido a la falta de causalidad.

---

## 4. Implementación Local en Hardware Neuromórfico

En hardware (como memristores o chips neuromórficos CMOS), calcular y almacenar los tiempos exactos de disparo de todas las neuronas requiere demasiada memoria. Para solucionarlo, se utilizan **variables de traza** que se actualizan localmente.

Cada neurona $i$ mantiene una traza de actividad $x_i(t)$ que decae exponencialmente:

$$\frac{dx_i}{dt} = -\frac{x_i}{\tau_+} + \sum_{t_i^k} \delta(t - t_i^k)$$

Cuando ocurre un disparo presináptico, la traza sube a $1$ y decae en el tiempo. Si la neurona postsináptica dispara mientras la traza $x_i(t)$ aún tiene un valor positivo, el peso se actualiza proporcionalmente al nivel de la traza en ese instante preciso:

$$\Delta w \propto x_i(t_{\text{post}})$$

Esto permite actualizar los pesos de forma puramente **local** y en **tiempo real**, eliminando la necesidad de algoritmos de retropropagación global (*backpropagation*).
