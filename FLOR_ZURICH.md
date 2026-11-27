# Flor Rubia — Súper EX «¡DETENIDA EN ZÚRICH!»

**Personaje:** Flor Rubia, índice 7 del elenco original.
**Modo:** campaña, arena de práctica y VS local (el online aún no sincroniza cinemáticas).
**Ataque normal:** *Paletazo* sigue existiendo, sin reemplazos.
**Gasto:** barra EX al 100 %; en práctica puede ejecutarse sin llenar barra.

## Secuencia cinematográfica

1. **0–35:** aeropuerto alpino de Zúrich. Carteles en alemán/inglés, banderas
   suizas, pista, avión en movimiento, ventanales, mostradores, llegada de Flor
   con una valija. Dos agentes de POLIZEI se acercan.
2. **35–75:** «Madame, contrôle de sécurité». Los policías detienen a Flor.
3. **75–145:** abren la valija; aparecen perfumes, secador, fernet y queso.
   Flor protesta: «¡Yo no hice nada!» y «¡Pero si esto en Argentina se puede!».
4. **145–169:** señala al adversario real: «¡ÉL FUE!».
5. **169–290:** el rival resuelve **tres controles cronometrados de pasaporte**
   pulsando, por separado, **GOLPE (□), PATADA (△) y ESPECIAL (○)**.
   Los indicadores en pantalla señalan qué entrada se pide en cada puesto.
6. **290–380:** los agentes toman una decisión según la defensa:
   - **Perfecta (3/3):** verifican el pasaporte del rival, lo liberan y arrestan
     **a Flor**, que protesta «¡PERO OTRA VEZ YO, BOLUDO!».
   - **Parcial (1/3 o 2/3):** el rival supera la revisión, pero una valija
     expulsada por la cinta transportadora lo golpea de refilón.
   - **Fallida (0/3):** introducen al rival en una valija marcada **DEPORTADO**,
     que vuela por la cinta de equipaje y explota contra el suelo del combate.
7. **380–432:** remate visual, sello de pasaporte, impacto y salida de la
   cinemática; se restaura el escenario real.

La animación de Flor usa **el SpriteAtlas original del personaje**: no
se generó un rostro ni un cuerpo sustituto. El adversario también mantiene su
sprite real, incluyendo reacciones de golpe. Los policías y el aeropuerto son
sprites vectoriales de Canvas precalculados por \`flor-airport-art-v1.js\`.

## Defensa de pasaporte

Entradas cronometradas (tiempo interno de la cinemática):

| Control | Centro | Entrada | PS4 | Teclado jugador 1 | Teclado jugador 2 |
|---|---:|---|---|---|---|
| 1 | 188 | Golpe | □ | J | Z |
| 2 | 229 | Patada | △ | K | X |
| 3 | 269 | Especial | ○ | Espacio / L | C |

Cada pulsación tiene una ventana de **±12 unidades** de cinemática.
La entrada se obtiene desde \`humanInput\`, igual que cualquier ataque:
mandos PS4/PS5 compatibles, Joy-Con individuales, teclado o botones táctiles.
Mantener presionado un botón no completa varios pasos. Pulsar dos acciones
simultáneamente o una incorrecta **hace fallar el control correspondiente**.

- **3 correctos:** defensa perfecta, **0 % de daño**. Los policías esposan a Flor.
- **1 o 2 correctos:** defensa parcial, **24 % de la vida máxima** del rival.
- **0 correctos:** defensa fallida, **48 % de la vida máxima** del rival.

La defensa no se ejecuta por la CPU; así funciona el sistema actual de otros
super especiales. Cuando no existe adversario real durante una prueba, la
cinemática muestra un luchador de entrenamiento sin modificar la vida del juego.

## Integración técnica

- \`flor-airport-art-v1.js\`: escena, atlas policial de distintas poses, efectos,
  cinta de equipaje, valijas, controles e indicaciones de pasaporte.
- \`flor-super-v1.js\`: fases, animaciones, impactos, audio opcional, reinicio,
  cómputo de daño y registro \`SUPER_MANAGER.register({fighterId:7,key:'flor',...})\`.
- \`super-defense-v1.js\`: \`SEQ.flor\`, seguimiento de los tres controles,
  detección de errores y textos específicos del minijuego.
- \`training-special-controls-v1.js\`: detecta el súper automáticamente por
  registro y conserva «especial normal» y «súper EX» como acciones separadas.
- \`game.css\`: aura del botón Súper EX de Flor.
- \`tests/flor-super.test.mjs\`: rutas de derrota, defensa parcial/perfecta,
  captura de Flor, daños, sprites reales y recorrido de toda la animación.
- \`tests/controls.test.mjs\`: controles de pasaporte PS4, Joy-Con, táctil,
  teclado del jugador 2 y entradas erróneas.

**Nota:** la escena es una parodia de ficción para el juego entre amigos. No
representa ni afirma detalles de un expediente policial real.

Para verificar la implementación: ejecutar \`npm test\` y comprobar los tres
desenlaces en un navegador con los controles físicos correspondientes.

## V2 — cinematic art upgrade

- `flor-airport-art-v2.js`: two **separately illustrated Swiss police sprites** with distinct faces, uniforms, gestures and dynamic pose animation. The actors are cached as high-detail vector images and only decoded once; pose fallback remains available.
- Painted airport terminal with mountains, windows, distant travelers, reflected tile floor and moving runway traffic.
- `flor-airport-props-v2.js`: shaded X-ray scanner, three-dimensional moving conveyor, illustrated passport, perfume, hairdryer, fernet and cheese. Fully self-contained SVG/data images, with no external hosts.
- Flor and rival still use the original `SpriteAtlas` so facial identity and on-screen sizes remain stable. Camera zoom, comic action rays, animated impact particles and improved police choreography now match the game's EX visual language.
- The three QTE endings, 48/24/0% damage and timings are **unchanged**. Loading errors automatically fall back to the original V1 art.
