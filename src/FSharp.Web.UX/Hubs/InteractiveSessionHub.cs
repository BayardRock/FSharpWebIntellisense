using BayardRock.FSharpWeb.Intellisense.UX.Controllers;
using Microsoft.AspNet.SignalR;
using System;

namespace BayardRock.FSharpWeb.Intellisense.UX.Hubs
{
    public class InteractiveSessionHub : Hub
    {
        /// <summary>
        /// Get the methods for the specified F# source code at the
        /// specified line index and column index.
        /// </summary>
        /// <param name="source">The F# source code</param>
        /// <param name="lineNumber">The line that the user is on</param>
        /// <param name="colIndex">The column that the user is on</param>
        public void GetMethods(String source, int lineNumber, int colIndex)
        {
            using (var c = new MethodsController())
            {
                var request = new MethodsController.MethodsRequest
                {
                    ColIndex = colIndex,
                    LineNumber = lineNumber,
                    Source = source
                };
                var methods = c.Post(request);
                Clients.Caller.sendMethods(methods);
            }
        }

        /// <summary>
        /// Get the declarations for the specified F# source code at the
        /// specified line index and column index.
        /// </summary>
        /// <param name="source">The F# source code</param>
        /// <param name="lineNumber">The line that the user is on</param>
        /// <param name="colIndex">The column that the user is on</param>
        public void GetDeclarations(String source, int lineNumber, int colIndex)
        {
            using (var c = new IntellisenseController())
            {
                var request = new IntellisenseController.IntellisenseRequest
                {
                    ColIndex = colIndex,
                    LineNumber = lineNumber,
                    Source = source
                };
                var declarations = c.Post(request);
                Clients.Caller.sendDeclarations(declarations);
            }
        }

        /// <summary>
        /// Compiles the specified source and sends errors to the client.
        /// </summary>
        /// <param name="source">The source to compile.</param>
        public void Compile(String source)
        {
            using (var c = new CompileController())
            {
                var request = new CompileController.CompileRequest { Source = source };
                var errors = c.Post(request);
                Clients.Caller.sendErrors(errors);
            }
        }
    }
}