package handlers

import (
    "fmt"
    "net/http"
)

// HealthHandler responds with 200 OK
func HealthHandler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    fmt.Fprint(w, "OK")
}