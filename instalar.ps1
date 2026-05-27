Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# ── Ventana principal ────────────────────────────────────
$form = New-Object System.Windows.Forms.Form
$form.Text = "Configuracion - Reporte Semanal"
$form.Size = New-Object System.Drawing.Size(420, 420)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.BackColor = [System.Drawing.Color]::FromArgb(45, 43, 61)

# ── Titulo ───────────────────────────────────────────────
$labelTitulo = New-Object System.Windows.Forms.Label
$labelTitulo.Text = "Reporte Semanal de Productividad"
$labelTitulo.Font = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Bold)
$labelTitulo.ForeColor = [System.Drawing.Color]::FromArgb(232, 238, 245)
$labelTitulo.Size = New-Object System.Drawing.Size(380, 30)
$labelTitulo.Location = New-Object System.Drawing.Point(20, 20)
$labelTitulo.BackColor = [System.Drawing.Color]::Transparent
$form.Controls.Add($labelTitulo)

# ── Correo ───────────────────────────────────────────────
$labelCorreo = New-Object System.Windows.Forms.Label
$labelCorreo.Text = "Correo Gmail:"
$labelCorreo.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$labelCorreo.ForeColor = [System.Drawing.Color]::FromArgb(180, 195, 220)
$labelCorreo.BackColor = [System.Drawing.Color]::Transparent
$labelCorreo.Location = New-Object System.Drawing.Point(20, 70)
$labelCorreo.Size = New-Object System.Drawing.Size(380, 20)
$form.Controls.Add($labelCorreo)

$inputCorreo = New-Object System.Windows.Forms.TextBox
$inputCorreo.Location = New-Object System.Drawing.Point(20, 92)
$inputCorreo.Size = New-Object System.Drawing.Size(360, 25)
$inputCorreo.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$inputCorreo.BackColor = [System.Drawing.Color]::FromArgb(61, 80, 128)
$inputCorreo.ForeColor = [System.Drawing.Color]::FromArgb(232, 238, 245)
$inputCorreo.BorderStyle = "FixedSingle"
$form.Controls.Add($inputCorreo)

# ── Contrasena ───────────────────────────────────────────
$labelPass = New-Object System.Windows.Forms.Label
$labelPass.Text = "Contrasena de aplicacion Gmail:"
$labelPass.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$labelPass.ForeColor = [System.Drawing.Color]::FromArgb(180, 195, 220)
$labelPass.BackColor = [System.Drawing.Color]::Transparent
$labelPass.Location = New-Object System.Drawing.Point(20, 130)
$labelPass.Size = New-Object System.Drawing.Size(380, 20)
$form.Controls.Add($labelPass)

$inputPass = New-Object System.Windows.Forms.TextBox
$inputPass.Location = New-Object System.Drawing.Point(20, 152)
$inputPass.Size = New-Object System.Drawing.Size(360, 25)
$inputPass.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$inputPass.PasswordChar = "*"
$inputPass.BackColor = [System.Drawing.Color]::FromArgb(61, 80, 128)
$inputPass.ForeColor = [System.Drawing.Color]::FromArgb(232, 238, 245)
$inputPass.BorderStyle = "FixedSingle"
$form.Controls.Add($inputPass)

$linkPass = New-Object System.Windows.Forms.LinkLabel
$linkPass.Text = "Como obtener la contrasena de aplicacion?"
$linkPass.Font = New-Object System.Drawing.Font("Segoe UI", 8)
$linkPass.LinkColor = [System.Drawing.Color]::FromArgb(180, 195, 220)
$linkPass.ActiveLinkColor = [System.Drawing.Color]::White
$linkPass.BackColor = [System.Drawing.Color]::Transparent
$linkPass.Location = New-Object System.Drawing.Point(20, 182)
$linkPass.Size = New-Object System.Drawing.Size(360, 20)
$linkPass.Add_LinkClicked({ Start-Process "https://myaccount.google.com/apppasswords" })
$form.Controls.Add($linkPass)

