package main

import (
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/juanse/reporte-semanal-linux/internal/api"
)

func isBackendRunning() bool {
	client := &http.Client{Timeout: time.Second}
	resp, err := api.Request(client, http.MethodGet, "/status")
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == http.StatusOK
}

func main() {
	if isBackendRunning() {
		fmt.Println("[Launcher] El backend de Reporte Semanal ya se encuentra en ejecución.")
		return
	}

	execPath, err := os.Executable()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error obteniendo la ruta del ejecutable: %v\n", err)
		os.Exit(1)
	}

	// bin/launcher -> bin -> raíz del proyecto
	appDir := filepath.Dir(filepath.Dir(execPath))
	mainJs := filepath.Join(appDir, "dist", "main.js")

	if _, err := os.Stat(mainJs); os.IsNotExist(err) {
		fmt.Fprintf(os.Stderr, "No se encontró dist/main.js en %s\n", mainJs)
		os.Exit(1)
	}

	cmd := exec.Command("node", mainJs)
	cmd.Dir = appDir
	cmd.Stdout = nil
	cmd.Stderr = nil

	if err := cmd.Start(); err != nil {
		fmt.Fprintf(os.Stderr, "Error iniciando el servicio: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("[Launcher] Backend iniciado correctamente (PID: %d)\n", cmd.Process.Pid)
}
