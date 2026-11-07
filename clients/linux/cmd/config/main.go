package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	fmt.Println("========================================")
	fmt.Println(" Reporte Semanal — Configuración (Linux)")
	fmt.Println("========================================")

	execPath, _ := os.Executable()
	appDir := filepath.Dir(filepath.Dir(filepath.Dir(execPath)))
	envPath := filepath.Join(appDir, ".env")

	reader := bufio.NewReader(os.Stdin)

	fmt.Print("Correo emisor (EMAIL_USER): ")
	user, _ := reader.ReadString('\n')
	user = strings.TrimSpace(user)

	fmt.Print("Contraseña de aplicación (EMAIL_PASS): ")
	pass, _ := reader.ReadString('\n')
	pass = strings.TrimSpace(pass)

	fmt.Print("Correo destinatario (REPORT_RECEIVER): ")
	receiver, _ := reader.ReadString('\n')
	receiver = strings.TrimSpace(receiver)

	content := fmt.Sprintf("EMAIL_USER=%s\nEMAIL_PASS=%s\nREPORT_RECEIVER=%s\nPORT=4577\n", user, pass, receiver)

	if err := os.WriteFile(envPath, []byte(content), 0600); err != nil {
		fmt.Fprintf(os.Stderr, "Error guardando .env: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("\n[OK] Configuración guardada exitosamente en", envPath)
}

