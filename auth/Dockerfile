# Stage 1: builder
FROM golang:1.24-alpine3.22 AS builder
WORKDIR /app

# Cache deps
COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o auth_service ./cmd/auth

FROM alpine:3.19
WORKDIR /app

RUN apk add --no-cache ca-certificates

COPY --from=builder /app/auth_service .

EXPOSE 5000

CMD ["./auth_service"]
