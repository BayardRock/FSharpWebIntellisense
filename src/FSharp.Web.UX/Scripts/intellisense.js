var Utils = function ()
{
    /**
     * Eithers shows the specified element or hides it
     */
    function showElement(el, b)
    {
        el.style.display = b ? 'block' : 'none';
    }

    /**
     * Check to see if an element has a css class
     */
    function hasCssClass(el, name)
    {
        var classes = el.className.split(/\s+/g);
        return classes.indexOf(name) !== -1;
    }

    /**
     * Adds a css class from an element
     */
    function addCssClass(el, name)
    {
        if (!hasCssClass(el, name))
        {
            el.className += " " + name;
        }
    }

    /**
     * Removes a css class from an element
     */
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

    /**
     * Convenience method to get the last index of any of the items in the array
     */
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

    this.lastIndexOfAny = lastIndexOfAny;
    this.removeCssClass = removeCssClass;
    this.addCssClass = addCssClass;
    this.hasCssClass = hasCssClass;
    this.showElement = showElement;
};


var MethodsIntellisense = function ()
{
    var utils = new Utils();
    var visible = false;
    var methods = []
    var selectedIndex = 0;

    // methods
    var methodsElement = document.createElement('div');
    methodsElement.className = 'br-methods';

    // methods text
    var methodsTextElement = document.createElement('div');
    methodsTextElement.className = 'br-methods-text';

    // arrows
    var arrowsElement = document.createElement('div');
    arrowsElement.className = 'br-methods-arrows';

    // up arrow
    var upArrowElement = document.createElement('span');
    upArrowElement.className = 'br-methods-arrow';
    upArrowElement.innerHTML = '&#8593;';

    // down arrow
    var downArrowElement = document.createElement('span');
    downArrowElement.className = 'br-methods-arrow';
    downArrowElement.innerHTML = '&#8595;';

    // arrow text (1 of x)
    var arrowTextElement = document.createElement('span');
    arrowTextElement.className = 'br-methods-arrow-text';

    arrowsElement.appendChild(upArrowElement);
    arrowsElement.appendChild(arrowTextElement);
    arrowsElement.appendChild(downArrowElement);
    methodsElement.appendChild(arrowsElement);
    methodsElement.appendChild(methodsTextElement);
    document.body.appendChild(methodsElement);

    /**
     * Sets the selected index of the methods
     */
    function setSelectedIndex(idx)
    {
        var disabledColor = '#808080';
        var enabledColor = 'black';
        if (idx < 0)
        {
            idx = methods.length - 1;
        }
        else if (idx >= methods.length)
        {
            idx = 0;
        }

        selectedIndex = idx;
        methodsTextElement.innerHTML = methods[idx];
        arrowTextElement.innerHTML = (idx + 1) + ' of ' + methods.length;
    }

    /**
     * This method is called by the end-user application to show method information
     */
    function setMethods (data)
    {
        if (data != null && data.length > 0)
        {
            methods = data;

            // show the elements
            setVisible(true);

            // show the first item
            setSelectedIndex(0);
        }
    }

    /**
     * Reposition the methods element
     */
    function setPosition(left, top)
    {
        methodsElement.style.left = left + 'px';
        methodsElement.style.top = top + 'px';
    }

    /**
     * Moves the methods the specified delta
     */
    function moveSelected (delta)
    {
        setSelectedIndex(selectedIndex + delta);
    }

    /**
     * Checks to see if this is visible
     */
    function isVisible()
    {
        return visible;
    }

    /**
     * Show the methods UI
     */
    function setVisible(b)
    {
        visible = b;
        utils.showElement(methodsElement, b);
    }

    // arrow click events
    downArrowElement.onclick = function ()
    {
        moveSelected(1);
    };

    // arrow click events
    upArrowElement.onclick = function ()
    {
        moveSelected(-1);
    };

    this.setVisible = setVisible;
    this.isVisible = isVisible;
    this.setSelectedIndex = setSelectedIndex;
    this.setMethods = setMethods;
    this.moveSelected = moveSelected;
    this.setPosition = setPosition;
};

