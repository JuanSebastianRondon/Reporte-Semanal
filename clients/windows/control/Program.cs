using System;
using System.Drawing;
using System.IO;
using System.Net.Http;
using System.Windows.Forms;

namespace ReporteControl
{
    internal static class Program
    {
        [STAThread]
        private static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new ControlForm());
        }
    }

    public class ControlForm : Form
    {
        private const string ApiUrl = "http://localhost:4577";
        private readonly string _appDir;
        private readonly bool _corriendo;

        public ControlForm()
        {
            _appDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\', '/');
            _corriendo = IsBackendRunning();

            Text = "Reporte Semanal - Control";
            ClientSize = new Size(320, 160);
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
                Text = "Reporte Semanal de Productividad",
                Font = new Font("Segoe UI", 10, FontStyle.Bold),
                ForeColor = Color.FromArgb(232, 238, 245),
                BackColor = Color.Transparent,
                Size = new Size(280, 25),
                Location = new Point(20, 15)
            };
            Controls.Add(labelTitulo);

            var labelEstado = new Label
            {
                Font = new Font("Segoe UI", 9),
                BackColor = Color.Transparent,
                Size = new Size(280, 20),
                Location = new Point(20, 48),
                Text = _corriendo ? "Estado: Activo" : "Estado: Inactivo",
                ForeColor = _corriendo ? Color.FromArgb(134, 239, 172) : Color.FromArgb(252, 165, 165)
            };
            Controls.Add(labelEstado);

            var boton = new Button
            {
                Text = _corriendo ? "Apagar" : "Encender",
                Font = new Font("Segoe UI", 10, FontStyle.Bold),
                Location = new Point(20, 85),
                Size = new Size(280, 40),
                FlatStyle = FlatStyle.Flat,
                ForeColor = Color.FromArgb(232, 238, 245),
                BackColor = _corriendo ? Color.FromArgb(45, 43, 61) : Color.FromArgb(61, 80, 128),
                Cursor = Cursors.Hand
            };
            boton.FlatAppearance.BorderColor = Color.FromArgb(232, 238, 245);
            boton.Click += OnToggleClicked;
            Controls.Add(boton);

            AcceptButton = boton;
        }

        private static bool IsBackendRunning()
        {
            try
            {
                using (var client = new HttpClient { Timeout = TimeSpan.FromSeconds(2) })
                {
                    var response = client.GetAsync($"{ApiUrl}/status").Result;
                    return response.IsSuccessStatusCode;
                }
            }
            catch
            {
                return false;
            }
        }

        private void OnToggleClicked(object sender, EventArgs e)
        {
            if (_corriendo)
            {
                try
                {
                    using (var client = new HttpClient { Timeout = TimeSpan.FromSeconds(3) })
                    {
                        var response = client.PostAsync($"{ApiUrl}/app/quit", null).Result;
                    }
                    MessageBox.Show("Programa apagado.", "Listo", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                catch
                {
                    MessageBox.Show("No se pudo apagar. Puede que ya estuviera detenido.", "Aviso", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                }
            }
            else
            {
                var launcher = Path.Combine(_appDir, "Launcher.exe");
                if (File.Exists(launcher))
                {
                    System.Diagnostics.Process.Start(launcher);
                    MessageBox.Show("Programa encendido.", "Listo", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                else
                {
                    MessageBox.Show("No se encontró Launcher.exe en esta carpeta.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                }
            }
            Close();
        }
    }
}

