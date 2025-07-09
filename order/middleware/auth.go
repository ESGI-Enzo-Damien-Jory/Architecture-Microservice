// order/middleware/auth.go
package middleware

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

type VerifyResponse struct {
	Valid bool `json:"valid"`
	User  struct {
		ID   string `json:"id"`
		Role string `json:"role"`
	} `json:"user"`
}

func VerifyJWT(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		log.Println("[AUTH] Missing or invalid Authorization header")
		return c.Status(401).JSON(fiber.Map{"error": "Missing or invalid Authorization header"})
	}

	token := strings.TrimPrefix(authHeader, "Bearer ")
	log.Printf("[AUTH] Verifying token: %s...", token[:20])

	authServiceURL := os.Getenv("AUTH_SERVICE_URL")
	if authServiceURL == "" {
		authServiceURL = "http://auth:3001"
	}

	verifyURL := fmt.Sprintf("%s/verify", authServiceURL)
	log.Printf("[AUTH] Calling auth service: %s", verifyURL)

	req, err := http.NewRequest("POST", verifyURL, nil)
	if err != nil {
		log.Printf("[AUTH] Failed to create verify request: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Internal server error"})
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{
		Timeout: 10 * time.Second,
	}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("[AUTH] Failed to verify token with auth service: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Auth service unavailable"})
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("[AUTH] Failed to read auth service response: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Internal server error"})
	}

	log.Printf("[AUTH] Auth service response status: %d", resp.StatusCode)
	log.Printf("[AUTH] Auth service response body: %s", string(body))

	if resp.StatusCode != 200 {
		log.Printf("[AUTH] Token verification failed with status %d: %s", resp.StatusCode, string(body))
		return c.Status(401).JSON(fiber.Map{"error": "Invalid or expired token"})
	}

	var verifyResp VerifyResponse
	if err := json.Unmarshal(body, &verifyResp); err != nil {
		log.Printf("[AUTH] Failed to parse auth service response: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Internal server error"})
	}

	if !verifyResp.Valid {
		log.Printf("[AUTH] Token marked as invalid by auth service")
		return c.Status(401).JSON(fiber.Map{"error": "Invalid token"})
	}

	// Set user info in context
	c.Locals("userID", verifyResp.User.ID)
	c.Locals("userRole", verifyResp.User.Role)

	log.Printf("[AUTH] Authentication successful for user: %s with role: %s", verifyResp.User.ID, verifyResp.User.Role)

	return c.Next()
}