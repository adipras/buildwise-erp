# Dockerfile production — multi-stage build
FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o bin/buildwise ./cmd/main

FROM alpine:3.19
RUN apk add --no-cache tzdata ca-certificates
WORKDIR /app
COPY --from=builder /app/bin/buildwise .
EXPOSE 8080
CMD ["./buildwise"]
