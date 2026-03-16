package middleware

import (
	"go/rest-ws/models"
	"go/rest-ws/server"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt"
)

var (
	NO_AUTH_NEEDED = []string{
		"login",
		"signup",
	}
)

func shouldCheckAuth(path string) bool {
	for _, noNeededAuthPath := range NO_AUTH_NEEDED {
		if strings.Contains(path, noNeededAuthPath) {
			return false
		}
	}
	return true
}

func CheckAuthMiddleware(s server.Server) func(h http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !shouldCheckAuth(r.URL.Path) {
				next.ServeHTTP(w, r)
				return
			}

			// check tokenString
			tokenString := strings.TrimSpace(r.Header.Get("Authorization"))
			_, err := jwt.ParseWithClaims(
				tokenString,
				&models.AppClaims{},
				func(t *jwt.Token) (interface{}, error) {
					return []byte(s.Config().JWTSecret), nil
				},
			)
			if err != nil {
				http.Error(w, err.Error(), http.StatusUnauthorized)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
