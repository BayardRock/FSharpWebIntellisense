using Microsoft.Owin;
using Owin;

[assembly: OwinStartup(typeof(BayardRock.FSharpWeb.Intellisense.UX.AppStartup))]
namespace BayardRock.FSharpWeb.Intellisense.UX
{
    public class AppStartup
    {
        public void Configuration(IAppBuilder app)
        {
            // config camel case serialization
            //var settings = new JsonSerializerSettings();
            //settings.ContractResolver = new CamelCasePropertyNamesContractResolver();
            //var serializer = JsonSerializer.Create(settings);
            //GlobalHost.DependencyResolver.Register(typeof(JsonSerializer), () => serializer);

            // map the hubs
            app.MapSignalR();
        }
    }
}
