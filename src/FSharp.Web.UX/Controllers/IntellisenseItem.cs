using Microsoft.FSharp.Compiler.SourceCodeServices;
using System;
using System.Collections.Generic;
using System.Text;

namespace BayardRock.FSharpWeb.Intellisense.UX.Controllers
{
    public class IntellisenseItem
    {
        public int Glyph { get; set; }
        public String Name { get; set; }
        public List<IntellisenseOverride> Overrides { get; set; }
        public String Documentation { get; set; }

        public IntellisenseItem(Declaration dtt)
        {
            Overrides = new List<IntellisenseOverride>();
            Name = dtt.Name;
            Glyph = dtt.Glyph;

            StringBuilder docs = new StringBuilder();
            foreach (var element in dtt.DescriptionText.Item)
            {
                if (element.IsDataTipElement)
                {
                    var x = (DataTipElement.DataTipElement)element;
                    Documentation = x.Item1;
                }
                else if (element.IsDataTipElementGroup)
                {
                    foreach (var subElement in ((DataTipElement.DataTipElementGroup)element).Item)
                    {
                        docs.AppendLine(subElement.Item1);
                        Overrides.Add(new IntellisenseOverride
                        {
                            Name = subElement.Item1
                        });
                    }
                }
            }

            if (String.IsNullOrEmpty(Documentation))
            {
                Documentation = docs.ToString();
            }
        }

        private static String XmlCommentToString(XmlComment c)
        {
            if (c.IsXmlCommentSignature)
            {
                var x = (XmlComment.XmlCommentSignature)c;
                return x.Item1;
            }
            else if (c.IsXmlCommentText)
            {
                var x = (XmlComment.XmlCommentText)c;
                return x.Item;
            }

            return c.ToString();
        }

        /// <summary>
        /// Gets the name.
        /// </summary>
        public override String ToString()
        {
            return Name;
        }
    }

    public class IntellisenseOverride
    {
        public String Name { get; set; }
        public List<IntellisenseArgument> Arguments { get; set; }
        public String Documentation { get; set; }

        public IntellisenseOverride()
        {
            Arguments = new List<IntellisenseArgument>();
        }
    }

    public class IntellisenseArgument
    {
        public String Name { get; set; }
        public String Documentation { get; set; }
        public String ReturnType { get; set; }
    }
}