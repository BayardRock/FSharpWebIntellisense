ace.define('ace/intellisense',
    ['require', 'exports', 'module', 'ace/keyboard/hash_handler'],
    function (require, exports, module)
    {
        var HashHandler = require("./keyboard/hash_handler").HashHandler;
        
        var Intellisense = function (editor, userCallback, methodsCallback)
        {
            var utils = new Utils();
            var decls = new DeclarationsIntellisense();
            var meths = new MethodsIntellisense();
            var autoCompleteStart = { lineIndex: 0, columnIndex: 0 };

            /**
             * Inserts the currently selected auto complete
             */ 
            function insertAutoComplete()
            {
                if (decls.isVisible())
                {
                    var selectedDeclaration = decls.getSelectedItem();
                    var document = editor.getSession().getDocument();
                    var cursor = editor.getSelection().getCursor();
                    var line = document.getLine(autoCompleteStart.lineIndex);

                    var newLine = line.substring(0, autoCompleteStart.columnIndex)
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
                    decls.setVisible(false);
                    editor.focus();
                    return true;
                }
                return false;
            };

            /**
             * Sets the declarations and repositions the declarations UI.
             */
            function setDeclarations(data)
            {
                var cursor = editor.selection.getCursor();
                var coords = editor.renderer.textToScreenCoordinates(cursor.row, cursor.column);
                var top = coords.pageY + 10;
                var left = coords.pageX - 5;

                decls.setDeclarations(data);
                decls.setPosition(left, top);
                meths.setVisible(false);
            }

            /**
             * Sets the methods and repositions the methods UI.
             */
            function setMethods(data)
            {
                var cursor = editor.selection.getCursor();
                var coords = editor.renderer.textToScreenCoordinates(cursor.row, cursor.column);
                var top = coords.pageY + 10;
                var left = coords.pageX - 5;

                meths.setMethods(data);
                meths.setPosition(left, top);
                decls.setVisible(false);
            }

            /**
             * Requests that the user provide items to display in the intellisense popup
             */
            function autoComplete()
            {
                if (typeof (userCallback) === 'function')
                {
                    var cursor = editor.getSelection().getCursor();
                    var line = editor.getSession()
                        .getDocument()
                        .getLine(cursor.row);

                    var find = utils.lastIndexOfAny(line, [' ', '\t', '.'], cursor.column) + 1;
                    autoCompleteStart = { lineIndex: cursor.row, columnIndex: find };
                    userCallback(autoCompleteStart, setDeclarations);
                    return true;
                }
                return false;
            };

            /**
             * Requests that the user provide items to display in the methods popup
             */
            function autoCompleteMethods()
            {
                if (typeof (methodsCallback) === 'function')
                {
                    var cursor = editor.getSelection().getCursor();
                    autoCompleteStart = { lineIndex: cursor.row, columnIndex: cursor.column };
                    methodsCallback(autoCompleteStart, setMethods);
                }
            };

            // hook into keyboard events
            editor.commands.on("afterExec", function (e)
            {
                // hide autocomplete when the user navigates using keyboard
                if (e.command.name.indexOf('goto') === 0
                    || e.command.name.indexOf('select') === 0
                    || e.command.name.indexOf('removeword') === 0
                    )
                {
                    decls.setVisible(false);
                }
                // show auto complete when period is pressed
                else if (e.command.name === 'insertstring' && e.args === '.')
                {
                    autoComplete();
                }
                else if (e.command.name === 'insertstring' && e.args === '(')
                {
                    autoCompleteMethods();
                }
                else if (e.command.name === 'insertstring' && e.args === ')')
                {
                    meths.setVisible(false);
                }
                // update the filter for auto complete
                else if (decls.isVisible() && (e.command.name === 'insertstring' || e.command.name === 'backspace'))
                {
                    var cursor = editor.getSelection().getCursor();
                    if (cursor.column < autoCompleteStart.columnIndex)
                    {
                        decls.setVisible(false);
                    }
                    else
                    {
                        var line = editor.getSession()
                            .getDocument()
                            .getLine(autoCompleteStart.lineIndex);

                        // filter out bad results
                        var filterText = line.substring(autoCompleteStart.columnIndex, editor.getSelection().getCursor().column).toLowerCase();
                        decls.setFilter(filterText);
                    }
                }
            });

            function keyEscape()
            {
                decls.setVisible(false);
                meths.setVisible(false);
                return true;
            }

            function move(delta)
            {
                if (decls.isVisible())
                {
                    decls.moveSelected(delta);
                    return true;
                }
                else if (meths.isVisible())
                {
                    meths.moveSelected(delta);
                    return true;
                }
                return false;
            }

            // keyboard bindings
            var keyboardHandler = new HashHandler();
            keyboardHandler.bindKeys(
            {
                "Escape": keyEscape,
                "Up": function () { return move(-1); },
                "Down": function () { return move(1); },
                "PageUp": function () { return move(-5); },
                "PageDown": function () { return move(5); },
                "Enter": function (ed) { return insertAutoComplete(); },
                "Tab": function (ed) { return insertAutoComplete(); },
                "Ctrl+Space": function (ed) { return autoComplete(); }
            });
            editor.keyBinding.addKeyboardHandler(keyboardHandler);

            // public API
            this.setDeclarations = setDeclarations;
            this.setMethods = setMethods;
        };

        exports.Intellisense = function (editor, userCallback, methodsCallback)
        {
            return new Intellisense(editor, userCallback, methodsCallback);
        };
    });