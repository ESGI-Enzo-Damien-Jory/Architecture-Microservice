# Build stage
FROM golang:1.25 AS builder

WORKDIR /app

COPY go.mod ./
COPY go.sum ./
RUN go mod download

COPY . .
RUN go build -o kitchen-service

# Final image
FROM gcr.io/distroless/base-debian11

WORKDIR /app

COPY --from=builder /app/kitchen-service .

EXPOSE 3000

ENTRYPOINT ["/app/kitchen-service"]
