Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$AppDir = $PSScriptRoot
if ([string]::IsNullOrEmpty($AppDir)) {
    $AppDir = Split-Path -Parent ([System.Diagnostics.Process]::GetCurrentProcess().MainModule.FileName)
}

$RegPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
$RegName = "ReporteSemanal"
$EnvPath = Join-Path $AppDir ".env"

# Si ya existe un .env de una configuración anterior, precarga los valores
# para que reconfigurar (por ejemplo, solo para cambiar el checkbox de
# arranque automático) no obligue a volver a escribir la contraseña.
$correoExistente = ""
$passExistente = ""
if (Test-Path $EnvPath) {
    Get-Content $EnvPath | ForEach-Object {
        if ($_ -match '^EMAIL_USER=(.*)$') { $correoExistente = $Matches[1] }
        if ($_ -match '^EMAIL_PASS=(.*)$') { $passExistente = $Matches[1] }
    }
}

# ── Ventana ──────────────────────────────────────────────
$form = New-Object System.Windows.Forms.Form
$form.Text = "Reporte Semanal - Configuracion inicial"
$form.Size = New-Object System.Drawing.Size(360, 360)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.BackColor = [System.Drawing.Color]::FromArgb(45, 43, 61)

$labelTitulo = New-Object System.Windows.Forms.Label
$labelTitulo.Text = "Configura el envio de tu reporte"
$labelTitulo.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$labelTitulo.ForeColor = [System.Drawing.Color]::FromArgb(232, 238, 245)
$labelTitulo.BackColor = [System.Drawing.Color]::Transparent
$labelTitulo.Size = New-Object System.Drawing.Size(320, 25)
$labelTitulo.Location = New-Object System.Drawing.Point(20, 15)
$form.Controls.Add($labelTitulo)

# ── Correo ───────────────────────────────────────────────
$labelCorreo = New-Object System.Windows.Forms.Label
$labelCorreo.Text = "Correo de Gmail:"
$labelCorreo.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$labelCorreo.ForeColor = [System.Drawing.Color]::FromArgb(232, 238, 245)
$labelCorreo.BackColor = [System.Drawing.Color]::Transparent
$labelCorreo.Size = New-Object System.Drawing.Size(300, 18)
$labelCorreo.Location = New-Object System.Drawing.Point(20, 55)
$form.Controls.Add($labelCorreo)

$inputCorreo = New-Object System.Windows.Forms.TextBox
$inputCorreo.Size = New-Object System.Drawing.Size(300, 24)
$inputCorreo.Location = New-Object System.Drawing.Point(20, 75)
$inputCorreo.Text = $correoExistente
$form.Controls.Add($inputCorreo)

# ── Password de aplicacion ───────────────────────────────
$labelPass = New-Object System.Windows.Forms.Label
$labelPass.Text = "Contrasena de aplicacion (no tu password normal):"
$labelPass.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$labelPass.ForeColor = [System.Drawing.Color]::FromArgb(232, 238, 245)
$labelPass.BackColor = [System.Drawing.Color]::Transparent
$labelPass.Size = New-Object System.Drawing.Size(300, 18)
$labelPass.Location = New-Object System.Drawing.Point(20, 110)
$form.Controls.Add($labelPass)

$inputPass = New-Object System.Windows.Forms.TextBox
$inputPass.Size = New-Object System.Drawing.Size(300, 24)
$inputPass.Location = New-Object System.Drawing.Point(20, 130)
$inputPass.UseSystemPasswordChar = $true
$inputPass.Text = $passExistente
$form.Controls.Add($inputPass)

# ── Nota de ayuda ────────────────────────────────────────
$labelNota = New-Object System.Windows.Forms.Label
$labelNota.Text = "Gmail no acepta tu contrasena normal para esto. Genera una`n" +
                   "'contrasena de aplicacion' en myaccount.google.com/apppasswords`n" +
                   "y pega ese codigo de 16 caracteres aqui."
