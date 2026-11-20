package main

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

func main() {
	fmt.Println("========================================")
	fmt.Println(" Reporte Semanal — Configuración (Linux)")
	fmt.Println("========================================")

	execPath, _ := os.Executable()
	appDir := filepath.Dir(filepath.Dir(execPath))
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

	storedPass := pass
	if _, err := exec.LookPath("secret-tool"); err == nil {
		cmd := exec.Command("secret-tool", "store",
			"--label=Reporte Semanal de Productividad", "reporte-semanal", "EMAIL_PASS")
		cmd.Stdin = strings.NewReader(pass)
		if err := cmd.Run(); err == nil {
			storedPass = "keyring:"
			fmt.Println("[OK] Contraseña guardada en el llavero del sistema.")
		} else {
			fmt.Fprintf(os.Stderr, "[Aviso] No se pudo usar secret-tool (%v). Se guardará en .env con permisos 0600.\n", err)
		}
	} else {
		fmt.Println("[Aviso] secret-tool no está instalado; la contraseña se guardará en .env con permisos 0600.")
	}

	content := fmt.Sprintf("EMAIL_USER=%s\nEMAIL_PASS=%s\nREPORT_RECEIVER=%s\n", user, storedPass, receiver)

	if err := os.WriteFile(envPath, []byte(content), 0600); err != nil {
		fmt.Fprintf(os.Stderr, "Error guardando .env: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("\n[OK] Configuración guardada exitosamente en", envPath)
}
