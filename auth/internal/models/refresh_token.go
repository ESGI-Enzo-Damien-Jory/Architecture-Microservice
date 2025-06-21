package models

import (
    "database/sql"
    "time"
)

func StoreRefreshToken(db *sql.DB, userID int, token string, expiresAt time.Time) error {
    _, err := db.Exec(
        `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1,$2,$3)`,
        userID, token, expiresAt,
    )
    return err
}

func ValidateRefreshToken(db *sql.DB, token string) (int, error) {
    var userID int
    var expiresAt time.Time
    var revoked bool
    err := db.QueryRow(
        `SELECT user_id, expires_at, revoked FROM refresh_tokens WHERE token=$1`,
        token,
    ).Scan(&userID, &expiresAt, &revoked)
    if err != nil {
        return 0, err
    }
    if revoked || time.Now().After(expiresAt) {
        return 0, sql.ErrNoRows
    }
    return userID, nil
}

func RevokeRefreshToken(db *sql.DB, token string) error {
    _, err := db.Exec(
        `UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1`,
        token,
    )
    return err
}
