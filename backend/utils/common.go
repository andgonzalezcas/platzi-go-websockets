package utils

import (
	"go/rest-ws/models"
	"go/rest-ws/repository"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt"
)

func GetUserFromToken(r *http.Request, jwtSecret string) (*models.User, error) {
	tokenString := strings.TrimSpace(r.Header.Get("Authorization"))

	token, err := jwt.ParseWithClaims(
		tokenString,
		&models.AppClaims{},
		func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		},
	)
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*models.AppClaims); ok && token.Valid {
		user, err := repository.GetUserById(r.Context(), claims.UserId)
		if err != nil {
			return nil, err
		}
		return user, nil
	} else {
		return nil, err
	}
}
