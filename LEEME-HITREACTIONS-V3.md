# La Batalla del Paripé — Prueba beta 3 (Lucas y T-Rex)

## Dónde está
- Rama aislada: \`test-hitreactions-lucas-trex-v3\`
- Punto de partida: \`main\` SHA \`031bce22e0aa9ee8ee7aa604108987bb54d278fd\`
- Entrada de la prueba: \`preview-hitreactions-lucas-trex-v3.html\`
- El archivo \`index.html\` de la web publicada NO se modifica.

## Cómo jugar (Windows)

1. Descargar el ZIP completo de esta rama desde GitHub: menú **Code → Download ZIP**.
2. Extraer el ZIP a una carpeta. No mover ni abrir el HTML aislado: necesita los sprites y módulos de \`assets\`.
3. Ejecutar \`INICIAR-BETA-HITREACTIONS-V3.bat\` (Python debe estar instalado).
4. Si no se abre automáticamente, entrar a \`http://127.0.0.1:8767/preview-hitreactions-lucas-trex-v3.html\`.
5. Arriba hay tres botones: **VS CPU** para jugar como T-Rex frente a Lucas; **2 JUGADORES** para elegir teclado/mandos de PS4; y **ANIMACIONES BETA 3 / ORIGINALES** para comparar en tiempo real.
6. La etiqueta pequeña bajo los botones indica qué reacción acaba de registrar: golpe alto, medio, bajo o fuerte.

## Qué hace realmente esta beta 3

A diferencia de las dos pruebas anteriores, **NO** deforma una única imagen por bandas o una malla de píxeles. Construye secuencias específicas de reacción utilizando **poses completas de cuerpo entero ya ilustradas**: daño con brazos abiertos, guardia, pérdida de equilibrio, agachado y primer fotograma de caída.

- **Alto**: retroceso completo, apertura de brazos y recuperación.
- **Medio**: flexión y absorción del impacto, protección del torso y recuperación.
- **Bajo**: flexión marcada de rodillas y regreso a la guardia.
- **Fuerte / especial**: retroceso y pérdida de equilibrio más pronunciados; respeta los K.O. originales.

Cada categoría reproduce una secuencia de 5 momentos visuales con tiempos propios, sobre las posiciones y dimensiones de los dibujos originales.
No cambia los puntos de vida, las colisiones, las velocidades, los efectos especiales, el aturdimiento real, los agarres ni las reglas del torneo.
Se elimina SOLO durante los fotogramas experimentales el parpadeo semitransparente, sin desactivar la invulnerabilidad del luchador para la lógica del combate.

## Limitación importante

Los personajes conservan **las ilustraciones originales** de Work. Esta beta 3 organiza distintas poses completas ya existentes en nuevas secuencias, pero **NO contiene aún 40 ilustraciones nuevas dibujadas específicamente** para recibir golpes. Para esa calidad definitiva habrá que crear sprites adicionales con las mismas caras, ropa y escala, y reemplazar aquí las referencias a las poses existentes.

Esta distinción es importante al evaluar cuánto mejoró realmente la naturalidad.

## Estado de verificación

Se valida la sintaxis, la ruta de carga y que las modificaciones solo crean cuatro archivos en una rama nueva. No se ha comprobado todavía en una partida real en Chrome con los mandos PS4. Antes de pasar cualquier mejora a \`main\`, hay que grabar un vídeo corto con golpes altos, medios, bajos y especiales y comprobar continuidad/proporciones.

## Compatibilidad

La rama deriva de la versión de Work con torneo local, selector con retratos y choque de proyectiles. Esas funciones conservan sus scripts y archivos originales.