var DeclarationsIntellisense = function ()
{
    var events = { itemChosen: [], itemSelected: [] };
    var utils = new Utils();
    var selectedIndex = 0;
    var filteredDeclarations = [];
    var filteredDeclarationsUI = [];
    var visible = false;
    var declarations = []

    // ui widgets
    var selectedElement = null;
    var listElement = document.createElement('ul');
    listElement.className = 'br-intellisense';

    var documentationElement = document.createElement('div');
    documentationElement.className = 'br-documentation';

    document.body.appendChild(listElement);
    document.body.appendChild(documentationElement);

    /**
     * Filters an array
     */
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
    };

    /**
     * Triggers that an item is chosen.
     */
    function triggerItemChosen(item)
    {
        events.itemChosen.forEach(function (callback)
        {
            callback(item);
        });
    }

    /**
     * Triggers that an item is selected.
     */
    function triggerItemSelected(item)
    {
        events.itemSelected.forEach(function (callback)
        {
            callback(item);
        });
    }

    /**
     * Gets the selected index
     */
    function getSelectedIndex(idx)
    {
        return selectedIndex;
    }

    /**
     * Sets the selected index
     */
    function setSelectedIndex (idx)
    {
        if (idx != selectedIndex)
        {
            selectedIndex = idx;
            triggerItemSelected(getSelectedItem());
        }
    }

    /**
     * Event when an item is chosen (double clicked).
     */
    function onItemChosen (callback)
    {
        events.itemChosen.push(callback);
    }

    /**
     * Event when an item is selected.
     */
    function onItemSelected (callback)
    {
        events.itemSelected.push(callback);
    }

    /**
     * Gets the selected item
     */
    function getSelectedItem ()
    {
        return filteredDeclarations[selectedIndex];
    }

    /**
     * Creates a list item that is appended to our intellisense list
     */
    function createListItemDefault (item, idx)
    {
        var listItem = document.createElement('li');
        listItem.innerHTML = '<span class="br-icon icon-glyph-' + item.glyph + '"></span> ' + item.name;
        listItem.className = 'br-listlink'
        return listItem;
    }

    /**
     * Refreshes the user interface for the selected element
     */
    function refreshSelected ()
    {
        if (selectedElement != null)
        {
            utils.removeCssClass(selectedElement, 'br-selected');
        }

        selectedElement = filteredDeclarationsUI[selectedIndex];
        if (selectedElement)
        {
            utils.addCssClass(selectedElement, 'br-selected');

            var item = getSelectedItem();
            if (item.documentation == null)
            {
                showDocumentation(false);
            }
            else
            {
                showDocumentation(true);
                documentationElement.innerHTML = item.documentation;
            }

            var top = selectedElement.offsetTop;
            var bottom = top + selectedElement.offsetHeight;
            var scrollTop = listElement.scrollTop;
            if (top <= scrollTop)
            {
                listElement.scrollTop = top;
            }
            else if (bottom >= scrollTop + listElement.offsetHeight)
            {
                listElement.scrollTop = bottom - listElement.offsetHeight;
            }
        }
    }

    /**
     * Refreshes the user interface.
     */
    function refreshUI ()
    {
        listElement.innerHTML = '';
        filteredDeclarationsUI = [];
        filteredDeclarations.forEach(function (item, idx)
        {
            var listItem = createListItemDefault(item, idx);

            listItem.ondblclick = function ()
            {
                setSelectedIndex(idx);
                triggerItemChosen(getSelectedItem());
                setVisible(false);
                showDocumentation(false);
            };

            listItem.onclick = function ()
            {
                setSelectedIndex(idx);
            };

            listElement.appendChild(listItem);
            filteredDeclarationsUI.push(listItem);
        });

        refreshSelected();
    }

    /**
     * Shows / hides the documentation element
     */
    function showDocumentation (b)
    {
        utils.showElement(documentationElement, b);
    };

    /**
     * Show the auto complete and the documentation elements
     */
    function setVisible (b)
    {
        visible = b;
        utils.showElement(listElement, b);
        utils.showElement(documentationElement, b);
    }

    /**
     * This method is called by the end-user application
     */
    function setDeclarations (data)
    {
        if (data != null && data.length > 0)
        {
            // set the data
            declarations = data;
            filteredDeclarations = data;

            // show the elements
            setVisible(true);
            showDocumentation(true);
            setFilter('');
        }
    }

    /**
     * Sets the position of the list element and documentation element
     */
    function setPosition (left, top)
    {
        // reposition intellisense
        listElement.style.left = left + 'px';
        listElement.style.top = top + 'px';

        // reposition documentation (magic number offsets can't figure out why)
        documentationElement.style.left = (left + listElement.offsetWidth + 5) + 'px';
        documentationElement.style.top = (top + 5) + 'px';
    }

    /**
     * Refresh the filter
     */
    function setFilter (filterText)
    {
        filteredDeclarations = filter(declarations, function (x)
        {
            return x.name.toLowerCase().indexOf(filterText) === 0;
        });
        selectedIndex = 0;
        refreshUI();
    }

    /**
     * Moves the auto complete selection up or down a specified amount
     */
    function moveSelected(delta)
    {
        var idx = selectedIndex + delta;
        idx = Math.max(idx, 0);
        idx = Math.min(idx, filteredDeclarations.length - 1);

        // select
        setSelectedIndex(idx)
        refreshSelected();
    }

    /**
     * Is the list visible or not
     */
    function isVisible()
    {
        return visible;
    }

    // public API
    this.isVisible = isVisible;
    this.setFilter = setFilter;
    this.getSelectedItem = getSelectedItem;
    this.getSelectedIndex = getSelectedIndex;
    this.setSelectedIndex = setSelectedIndex;
    this.onItemChosen = onItemChosen;
    this.onItemSelected = onItemSelected;
    this.moveSelected = moveSelected;
    this.setDeclarations = setDeclarations;
    this.setPosition = setPosition;
    this.setVisible = setVisible;
    this.showDocumentation = showDocumentation;
};