using System.Web.Optimization;

namespace BayardRock.FSharpWeb.Intellisense.UX
{
    public class BundleConfig
    {
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/bundles/jquery").Include("~/scripts/jquery-{version}.js"));
            bundles.Add(new ScriptBundle("~/bundles/jqueryui").Include("~/scripts/jquery-ui-{version}.js"));
            bundles.Add(new ScriptBundle("~/bundles/jqueryval").Include("~/scripts/jquery.unobtrusive*", "~/scripts/jquery.validate*"));
            bundles.Add(new ScriptBundle("~/bundles/modernizr").Include("~/scripts/modernizr-*"));
            bundles.Add(new StyleBundle("~/content/css").Include("~/content/site.css"));
        }
    }
}