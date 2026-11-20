using System;
using System.IO;
using System.Net.Http;

namespace ReporteSemanal.Shared
{
    /// <summary>
    /// Construye un HttpClient que envía el token local exigido por la API.
    /// El token lo genera el backend en el archivo .token de la carpeta raíz.
    /// </summary>
    internal static class ApiAuth
    {
        internal static readonly TimeSpan RequestTimeout = TimeSpan.FromSeconds(5);

        internal static HttpClient CreateHttpClient()
        {
            var client = new HttpClient { Timeout = RequestTimeout };
            var token = ReadToken();
            if (!string.IsNullOrEmpty(token))
            {
                client.DefaultRequestHeaders.Add("X-Report-Token", token);
            }
            return client;
        }

        internal static string ReadToken()
        {
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
    }
}
