package handlers

import (
    "database/sql"
    "encoding/json"
    "log"
    "net/http"
	"time"

    "auth/internal/jwt"
    "auth/internal/models"
)

func RefreshHandler(db *sql.DB) http.HandlerFunc {
    type reqBody struct {
        RefreshToken string `json:"refresh_token"`
    }
    type respBody struct {
        AccessToken string `json:"access_token"`
    }

    return func(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodPost {
            http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
            return
        }

        var req reqBody
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            log.Printf("🔴 Refresh decode error: %v", err)
            http.Error(w, "invalid JSON", http.StatusBadRequest)
            return
        }
        log.Printf("🟢 RefreshHandler got token: %q", req.RefreshToken)

        userID, err := models.ValidateRefreshToken(db, req.RefreshToken)
        if err != nil {
            if err == sql.ErrNoRows {
                log.Printf("🔴 ValidateRefreshToken: not found or revoked/expired")
                http.Error(w, "invalid refresh token", http.StatusUnauthorized)
                return
            }
            log.Printf("🔴 ValidateRefreshToken unexpected error: %v", err)
            http.Error(w, "server error", http.StatusInternalServerError)
            return
        }

        // (Optionnel) revoke the old token
        go func() {
            if err := models.RevokeRefreshToken(db, req.RefreshToken); err != nil {
                log.Printf("⚠️  Failed to revoke old refresh token: %v", err)
            } else {
                log.Printf("✅ Old refresh token revoked")
            }
        }()

        accessToken, err := jwt.GenerateToken(userID, "", 15*time.Minute)
        if err != nil {
            log.Printf("🔴 GenerateToken error: %v", err)
            http.Error(w, "token error", http.StatusInternalServerError)
            return
        }
        log.Printf("✅ Issuing new access token for user %d", userID)

        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(respBody{AccessToken: accessToken})
    }
}
