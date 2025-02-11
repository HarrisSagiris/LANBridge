using System;
using System.Threading.Tasks;
using LanBridge;

class Program
{
    static async Task Main(string[] args)
    {
        Console.WriteLine("1. Start Server");
        Console.WriteLine("2. Connect to Server");
        Console.Write("Choose an option (1 or 2): ");
        
        string choice = Console.ReadLine();

        switch (choice)
        {
            case "1":
                var server = new BridgeServer();
                await server.StartServer();
                break;

            case "2":
                Console.Write("Enter server IP address: ");
                string ipAddress = Console.ReadLine();
                Console.Write("Enter connection code: ");
                string connectionCode = Console.ReadLine();

                var client = new BridgeClient();
                await client.ConnectToServer(ipAddress, connectionCode);
                break;

            default:
                Console.WriteLine("Invalid option selected.");
                break;
        }

        Console.WriteLine("Press any key to exit...");
        Console.ReadKey();
    }
}
