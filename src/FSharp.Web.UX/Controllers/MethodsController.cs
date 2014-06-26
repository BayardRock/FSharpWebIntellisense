using System;
using System.Collections.Generic;
using System.Web.Http;

namespace BayardRock.FSharpWeb.Intellisense.UX.Controllers
{
    public class MethodsController : ApiController
    {
        public IEnumerable<String> Get(String source, int lineIndex, int colIndex)
        {
            return IntellisenseHelper.GetMethods(source, lineIndex, colIndex);
        }
    }
}
