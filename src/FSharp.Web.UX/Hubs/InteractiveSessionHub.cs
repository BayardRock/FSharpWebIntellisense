using BayardRock.FSharpWeb.Intellisense.UX.Controllers;
using Microsoft.AspNet.SignalR;
using System;

namespace BayardRock.FSharpWeb.Intellisense.UX.Hubs
{
    public class InteractiveSessionHub : Hub
    {
        /// <summary>
        /// Get the declarations for the specified F# source code at the
        /// specified line index and column index.
        /// </summary>
        /// <param name="source">The F# source code</param>
        /// <param name="lineIndex">The line that the user is on</param>
        /// <param name="colIndex">The column that the user is on</param>
        public void GetDeclarations(String source, int lineIndex, int colIndex)
        {
            using (var c = new IntellisenseController())
            {
                var declarations = c.Get(source, lineIndex, colIndex);
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
                var errors = c.Get(source);
                Clients.Caller.sendErrors(errors);
            }
        }
    }
}