using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Windows.Forms;

namespace ReporteLauncher
{
    internal static class Program
    {
        private const string ApiUrl = "http://localhost:4577/status";
        
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            
            if(IsBackendRunning())
            {
                MessageBox.Show(
                    "El servicio ya esta corriendo",
                    "Reporte Semanal",
                    MessageBoxButtons.OK,
                     MessageBoxIcon.Information
                );
                return;
            }

            var appDir = Application.StartupPath;
            var nodeExe = Path.Combine(appDir, "runtime", "node.exe");
            var mainJs = Path.Combine(appDir, "dist", "main.js");
            
            if (!File.Exists(nodeExe) || !File.Exists(mainJs))
            {
                MessageBox.Show(
                    "No se pudo encontrar los archivos necesarios para iniciar.",
                    "Reporte Semanal",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return;
            }

            var info = new ProcessStartInfo
            {
                FileName = nodeExe,
                Arguments = $"\"{mainJs}\"",
                WorkingDirectory = appDir,
                WindowStyle = ProcessWindowStyle.Hidden,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            Process.Start(info);
            
        }

        private static bool IsBackendRunning()
        {
            try
            {
                using (var client = new HttpClient{Timeout = TimeSpan.FromSeconds(2)})
                {
                    var response = client.GetAsync(ApiUrl).Result;
                    return response.IsSuccessStatusCode;
                }
            }
            catch
            {
                return false;
            }
        }
    }
}