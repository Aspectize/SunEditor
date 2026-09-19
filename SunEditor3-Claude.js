/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisenseLibrary.js" />

//<!-- SunEditor v3 (tested against 3.3.3) - pin the version, "@latest" is what broke the v2 integration -->
//<link href="https://cdn.jsdelivr.net/npm/suneditor@3.3.3/dist/suneditor.min.css" rel="stylesheet">
//<link href="https://cdn.jsdelivr.net/npm/suneditor@3.3.3/dist/suneditor-contents.min.css" rel="stylesheet">
//<script src="https://cdn.jsdelivr.net/npm/suneditor@3.3.3/dist/suneditor.min.js"></script>
//<!-- languages (English is built in) -->
//<script src="https://cdn.jsdelivr.net/npm/suneditor@3.3.3/src/langs/fr.js"></script>

// Buttons / FontColors syntax: items separated by "," , groups (toolbar) or rows (colors) separated by ";"
// A toolbar button only exists if its plugin is registered: plugins are registered from the button names
// and from the keys of the Options JSON (slashCommand, autocomplete, subToolbar, ...)

var aasSunEditorLabels = {

    fr: { words: 'Mots:', chars: 'Caractères:' },
    en: { words: 'Words:', chars: 'Characters:' }
};


Aspectize.Extend('SunEditor', {
    Properties: {
        EditMode: true, Value: '', Mode: 'classic', Language: 'fr', Placeholder: '',
        SpellCheck: false, CloseOnSaveOrCancel: true,
        MaxImageSize: 300000,
        FontColors: '', // empty: SunEditor palette
        Fonts: '',      // empty: SunEditor font list
        Options: '',    // JSON, merged into the SunEditor config (experiments / rarely used options)
        Buttons: 'undo,redo;removeFormat,copyFormat;finder;bold,italic,underline,strike;subscript,superscript;font,fontSize,blockStyle,fontColor,backgroundColor,textStyle;outdent,indent;align,hr,list_bulleted,list_numbered,lineHeight;table,Link,link,Image;image; showBlocks,codeView,print;paragraphStyle,blockquote;preview, save, Cancel',
        MiniToolbarButtons: 'bold,italic,underline,strike;font,fontSize,fontColor,backgroundColor'
    },
    Events: ['OnEditModeChanged', 'OnSave', 'OnCancel', 'OnStartEditing', 'OnCustomImage', 'OnCustomLink'],

    Init: function (elem) {

        if ((typeof SUNEDITOR === 'undefined') || !SUNEDITOR.plugins) throw ('SunEditor: SUNEDITOR is undefined, the loaded suneditor.min.js is not a v3 script (a v2 copy is probably loaded before it)');

        // properties that need the editor to be recreated (SunEditor refuses them in resetOptions)
        var recreateProperties = { Mode: 1, Language: 1, FontColors: 1, Fonts: 1, Buttons: 1, MiniToolbarButtons:1, Options: 1 };

        //#region readOnlyViewer EditMode === false
        var readOnlyViewer = document.createElement('div');
        readOnlyViewer.id = 'rov-' + elem.id;
        readOnlyViewer.style.width = '100%';
        readOnlyViewer.style.height = '100%';
        readOnlyViewer.classList.add('sun-editor-editable');

        elem.appendChild(readOnlyViewer);
        //#endregion

        var started = false;
        var editorVisible = false;
        var lastLinkText = null;
        var lastSelectedText = null;

        function showViewer(show) {

            readOnlyViewer.style.display = show ? 'block' : 'none';
            editorVisible = !show;
        }

        function showEditor() {

            if (!started) {
                Aspectize.UiExtensions.Notify(elem, 'OnStartEditing', '');
                started = true;
            }

            var editor = getSunEditor(elem);

            editor.$.ui.show();
            showViewer(false);
            Aspectize.UiExtensions.ChangeProperty(elem, 'EditMode', true);
        }

        function hideEditor(notifyCancel) {

            if (notifyCancel && started) {
                Aspectize.UiExtensions.Notify(elem, 'OnCancel', '');
            }

            started = false;

            var editor = getSunEditor(elem);

            var html = Aspectize.UiExtensions.GetProperty(elem, 'Value');
            editor.$.html.set(html);
            readOnlyViewer.innerHTML = html;

            editor.$.ui.hide();
            showViewer(true);
            Aspectize.UiExtensions.ChangeProperty(elem, 'EditMode', false);
        }

        function setCustomImageUrl(url) {

            var editor = getSunEditor(elem);
            var htmlImg = '<img src="' + url + '">';
            editor.$.html.insert(htmlImg);
        }

        function setCustomLinkUrl(url, text) {

            var editor = getSunEditor(elem);
            var htmlLink = '<a target="_blank" href="' + url + '">' + text + '</a>';
            editor.$.html.insert(htmlLink);
        }

        function getItemLists(sItems) {

            sItems = sItems.replace(/\s*/g, '');

            var itemLists = [];
            var itemBlocks = sItems.split(';');
            for (var n = 0; n < itemBlocks.length; n++) {

                var items = itemBlocks[n].split(',');

                itemLists.push(items);
            }

            return itemLists;
        }

        // rows separated by ";" -> flat item list + number of items per row
        function getColorOptions(sColors) {

            var colorOptions = {};
            if (sColors) {
                var rows = getItemLists(sColors);
                var items = [];
                for (var n = 0; n < rows.length; n++) {
                    items = items.concat(rows[n]);
                }
                colorOptions.items = items;
                colorOptions.splitNum = rows[0].length;
            }

            return colorOptions;
        }

        function getFontOptions(sFonts) {

            var fontOptions = {};
            if (sFonts) {
                var fonts = sFonts.split(',');
                for (var n = 0; n < fonts.length; n++) fonts[n] = fonts[n].trim();
                fontOptions.items = fonts;
            }

            return fontOptions;
        }

        function getExtraOptions(sOptions) {

            var extraOptions = {};
            if (sOptions) {
                try {
                    extraOptions = JSON.parse(sOptions);
                } catch (ex) { throw ('SunEditor bad JSON in property Options: ' + ex.message); }
            }

            return extraOptions;
        }

        function getBuiltInPlugins(buttonList, extraOptions) {

            var plugins = [];
            var added = {};

            function addPlugin(name) {
                var plugin = SUNEDITOR.plugins[name];
                if (plugin && !added[name]) {
                    plugins.push(plugin);
                    added[name] = true;
                }
            }

            for (var n = 0; n < buttonList.length; n++) {
                var items = buttonList[n];
                for (var i = 0; i < items.length; i++) addPlugin(items[i]);
            }

            for (var key in extraOptions) addPlugin(key);

            return plugins;
        }

        function onChange(contents) {

            if (elem.aasSunEditor.isEmpty()) contents = '';

            readOnlyViewer.innerHTML = contents;
            Aspectize.UiExtensions.ChangeProperty(elem, 'Value', contents);
        }

        //#region custom command plugins
        // SunEditor instantiates plugins with "new plugin(kernel, pluginOptions)" and only looks at
        // plugin.key / plugin.type (static) and this.$ / title / icon / inner / action (instance):
        // a plain constructor function is enough. title and icon are keys of the SunEditor lang / icons
        function createCommandPlugin(key, title, icon, action) {

            function CommandPlugin(kernel, pluginOptions) {

                this.$ = kernel.$;
                this.title = title;
                this.icon = icon;
                this.inner = null;
            }
            CommandPlugin.key = key;
            CommandPlugin.type = 'command';
            CommandPlugin.prototype.action = action;

            return CommandPlugin;
        }

        function getCancelPlugin(elem) {

            var cancelPlugin = createCommandPlugin('Cancel', 'cancel', 'cancel',
                function (target) {

                    if (Aspectize.UiExtensions.GetProperty(elem, 'CloseOnSaveOrCancel')) hideEditor(true);
                });

            return cancelPlugin;
        }

        function getImagePlugin(elem) {

            var imagePlugin = createCommandPlugin('Image', 'image', 'image',
                function (target) {

                    var maxSize = Aspectize.UiExtensions.GetProperty(elem, 'MaxImageSize');
                    var sys = Aspectize.GetService('SystemServices');
                    var chosen = sys.ChooseFile('image/*', false);

                    chosen.then(function (files) {

                        if (files.length === 1) {

                            if ((maxSize > 0) && (files[0].size > maxSize)) Aspectize.Throw('File to large !', 1000);

                            var obj = { File: files[0] };
                            Aspectize.UiExtensions.Notify(elem, 'OnCustomImage', obj);
                        }
                    });
                });

            return imagePlugin;
        }

        function getLinkPlugin(elem) {

            var linkPlugin = createCommandPlugin('Link', 'link', 'link',
                function (target) {

                    // captured now: the selection is gone once the file dialog opens
                    lastSelectedText = this.$.selection.getRange().toString();

                    var sys = Aspectize.GetService('SystemServices');
                    var chosen = sys.ChooseFile('*/*', false);

                    chosen.then(function (files) {

                        if (files.length === 1) {

                            var obj = { File: files[0] };
                            lastLinkText = files[0].name;
                            Aspectize.UiExtensions.Notify(elem, 'OnCustomLink', obj);
                        }
                    });
                });

            return linkPlugin;
        }
        //#endregion

        function getLanguageCode(language) {

            return (language || 'en').split('-')[0].toLowerCase();
        }

        function getLang(language) {

            var lg = getLanguageCode(language);
            return SUNEDITOR_LANG[lg] || SUNEDITOR_LANG.fr || SUNEDITOR_LANG.en;
        }

        function getLabels(language) {

            var lg = getLanguageCode(language);
            return aasSunEditorLabels[lg] || aasSunEditorLabels.fr;
        }

        function getSpellCheckAttributes() {

            return { spellcheck: String(!!Aspectize.UiExtensions.GetProperty(elem, 'SpellCheck')) };
        }

        function getSunEditor(elem) {

            if (!elem.aasSunEditor) {

                var html = Aspectize.UiExtensions.GetProperty(elem, 'Value');
                var eMode = Aspectize.UiExtensions.GetProperty(elem, 'EditMode');
                var language = Aspectize.UiExtensions.GetProperty(elem, 'Language');
                var labels = getLabels(language);

                var colorOptions = getColorOptions(Aspectize.UiExtensions.GetProperty(elem, 'FontColors'));
                var fontOptions = getFontOptions(Aspectize.UiExtensions.GetProperty(elem, 'Fonts'));
                var buttonList = getItemLists(Aspectize.UiExtensions.GetProperty(elem, 'Buttons'));
                var miniButtons = Aspectize.UiExtensions.GetProperty(elem, 'MiniToolbarButtons');
                var miniButtonList = miniButtons ? getItemLists(miniButtons) : null;
                var extraOptions = getExtraOptions(Aspectize.UiExtensions.GetProperty(elem, 'Options'));

                var plugins = [getCancelPlugin(elem), getImagePlugin(elem), getLinkPlugin(elem)].concat(getBuiltInPlugins(buttonList, extraOptions));

                var config = {
                    plugins: plugins,
                    mode: Aspectize.UiExtensions.GetProperty(elem, 'Mode'), // classic, inline, balloon, balloon-always (+ ':bottom')
                    lang: getLang(language),
                    editableFrameAttributes: getSpellCheckAttributes(),
                    placeholder: Aspectize.UiExtensions.GetProperty(elem, 'Placeholder'),
                    height: '100%',

                    buttonList: buttonList,
                    subToolbar: miniButtonList ? { buttonList: miniButtonList, mode: 'balloon' } : undefined,
                    font: fontOptions,
                    fontColor: colorOptions,
                    backgroundColor: colorOptions,
                    link: { openNewWindow: true },
                    // externalLibs: { katex: window.katex },  // goes with math button

                    statusbar_showPathLabel: false,
                    wordCounter: true,
                    wordCounter_label: labels.words,
                    charCounter: true,
                    charCounter_label: labels.chars,
                    //charCounter_max: 100,

                    shortcuts: {
                        undo: ['c+KeyZ', 'Z', 'c+KeyW', 'Z'],
                        redo: ['c+KeyY', 'Y', 'c+s+KeyZ', 'Z', 'c+s+KeyW', 'Z']
                    },
                    events: {
                        onChange: function (e) { onChange(e.data); },
                        onPaste: function (e) {

                            // pasted links open in a new window
                            var div = document.createElement('div');
                            div.innerHTML = e.data;

                            var links = div.querySelectorAll('a[href]');
                            for (var n = 0; n < links.length; n++) links[n].target = '_blank';

                            return div.innerHTML;
                        },
                        onSave: function (e) {

                            onChange(e.data); // Value is updated by onChange with a delay: sync before notifying
                            Aspectize.UiExtensions.Notify(elem, 'OnSave', '');
                            if (Aspectize.UiExtensions.GetProperty(elem, 'CloseOnSaveOrCancel')) hideEditor(false);
                        }
                    }
                };

                for (var op in extraOptions) config[op] = extraOptions[op];

                readOnlyViewer.innerHTML = html;
                elem.aasSunEditor = SUNEDITOR.create(readOnlyViewer, config);

                if (eMode) {
                    showEditor();
                } else {
                    // content is already in place: no need to go through hideEditor
                    elem.aasSunEditor.$.ui.hide();
                    showViewer(true);
                }
            }

            return elem.aasSunEditor;
        }

        function recreateSunEditor() {

            var editor = elem.aasSunEditor;
            if (editor) {
                editor.destroy();
                elem.aasSunEditor = null;
                showViewer(true);
            }

            return getSunEditor(elem);
        }

        function setHtmlContent(html) {

            var editor = getSunEditor(elem);

            editor.$.html.set(html);
            readOnlyViewer.innerHTML = html;
        }

        function changeEditMode(eMode) {

            if (editorVisible === eMode) return;

            if (eMode) {

                showEditor();

            } else hideEditor(true);
        }

        elem.aasControlInfo.ToggleEditMode = function () {

            var eMode = !Aspectize.UiExtensions.GetProperty(elem, 'EditMode');
            Aspectize.UiExtensions.ChangeProperty(elem, 'EditMode', eMode);

            changeEditMode(eMode);
        };

        elem.aasControlInfo.SetCustomImageUrl = function (e, url) {

            setCustomImageUrl(url);
        };

        elem.aasControlInfo.SetCustomLinkUrl = function (e, url, text) {

            setCustomLinkUrl(url, lastSelectedText || text || lastLinkText || url);
            lastSelectedText = lastLinkText = null;
        };

        Aspectize.UiExtensions.AddMergedPropertyChangeObserver(elem, function (sender, arg) {

            var eMode = null;
            var html = null;
            var mustRecreate = false;
            var liveOptions = null;

            for (var key in arg) {

                var value = arg[key];
                switch (key) {

                    case 'Value': html = value; break;
                    case 'EditMode': eMode = value; break;

                    case 'Placeholder':
                        if (!liveOptions) liveOptions = {};
                        liveOptions.placeholder = value;
                        break;

                    case 'SpellCheck':
                        if (!liveOptions) liveOptions = {};
                        liveOptions.editableFrameAttributes = getSpellCheckAttributes();
                        break;

                    default:
                        if (key in recreateProperties) mustRecreate = true;
                        break;
                }
            }

            if (mustRecreate) {
                recreateSunEditor(); // reads all current property values
            } else if (liveOptions) {
                getSunEditor(elem).resetOptions(liveOptions);
            }

            if (eMode !== null) changeEditMode(eMode);
            if (html !== null) setHtmlContent(html);
        });
    }
});