var Intellisense = function (editor, userCallback, methodsCallback)
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

    // check to see if an element has a css class
    function hasCssClass(el, name)
    {
        var classes = el.className.split(/\s+/g);
        return classes.indexOf(name) !== -1;
    }

    // adds a css class from an element
    function addCssClass(el, name)
    {
        if (!hasCssClass(el, name))
        {
            el.className += " " + name;
        }
    }

    // removes a css class from an element
    function removeCssClass(el, name)
    {
        var classes = el.className.split(/\s+/g);
        while (true)
        {
            var index = classes.indexOf(name);
            if (index == -1)
            {
                break;
            }
            classes.splice(index, 1);
        }
        el.className = classes.join(" ");
    }

    function lastIndexOfAny(str, arr, start)
    {
        var max = -1;
        for (var i = 0; i < arr.length; i++)
        {
            var val = str.lastIndexOf(arr[i], start);
            max = Math.max(max, val);
        }
        return max;
    }

    var cssText =
".br-intellisense {" +
"    min-width: 220px;" +
"    max-height: 176px;" +
"    min-height: 22px;" +
"    z-index: 10;" +
"    overflow: auto;" +
"    position: absolute;" +
"    background-color: white;" +
"    border: 1px solid #E5C365;" +
"    box-shadow: 2px 3px 5px rgba(0, 0, 0, .2);" +
"    padding: 0;" +
"    margin: 5px;" +
"    display: none;" +
"}" +
".br-methods {" +
"    min-width: 220px;" +
"    min-height: 22px;" +
"    z-index: 10;" +
"    padding: 3px;" +
"    overflow: auto;" +
"    position: absolute;" +
"    background-color: #E7E8EC;" +
"    border: 1px solid #CCCEDB;" +
"    margin: 5px;" +
"    display: none;" +
"    font-family: 'Segoe UI';" +
"    font-size: 10pt;" +
"}" +
".br-methods-text {" +
"    margin-left: 75px;" +
"}" +
".br-methods-arrows {" +
"    width: 75px;" +
"    float: left;" +
"    font-family: Calibri;" +
"    font-weight: bold;" +
"    -webkit-touch-callout: none;" +
"    -webkit-user-select: none;" +
"    -khtml-user-select: none;" +
"    -moz-user-select: none;" +
"    -ms-user-select: none;" +
"    user-select: none;" +
"}" +
".br-methods-arrow {" +
"    cursor: pointer;" +
"}" +
".br-methods-arrow-text {" +
"    font-weight: normal;" +
"    margin-left: 2px;" +
"    margin-right: 2px;" +
"}" +
".br-documentation {" +
"    min-width: 200px;" +
"    padding: 3px;" +
"    overflow: auto;" +
"    position: absolute;" +
"    z-index: 10;" +
"    background-color: #E7E8EC;" +
"    border: 1px solid #CCCEDB;" +
"    box-shadow: 2px 3px 5px rgba(0,0,0,.2);" +
"    font-family: 'Segoe UI';" +
"    font-size: 10pt;" +
"    white-space: pre-line;" +
"    display: none;" +
"}" +
".br-listlink {" +
"    font-family: 'Segoe UI';" +
"    font-size: 10pt;" +
"    list-style: none;" +
"    cursor: pointer;" +
"    border: 1px solid white;" +
"    white-space: nowrap;" +
"    overflow: hidden;" +
"}" +
".br-listlink:hover {" +
"    background-color: #FDF4BF;" +
"}" +
".br-selected {" +
"    background-color: #FDF4BF;" +
"    border: 1px dotted black;" +
"}" +
".br-icon {" +
"    width: 16px;" +
"    height: 16px;" +
"    display: inline-block;" +
"    vertical-align: text-top;" +
"    margin: 2px;" +
"}";

    importCssString(cssText, 'br-intellisense');

    var self = this;

    // data element
    self.selectedIndex = 0;
    self.isAutoCompleteOpen = false;
    self.isMethodsOpen = false;
    self.filteredDeclarations = [];
    self.filteredDeclarationsUI = [];
    self.declarations = []
    self.methods = []
    self.methodsSelectedIndex = 0;
    self.autoCompleteStart = { line: 0, ch: 0 };

    // ui widgets
    self.selectedElement = null;
    self.listElement = document.createElement('ul');
    self.listElement.className = 'br-intellisense';

    self.documentationElement = document.createElement('div');
    self.documentationElement.className = 'br-documentation';

    // methods
    self.methodsElement = document.createElement('div');
    self.methodsElement.className = 'br-methods';

    // methods text
    self.methodsTextElement = document.createElement('div');
    self.methodsTextElement.className = 'br-methods-text';

    // arrows
    self.arrowsElement = document.createElement('div');
    self.arrowsElement.className = 'br-methods-arrows';

    // up arrow
    self.upArrowElement = document.createElement('span');
    self.upArrowElement.className = 'br-methods-arrow';
    self.upArrowElement.innerHTML = '&#8593;';

    // down arrow
    self.downArrowElement = document.createElement('span');
    self.downArrowElement.className = 'br-methods-arrow';
    self.downArrowElement.innerHTML = '&#8595;';

    // arrow text (1 of x)
    self.arrowTextElement = document.createElement('span');
    self.arrowTextElement.className = 'br-methods-arrow-text';

    self.arrowsElement.appendChild(self.upArrowElement);
    self.arrowsElement.appendChild(self.arrowTextElement);
    self.arrowsElement.appendChild(self.downArrowElement);
    self.methodsElement.appendChild(self.arrowsElement);
    self.methodsElement.appendChild(self.methodsTextElement);

    document.body.appendChild(self.listElement);
    document.body.appendChild(self.documentationElement);
    document.body.appendChild(self.methodsElement);

    // filters an array
    function filter(arr, cb)
    {
        var ret = [];
        arr.forEach(function (item)
        {
            if (cb(item))
            {
                ret.push(item);
            }
        });
        return ret;
    }

    // creates a list item that is appended to our intellisense list
    function createListItemDefault(item, idx)
    {
        var listItem = document.createElement('li');
        listItem.innerHTML = '<span class="br-icon icon-glyph-' + item.glyph + '"></span> ' + item.name;
        listItem.className = 'br-listlink'
        return listItem;
    }

    // inserts the currently selected auto complete
    self.insertAutoComplete = function ()
    {
        if (self.isAutoCompleteOpen)
        {
            var selectedDeclaration = self.filteredDeclarations[self.selectedIndex];
            if (selectedDeclaration == null)
            {
                self.showAutoComplete(false);
            }
            else
            {
                var cursor = editor.getCursor();
                var line = editor.getLine(self.autoCompleteStart.line);
                var name = selectedDeclaration.name;
                if (lastIndexOfAny(name, [' ', '[', ']', '.']) != -1)
                {
                    name = '``' + name + '``';
                }

                var startRange = { line: cursor.line, ch: self.autoCompleteStart.ch };
                var endRange = { line: cursor.line, ch: cursor.ch };
                editor.replaceRange(name, startRange, endRange);
                editor.setSelection({ line: cursor.line, ch: cursor.ch + name.length });
                self.showAutoComplete(false);
                editor.focus();
            }
        }
    };

    // refreshes the user interface for the selected element
    self.refreshSelected = function ()
    {
        if (self.selectedElement != null)
        {
            removeCssClass(self.selectedElement, 'br-selected');
        }

        self.selectedElement = self.filteredDeclarationsUI[self.selectedIndex];
        if (self.selectedElement)
        {
            addCssClass(self.selectedElement, 'br-selected');

            var documentation = self.filteredDeclarations[self.selectedIndex].documentation;
            self.documentationElement.innerHTML = (documentation == null) ? 'N/A' : documentation;

            var top = self.selectedElement.offsetTop;
            var bottom = top + self.selectedElement.offsetHeight;
            var scrollTop = self.listElement.scrollTop;
            if (top <= scrollTop)
            {
                self.listElement.scrollTop = top;
            }
            else if (bottom >= scrollTop + self.listElement.offsetHeight)
            {
                self.listElement.scrollTop = bottom - self.listElement.offsetHeight;
            }
        }
    };

    // refreshes the DOM
    self.refreshUI = function ()
    {
        self.listElement.innerHTML = '';
        self.filteredDeclarationsUI = [];
        self.filteredDeclarations.forEach(function (item, idx)
        {
            var listItem = createListItemDefault(item, idx);

            listItem.ondblclick = function ()
            {
                self.selectedIndex = idx;
                self.insertAutoComplete();
            };

            listItem.onclick = function ()
            {
                self.selectedIndex = idx;
                self.refreshSelected();
                editor.focus();
            };

            self.listElement.appendChild(listItem);
            self.filteredDeclarationsUI.push(listItem);
        });

        self.refreshSelected();
    };

    // requests that the user provide items to display in the intellisense popup
    self.autoComplete = function ()
    {
        if (typeof (userCallback) === 'function')
        {
            var cursor = editor.doc.getCursor();
            var line = editor.doc.getLine(cursor.line);
            var find = lastIndexOfAny(line, [' ', '\t', '.'], cursor.ch) + 1;
            self.autoCompleteStart = { line: cursor.line, ch: find };
            userCallback(self.autoCompleteStart, self.showDeclarations);
        }
    };

    // requests that the user provide items to display in the methods popup
    self.autoCompleteMethods = function ()
    {
        if (typeof (methodsCallback) === 'function')
        {
            var cursor = editor.getCursor();
            self.autoCompleteStart = { line: cursor.line, ch: cursor.ch };
            methodsCallback(self.autoCompleteStart, self.showMethods);
        }
    };

    // show the auto complete and the documentation elements
    self.showAutoComplete = function (b)
    {
        self.isAutoCompleteOpen = b;
        self.listElement.style.display = b ? 'block' : 'none';
        self.documentationElement.style.display = b ? 'block' : 'none';
    };

    // show the methods UI
    self.showMethodsUI = function (b)
    {
        self.isMethodsOpen = b;
        self.methodsElement.style.display = b ? 'block' : 'none';
    };

    // sets the selected index of the methods
    self.setSelectedMethodIndex = function (idx)
    {
        var disabledColor = '#808080';
        var enabledColor = 'black';
        if (idx < 0)
        {
            idx = self.methods.length - 1;
        }
        else if (idx >= self.methods.length)
        {
            idx = 0;
        }

        self.methodsSelectedIndex = idx;
        self.methodsTextElement.innerHTML = self.methods[idx];
        self.arrowTextElement.innerHTML = (idx + 1) + ' of ' + self.methods.length;
    };

    // this method is called by the end-user application to show method information
    self.showMethods = function (data)
    {
        if (data != null && data.length > 0)
        {
            // set the position of the popup
            var coords = editor.cursorCoords(true, 'page');
            self.methods = data;

            // show the elements
            self.showMethodsUI(true);

            // reposition intellisense
            self.methodsElement.style.left = coords.left + 'px';
            self.methodsElement.style.top = coords.bottom + 'px';

            // show the first item
            self.setSelectedMethodIndex(0);
        }
    };

    // this method is called by the end-user application
    self.showDeclarations = function (data)
    {
        if (data != null && data.length > 0)
        {
            // set the data
            self.declarations = data;
            self.filteredDeclarations = data;

            // refresh the DOM
            self.refreshFilter();

            // set the position of the popup
            var coords = editor.cursorCoords(true, 'page');

            // show the elements
            self.showAutoComplete(true);

            // reposition intellisense
            self.listElement.style.left = coords.left + 'px';
            self.listElement.style.top = coords.bottom + 'px';

            // reposition documentation (magic number offsets can't figure out why)
            self.documentationElement.style.left = (coords.left + self.listElement.offsetWidth + 5) + 'px';
            self.documentationElement.style.top = (coords.bottom + 5) + 'px';
        }
    };

    // moves the methods the specified delta
    self.moveMethods = function (delta)
    {
        self.setSelectedMethodIndex(self.methodsSelectedIndex + delta);
    };

    // moves the auto complete selection up or down a specified amount
    self.moveAutoComplete = function (delta)
    {
        if (self.isAutoCompleteOpen)
        {
            self.selectedIndex = self.selectedIndex + delta;
            self.selectedIndex = Math.max(self.selectedIndex, 0);
            self.selectedIndex = Math.min(self.selectedIndex, self.filteredDeclarations.length - 1);

            // select
            self.refreshSelected();
        }
    }

    // refresh the filter
    self.refreshFilter = function ()
    {
        var line = editor.doc.getLine(self.autoCompleteStart.line);
        var filterText = line.substring(self.autoCompleteStart.ch, editor.getCursor().ch).toLowerCase()
        self.filteredDeclarations = filter(self.declarations, function (x)
        {
            return x.name.toLowerCase().indexOf(filterText) === 0;
        });
        self.selectedIndex = 0;
        self.refreshUI();
    };

    // check to see if the cursor is to the left of where we started showing it
    function isMethodsOff()
    {
        var cursor = editor.getCursor();
        return (cursor.ch <= self.autoCompleteStart.ch);
    }

    // when the document changes, update the UI when certain events occur
    editor.doc.on('change', function (cm, changes)
    {
        if (self.isAutoCompleteOpen && (changes.origin === '+delete' || changes.origin === '+input'))
        {
            var cursor = editor.getCursor();
            if (cursor.ch < self.autoCompleteStart.ch)
            {
                self.showAutoComplete(false);
            }
            self.refreshFilter();
        }
        else if (self.isMethodsOpen && (changes.origin === '+delete' || changes.origin === '+input'))
        {
            self.showMethodsUI(!isMethodsOff());
        }
    });

    editor.on('keydown', function (cm, evt)
    {
        if (self.isMethodsOpen)
        {
            // escape
            if (evt.keyCode === 27)
            {
                self.showMethodsUI(false);
            }
                // left
            else if (evt.keyCode === 37)
            {
                self.showMethodsUI(!isMethodsOff());
            }
                // up
            else if (evt.keyCode === 38)
            {
                self.moveMethods(-1);
                evt.preventDefault();
            }
                // down
            else if (evt.keyCode === 40)
            {
                self.moveMethods(1);
                evt.preventDefault();
            }
                // right paren
            else if (evt.shiftKey && evt.keyCode === 48)
            {
                self.showMethodsUI(false);
            }
        }
        else if (self.isAutoCompleteOpen)
        {
            // escape
            if (evt.keyCode === 27)
            {
                self.showAutoComplete(false);
            }
                // left
            else if (evt.keyCode === 37)
            {
                self.showAutoComplete(false);
            }
                // right
            else if (evt.keyCode === 39)
            {
                self.showAutoComplete(false);
            }
                // up
            else if (evt.keyCode === 38)
            {
                self.moveAutoComplete(-1);
                evt.preventDefault();
            }
                // down
            else if (evt.keyCode === 40)
            {
                self.moveAutoComplete(1);
                evt.preventDefault();
            }
                // page down
            else if (evt.keyCode === 34)
            {
                self.moveAutoComplete(5);
                evt.preventDefault();
            }
                // page up
            else if (evt.keyCode === 33)
            {
                self.moveAutoComplete(-5);
                evt.preventDefault();
            }
                // tab
            else if (evt.keyCode === 9)
            {
                self.insertAutoComplete();
                evt.preventDefault();
            }
                // enter
            else if (evt.keyCode === 13)
            {
                self.insertAutoComplete();
                evt.preventDefault();
            }
        }
        else if (evt.shiftKey)
        {
            // left paren
            if (evt.keyCode === 57)
            {
                self.autoCompleteMethods();
            }
        }
    });

    var initialKeyMap =
	{
	    'Ctrl-Space': function (cm)
	    {
	        self.autoComplete();
	    },
	    '.': function (cm)
	    {
	        cm.replaceSelection('.', "end", "+input");
	        self.autoComplete();
	    }
	};

    editor.addKeyMap(initialKeyMap);

    // arrow click events
    self.downArrowElement.onclick = function ()
    {
        self.moveMethods(1);
    };

    // arrow click events
    self.upArrowElement.onclick = function ()
    {
        self.moveMethods(-1);
    };
};