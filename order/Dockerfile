FROM golang:1.24.4 AS builder

WORKDIR /app

COPY go.mod ./
COPY go.sum ./
RUN go mod download

COPY . .
RUN go build -o order-service

FROM gcr.io/distroless/base-debian12

WORKDIR /app

COPY --from=builder /app/order-service .

EXPOSE 5000

ENTRYPOINT ["/app/order-service"]