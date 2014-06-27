using System;
using System.Collections.Generic;
using System.Web.Http;

namespace BayardRock.FSharpWeb.Intellisense.UX.Controllers
{
    public class MethodsController : ApiController
    {
        public class MethodsRequest
        {
            public String Source { get; set; }
            public int LineNumber { get; set; }
            public int ColIndex { get; set; }
        }

        /// <summary>
        /// Gets the methods for the specified source code.
        /// </summary>
        /// <param name="req">The request.</param>
        public IEnumerable<String> Post(MethodsRequest req)
        {
            return WebApiApplication.Compiler.GetMethods(req.Source, req.LineNumber, req.ColIndex);
        }
    }
}