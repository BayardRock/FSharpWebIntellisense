ace.define('ace/compiler',
    ['require', 'exports', 'module'],
    function (require, exports, module)
    {
        //background-image: url(data:image/gif;base64,R0lGODlhBAAOAJEAAAAAAP////8AAP///yH5BAEAAAMALAAAAAAEAA4AAAIJnI+pyyg+XkwFADs=);
        var cssText =
".ace_marker-layer .br-error {" +
"   background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAQCAYAAAAxtt7zAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjExR/NCNwAAABdJREFUKFNjGNbgPxihAZggiiSEw8AAAMxEB/k37k01AAAAAElFTkSuQmCC);" +
"   background-repeat: repeat-x;" +
"   background-position: left bottom;" +
"   position: absolute;" +
"   z-index: -2;" +
"   margin-bottom: -1px;" +
"}";

        var dom = require('ace/lib/dom');
        var event = require("ace/lib/event");
        var Range = ace.require('ace/range').Range;
        dom.importCssString(cssText, 'br-compiler');

        var Compiler = function (editor, userCallback)
        {
            var self = this;

            self.timeout = 5000;
            self.markers = [];

            // callback called by the end-user
            self.updateMarkers = function (data)
            {
                var session = editor.getSession();

                // remove previous markers
                self.markers.forEach(function (m)
                {
                    session.removeMarker(m);
                });

                // create new markers
                self.markers = data.map(function (e)
                {
                    var r = new Range(e.startLine, e.startColumn, e.endLine, e.endColumn);
                    return session.addMarker(r, "br-error", "error", true);
                });

                // set up our annotations
                var annotations = data.map(function (e)
                {
                    return { row: e.startLine, column: e.startColumn, text: e.message, type: "error" };
                });
                editor.session.setAnnotations(annotations);

                // background compile asap
                self.timer = setTimeout(self.tick, self.timeout);
            };

            // background compile
            self.tick = function ()
            {
                userCallback(self.updateMarkers);
            };

            // start ticking
            self.timer = setTimeout(self.tick, self.timeout);
        };

        exports.Compiler = function (editor, userCallback)
        {
            var i = editor.compiler || new Compiler(editor, userCallback);
            editor.compiler = i;
        };
    });