using Microsoft.AspNet.SignalR;
using System;
using System.Diagnostics;

namespace BayardRock.ModelAnalysis.UX.Hubs
{
    public class InteractiveSession
    {
        public String ConnectionId { get; set; }
        public Process FsiProcess { get; set; }

        public void StartSession()
        {
            // clear interactive session
            var hub = GlobalHost.ConnectionManager.GetHubContext<InteractiveSessionHub>();
            hub.Clients.Client(ConnectionId).clearInteractive();

            // start up FSI
            String fileName = @"C:\Program Files (x86)\Microsoft SDKs\F#\3.1\Framework\v4.0\FsiAnyCPU.exe";

            ProcessStartInfo psi = new ProcessStartInfo(fileName);
            psi.RedirectStandardError = true;
            psi.RedirectStandardInput = true;
            psi.RedirectStandardOutput = true;
            psi.UseShellExecute = false;

            FsiProcess = Process.Start(psi);
            FsiProcess.OutputDataReceived += FsiProcess_OutputDataReceived;
            FsiProcess.ErrorDataReceived += FsiProcess_ErrorDataReceived;
            FsiProcess.BeginOutputReadLine();
            FsiProcess.BeginErrorReadLine();
        }

        public void SendToInteractive(String code)
        {
            FsiProcess.StandardInput.Write(code);
            FsiProcess.StandardInput.WriteLine(";;");
        }

        void FsiProcess_ErrorDataReceived(Object sender, DataReceivedEventArgs e)
        {
            if (e.Data != null)
            {
                var hub = GlobalHost.ConnectionManager.GetHubContext<InteractiveSessionHub>();
                hub.Clients.Client(ConnectionId).sendError(e.Data);
            }
        }

        void FsiProcess_OutputDataReceived(Object sender, DataReceivedEventArgs e)
        {
            if (e.Data != null)
            {
                var hub = GlobalHost.ConnectionManager.GetHubContext<InteractiveSessionHub>();
                hub.Clients.Client(ConnectionId).sendMessage(e.Data);
            }
        }

        public void StopSession()
        {
            if (FsiProcess != null)
            {
                FsiProcess.Kill();
            }
        }
    }
}