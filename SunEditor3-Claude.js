/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisenseLibrary.js" />

//<!-- SunEditor v3 (tested against 3.3.3) - pin the version, "@latest" is what broke the v2 integration -->
//<!-- v3 dist layout has no "css" folder anymore: the two stylesheets sit next to suneditor.min.js -->
//<link href="https://cdn.jsdelivr.net/npm/suneditor@3.3.3/dist/suneditor.min.css" rel="stylesheet">
//<link href="https://cdn.jsdelivr.net/npm/suneditor@3.3.3/dist/suneditor-contents.min.css" rel="stylesheet">
//<script src="https://cdn.jsdelivr.net/npm/suneditor@3.3.3/dist/suneditor.min.js"></script>
//<!-- languages (Basic Language: English/en) - note: folder is now "langs" -->
//<script src="https://cdn.jsdelivr.net/npm/suneditor@3.3.3/src/langs/fr.js"></script>

// All Buttons : 
// undo,redo,newDocument;removeFormat,copyFormat;bold,italic,underline,strike;subscript,superscript;font,fontSize,blockStyle,fontColor,backgroundColor,textStyle;outdent,indent;align,hr,list,list_bulleted,list_numbered,lineHeight;table,Link,link,Image,image,video,audio,embed,drawing,fileUpload;codeBlock,blockquote,paragraphStyle,template,layout;finder,selectAll,pageBreak;showBlocks,codeView,markdownView,preview,print,fullScreen,exportPDF;save,Cancel

var globalLabels = {

    fr: ['Mots:', 'Caractères:', 'Lien'],
    en: ['Words:', 'Characters:', 'Link']
};


