using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;

namespace BayardRock.FSharpWeb.Intellisense.UX.Controllers
{
    public class IntellisenseController : ApiController
    {
        public IEnumerable<IntellisenseItem> Get(String source, int lineIndex, int colIndex)
        {
            return IntellisenseHelper.GetDeclarations(source, lineIndex, colIndex)
                .Select(x => new IntellisenseItem(x))
                .OrderBy(x => x.Name)
                .ToList();
        }
    }
}
