Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$ApiUrl = "http://localhost:4577"

function Test-BackendRunning {
    try {
        Invoke-RestMethod -Uri "$ApiUrl/status" -TimeoutSec 2 -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

$corriendo = Test-BackendRunning

# ── Ventana ──────────────────────────────────────────────
$form = New-Object System.Windows.Forms.Form
$form.Text = "Reporte Semanal - Control"
$form.Size = New-Object System.Drawing.Size(320, 200)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.BackColor = [System.Drawing.Color]::FromArgb(45, 43, 61)

# ── Titulo ───────────────────────────────────────────────
$labelTitulo = New-Object System.Windows.Forms.Label
$labelTitulo.Text = "Reporte Semanal de Productividad"
$labelTitulo.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$labelTitulo.ForeColor = [System.Drawing.Color]::FromArgb(232, 238, 245)
$labelTitulo.BackColor = [System.Drawing.Color]::Transparent
$labelTitulo.Size = New-Object System.Drawing.Size(280, 25)
$labelTitulo.Location = New-Object System.Drawing.Point(20, 20)
$form.Controls.Add($labelTitulo)

# ── Estado ───────────────────────────────────────────────
$labelEstado = New-Object System.Windows.Forms.Label
$labelEstado.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$labelEstado.BackColor = [System.Drawing.Color]::Transparent
$labelEstado.Size = New-Object System.Drawing.Size(280, 20)
$labelEstado.Location = New-Object System.Drawing.Point(20, 55)

if ($corriendo) {
    $labelEstado.Text = "Estado: Activo"
    $labelEstado.ForeColor = [System.Drawing.Color]::FromArgb(134, 239, 172)
} else {
    $labelEstado.Text = "Estado: Inactivo"
    $labelEstado.ForeColor = [System.Drawing.Color]::FromArgb(252, 165, 165)
}
$form.Controls.Add($labelEstado)

# ── Boton toggle ─────────────────────────────────────────
$boton = New-Object System.Windows.Forms.Button
$boton.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$boton.Location = New-Object System.Drawing.Point(20, 90)
$boton.Size = New-Object System.Drawing.Size(260, 40)
$boton.FlatStyle = "Flat"
$boton.ForeColor = [System.Drawing.Color]::FromArgb(232, 238, 245)
$boton.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb(232, 238, 245)

if ($corriendo) {
    $boton.Text = "Apagar"
    $boton.BackColor = [System.Drawing.Color]::FromArgb(45, 43, 61)
} else {
    $boton.Text = "Encender"
    $boton.BackColor = [System.Drawing.Color]::FromArgb(61, 80, 128)
}

$boton.Add_Click({
    if ($corriendo) {
        try {
            Invoke-RestMethod -Uri "$ApiUrl/app/quit" -Method Post -TimeoutSec 3 -ErrorAction Stop | Out-Null
            [System.Windows.Forms.MessageBox]::Show("Programa apagado.", "Listo", "OK", "Information")
        } catch {
            [System.Windows.Forms.MessageBox]::Show(
                "No se pudo apagar. Puede que ya estuviera detenido.",
                "Aviso", "OK", "Warning"
            )
        }
    } else {
        $launcher = Join-Path $PSScriptRoot "Launcher.exe"
        if (Test-Path $launcher) {
            Start-Process -FilePath $launcher
            [System.Windows.Forms.MessageBox]::Show("Programa encendido.", "Listo", "OK", "Information")
        } else {
            [System.Windows.Forms.MessageBox]::Show(
                "No se encontro ReporteSemanal.exe en esta carpeta.",
                "Error", "OK", "Error"
            )
        }
    }
    $form.Close()
})

$form.Controls.Add($boton)
$form.ShowDialog() | Out-Null