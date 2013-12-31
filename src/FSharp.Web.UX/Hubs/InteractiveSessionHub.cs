using BayardRock.FSharpWeb.Intellisense.UX.Controllers;
using Microsoft.AspNet.SignalR;
using System;
using System.Linq;

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
            var declarations = IntellisenseHelper.GetDeclarations(source, lineIndex, colIndex)
                .Select(x => new IntellisenseItem(x))
                .OrderBy(x => x.Name)
                .ToList();

            Clients.Caller.sendDeclarations(declarations);
        }
    }
}