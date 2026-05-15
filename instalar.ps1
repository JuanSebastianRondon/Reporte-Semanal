Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# ── Ventana principal ────────────────────────────────────
$form = New-Object System.Windows.Forms.Form
$form.Text = "Configuracion - Reporte Semanal"
$form.Size = New-Object System.Drawing.Size(420, 420)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.BackColor = [System.Drawing.Color]::White

# ── Titulo ───────────────────────────────────────────────
$labelTitulo = New-Object System.Windows.Forms.Label
$labelTitulo.Text = "Reporte Semanal de Productividad"
$labelTitulo.Font = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Bold)
$labelTitulo.ForeColor = [System.Drawing.Color]::FromArgb(37, 99, 235)
$labelTitulo.Size = New-Object System.Drawing.Size(380, 30)
$labelTitulo.Location = New-Object System.Drawing.Point(20, 20)
$form.Controls.Add($labelTitulo)

# ── Correo ───────────────────────────────────────────────
$labelCorreo = New-Object System.Windows.Forms.Label
$labelCorreo.Text = "Correo Gmail:"
$labelCorreo.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$labelCorreo.Location = New-Object System.Drawing.Point(20, 70)
$labelCorreo.Size = New-Object System.Drawing.Size(380, 20)
$form.Controls.Add($labelCorreo)

$inputCorreo = New-Object System.Windows.Forms.TextBox
$inputCorreo.Location = New-Object System.Drawing.Point(20, 92)
$inputCorreo.Size = New-Object System.Drawing.Size(360, 25)
$inputCorreo.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$form.Controls.Add($inputCorreo)

# ── Contrasena ───────────────────────────────────────────
$labelPass = New-Object System.Windows.Forms.Label
$labelPass.Text = "Contrasena de aplicacion Gmail:"
$labelPass.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$labelPass.Location = New-Object System.Drawing.Point(20, 130)
$labelPass.Size = New-Object System.Drawing.Size(380, 20)
$form.Controls.Add($labelPass)

$inputPass = New-Object System.Windows.Forms.TextBox
$inputPass.Location = New-Object System.Drawing.Point(20, 152)
$inputPass.Size = New-Object System.Drawing.Size(360, 25)
$inputPass.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$inputPass.PasswordChar = "*"
$form.Controls.Add($inputPass)

$linkPass = New-Object System.Windows.Forms.LinkLabel
$linkPass.Text = "Como obtener la contrasena de aplicacion?"
$linkPass.Font = New-Object System.Drawing.Font("Segoe UI", 8)
$linkPass.Location = New-Object System.Drawing.Point(20, 182)
$linkPass.Size = New-Object System.Drawing.Size(360, 20)
$linkPass.Add_LinkClicked({ Start-Process "https://myaccount.google.com/apppasswords" })
$form.Controls.Add($linkPass)

# ── Tipo de uso ──────────────────────────────────────────
$labelUso = New-Object System.Windows.Forms.Label
$labelUso.Text = "Tipo de uso:"
$labelUso.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$labelUso.Location = New-Object System.Drawing.Point(20, 215)
$labelUso.Size = New-Object System.Drawing.Size(380, 20)
$form.Controls.Add($labelUso)

$radioPersistente = New-Object System.Windows.Forms.RadioButton
$radioPersistente.Text = "Arranque automatico con Windows"
$radioPersistente.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$radioPersistente.Location = New-Object System.Drawing.Point(20, 238)
$radioPersistente.Size = New-Object System.Drawing.Size(360, 22)
$radioPersistente.Checked = $true
$form.Controls.Add($radioPersistente)

$radioTemporal = New-Object System.Windows.Forms.RadioButton
$radioTemporal.Text = "Uso temporal (definir tiempo)"
$radioTemporal.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$radioTemporal.Location = New-Object System.Drawing.Point(20, 262)
$radioTemporal.Size = New-Object System.Drawing.Size(360, 22)
$form.Controls.Add($radioTemporal)

# ── Tiempo temporal ──────────────────────────────────────
$labelTiempo = New-Object System.Windows.Forms.Label
$labelTiempo.Text = "Duracion (en dias):"
$labelTiempo.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$labelTiempo.Location = New-Object System.Drawing.Point(20, 292)
$labelTiempo.Size = New-Object System.Drawing.Size(200, 20)
$labelTiempo.Enabled = $false
$form.Controls.Add($labelTiempo)

$inputTiempo = New-Object System.Windows.Forms.NumericUpDown
$inputTiempo.Location = New-Object System.Drawing.Point(20, 314)
$inputTiempo.Size = New-Object System.Drawing.Size(100, 25)
$inputTiempo.Minimum = 1
$inputTiempo.Maximum = 365
$inputTiempo.Value = 7
$inputTiempo.Enabled = $false
$form.Controls.Add($inputTiempo)

$radioTemporal.Add_CheckedChanged({
    $inputTiempo.Enabled = $radioTemporal.Checked
    $labelTiempo.Enabled = $radioTemporal.Checked
})

# ── Boton instalar ───────────────────────────────────────
$botonInstalar = New-Object System.Windows.Forms.Button
$botonInstalar.Text = "Instalar"
$botonInstalar.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$botonInstalar.Location = New-Object System.Drawing.Point(20, 350)
$botonInstalar.Size = New-Object System.Drawing.Size(360, 35)
$botonInstalar.BackColor = [System.Drawing.Color]::FromArgb(37, 99, 235)
$botonInstalar.ForeColor = [System.Drawing.Color]::White
$botonInstalar.FlatStyle = "Flat"

$botonInstalar.Add_Click({
    $correo = $inputCorreo.Text.Trim()
    $pass = $inputPass.Text.Trim()

    if ($correo -eq "" -or $pass -eq "") {
        [System.Windows.Forms.MessageBox]::Show("Por favor completa todos los campos.", "Error", "OK", "Warning")
        return
    }

    # Ruta del proyecto (misma carpeta que el .ps1)
    $rutaProyecto = Split-Path -Parent $PSCommandPath

    # Generar .env
    $envContent = "EMAIL_USER=$correo`nEMAIL_PASS=$pass"
    Set-Content -Path "$rutaProyecto\.env" -Value $envContent

    # Instalar dependencias y compilar
    Set-Location $rutaProyecto
    npm install | Out-Null
    npm run build | Out-Null

    # Configurar pm2
    pm2 start dist/main.js --name reporte-semanal | Out-Null
    pm2 start "$rutaProyecto\tracker.mjs" --name tracker | Out-Null
    pm2 save | Out-Null
    
    if ($radioPersistente.Checked) {
    pm2 restart reporte-semanal | Out-Null
    [System.Windows.Forms.MessageBox]::Show("Instalacion completada. El programa arrancara automaticamente con Windows.", "Listo", "OK", "Information")
    } else {
        $dias = $inputTiempo.Value
        $fechaFin = (Get-Date).AddDays($dias).ToString("yyyy-MM-dd")
        Add-Content -Path "$rutaProyecto\.env" -Value "FECHA_FIN=$fechaFin"
        [System.Windows.Forms.MessageBox]::Show("Instalacion completada. El programa correra por $dias dias hasta el $fechaFin.", "Listo", "OK", "Information")
    }

    $form.Close()
})

$form.Controls.Add($botonInstalar)
$form.ShowDialog()