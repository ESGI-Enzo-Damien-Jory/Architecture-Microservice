package middleware

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"

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

	
	authServiceURL := os.Getenv("AUTH_SERVICE_URL")
	if authServiceURL == "" {
		authServiceURL = "http://auth:3001"
	}

	verifyURL := fmt.Sprintf("%s/verify", authServiceURL)

	
	req, err := http.NewRequest("POST", verifyURL, nil)
	if err != nil {
		log.Printf("[AUTH] Failed to create verify request: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Internal server error"})
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	req.Header.Set("Content-Type", "application/json")

	
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("[AUTH] Failed to verify token with auth service: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Auth service unavailable"})
	}
	defer resp.Body.Close()

	
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Printf("[AUTH] Failed to read auth service response: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Internal server error"})
	}

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

	
	c.Locals("userID", verifyResp.User.ID)
	c.Locals("userRole", verifyResp.User.Role)

	log.Printf("[AUTH] Authenticated user: %s with role: %s", verifyResp.User.ID, verifyResp.User.Role)

	return c.Next()
}