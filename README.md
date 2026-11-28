# sid-polyglot-project
## MongoDB de prueba

Desde la raíz del repositorio, usa MongoDB 5.0 o superior y mongosh.
Ejecuta cada paso en orden y detente si aparece un error.

```powershell
$mongoUri = 'mongodb://localhost:27017/cineconecta_test'
mongosh $mongoUri --file src/mongo/collections.js
mongosh $mongoUri --file src/mongo/indexes.js
# Configura CINECONECTA_TEST_ADMIN_HASH con un hash Argon2id o bcrypt de prueba.
mongosh $mongoUri --file src/mongo/seed.js
mongosh $mongoUri --file src/mongo/verify.js
mongosh $mongoUri --file src/mongo/examples.js
```

Ejecuta la carga dos veces para comprobar que no duplica documentos.
Los identificadores relacionales son provisionales hasta alinear la carga con Oracle.

Para optimizar el informe de consumo, ejecuta la misma agregación del ejemplo
sobre los mismos datos y rango de fechas en una base de prueba dedicada.
Compara explain("executionStats") con un recorrido de colección y con el índice
sessions_consumption. Registra el volumen, documentos y claves examinados,
plan y tiempo de ejecución de varias repeticiones.

### Comparación del índice de consumo

Usa una base dedicada. Repite los pasos de colecciones, índices y carga
en `mongodb://localhost:27017/cineconecta_benchmark`. Luego ejecuta:

```powershell
mongosh 'mongodb://localhost:27017/cineconecta_benchmark' --file src/mongo/benchmark.js
```

El script agrega 50 000 sesiones sintéticas y compara tres veces el recorrido
de colección con el índice sobre el mismo rango de fechas. La actividad
sintética replica una sesión de prueba para medir el filtro y la agregación
en MongoDB. Sus fechas sirven para la medición y deben mantenerse en la base
dedicada. Guarda la salida para interpretar los resultados.
