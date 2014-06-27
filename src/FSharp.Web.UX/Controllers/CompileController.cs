using Microsoft.FSharp.Compiler;
using System;
using System.Collections.Generic;
using System.Web.Http;

namespace BayardRock.FSharpWeb.Intellisense.UX.Controllers
{
    public class CompileController : ApiController
    {
        public class CompileRequest
        {
            public String Source { get; set; }
        }

        /// <summary>
        /// Compiles the specified code and returns errors.
        /// </summary>
        /// <param name="req">The request</param>
        public IEnumerable<ErrorInfo> Post(CompileRequest req)
        {
            // short circuit bad requests
            if (String.IsNullOrEmpty(req.Source))
            {
                return new List<ErrorInfo>();
            }

            var c = WebApiApplication.Compiler.TypeCheck(req.Source, "/home/test.fsx");
            return c.Check.Errors;
        }
    }
}
