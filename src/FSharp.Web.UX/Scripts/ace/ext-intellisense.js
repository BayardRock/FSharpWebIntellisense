ace.define('ace/intellisense',
    ['require', 'exports', 'module', 'ace/keyboard/hash_handler'],
    function (require, exports, module)
    {
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

        var dom = require('ace/lib/dom');
        var HashHandler = require("./keyboard/hash_handler").HashHandler;
        dom.importCssString(cssText, 'br-intellisense');
        
        var Intellisense = function (editor, userCallback)
        {
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
            self.autoCompleteStart = { line: 0, column: 0 };

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
                arr.forEach(function(item)
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
                var listItem = dom.createElement('li');
                listItem.innerHTML = '<span class="br-icon icon-glyph-' + item.glyph + '"></span> ' + item.name;
                dom.addCssClass(listItem, 'br-listlink');
                return listItem;
            }

            // inserts the currently selected auto complete
            self.insertAutoComplete = function()
            {
                if (self.isAutoCompleteOpen)
                {
                    var selectedDeclaration = self.filteredDeclarations[self.selectedIndex];

                    var document = editor.getSession().getDocument();
                    var cursor = editor.getSelection().getCursor();
                    var line = document.getLine(self.autoCompleteStart.row);

                    var newLine = line.substring(0, self.autoCompleteStart.column)
                        + selectedDeclaration.name
                        + line.substring(cursor.column, line.length);

                    if (document.getLength() == 1)
                    {
                        document.setValue(newLine);
                    }
                    else
                    {
                        document.removeLines(cursor.row, cursor.row);
                        document.insertLines(cursor.row, [newLine]);
                    }
                    editor.getSelection().moveCursorTo(cursor.row, cursor.column + selectedDeclaration.name.length);
                    self.showAutoComplete(false);
                    editor.focus();
                    return true;
                }
                return false;
            };

            // refreshes the user interface for the selected element
            self.refreshSelected = function()
            {
                if (self.selectedElement != null)
                {
                    dom.removeCssClass(self.selectedElement, 'br-selected');
                }

                self.selectedElement = self.filteredDeclarationsUI[self.selectedIndex];
                if (self.selectedElement)
                {
                    dom.addCssClass(self.selectedElement, 'br-selected');
                    self.documentationElement.innerHTML = self.filteredDeclarations[self.selectedIndex].documentation;

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
            self.refreshUI = function()
            {
                self.listElement.innerHTML = '';
                self.filteredDeclarationsUI = [];
                self.filteredDeclarations.forEach(function(item, idx)
                {
                    var listItem = createListItemDefault(item, idx);
                    
                    listItem.ondblclick = function()
                    {
                        self.selectedIndex = idx;
                        self.insertAutoComplete();
                    };

                    listItem.onclick = function()
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

            function lastIndexOfAny(str, arr, start)
            {
                for (var i = 0; i < arr.length; i++)
                {
                    var val = str.lastIndexOf(arr[i], start);
                    if (val > -1)
                    {
                        return val;
                    }
                }
                return -1;
            }

            // requests that the user provide items to display in the intellisense popup
            self.autoComplete = function()
            {
                if (typeof(userCallback) === 'function')
                {
                    var cursor = editor.getSelection().getCursor();
                    var line = editor.getSession()
                        .getDocument()
                        .getLine(cursor.row);

                    var find = lastIndexOfAny(line, ['.', ' ', '\t']) + 1;
                    self.autoCompleteStart = { row: cursor.row, column: find };
                    userCallback(self.showDeclarations, self.autoCompleteStart);
                    return true;
                }
                return false;
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
            self.showAutoComplete = function(b)
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

            self.refreshFilter = function ()
            {
                var line = editor.getSession()
                    .getDocument()
                    .getLine(self.autoCompleteStart.row);

                // filter out bad results
                var filterText = line.substring(self.autoCompleteStart.column, editor.getSelection().getCursor().column).toLowerCase();
                self.filteredDeclarations = filter(self.declarations, function (x)
                {
                    return x.name.toLowerCase().indexOf(filterText) === 0;
                });
                self.selectedIndex = 0;
                self.refreshUI();
            };

            // this method is called by the end-user application
            self.showDeclarations = function(data)
            {
                if (data.length > 0)
                {
                    // set the data
                    self.declarations = data;
                    self.filteredDeclarations = data;

                    // refresh the DOM
                    self.refreshFilter();

                    // set the position of the popup (magic number offsets can't figure out why)
                    var cursor = editor.selection.getCursor();
                    var coords = editor.renderer.textToScreenCoordinates(cursor.row, cursor.column);
                    var top = coords.pageY + 10;
                    var left = coords.pageX - 5;

                    // show the elements
                    self.showAutoComplete(true);

                    // reposition intellisense
                    self.listElement.style.left = left + 'px';
                    self.listElement.style.top = top + 'px';

                    // reposition documentation (magic number offsets can't figure out why)
                    self.documentationElement.style.left = (left + self.listElement.offsetWidth + 5) + 'px';
                    self.documentationElement.style.top = (top + 5) + 'px';
                }
            };

            // moves the auto complete selection up or down a specified amount
            self.moveAutoComplete = function (delta)
            {
                if (self.isAutoCompleteOpen)
                {
                    // apply the new selected index
                    self.selectedIndex = self.selectedIndex + delta;
                    self.selectedIndex = Math.max(self.selectedIndex, 0);
                    self.selectedIndex = Math.min(self.selectedIndex, self.filteredDeclarations.length - 1);

                    // select
                    self.refreshSelected();
                    return true;
                }
                return false;
            }

            // hook into keyboard events
            editor.commands.on("afterExec", function (e)
            {
                // hide autocomplete when the user navigates using keyboard
                if (e.command.name.indexOf('goto') === 0
                    || e.command.name.indexOf('select') === 0
                    || e.command.name.indexOf('removeword') === 0
                    )
                {
                    self.showAutoComplete(false);
                }
                // show auto complete when period is pressed
                else if (e.command.name === 'insertstring' && e.args === '.')
                {
                    self.autoComplete();
                }
                // update the filter for auto complete
                else if (self.isAutoCompleteOpen && (e.command.name === 'insertstring' || e.command.name === 'backspace'))
                {
                    var cursor = editor.getSelection().getCursor();
                    if (cursor.column < self.autoCompleteStart.column)
                    {
                        self.showAutoComplete(false);
                    }
                    else
                    {
                        self.refreshFilter();
                    }
                }
            });

            // keyboard bindings
            self.keyboardHandler = new HashHandler();
            self.keyboardHandler.bindKeys(
            {
                "Escape": function (ed) { self.showAutoComplete(false); },
                "Up": function (ed) { return self.moveAutoComplete(-1); },
                "Down": function (ed) { return self.moveAutoComplete(1); },
                "PageUp": function (ed) { return self.moveAutoComplete(-5); },
                "PageDown": function (ed) { return self.moveAutoComplete(5); },
                "Enter": function (ed) { return self.insertAutoComplete(); },
                "Tab": function (ed) { return self.insertAutoComplete(); },
                "Ctrl+Space": function (ed) { return self.autoComplete(); }
            });
            editor.keyBinding.addKeyboardHandler(self.keyboardHandler);
        };

        exports.Intellisense = function (editor, userCallback)
        {
            var i = editor.intellisense || new Intellisense(editor, userCallback);
            editor.intellisense = i;
        };
    });