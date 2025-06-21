package jwt

import (
    "crypto/rsa"
    "errors"
    "io/ioutil"
    "os"
    "time"

    "github.com/golang-jwt/jwt/v5"
)

var (
    privateKey *rsa.PrivateKey
    publicKey  *rsa.PublicKey
)

func init() {
    data, err := ioutil.ReadFile(os.Getenv("PRIVATE_KEY_PATH"))
    if err != nil {
        panic("jwt: cannot read private key: " + err.Error())
    }
    key, err := jwt.ParseRSAPrivateKeyFromPEM(data)
    if err != nil {
        panic("jwt: parse private key: " + err.Error())
    }
    privateKey = key

    pubData, err := ioutil.ReadFile(os.Getenv("PUBLIC_KEY_PATH"))
    if err != nil {
        panic("jwt: cannot read public key: " + err.Error())
    }
    pubKey, err := jwt.ParseRSAPublicKeyFromPEM(pubData)
    if err != nil {
        panic("jwt: parse public key: " + err.Error())
    }
    publicKey = pubKey
}

func GenerateToken(userID int, role string, expires time.Duration) (string, error) {
    claims := jwt.MapClaims{
        "sub":     userID,
        "role":    role,
        "exp":     time.Now().Add(expires).Unix(),
        "iat":     time.Now().Unix(),
    }
    token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
    return token.SignedString(privateKey)
}

func ValidateToken(tokenStr string) (*jwt.Token, error) {
    return jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
        if t.Method != jwt.SigningMethodRS256 {
            return nil, errors.New("unexpected signing method")
        }
        return publicKey, nil
    })
}
