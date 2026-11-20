using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;
using ReporteSemanal.Shared;

namespace ReporteLauncher
{
    internal static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            var silent = Array.Exists(
                args,
                a => string.Equals(a, "--silent", StringComparison.OrdinalIgnoreCase)
            );

            AppDomain.CurrentDomain.UnhandledException += (sender, e) =>
            {
                if (!silent)
                {
                    MessageBox.Show(
                        "No se pudo iniciar el servicio:\n\n" + e.ExceptionObject,
                        "Error",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                }
            };

            try
            {
                var appDir = Application.StartupPath;
                var nodeExe = Path.Combine(appDir, "runtime", "node.exe");
                var mainJs = Path.Combine(appDir, "dist", "main.js");

                if (!File.Exists(nodeExe) || !File.Exists(mainJs))
                {
                    if (!silent)
                    {
                        MessageBox.Show(
                            "No se pudo encontrar los archivos necesarios para iniciar.",
                            "Reporte Semanal",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Error
                        );
                    }
                    return;
                }

                if (ApiAuth.IsBackendRunning())
                {
                    if (!silent)
                    {
                        MessageBox.Show(
                            "El servicio ya esta corriendo",
                            "Reporte Semanal",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Information
                        );
                    }
                    return;
                }

                // Si el lock pertenece a un proceso vivo, el backend ya está
                // arrancando: no conviene lanzar una segunda instancia.
                if (!HasLiveBackendLock(appDir))
                {
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

                if (!ApiAuth.WaitForBackend(ApiAuth.StartupTimeout))
                {
                    if (!silent)
                    {
                        MessageBox.Show(
                            "El servicio no respondió al iniciar. Revise que el puerto 4577 esté libre.",
                            "Reporte Semanal",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Error
                        );
                    }
                    return;
                }

                if (!silent)
                {
                    MessageBox.Show(
                        "Programa encendido.",
                        "Listo",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Information
                    );
                }
            }
            catch (Exception ex)
            {
                if (!silent)
                {
                    MessageBox.Show(
                        "No se pudo iniciar el servicio:\n\n" + ex.Message,
                        "Error",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                }
            }
        }

        private static bool HasLiveBackendLock(string appDir)
        {
            var lockPath = Path.Combine(appDir, ".lock");
            if (!File.Exists(lockPath)) return false;

            int pid;
            if (!int.TryParse(File.ReadAllText(lockPath).Trim(), out pid)) return false;

            try
            {
                var process = Process.GetProcessById(pid);
                return !process.HasExited;
            }
            catch
            {
                return false;
            }
        }
    }
}