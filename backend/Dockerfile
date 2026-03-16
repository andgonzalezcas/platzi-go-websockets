# 1. Etapa de Construcción (Builder)
ARG GO_VERSION=1.24-alpine
FROM golang:${GO_VERSION} AS builder

# Instalamos dependencias de sistema necesarias para la construcción
RUN apk add --no-cache git ca-certificates && update-ca-certificates

# Creamos un usuario sin privilegios para que el contenedor no corra como root
# Lo hacemos aquí para poder copiar los archivos /etc/passwd y /etc/group después
RUN adduser -D -g '' appuser

WORKDIR /src

# Gestionamos módulos por separado para aprovechar la caché de capas de Docker
COPY ./go.mod ./go.sum ./
RUN go mod download

# Copiamos el resto del código
COPY ./ ./

# Compilación optimizada:
# - CGO_ENABLED=0 para que sea un binario estático puro (necesario para scratch)
# - ldflags "-s -w" para eliminar tablas de símbolos y reducir peso (~25-30% menos)
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w" \
    -o /app/platzi-rest-ws .

# 2. Etapa Final: Imagen Minimalista (Scratch)
# 'scratch' es la imagen más pequeña posible (0 MB de base)
FROM scratch AS runner

# Copiamos los certificados necesarios para conexiones HTTPS/Websockets seguras
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copiamos la información de usuario para poder ejecutar la app sin root
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /etc/group /etc/group

# Copiamos el archivo .env (tu main.go lo requiere al inicio)
COPY .env ./

# Copiamos el binario compilado desde la etapa anterior
COPY --from=builder /app/platzi-rest-ws /platzi-rest-ws

# Cambiamos al usuario sin privilegios por seguridad
USER appuser

# Exponemos el puerto definido en tu .env
EXPOSE 5050

# Punto de entrada
ENTRYPOINT ["/platzi-rest-ws"]
