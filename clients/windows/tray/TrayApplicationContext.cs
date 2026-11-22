using System;
using System.Drawing;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using ReporteSemanal.Shared;

namespace ReporteTray
{
    public class TrayApplicationContext : ApplicationContext
    {
        private const string ApiBaseUrl = "http://localhost:4577";

        private static readonly JavaScriptSerializer Serializer = new JavaScriptSerializer();
        private static readonly Icon WarningIcon = SystemIcons.Warning;

        private readonly NotifyIcon _trayIcon;
        private readonly Timer _pollTimer;
        private readonly HttpClient _http;

        private readonly Icon _appIcon;
        private bool _polling;

        public TrayApplicationContext()
        {
            _appIcon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);

            _http = ApiAuth.CreateHttpClient();

            var menu = new ContextMenuStrip();
            menu.Items.Add("Generar reporte ahora", null, OnGenerateReportClicked);
            menu.Items.Add("Abrir carpeta de datos", null, OnOpenDataFolderClicked);
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("Salir", null, OnExitClicked);

            _trayIcon = new NotifyIcon
            {
                Icon = _appIcon,
                ContextMenuStrip = menu,
                Visible = true,
                Text = "Reporte Semanal de Productividad"
            };

            _pollTimer = new System.Windows.Forms.Timer { Interval = 5000 };
            _pollTimer.Tick += async (s, e) => await PollStatusAsync();
            _pollTimer.Start();

            _ = PollStatusAsync();
        }

        private async Task PollStatusAsync()
        {
            // Si el servicio tarda más de 5 s, se ignoran los ticks solapados;
            // el siguiente tick recogerá el estado actual.
            if (_polling) return;
            _polling = true;
            try
            {
                var response = await _http.GetStringAsync($"{ApiBaseUrl}/status");
                var data = Serializer.Deserialize<StatusResponse>(response);

                if (_trayIcon.Icon != _appIcon) _trayIcon.Icon = _appIcon;
                _trayIcon.Text = TrimTooltip(
                    $"Esta semana: {data.weekTotal}\nÚltimo reporte: {data.lastReportSentAt ?? "sin enviar aún"}"
                );
            }
            catch
            {
                if (_trayIcon.Icon != WarningIcon) _trayIcon.Icon = WarningIcon;
                _trayIcon.Text = "No se pudo conectar con el servicio";
            }
            finally
            {
                _polling = false;
            }
        }

        private static string TrimTooltip(string text) =>
            text.Length > 127 ? text.Substring(0, 127) : text; // límite de NotifyIcon.Text

        private async void OnGenerateReportClicked(object sender, EventArgs e)
        {
            try
            {
                await _http.PostAsync($"{ApiBaseUrl}/report/generate", null);
                MessageBox.Show("Reporte generado y enviado.", "Reporte Semanal",
                    MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch
            {
                MessageBox.Show("No se pudo generar el reporte. ¿Está corriendo el servicio?",
                    "Reporte Semanal", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private async void OnOpenDataFolderClicked(object sender, EventArgs e)
        {
            try
            {
                var response = await _http.GetStringAsync($"{ApiBaseUrl}/app/data-folder");
                var data = Serializer.Deserialize<DataFolderResponse>(response);
                System.Diagnostics.Process.Start("explorer.exe", data.path);
            }
            catch
            {
                var fallback = System.IO.Path.GetFullPath(
                    System.IO.Path.Combine(Application.StartupPath, "..")
                );
                System.Diagnostics.Process.Start("explorer.exe", fallback);
            }
        }

        private async void OnExitClicked(object sender, EventArgs e)
        {
            try
            {
                await _http.PostAsync($"{ApiBaseUrl}/app/quit", null);
            }
            catch
            {
                // El backend puede ya estar caído. No bloquear el cierre del tray por esto.
            }

            _trayIcon.Visible = false;
            Application.Exit();
        }

        private class StatusResponse
        {
            public string weekTotal { get; set; }
            public string lastReportSentAt { get; set; }
        }

        private class DataFolderResponse
        {
            public string path { get; set; }
        }
    }
}