# ── Tipo de uso ──────────────────────────────────────────
$labelUso = New-Object System.Windows.Forms.Label
$labelUso.Text = "Tipo de uso:"
$labelUso.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$labelUso.ForeColor = [System.Drawing.Color]::FromArgb(180, 195, 220)
$labelUso.BackColor = [System.Drawing.Color]::Transparent
$labelUso.Location = New-Object System.Drawing.Point(20, 215)
$labelUso.Size = New-Object System.Drawing.Size(380, 20)
$form.Controls.Add($labelUso)

$radioPersistente = New-Object System.Windows.Forms.RadioButton
$radioPersistente.Text = "Arranque automatico con Windows"
$radioPersistente.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$radioPersistente.ForeColor = [System.Drawing.Color]::FromArgb(180, 195, 220)
$radioPersistente.BackColor = [System.Drawing.Color]::Transparent
$radioPersistente.Location = New-Object System.Drawing.Point(20, 238)
$radioPersistente.Size = New-Object System.Drawing.Size(360, 22)
$radioPersistente.Checked = $true
$form.Controls.Add($radioPersistente)

$radioAhora = New-Object System.Windows.Forms.RadioButton
$radioAhora.Text = "Manual (tendras que encenderlo desde el control cada vez)"
$radioAhora.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$radioAhora.ForeColor = [System.Drawing.Color]::FromArgb(180, 195, 220)
$radioAhora.BackColor = [System.Drawing.Color]::Transparent
$radioAhora.Location = New-Object System.Drawing.Point(20, 262)
$radioAhora.Size = New-Object System.Drawing.Size(360, 40)
$form.Controls.Add($radioAhora)

# ── Boton instalar ───────────────────────────────────────
$botonInstalar = New-Object System.Windows.Forms.Button
$botonInstalar.Text = "Instalar"
$botonInstalar.Font = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$botonInstalar.Location = New-Object System.Drawing.Point(20, 330)
$botonInstalar.Size = New-Object System.Drawing.Size(360, 35)
$botonInstalar.BackColor = [System.Drawing.Color]::FromArgb(61, 80, 128)
$botonInstalar.ForeColor = [System.Drawing.Color]::FromArgb(232, 238, 245)
$botonInstalar.FlatStyle = "Flat"
$botonInstalar.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb(180, 195, 220)

$botonInstalar.Add_Click({
    $correo = $inputCorreo.Text.Trim()
    $pass = $inputPass.Text.Trim()

    if ($correo -eq "" -or $pass -eq "") {
        [System.Windows.Forms.MessageBox]::Show("Por favor completa todos los campos.", "Error", "OK", "Warning")
        return
    }

    $rutaProyecto = Split-Path -Parent $PSCommandPath

    $envContent = "EMAIL_USER=" + $correo + "`nEMAIL_PASS=" + $pass
    Set-Content -Path "$rutaProyecto\.env" -Value $envContent -NoNewline

    Set-Location $rutaProyecto
    npm ci | Out-Null
    npm run build | Out-Null

    pm2 start dist/main.js --name reporte-semanal | Out-Null
    pm2 start "$rutaProyecto\tracker.mjs" --name tracker | Out-Null
    pm2 save | Out-Null
    pm2 restart reporte-semanal | Out-Null

    if ($radioPersistente.Checked) {
        pm2 startup | Out-Null
        pm2 save | Out-Null
        [System.Windows.Forms.MessageBox]::Show("Instalacion completada. El programa arrancara automaticamente con Windows.", "Listo", "OK", "Information")
    } else {
        [System.Windows.Forms.MessageBox]::Show("Instalacion completada. El programa esta corriendo.", "Listo", "OK", "Information")
    }

    $form.Close()
})

$form.Controls.Add($botonInstalar)
$form.ShowDialog()