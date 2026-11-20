using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Windows.Forms;
using ReporteSemanal.Shared;

namespace ReporteControl
{
    internal static class Program
    {
        [STAThread]
        private static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);

            AppDomain.CurrentDomain.UnhandledException += (sender, e) =>
                MessageBox.Show(
                    "Error no controlado:\n\n" + e.ExceptionObject,
                    "Reporte Semanal",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );

            Application.ThreadException += (sender, e) =>
                MessageBox.Show(
                    "Error no controlado:\n\n" + e.Exception.Message,
                    "Reporte Semanal",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );

            Application.Run(new ControlForm());
        }
    }

    public class ControlForm : Form
    {
        private readonly string _appDir;
        private bool _corriendo;
        private Label _labelEstado;
        private Button _boton;

        public ControlForm()
        {
            _appDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\', '/');
            _corriendo = ApiAuth.IsBackendRunning();

            Text = "Reporte Semanal - Control";
            ClientSize = new Size(320, 160);
            StartPosition = FormStartPosition.CenterScreen;
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            BackColor = Color.FromArgb(45, 43, 61);
            Shown += (sender, e) => { Activate(); BringToFront(); };

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

            _labelEstado = new Label
            {
                Font = new Font("Segoe UI", 9),
                BackColor = Color.Transparent,
                Size = new Size(280, 20),
                Location = new Point(20, 48)
            };
            Controls.Add(_labelEstado);

            _boton = new Button
            {
                Font = new Font("Segoe UI", 10, FontStyle.Bold),
                Location = new Point(20, 85),
                Size = new Size(280, 40),
                FlatStyle = FlatStyle.Flat,
                ForeColor = Color.FromArgb(232, 238, 245),
                Cursor = Cursors.Hand
            };
            _boton.FlatAppearance.BorderColor = Color.FromArgb(232, 238, 245);
            _boton.Click += OnToggleClicked;
            Controls.Add(_boton);

            AcceptButton = _boton;
            ActualizarEstado();
        }

        private void ActualizarEstado()
        {
            _labelEstado.Text = _corriendo ? "Estado: Activo" : "Estado: Inactivo";
            _labelEstado.ForeColor = _corriendo
                ? Color.FromArgb(134, 239, 172)
                : Color.FromArgb(252, 165, 165);
            _boton.Text = _corriendo ? "Apagar" : "Encender";
            _boton.BackColor = _corriendo
                ? Color.FromArgb(45, 43, 61)
                : Color.FromArgb(61, 80, 128);
        }

        private void OnToggleClicked(object sender, EventArgs e)
        {
            // El estado pudo cambiar mientras el formulario estaba abierto.
            _corriendo = ApiAuth.IsBackendRunning();
            ActualizarEstado();

            if (_corriendo)
            {
                try
                {
                    using (var client = ApiAuth.CreateHttpClient())
                    {
                        var response = client.PostAsync("http://localhost:4577/app/quit", null).Result;
                    }
                    MessageBox.Show("Programa apagado.", "Listo", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
                catch
                {
                    MessageBox.Show("No se pudo apagar. Puede que ya estuviera detenido.", "Aviso", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                }
                Close();
                return;
            }

            var launcher = Path.Combine(_appDir, "Launcher.exe");
            if (!File.Exists(launcher))
            {
                MessageBox.Show("No se encontró Launcher.exe en esta carpeta.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            try
            {
                var info = new ProcessStartInfo
                {
                    FileName = launcher,
                    Arguments = "--silent",
                    WorkingDirectory = _appDir,
                    UseShellExecute = true
                };
                Process.Start(info);

                if (!ApiAuth.WaitForBackend(ApiAuth.StartupTimeout))
                {
                    MessageBox.Show(
                        "El servicio no respondió al iniciar. Revise que el puerto 4577 esté libre.",
                        "Error",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    return;
                }

                _corriendo = true;
                ActualizarEstado();
                MessageBox.Show("Programa encendido.", "Listo", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "No se pudo encender el servicio:\n\n" + ex.Message,
                    "Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return;
            }

            Close();
        }
    }
}

