// Package api centraliza el acceso a la API local del backend.
package api

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

const BaseURL = "http://localhost:4577"

// Token lee el token generado por el backend en "<raiz>/.token".
// Se buscan varios niveles para funcionar tanto desde bin/ como desde la raíz.
func Token() string {
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

// Request ejecuta una petición añadiendo el header de autenticación local.
func Request(client *http.Client, method, endpoint string) (*http.Response, error) {
	req, err := http.NewRequest(method, BaseURL+endpoint, nil)
	if err != nil {
		return nil, err
	}
	if token := Token(); token != "" {
		req.Header.Set("X-Report-Token", token)
	}
	return client.Do(req)
}
