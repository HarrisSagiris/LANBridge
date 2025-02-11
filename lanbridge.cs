using System;
using System.Net;
using System.Net.Sockets;
using System.Threading.Tasks;
using System.Security.Cryptography;
using System.IO;
using System.Runtime.CompilerServices;

namespace LanBridge
{
    public class Startup
    {
        public async Task<object> Invoke(object input)
        {
            return null;
        }
    }

    public class BridgeServer
    {
        private TcpListener server;
        private readonly int port = 5000;
        private string connectionCode;
        private Task listenerTask;

        public BridgeServer()
        {
            GenerateConnectionCode();
        }

        private void GenerateConnectionCode()
        {
            // Generate a 6-character alphanumeric code
            var random = new RNGCryptoServiceProvider();
            var bytes = new byte[4];
            random.GetBytes(bytes);
            connectionCode = BitConverter.ToString(bytes).Replace("-", "").Substring(0, 6);
        }

        public async Task<string> StartServer()
        {
            server = new TcpListener(IPAddress.Any, port);
            server.Start();
            Console.WriteLine($"Server started. Connection code: {connectionCode}");

            // Start listening for clients in a separate task
            listenerTask = Task.Run(async () =>
            {
                while (true)
                {
                    TcpClient client = await server.AcceptTcpClientAsync();
                    _ = HandleClientAsync(client);
                }
            });

            // Return the connection code so it can be displayed in the UI
            return connectionCode;
        }

        private async Task HandleClientAsync(TcpClient client)
        {
            using (NetworkStream stream = client.GetStream())
            using (StreamReader reader = new StreamReader(stream))
            using (StreamWriter writer = new StreamWriter(stream))
            {
                string receivedCode = await reader.ReadLineAsync();
                if (receivedCode == connectionCode)
                {
                    await writer.WriteLineAsync("CONNECTED");
                    await writer.FlushAsync();
                    // Handle file transfers, terminal commands, etc.
                }
                else
                {
                    await writer.WriteLineAsync("INVALID_CODE");
                    await writer.FlushAsync();
                    client.Close();
                }
            }
        }
    }

    public class BridgeClient
    {
        private TcpClient client;
        private readonly int port = 5000;

        public async Task ConnectToServer(string ipAddress, string connectionCode)
        {
            try
            {
                client = new TcpClient();
                await client.ConnectAsync(ipAddress, port);

                using (NetworkStream stream = client.GetStream())
                using (StreamWriter writer = new StreamWriter(stream))
                using (StreamReader reader = new StreamReader(stream))
                {
                    await writer.WriteLineAsync(connectionCode);
                    await writer.FlushAsync();

                    string response = await reader.ReadLineAsync();
                    if (response == "CONNECTED")
                    {
                        Console.WriteLine("Successfully connected to server");
                        // Handle file transfers, terminal commands, etc.
                    }
                    else
                    {
                        throw new Exception("Invalid connection code");
                    }
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Connection failed: {ex.Message}");
            }
        }
    }
}
