using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;

namespace BayardRock.FSharpWeb.Intellisense.UX.Controllers
{
    public class IntellisenseController : ApiController
    {
        public class IntellisenseRequest
        {
            public String Source { get; set; }
            public int LineNumber { get; set; }
            public int ColIndex { get; set; }
        }

        /// <summary>
        /// Gets the intellisense declarations for the specified request.
        /// </summary>
        /// <param name="req">The request.</param>
        public IEnumerable<SimpleDeclaration> Post(IntellisenseRequest req)
        {
            var decls = WebApiApplication.Compiler.GetDeclarations(req.Source, req.LineNumber, req.ColIndex);
            return decls.Item2
                .OrderBy(x => x.Name)
                .ToList();
        }
    }
}
