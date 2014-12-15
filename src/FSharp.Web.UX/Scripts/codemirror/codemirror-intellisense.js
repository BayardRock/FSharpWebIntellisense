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
            var cursor = editor.getCursor();
            var line = editor.getLine(autoCompleteStart.line);
            var name = selectedDeclaration.name;
            if (utils.lastIndexOfAny(name, [' ', '[', ']', '.']) != -1)
            {
                name = '``' + name + '``';
            }

            var startRange = { line: cursor.line, ch: autoCompleteStart.columnIndex };
            var endRange = { line: cursor.line, ch: cursor.ch };
            editor.replaceRange(name, startRange, endRange);
            editor.setSelection({ line: cursor.line, ch: cursor.ch + name.length });
            decls.setVisible(false);
            editor.focus();
        }
    };

    /**
     * Sets the declarations and repositions the declarations UI.
     */
    function setDeclarations(data)
    {
        var coords = editor.cursorCoords(true, 'page');
        decls.setDeclarations(data);
        decls.setPosition(coords.left, coords.bottom);
        meths.setVisible(false);
    }

    /**
     * Sets the methods and repositions the methods UI.
     */
    function setMethods(data)
    {
        var coords = editor.cursorCoords(true, 'page');
        meths.setMethods(data);
        meths.setPosition(coords.left, coords.bottom);
        decls.setVisible(false);
    }

    /**
     * Requests that the user provide items to display in the intellisense popup
     */
    function autoComplete()
    {
        if (typeof (userCallback) === 'function')
        {
            var cursor = editor.doc.getCursor();
            var line = editor.doc.getLine(cursor.line);
            var find = utils.lastIndexOfAny(line, [' ', '\t', '.'], cursor.ch) + 1;
            autoCompleteStart = { lineIndex: cursor.line, columnIndex: find };
            userCallback(autoCompleteStart, setDeclarations);
        }
    };

    /**
     * Requests that the user provide items to display in the methods popup
     */
    function autoCompleteMethods()
    {
        if (typeof (methodsCallback) === 'function')
        {
            var cursor = editor.getCursor();
            autoCompleteStart = { lineIndex: cursor.line, columnIndex: cursor.ch };
            methodsCallback(autoCompleteStart, setMethods);
        }
    };

    /**
     * Check to see if the cursor is to the left of where we started showing it
     */
    function isMethodsOff()
    {
        var cursor = editor.getCursor();
        return (cursor.ch <= autoCompleteStart.columnIndex);
    }

    /**
     * When the document changes, update the UI when certain events occur
     */
    editor.doc.on('change', function (cm, changes)
    {
        if (decls.isVisible() && (changes.origin === '+delete' || changes.origin === '+input'))
        {
            var cursor = editor.getCursor();
            if (cursor.ch < autoCompleteStart.columnIndex)
            {
                decls.setVisible(false);
                meths.setVisible(false);
            }

            var line = editor.doc.getLine(autoCompleteStart.lineIndex);
            var filterText = line.substring(autoCompleteStart.columnIndex, editor.getCursor().ch).toLowerCase()
            decls.setFilter(filterText);
        }
        else if (meths.isVisible() && (changes.origin === '+delete' || changes.origin === '+input'))
        {
            meths.setVisible(!isMethodsOff());
        }
    });

    editor.on('keydown', function (cm, evt)
    {
        if (evt.keyCode === 27)
        {
            meths.setVisible(false);
            decls.setVisible(false);
        }

        if (meths.isVisible())
        {
            // left
            if (evt.keyCode === 37)
            {
                meths.setVisible(!isMethodsOff());
            }
            // up
            else if (evt.keyCode === 38)
            {
                meths.moveSelected(-1);
                evt.preventDefault();
            }
            // down
            else if (evt.keyCode === 40)
            {
                meths.moveSelected(1);
                evt.preventDefault();
            }
            // right paren
            else if (evt.shiftKey && evt.keyCode === 48)
            {
                meths.setVisible(false);
            }
        }
        else if (decls.isVisible())
        {
            // escape, left, right
            if (evt.keyCode === 37 || evt.keyCode === 39)
            {
                decls.setVisible(false);
            }
            // up
            else if (evt.keyCode === 38)
            {
                decls.moveSelected(-1);
                evt.preventDefault();
            }
            // down
            else if (evt.keyCode === 40)
            {
                decls.moveSelected(1);
                evt.preventDefault();
            }
            // page down
            else if (evt.keyCode === 34)
            {
                decls.moveSelected(5);
                evt.preventDefault();
            }
            // page up
            else if (evt.keyCode === 33)
            {
                decls.moveSelected(-5);
                evt.preventDefault();
            }
            // tab
            else if (evt.keyCode === 9)
            {
                insertAutoComplete();
                evt.preventDefault();
            }
            // enter
            else if (evt.keyCode === 13)
            {
                insertAutoComplete();
                evt.preventDefault();
            }
        }
        else if (evt.shiftKey)
        {
            // left paren
            if (evt.keyCode === 57)
            {
                autoCompleteMethods();
            }
        }
    });

    editor.addKeyMap({
        'Ctrl-Space': function (cm)
        {
            autoComplete();
        },
        '.': function (cm)
        {
            cm.replaceSelection('.', "end", "+input");
            autoComplete();
        }
    });

    // when the user chooses an item, insert it
    decls.onItemChosen(insertAutoComplete);

    // public API
    this.setMethods = setMethods;
    this.setDeclarations = setDeclarations;
};