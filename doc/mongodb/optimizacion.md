# Evidencia de optimización de MongoDB

Prueba local del 27 de noviembre de 2026 con MongoDB Community 9.0.8 y mongosh 2.14.1. La base dedicada contenía 50 002 sesiones, de las cuales 959 correspondían al intervalo del 1 al 8 de junio de 2026 en UTC, con el extremo final excluido.

Se ejecutó la misma agregación de consumo tres veces por plan, alternando un recorrido de colección con el índice compuesto `sessions_consumption`. Ambos planes se forzaron mediante `hint`. Los valores de tiempo provienen de `executionStats.executionTimeMillis`.

| Plan | Tiempos (ms) | Documentos examinados por ejecución | Claves examinadas por ejecución |
| --- | --- | ---: | ---: |
| Recorrido de colección | 25, 24, 23 | 50 002 | 0 |
| Índice de consumo | 1, 2, 1 | 0 | 959 |

El índice acotó el rango por fecha y aportó los campos usados por la agregación sin leer documentos. La carga replica una sesión sintética para medir ese patrón de acceso. Los tiempos corresponden a esta prueba local.

- [Planes completos de las seis ejecuciones](planes-consumo.txt)
- [Procedimiento para reproducir la prueba](../../README.md#comparación-del-índice-de-consumo)
