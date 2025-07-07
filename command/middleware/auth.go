package middleware

import (
	"crypto/rsa"
	"errors"
	"io/ioutil"
	"log"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

var publicKey *rsa.PublicKey

func init() {
	keyPath := os.Getenv("PUBLIC_KEY_PATH")
	keyData, err := ioutil.ReadFile(keyPath)
	if err != nil {
		log.Fatalf("Failed to read public key: %v", err)
	}

	publicKey, err = jwt.ParseRSAPublicKeyFromPEM(keyData)
	if err != nil {
		log.Fatalf("Failed to parse public key: %v", err)
	}
}

func VerifyJWT(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return c.Status(401).JSON(fiber.Map{"error": "Missing token"})
	}
	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return publicKey, nil
	})

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		c.Locals("userID", claims["sub"])
		return c.Next()
	}

	log.Println("JWT error:", err)
	return c.Status(401).JSON(fiber.Map{"error": "Invalid token"})
}
