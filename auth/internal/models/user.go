package models

import (
    "database/sql"
    "golang.org/x/crypto/bcrypt"
)

type User struct {
    ID       int
    Email    string
    FullName string
    Role     string
}

// CreateUser hashes the password and inserts a new user record
func CreateUser(db *sql.DB, email, fullName, password, role string) error {
    hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    if err != nil {
        return err
    }
    _, err = db.Exec(
        `INSERT INTO users (email, full_name, password, role) VALUES ($1, $2, $3, $4)`,
        email, fullName, string(hash), role,
    )
    return err
}

// GetUserByEmail retrieves a user and its hashed password by email
func GetUserByEmail(db *sql.DB, email string) (User, string, error) {
    var u User
    var hash string
    err := db.QueryRow(
        `SELECT id, email, full_name, password, role FROM users WHERE email=$1`,
        email,
    ).Scan(&u.ID, &u.Email, &u.FullName, &hash, &u.Role)
    return u, hash, err
}

// CheckPassword compares a hashed password with a plaintext one
func CheckPassword(hash, password string) bool {
    return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}