$labelNota.Font = New-Object System.Drawing.Font("Segoe UI", 8)
$labelNota.ForeColor = [System.Drawing.Color]::FromArgb(180, 180, 190)
$labelNota.BackColor = [System.Drawing.Color]::Transparent
$labelNota.Size = New-Object System.Drawing.Size(320, 55)
$labelNota.Location = New-Object System.Drawing.Point(20, 165)
$form.Controls.Add($labelNota)

# ── Checkbox de arranque automatico ─────────────────────
$checkAutoStart = New-Object System.Windows.Forms.CheckBox
$checkAutoStart.Text = "Iniciar automaticamente con Windows"
$checkAutoStart.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$checkAutoStart.ForeColor = [System.Drawing.Color]::FromArgb(232, 238, 245)
$checkAutoStart.BackColor = [System.Drawing.Color]::Transparent
$checkAutoStart.Size = New-Object System.Drawing.Size(300, 24)
$checkAutoStart.Location = New-Object System.Drawing.Point(20, 225)
$checkAutoStart.Checked = $true
# Si ya existe la entrada de registro (por ejemplo, corriendo Configuracion.exe
# de nuevo para cambiar de opinion), refleja el estado real actual.
if (-not (Test-Path $RegPath)) {
    New-Item -Path $RegPath -Force | Out-Null
}
$existing = Get-ItemProperty -Path $RegPath -Name $RegName -ErrorAction SilentlyContinue
$checkAutoStart.Checked = $null -ne $existing
$form.Controls.Add($checkAutoStart)

# ── Boton guardar ────────────────────────────────────────
$boton = New-Object System.Windows.Forms.Button
$boton.Text = "Guardar y continuar"
$boton.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$boton.Location = New-Object System.Drawing.Point(20, 265)
$boton.Size = New-Object System.Drawing.Size(300, 40)
$boton.FlatStyle = "Flat"
$boton.ForeColor = [System.Drawing.Color]::FromArgb(232, 238, 245)
$boton.BackColor = [System.Drawing.Color]::FromArgb(61, 80, 128)
$boton.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb(232, 238, 245)

$boton.Add_Click({
    $correo = $inputCorreo.Text.Trim()
    $pass   = $inputPass.Text.Trim()

    if ([string]::IsNullOrWhiteSpace($correo) -or [string]::IsNullOrWhiteSpace($pass)) {
        [System.Windows.Forms.MessageBox]::Show(
            "Los dos campos son obligatorios. Sin esto la app no va a poder enviar el reporte.",
            "Faltan datos", "OK", "Warning"
        )
        return
    }

    $envContent = "EMAIL_USER=$correo`nEMAIL_PASS=$pass`n"
    [System.IO.File]::WriteAllText(
        $EnvPath,
        $envContent,
        (New-Object System.Text.UTF8Encoding($false))
    )

    $dataPath = Join-Path $AppDir "data.json"
    if (-not (Test-Path $dataPath)) {
        [System.IO.File]::WriteAllText(
            $dataPath,
            '{"apps":{},"totalSeconds":0}',
            (New-Object System.Text.UTF8Encoding($false))
        )
    }

    $launcherExe = Join-Path $AppDir "Launcher.exe"

    if ($checkAutoStart.Checked) {
        Set-ItemProperty -Path $RegPath -Name $RegName -Value "`"$launcherExe`"" -Force
    } else {
        Remove-ItemProperty -Path $RegPath -Name $RegName -ErrorAction SilentlyContinue
    }

    [System.Windows.Forms.MessageBox]::Show(
        "Listo. La app ya puede enviar tu reporte cada lunes.",
        "Configuracion guardada", "OK", "Information"
    )

    if (Test-Path $launcherExe) {
        Start-Process -FilePath $launcherExe
    }

    $form.Close()
})

$form.Controls.Add($boton)
$form.AcceptButton = $boton
$form.ShowDialog() | Out-Null