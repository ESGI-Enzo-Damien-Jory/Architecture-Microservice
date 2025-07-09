package middleware

import (
	"log"

	"github.com/gofiber/fiber/v2"
)

// RequireRole creates a middleware that checks if the user has the required role
func RequireRole(allowedRoles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userRole := c.Locals("userRole")
		if userRole == nil {
			log.Printf("[AUTH] No user role found in context")
			return c.Status(401).JSON(fiber.Map{"error": "User not authenticated"})
		}

		userRoleStr, ok := userRole.(string)
		if !ok {
			log.Printf("[AUTH] Invalid user role type in context")
			return c.Status(500).JSON(fiber.Map{"error": "Internal server error"})
		}

		// Check if user role is in allowed roles
		for _, allowedRole := range allowedRoles {
			if userRoleStr == allowedRole {
				log.Printf("[AUTH] User role '%s' authorized for this endpoint", userRoleStr)
				return c.Next()
			}
		}

		log.Printf("[AUTH] User role '%s' not authorized. Required roles: %v", userRoleStr, allowedRoles)
		return c.Status(403).JSON(fiber.Map{"error": "Insufficient permissions"})
	}
}

// RequireClientRole ensures only clients can access the endpoint
func RequireClientRole() fiber.Handler {
	return RequireRole("client")
}

// RequireAdminRole ensures only admins can access the endpoint
func RequireAdminRole() fiber.Handler {
	return RequireRole("admin")
}

// RequireClientOrAdmin allows both clients and admins
func RequireClientOrAdmin() fiber.Handler {
	return RequireRole("client", "admin")
}