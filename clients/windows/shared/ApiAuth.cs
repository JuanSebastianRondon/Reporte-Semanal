using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Threading;

namespace ReporteSemanal.Shared
{
    /// <summary>
    /// Construye un HttpClient que envía el token local exigido por la API.
    /// El token lo genera el backend en el archivo .token de la carpeta raíz.
    /// </summary>
    internal static class ApiAuth
    {
        private const int ApiPort = 4577;
        internal const string StatusUrl = "http://localhost:4577/status";
        internal static readonly TimeSpan RequestTimeout = TimeSpan.FromSeconds(5);
        internal static readonly TimeSpan ProbeTimeout = TimeSpan.FromSeconds(1);
        internal static readonly TimeSpan StartupTimeout = TimeSpan.FromSeconds(30);

        internal static HttpClient CreateHttpClient(TimeSpan? timeout = null)
        {
            var client = new HttpClient { Timeout = timeout ?? RequestTimeout };
            var token = ReadToken();
            if (!string.IsNullOrEmpty(token))
            {
                client.DefaultRequestHeaders.Add("X-Report-Token", token);
            }
            return client;
        }

        /// <summary>
        /// Consulta /status con el token local. Devuelve false si el backend no
        /// responde, todavía está arrancando o el token no es válido.
        /// </summary>
        internal static bool IsBackendRunning(TimeSpan? timeout = null)
        {
            try
            {
                using (var client = CreateHttpClient(timeout ?? ProbeTimeout))
                {
                    var response = client.GetAsync(StatusUrl).Result;
                    return response.IsSuccessStatusCode;
                }
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Espera hasta que el backend responda /status o se agote el tiempo.
        /// Se usa para no dar por encendido el servicio antes de que escuche.
        /// </summary>
        internal static bool WaitForBackend(TimeSpan? timeout = null)
        {
            var limit = timeout ?? StartupTimeout;
            var watch = Stopwatch.StartNew();

            while (true)
            {
                if (IsBackendRunning()) return true;
                if (watch.Elapsed >= limit) return false;
                Thread.Sleep(400);
            }
        }

        internal static string ReadToken()
        {
            // Si otra instalación ya tiene el puerto, su token puede ser distinto.
            // Se toma de la carpeta raíz de ese node.exe para reconocerlo.
            var pid = FindListeningPid(ApiPort);
            if (pid > 0)
            {
                try
                {
                    var nodePath = Process.GetProcessById(pid).MainModule.FileName;
                    var runtimeDir = Path.GetDirectoryName(nodePath);
                    var appDir = Directory.GetParent(runtimeDir);
                    if (appDir != null)
                    {
                        var runningToken = Path.Combine(appDir.FullName, ".token");
                        if (File.Exists(runningToken))
                        {
                            return File.ReadAllText(runningToken).Trim();
                        }
                    }
                }
                catch
                {
                    // Proceso inaccessible: se usa el token de esta carpeta.
                }
            }

            var dir = AppDomain.CurrentDomain.BaseDirectory;
            var candidates = new[]
            {
                Path.Combine(dir, ".token"),
                Path.GetFullPath(Path.Combine(dir, "..", ".token")),
                Path.GetFullPath(Path.Combine(dir, "..", "..", ".token")),
            };

            foreach (var candidate in candidates)
            {
                if (File.Exists(candidate))
                {
                    return File.ReadAllText(candidate).Trim();
                }
            }
            return string.Empty;
        }

        private static int FindListeningPid(int port)
        {
            try
            {
                var info = new ProcessStartInfo
                {
                    FileName = "netstat.exe",
                    // Sin -p: el backend escucha en ::1 (TCPv6) y -p tcp solo ve IPv4.
                    Arguments = "-ano",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true,
                };

                using (var process = Process.Start(info))
                {
                    var needle = ":" + port;
                    string line;
                    while ((line = process.StandardOutput.ReadLine()) != null)
                    {
                        if (line.IndexOf(needle, StringComparison.Ordinal) < 0) continue;
                        if (line.IndexOf("LISTENING", StringComparison.OrdinalIgnoreCase) < 0) continue;

                        var parts = line.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                        int listeningPid;
                        if (parts.Length >= 5 &&
                            int.TryParse(parts[parts.Length - 1], out listeningPid))
                        {
                            return listeningPid;
                        }
                    }
                }
            }
            catch
            {
                // netstat no disponible: se mantiene el comportamiento anterior.
            }
            return 0;
        }
    }
}
