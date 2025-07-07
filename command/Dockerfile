FROM golang:1.21-alpine AS builder

WORKDIR /app


COPY go.mod ./
COPY go.sum ./
RUN go mod download

COPY . .


RUN go build -o command-service .


FROM alpine:latest


RUN apk --no-cache add ca-certificates

WORKDIR /root/


COPY --from=builder /app/command-service .


COPY .env .env
COPY secrets/public.pem /secrets/public.pem


EXPOSE 5000


CMD ["./command-service"]