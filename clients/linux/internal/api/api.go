// Package api centraliza el acceso a la API local del backend.
package api

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

const BaseURL = "http://localhost:4577"

var (
	tokenMu     sync.Mutex
	cachedToken string
	tokenLoaded bool
)

// Token devuelve el token generado por el backend en "<raiz>/.token".
// Se lee una sola vez por proceso; si la API responde 401 se fuerza una
// relectura por si otra instalación regeneró el archivo.
func Token() string {
	tokenMu.Lock()
	defer tokenMu.Unlock()
	if tokenLoaded {
		return cachedToken
	}
	cachedToken = readToken()
	tokenLoaded = true
	return cachedToken
}

// RefreshToken descarta la caché y vuelve a buscar el token en disco.
func RefreshToken() string {
	tokenMu.Lock()
	defer tokenMu.Unlock()
	cachedToken = readToken()
	tokenLoaded = true
	return cachedToken
}

func readToken() string {
	exe, err := os.Executable()
	if err != nil {
		return ""
	}
	dir := filepath.Dir(exe)
	for i := 0; i < 4; i++ {
		data, err := os.ReadFile(filepath.Join(dir, ".token"))
		if err == nil {
			return strings.TrimSpace(string(data))
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	return ""
}

func requestWithToken(client *http.Client, method, endpoint, token string) (*http.Response, error) {
	req, err := http.NewRequest(method, BaseURL+endpoint, nil)
	if err != nil {
		return nil, err
	}
	if token != "" {
		req.Header.Set("X-Report-Token", token)
	}
	return client.Do(req)
}

// Request ejecuta una petición añadiendo el header de autenticación local.
func Request(client *http.Client, method, endpoint string) (*http.Response, error) {
	resp, err := requestWithToken(client, method, endpoint, Token())
	if err == nil && resp.StatusCode == http.StatusUnauthorized {
		resp.Body.Close()
		return requestWithToken(client, method, endpoint, RefreshToken())
	}
	return resp, err
}
