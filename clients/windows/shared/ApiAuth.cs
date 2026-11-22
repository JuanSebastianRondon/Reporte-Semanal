using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Threading;

namespace ReporteSemanal.Shared
{
    /// <summary>
    /// Construye un HttpClient que envía el token local exigido por la API.
    /// El token lo genera el backend en el archivo .token de la carpeta raíz.
    /// Se resuelve una sola vez por proceso (y se reintenta solo si la API
    /// responde 401) para no lanzar netstat.exe en cada sondeo.
    /// </summary>
    internal static class ApiAuth
    {
        private const int ApiPort = 4577;
        private const string TokenHeader = "X-Report-Token";

        internal const string StatusUrl = "http://localhost:4577/status";
        internal static readonly TimeSpan RequestTimeout = TimeSpan.FromSeconds(5);
        internal static readonly TimeSpan ProbeTimeout = TimeSpan.FromSeconds(1);
        internal static readonly TimeSpan StartupTimeout = TimeSpan.FromSeconds(30);

        private static readonly object TokenLock = new object();
        private static string _cachedToken = string.Empty;
        private static bool _tokenLoaded;

        internal static HttpClient CreateHttpClient(TimeSpan? timeout = null)
        {
            var client = new HttpClient { Timeout = timeout ?? RequestTimeout };
            SetTokenHeader(client, GetToken(false));
            return client;
        }

        /// <summary>
        /// Consulta /status con el token local. Devuelve false si el backend no
        /// responde, todavía está arrancando o el token no es válido.
        /// </summary>
        internal static bool IsBackendRunning(TimeSpan? timeout = null)
        {
            var probeTimeout = timeout ?? ProbeTimeout;
            using (var client = CreateHttpClient(probeTimeout))
            {
                return Probe(client, true);
            }
        }

        /// <summary>
        /// Espera hasta que el backend responda /status o se agote el tiempo.
        /// Reutiliza el mismo HttpClient y el mismo token durante toda la espera.
        /// </summary>
        internal static bool WaitForBackend(TimeSpan? timeout = null)
        {
            var limit = timeout ?? StartupTimeout;
            var watch = Stopwatch.StartNew();

            using (var client = CreateHttpClient(ProbeTimeout))
            {
                while (true)
                {
                    if (Probe(client, true)) return true;
                    if (watch.Elapsed >= limit) return false;
                    Thread.Sleep(400);
                }
            }
        }

        private static bool Probe(HttpClient client, bool allowTokenRefresh)
        {
            try
            {
                using (var response = client.GetAsync(StatusUrl).GetAwaiter().GetResult())
                {
                    if (response.StatusCode == HttpStatusCode.Unauthorized && allowTokenRefresh)
                    {
                        SetTokenHeader(client, GetToken(true));
                        return Probe(client, false);
                    }

                    return response.IsSuccessStatusCode;
                }
            }
            catch
            {
                return false;
            }
        }

        private static void SetTokenHeader(HttpClient client, string token)
        {
            client.DefaultRequestHeaders.Remove(TokenHeader);
            if (!string.IsNullOrEmpty(token))
            {
                client.DefaultRequestHeaders.Add(TokenHeader, token);
            }
        }

        private static string GetToken(bool refresh)
        {
            lock (TokenLock)
            {
                if (!_tokenLoaded || refresh)
                {
                    _cachedToken = ReadToken();
                    _tokenLoaded = true;
                }
                return _cachedToken;
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
