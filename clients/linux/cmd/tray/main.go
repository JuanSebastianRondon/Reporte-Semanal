package main

import (
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/juanse/reporte-semanal-linux/internal/api"
)

// Monitor de estado residente (no AppIndicator): comprueba periódicamente
// que el backend responde y permite detenerlo con Ctrl+C.
func main() {
	fmt.Println("[Monitor Linux] Iniciando supervisor del servicio...")
	fmt.Println("Presiona Ctrl+C para salir.")

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	client := &http.Client{Timeout: 3 * time.Second}
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	check := func() {
		resp, err := api.Request(client, http.MethodGet, "/status")
		if err != nil || resp.StatusCode != http.StatusOK {
			fmt.Println("[Monitor] Alerta: el backend no responde o rechazó el token.")
			return
		}
		defer resp.Body.Close()
		fmt.Println("[Monitor] Servicio activo.")
	}

	check()
	for {
		select {
		case <-ticker.C:
			check()
		case <-stop:
			fmt.Println("\n[Monitor] Cerrando...")
			return
		}
	}
}
