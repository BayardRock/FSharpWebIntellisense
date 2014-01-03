using Microsoft.FSharp.Compiler;
using System;
using System.Collections.Generic;
using System.Web.Http;

namespace BayardRock.FSharpWeb.Intellisense.UX.Controllers
{
    public class CompileController : ApiController
    {
        public IEnumerable<ErrorInfo> Get(String source)
        {
            // short circuit bad requests
            if (String.IsNullOrEmpty(source))
            {
                return new List<ErrorInfo>();
            }

            var parsed = IntellisenseHelper.Compile(source);
            return parsed.Item2.Errors;
        }
    }
}
