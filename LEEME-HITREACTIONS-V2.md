# LA BATALLA DEL PARIPÉ — Beta 2: T-Rex y Lucas

Esta versión experimental se encuentra exclusivamente en la rama \`test-hitreactions-lucas-trex-v2\`.

Base: commit \`031bce22e0aa9ee8ee7aa604108987bb54d278fd\` (Work, 13/11/2026; incluye torneo local, selección con retratos e iconos, y choques entre proyectiles). No modifica \`main\` ni la beta 1.

## Jugar en Windows

1. Abrir la rama de prueba en GitHub y pulsar **Code > Download ZIP**.
2. Extraer TODO el ZIP (no extraer solo el HTML; se necesitan \`assets\` y los JS).
3. Ejecutar \`INICIAR-BETA-HITREACTIONS-V2.bat\` (requiere Python instalado) o ejecutar dentro de la carpeta \`py -m http.server 8766 --bind 127.0.0.1\`.
4. Abrir \`http://127.0.0.1:8766/preview-hitreactions-lucas-trex-v2.html\`.
5. Pulsar **T-REX VS LUCAS**, seleccionar mandos o teclado en la configuración local, y pulsar **¡A PELEAR!**.
6. Durante la pelea pulsar **REACCIONES NUEVAS / REACCIONES ORIGINALES** para comprobar el antes/después sin cambiar las reglas del juego.

También se puede entrar en Arcade contra CPU. Solo T-Rex (id 1) y Lucas (id 3) utilizan las reacciones nuevas; los demás luchadores conservan las suyas.

IMPORTANTE: el archivo \`index.html\` es el que usa GitHub Pages. Esta beta utiliza una página propia. No abrir el archivo con \`file://\`: el atlas de sprites original utiliza Canvas y necesita servidor HTTP.

## Qué cambia respecto a beta 1

- **Cuatro familias de animación diferentes**: impacto alto, al cuerpo, bajo y fuerte/especial.
- **Cinco fotogramas por familia y luchador (40 poses en total)**, precalculados al cargar el juego a partir de la ilustración original de cada luchador y conservando su rostro.
- No se hace una rotación rígida ni se desplazan bandas horizontales sin más: cada fotograma se reconstruye sobre una **malla bidimensional articulada**. Cabeza, hombros, tórax, cadera y rodillas tienen movimientos distintos; los pies quedan anclados.
- **Cuerpo consistente:** la base para las reacciones altas, medias y fuertes es la pose de pie de cada luchador, sin cambiar arbitrariamente la escala del cuerpo. La reacción baja empieza usando la pose agachada original.
- **Impacto y recuperación en fases** sincronizadas al tiempo de aturdimiento; el hitstop original se mantiene.
- **Sin parpadeo semitransparente mientras se muestra la nueva reacción**, pero la invulnerabilidad real y los datos de combate se conservan.
- Choque de proyectiles, torneo, controles, efectos, daños, hurtboxes, agarres y KO conservan las implementaciones de Work.

## Lo que NO se ha modificado

No hay cambios en los archivos existentes de \`main\`. Solo se crean nuevos archivos:
- \`hitreact-lucas-trex-v2.js\`
- \`preview-hitreactions-lucas-trex-v2.html\`
- \`INICIAR-BETA-HITREACTIONS-V2.bat\`
- \`LEEME-HITREACTIONS-V2.md\`

**Esta segunda beta usa una malla de deformación anatómica y fotogramas reconstruidos de las ilustraciones originales; no son dibujos a mano ni nuevas ilustraciones generadas por un artista.** Si las articulaciones necesitan otra forma o aparecen huecos, será necesario producir sprites nuevos dibujados específicamente para esos ataques.

## Validación

- Código fuente con sintaxis revisada.
- Se comprobará el puente con \`hit\`, \`drawNormalAction\` y \`drawFighter\`, y que el HTML incluya el torneo/proyectiles de Work.
- Falta una inspección interactiva en Chrome con mandos y una revisión visual fotograma a fotograma; esta beta no debe promoverse a \`main\` antes de esa prueba.

## Comparación recomendada

1. Un puñetazo alto de T-Rex a Lucas.
2. Una patada o golpe al cuerpo.
3. Una patada agachado.
4. La pierna voladora de T-Rex.
5. Repetir con Lucas golpeando a T-Rex.
6. Activar y desactivar las reacciones para ver la misma categoría de golpe.