Aspectize.Extend('SunEditor', {
    Properties: {
        EditMode: true, Value: '', Mode: 'classic', Language: 'fr', Placeholder: '',
        SpellCheck: false, CloseOnSaveOrCancel: true,
        MaxImageSize: 300000,
        FontColors: 'black, white, red, blue, green;navy, orange,yellow',
        Fonts: '',
        Options: '', // JSON, merged into the SunEditor config (experiments / rarely used options)
        Buttons: 'undo,redo;removeFormat,copyFormat;finder;bold,italic,underline,strike;subscript,superscript;font,fontSize,blockStyle,fontColor,backgroundColor,textStyle;outdent,indent;align,hr,list_bulleted,list_numbered,lineHeight;table,Link,link,Image;image; showBlocks,codeView,print;paragraphStyle,blockquote;save, Cancel'
        /*, Math: false */
    },
    Events: ['OnEditModeChanged', 'OnSave', 'OnCancel', 'OnStartEditing', 'OnCustomImage', 'OnCustomLink'],

    Init: function (elem) {

        if ((typeof SUNEDITOR === 'undefined') || !SUNEDITOR.plugins) throw ('SunEditor: SUNEDITOR is undefined, the loaded suneditor.min.js is not a v3 script (a v2 copy is probably loaded before it)');

        var emptyContent = '<p><br></p>';
        var propOptionMap = {
            Mode: 'mode', Placeholder: 'placeholder', Language: 'lang',
            SpellCheck: 'spellcheck', FontColors: 'colorList', Buttons: 'buttonList', Fonts: 'fontList', Options: 'extraOptions'
            //Math: 'math'
        };
        // v3: these options can not be changed with resetOptions, the editor must be recreated
        var recreateOptions = { mode: 1, lang: 1, buttonList: 1, colorList: 1, fontList: 1, extraOptions: 1 };

        // v2 button names still accepted in the Buttons property
        var buttonNameMap = { formatBlock: 'blockStyle', hiliteColor: 'backgroundColor', horizontalRule: 'hr' };

        //#region readOnlyViewer EditMode === false
        var readOnlyViewer = document.createElement('div');
        readOnlyViewer.id = 'rov-' + elem.id;
        readOnlyViewer.style.width = '100%';
        readOnlyViewer.style.height = '100%';
        readOnlyViewer.classList.add('se-wrapper-inner');
        readOnlyViewer.classList.add('se-wrapper-wysiwyg');
        readOnlyViewer.classList.add('sun-editor-editable');

        elem.appendChild(readOnlyViewer);
        //#endregion

        var started = false;
        var lastLinkText = 'Lien';
        var lastSelectedText = '';

        function showEditor() {

            if (!started) {
                Aspectize.UiExtensions.Notify(elem, 'OnStartEditing', '');
                started = true;
            }

            var editor = getSunEditor(elem);

            editor.$.ui.show();
            readOnlyViewer.style.display = 'none';
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
            readOnlyViewer.style.display = 'block';
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

        function getButtonList(sButtons) {

            var buttonList = getItemLists(sButtons);

            for (var n = 0; n < buttonList.length; n++) {
                var items = buttonList[n];
                for (var i = 0; i < items.length; i++) {
                    var name = items[i];
                    if (name in buttonNameMap) items[i] = buttonNameMap[name];
                }
            }

            return buttonList;
        }

        // v3: color list is flat, rows are given by splitNum
        function getColorOptions(sColors) {

            var rows = getItemLists(sColors);
            var items = [];
            for (var n = 0; n < rows.length; n++) {
                items = items.concat(rows[n]);
            }

            return { items: items, splitNum: rows[0].length };
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

        // v3: a toolbar button only exists if its plugin is registered
        // plugins are taken from the button names and from the keys of the Options JSON (slashCommand, autocomplete, ...)
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

            if (contents === emptyContent) contents = '';

            readOnlyViewer.innerHTML = contents;
            Aspectize.UiExtensions.ChangeProperty(elem, 'Value', contents);
        }

        //#region custom command plugins
        // v3 instantiates plugins with "new plugin(kernel, pluginOptions)" and only looks at
        // plugin.key / plugin.type (static) and this.$ / title / icon / inner / action (instance):
        // a plain constructor function is enough, no need to derive from SUNEDITOR.interfaces.PluginCommand
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

                            var obj = { File: files[0], Url: null };
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

                            var obj = { File: files[0], Url: null };
                            lastLinkText = files[0].name;
                            Aspectize.UiExtensions.Notify(elem, 'OnCustomLink', obj);
                        }
                    });
                });

            return linkPlugin;
        }

        //#endregion

        function getLang(language) {

            var lg = (language || 'en').split('-')[0].toLowerCase();
            return SUNEDITOR_LANG[lg] || SUNEDITOR_LANG.fr || SUNEDITOR_LANG.en;
        }

        function getLabels(language) {

            var lg = (language || 'en').split('-')[0].toLowerCase();
            return globalLabels[lg] || globalLabels['fr'];

        }
        function getSunEditor(elem) {

            if (!elem.aasSunEditor) {

                var html = Aspectize.UiExtensions.GetProperty(elem, 'Value');
                var eMode = Aspectize.UiExtensions.GetProperty(elem, 'EditMode');

                var colors = Aspectize.UiExtensions.GetProperty(elem, 'FontColors');
                var colorOptions = getColorOptions(colors);

                var fonts = Aspectize.UiExtensions.GetProperty(elem, 'Fonts');
                var fontOptions = getFontOptions(fonts);

                var buttons = Aspectize.UiExtensions.GetProperty(elem, 'Buttons');
                var buttonList = getButtonList(buttons);

                var extraOptions = getExtraOptions(Aspectize.UiExtensions.GetProperty(elem, 'Options'));

                var cancelPlugin = getCancelPlugin(elem);
                var imagePlugin = getImagePlugin(elem);
                var linkPlugin = getLinkPlugin(elem);
                var plugins = [cancelPlugin, imagePlugin, linkPlugin].concat(getBuiltInPlugins(buttonList, extraOptions));

                var language = Aspectize.UiExtensions.GetProperty(elem, 'Language');

                var labels = getLabels(language);
                lastLinkText = labels[2];

                var config = {
                    plugins: plugins,
                    mode: Aspectize.UiExtensions.GetProperty(elem, 'Mode'), // classic, inline, balloon, balloon-always (+ ':bottom')
                    lang: getLang(language),
                    editableFrameAttributes: {
                        spellcheck: String(!!Aspectize.UiExtensions.GetProperty(elem, 'SpellCheck'))
                    },
                    placeholder: Aspectize.UiExtensions.GetProperty(elem, 'Placeholder'),

                    width: "100%", height: "100%",

                    buttonList: buttonList,
                    font: fontOptions,
                    fontColor: colorOptions,
                    backgroundColor: colorOptions,
                    defaultUrlProtocol: '',
                    // externalLibs: { katex: window.katex },  // goes with math button
                    //imageGallery: { data: "https://etyswjpn79.execute-api.ap-northeast-1.amazonaws.com/suneditor-demo" }, // goes with imageGallery button

                    tabDisable: false,
                    textDirection: 'ltr',
                    statusbar_showPathLabel: false,
                    wordCounter_label: labels[0],
                    wordCounter: true,

                    charCounter: true,
                    //charCounter_max:100,
                    charCounter_type: 'char',
                    charCounter_label: labels[1],

                    events: {
                        onChange: function (e) { onChange(e.data); },
                        onSave: function (e) {
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
                } else hideEditor(true);
            }

            return elem.aasSunEditor;
        }

        function recreateSunEditor() {

            var editor = elem.aasSunEditor;
            if (editor) {
                editor.destroy();
                elem.aasSunEditor = null;
                readOnlyViewer.style.display = 'block';
            }

            return getSunEditor(elem);
        }

        function setOptions(options) {

            var eMode = Aspectize.UiExtensions.GetProperty(elem, 'EditMode');
            var editor = getSunEditor(elem);

            var edOptions = {};
            var mustRecreate = false;
            //#region validate and build editor options
            for (var op in options) {
                var value = options[op];

                if (op in recreateOptions) mustRecreate = true;

                switch (op) {

                    case 'mode': {
                        if (value) {
                            var mode = value.split(':')[0];
                            if (mode in { classic: 1, inline: 1, balloon: 1, 'balloon-always': 1 }) {
                                edOptions[op] = value;
                            } else throw ('SunEditor bad value "' + value + '" for property Mode. Value can be "classic", "inline", "balloon" or "balloon-always" (optionally followed by ":bottom")');
                        }
                    } break;

                    case 'math': {
                        if (value) { // TODO and Test
                            //editor.options.externalLibs = { katex: window.katex };
                        }
                    } break;

                    case 'lang': {
                        edOptions[op] = getLang(value);
                    } break;

                    case 'spellcheck': {
                        edOptions.editableFrameAttributes = { spellcheck: String(!!value) };
                    } break;

                    case 'buttonList': {
                        edOptions[op] = getButtonList(value);
                    } break;

                    case 'colorList': {
                        edOptions.fontColor = getColorOptions(value);
                        edOptions.backgroundColor = edOptions.fontColor;
                    } break;

                    case 'fontList': {
                        edOptions.font = getFontOptions(value);
                    } break;

                    case 'extraOptions': {
                        getExtraOptions(value); // validate JSON, editor is recreated anyway
                    } break;

                    default: edOptions[op] = value; break;
                }
            }
            //#endregion

            if (mustRecreate) {
                // getSunEditor reads the current property values, nothing else to pass
                recreateSunEditor();
            } else {
                editor.resetOptions(edOptions);
                if (!eMode) hideEditor(true);
            }
        }

        function setHtmlContent(html) {

            var editor = getSunEditor(elem);

            editor.$.html.set(html);
            readOnlyViewer.innerHTML = html;
        }

        function changeEditMode(eMode) {

            var currentVisibility = getComputedStyle(readOnlyViewer).display === 'none';
            if (currentVisibility === eMode) return;

            if (eMode) {

                showEditor();

            } else {

                hideEditor(true);
            }
        }

        elem.aasControlInfo.ToggleEditMode = function () {

            var eMode = !Aspectize.UiExtensions.GetProperty(elem, 'EditMode');
            Aspectize.UiExtensions.ChangeProperty(elem, 'EditMode', eMode);

            if (eMode) {

                showEditor();

            } else hideEditor(true);

        };

        elem.aasControlInfo.SetCustomImageUrl = function (e, url) {

            setCustomImageUrl(url);
        };

        elem.aasControlInfo.SetCustomLinkUrl = function (e, url, text) {

            setCustomLinkUrl(url, lastSelectedText || text || lastLinkText || url);
        };
        Aspectize.UiExtensions.AddMergedPropertyChangeObserver(elem, function (sender, arg) {

            var options = null;
            var eMode = null;
            var html = null;
            for (var key in arg) {

                var value = arg[key];
                switch (key) {

                    case 'Value': html = value; break;
                    case 'EditMode': eMode = value; break;

                    case 'Mode':
                    case 'Placeholder':
                    case 'Language':
                    case 'SpellCheck':
                    case 'FontColors':
                    case 'Fonts':
                    case 'Options':
                    case 'Buttons':
                    case 'Math':
                        if (!options) options = {};
                        var op = propOptionMap[key];
                        options[op] = value;
                        break;
                }
            }

            if (options) setOptions(options);

            if (eMode !== null) changeEditMode(eMode);
            if (html !== null) setHtmlContent(html);
        });
    }
});