var Compiler = function (editor, userCallback)
{
    function getDocumentHead(doc)
    {
        doc = doc || document;
        return doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement;
    }

    function hasCssString(id, doc)
    {
        var index = 0, sheets;
        doc = doc || document;

        if (doc.createStyleSheet && (sheets = doc.styleSheets))
        {
            while (index < sheets.length)
                if (sheets[index++].owningElement.id === id) return true;
        }
        else if ((sheets = doc.getElementsByTagName("style")))
        {
            while (index < sheets.length)
                if (sheets[index++].id === id) return true;
        }
        return false;
    }

    function importCssString(cssText, id, doc)
    {
        doc = doc || document;
        // If style is already imported return immediately.
        if (id && hasCssString(id, doc))
            return null;

        if (doc.createStyleSheet)
        {
            var style = doc.createStyleSheet();
            style.cssText = cssText;
            if (id) style.owningElement.id = id;
        }
        else
        {
            var style = doc.createElement("style");
            style.appendChild(doc.createTextNode(cssText));
            if (id) style.id = id;
            getDocumentHead(doc).appendChild(style);
        }
    }

    var cssText =
".br-errormarker {" +
"   background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAQCAYAAAAxtt7zAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjExR/NCNwAAABdJREFUKFNjGNbgPxihAZggiiSEw8AAAMxEB/k37k01AAAAAElFTkSuQmCC);" +
"   background-repeat: repeat-x;" +
"   background-position: left bottom;" +
"   margin-bottom: -1px;" +
"}";

    importCssString(cssText, 'br-compiler');

    var self = this;
    self.timeout = 5000;

    // callback called by the end-user
    self.updateMarkers = function (data)
    {
        // clear our error marks
        editor.doc.getAllMarks()
            .forEach(function (m)
            {
                if (m.className === 'br-errormarker')
                {
                    m.clear();
                }
            });

        // add new error marks
        data.forEach(function (err)
        {
            var from = { line: err.startLine, ch: err.startColumn };
            var to = { line: err.endLine, ch: err.endColumn };
            editor.doc.markText(from, to, { title: err.message, className: 'br-errormarker' });
        });

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