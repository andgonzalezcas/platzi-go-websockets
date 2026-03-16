# Go Websockets - Real-Time Post Feed

Este proyecto es una aplicación Full-Stack de alto rendimiento que demuestra el uso de **WebSockets** para actualizaciones en tiempo real y **scroll infinito** para una experiencia de usuario fluida.

## Tecnologías

- **Backend:** Go (compilado estáticamente con imagen `scratch`).
- **Frontend:** React + Vite (servido con NGINX).
- **Base de Datos:** PostgreSQL.
- **Infraestructura:** Docker & Docker Compose.

## Despliegue Local

La forma más sencilla de ejecutar todo el proyecto es utilizando Docker Compose. Esto levantará la base de datos, el servidor de Go y la interfaz de React automáticamente.

1. Asegúrate de tener instalado [Docker](https://docs.docker.com/get-docker/).
2. Desde la raíz del proyecto (donde está el archivo `docker-compose.yml`), ejecuta:

```bash
docker-compose up --build
```
Todo el sistema estará sincronizado y funcionando.

## Puertos y Acceso

Una vez que los contenedores estén corriendo, podrás acceder a los servicios en las siguientes direcciones:

- **Frontend (App Web):** [http://localhost:40404](http://localhost:40404)
- **Backend (API/Websocket):** [http://localhost:50505](http://localhost:50505)
- **Base de Datos (PSQL):** `localhost:54321`