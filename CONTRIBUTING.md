# GUÍA DE CONTRIBUCIÓN

1. **Modularidad Estricta:** Ningún motor debe acoplarse con dependencias duras al núcleo.
2. **Filosofía No Lock-in:** Si un motor o proveedor cambia su API, actualiza exclusivamente su adaptador dentro de `src/engines/`.
3. **Tests Obligatorios:** Todo cambio aditivo debe contar con pruebas en `tests/` y validar `npm test` con 100% de éxito.
4. **Regla de Oro de Splinter:** Cero regresiones. Lo que ya funciona debe mantenerse intacto y retrocompatible.
