using System;
using System.Drawing;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Windows.Forms;
using Microsoft.Win32;

namespace ReporteConfiguracion
{
    internal static class Program
    {
        [STAThread]
        private static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }

    public class MainForm : Form
    {
        private const string RunRegistryKey = @"Software\Microsoft\Windows\CurrentVersion\Run";
        private const string RunValueName = "ReporteSemanal";

        private readonly TextBox _inputCorreo;
        private readonly TextBox _inputPass;
        private readonly CheckBox _checkAutoStart;
        private readonly string _appDir;
        private readonly string _envPath;

        public MainForm()
        {
            _appDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\', '/');
            _envPath = Path.Combine(_appDir, ".env");

            string correoExistente = "";
            string passExistente = "";

            if (File.Exists(_envPath))
            {
                try
                {
                    var lines = File.ReadAllLines(_envPath);
                    foreach (var line in lines)
                    {
                        var matchUser = Regex.Match(line, @"^EMAIL_USER=(.*)$");
                        if (matchUser.Success) correoExistente = matchUser.Groups[1].Value.Trim();

                        var matchPass = Regex.Match(line, @"^EMAIL_PASS=(.*)$");
                        if (matchPass.Success) passExistente = matchPass.Groups[1].Value.Trim();
                    }
                }
                catch { }
            }

            Text = "Reporte Semanal - Configuración inicial";
            ClientSize = new Size(360, 360);
            StartPosition = FormStartPosition.CenterScreen;
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            BackColor = Color.FromArgb(45, 43, 61);

            try
            {
                Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
            }
            catch { }

            var labelTitulo = new Label
            {
                Text = "Configura el envío de tu reporte",
                Font = new Font("Segoe UI", 10, FontStyle.Bold),
                ForeColor = Color.FromArgb(232, 238, 245),
                BackColor = Color.Transparent,
                Size = new Size(320, 25),
                Location = new Point(20, 15)
            };
            Controls.Add(labelTitulo);

            var labelCorreo = new Label
            {
                Text = "Correo de Gmail:",
                Font = new Font("Segoe UI", 9),
                ForeColor = Color.FromArgb(232, 238, 245),
                BackColor = Color.Transparent,
                Size = new Size(300, 18),
                Location = new Point(20, 50)
            };
            Controls.Add(labelCorreo);

            _inputCorreo = new TextBox
            {
                Size = new Size(320, 24),
                Location = new Point(20, 70),
                Text = correoExistente
            };
            Controls.Add(_inputCorreo);

            var labelPass = new Label
            {
                Text = "Contraseña de aplicación (no tu password normal):",
                Font = new Font("Segoe UI", 9),
                ForeColor = Color.FromArgb(232, 238, 245),
                BackColor = Color.Transparent,
                Size = new Size(320, 18),
                Location = new Point(20, 105)
            };
            Controls.Add(labelPass);

            _inputPass = new TextBox
            {
                Size = new Size(320, 24),
                Location = new Point(20, 125),
                UseSystemPasswordChar = true,
                Text = passExistente
            };
            Controls.Add(_inputPass);

            var labelNota = new Label
            {
                Text = "Gmail no acepta tu contraseña normal para esto. Genera una 'contraseña de aplicación' en myaccount.google.com/apppasswords y pega ese código de 16 caracteres aquí.",
                Font = new Font("Segoe UI", 8),
                ForeColor = Color.FromArgb(180, 180, 190),
                BackColor = Color.Transparent,
                Size = new Size(320, 55),
                Location = new Point(20, 155)
            };
            Controls.Add(labelNota);

            _checkAutoStart = new CheckBox
            {
                Text = "Iniciar automáticamente con Windows",
                Font = new Font("Segoe UI", 9),
                ForeColor = Color.FromArgb(232, 238, 245),
                BackColor = Color.Transparent,
                Size = new Size(320, 24),
                Location = new Point(20, 215),
                Checked = true
            };

            try
            {
                using (var key = Registry.CurrentUser.OpenSubKey(RunRegistryKey, false))
                {
                    _checkAutoStart.Checked = key?.GetValue(RunValueName) != null;
                }
            }
            catch { }
            Controls.Add(_checkAutoStart);

            var boton = new Button
            {
                Text = "Guardar y continuar",
                Font = new Font("Segoe UI", 10, FontStyle.Bold),
                Location = new Point(20, 255),
                Size = new Size(320, 42),
                FlatStyle = FlatStyle.Flat,
                ForeColor = Color.FromArgb(232, 238, 245),
                BackColor = Color.FromArgb(61, 80, 128),
                Cursor = Cursors.Hand
            };
            boton.FlatAppearance.BorderColor = Color.FromArgb(232, 238, 245);
            boton.Click += OnSaveClicked;
            Controls.Add(boton);

            AcceptButton = boton;
        }

        private void OnSaveClicked(object sender, EventArgs e)
        {
            var correo = _inputCorreo.Text.Trim();
            var pass = _inputPass.Text.Trim();

            if (string.IsNullOrWhiteSpace(correo) || string.IsNullOrWhiteSpace(pass))
            {
                MessageBox.Show(
                    "Los dos campos son obligatorios. Sin esto la app no va a poder enviar el reporte.",
                    "Faltan datos", MessageBoxButtons.OK, MessageBoxIcon.Warning
                );
                return;
            }

            try
            {
                var utf8NoBom = new UTF8Encoding(false);
                var envContent = $"EMAIL_USER={correo}\nEMAIL_PASS={pass}\n";
                File.WriteAllText(_envPath, envContent, utf8NoBom);

                var dataPath = Path.Combine(_appDir, "data.json");
                if (!File.Exists(dataPath))
                {
                    File.WriteAllText(dataPath, "{\"apps\":{},\"totalSeconds\":0}", utf8NoBom);
                }

                var launcherExe = Path.Combine(_appDir, "Launcher.exe");

                using (var key = Registry.CurrentUser.OpenSubKey(RunRegistryKey, true))
                {
                    if (key != null)
                    {
                        if (_checkAutoStart.Checked)
                        {
                            key.SetValue(RunValueName, $"\"{launcherExe}\"");
                        }
                        else
                        {
                            key.DeleteValue(RunValueName, false);
                        }
                    }
                }

                MessageBox.Show(
                    "Listo. La app ya puede enviar tu reporte cada lunes.",
                    "Configuración guardada", MessageBoxButtons.OK, MessageBoxIcon.Information
                );

                if (File.Exists(launcherExe))
                {
                    System.Diagnostics.Process.Start(launcherExe);
                }

                Close();
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    $"Error al guardar la configuración: {ex.Message}",
                    "Error", MessageBoxButtons.OK, MessageBoxIcon.Error
                );
            }
        }
    }
}

