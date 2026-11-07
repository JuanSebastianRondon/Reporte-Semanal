package main

import (
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

const apiStatus = "http://localhost:4577/status"
const apiQuit = "http://localhost:4577/app/quit"

func main() {
	fmt.Println("[Tray Linux] Iniciando monitor de bandeja...")
	fmt.Println("Presiona Ctrl+C para salir.")

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			resp, err := http.Get(apiStatus)
			if err != nil || resp.StatusCode != http.StatusOK {
				fmt.Println("[Tray] Alerta: Backend no responde.")
			} else {
				resp.Body.Close()
			}
		case <-stop:
			fmt.Println("\n[Tray] Cerrando...")
			return
		}
	}
}

