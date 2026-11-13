# PRUEBA AISLADA — Hit reactions y proporciones (Lucas y T-Rex)

Esta prueba es independiente de la web publicada y de cualquier trabajo en curso en `main`.

**Base congelada:** `9e4cd037b712d7e5cbad8fb29daac42becf5b406` (v52, 13 de noviembre de 2026).
**Rama:** `test-hitreactions-lucas-trex-v1`
**Página de prueba:** `preview-hitreactions-lucas-trex.html`

## Instrucciones Windows

1. En GitHub, seleccionar la rama `test-hitreactions-lucas-trex-v1` y descargar **Code → Download ZIP**.
2. Extraer **todo** el ZIP; el HTML necesita las carpetas `assets` y el resto de archivos JavaScript.
3. Ejecutar `INICIAR-PRUEBA-LUCAS-TREX.bat` (requiere Python instalado) o abrir una terminal en esa carpeta y ejecutar `py -m http.server 8765 --bind 127.0.0.1`.
4. Abrir `http://127.0.0.1:8765/preview-hitreactions-lucas-trex.html`.

No abrir el HTML con doble clic (`file://`): la extracción de sprites necesita ejecutarse a través de HTTP para poder leer los píxeles del canvas en Chrome.

## Comparación A/B

- Botón **T-REX VS LUCAS**: abre el modo local con estos dos personajes seleccionados; elegir los mandos/teclados y empezar.
- Botón **Reacciones: ACTIVADAS / ORIGINALES**: alterna en tiempo real el render experimental y el original. No cambia daño, colisiones, aturdimiento, HP, cooldowns ni reglas.
- Abrir la consola de Chrome (F12) y consultar `window.PARIPE_HITREACTION_TEST` tras cargar para ver los factores de calibración calculados.

## Cambios limitados a Lucas (ID 3) y T-Rex (ID 1)

- Cuatro reacciones diferentes: **alto** (cuello y hombros retroceden), **medio** (torso se pliega), **bajo** (rodilla y cadera ceden, usando la pose baja original) y **fuerte/especial** (retroceso corporal amplificado).
- Animación en fases: contacto inmediato, absorción, breve rebote y vuelta a guardia. Se conserva el sprite completo, el rostro original y el anclaje de los pies.
- Deformación corporal suave por bandas horizontales; el desplazamiento es continuo desde las caderas y queda fijo en la cabeza para que la cara no se estire.
- Calibración **uniforme, conservadora, ±6 %** de las poses de acción de los dos personajes, tomando de referencia su altura de pie (no modifica los demás, y no normaliza las poses de salto, caída o sentadilla).
- El bloqueo y las caídas de KO mantienen su comportamiento original.

## Archivos de esta prueba

- `preview-hitreactions-lucas-trex.html`: entrada HTML privada de la rama con selector A/B y acceso local.
- `hitreact-lucas-trex-preview-v1.js`: módulo independiente; envuelve `hit`, `drawNormalAction` y `drawSprite` únicamente dentro de esta página.
- `INICIAR-PRUEBA-LUCAS-TREX.bat`: servidor de desarrollo local para Windows.

## Limitaciones / verificación

Este es un **primer prototipo técnico**, no los 12 sprites de reacción dibujados desde cero. Usa las ilustraciones existentes y deformaciones de cuerpo completo para dar movimiento real con proporciones estables. Para máxima calidad, el siguiente paso sería sustituir los fotogramas base de daño por dibujos específicos de alto/medio/bajo/impacto fuerte.

Se comprobó que el JavaScript es sintácticamente válido, que la preview enlaza el módulo y que todos los cambios están **solo** en esta rama. **No hay todavía una prueba interactiva en Chrome ni una revisión visual cuadro por cuadro de esta build.** No mezclar en `main` antes de esa revisión.

Para comparar, probá un puñetazo alto, una patada al cuerpo, una patada baja y el especial de T-Rex; alterná el botón A/B durante la misma pelea.

## Seguridad del despliegue

GitHub Pages publica el origen configurado del repositorio, **no esta rama de test por defecto**. La URL pública normal del juego no incorpora estos cambios. No se configura ningún workflow nuevo ni se cambia ningún ajuste de Pages.
