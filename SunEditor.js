/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisenseLibrary.js" />

//<!-- SunEditor -->
//<link href="https://cdn.jsdelivr.net/npm/suneditor@latest/dist/css/suneditor.min.css" rel="stylesheet">
//<script src="https://cdn.jsdelivr.net/npm/suneditor@latest/dist/suneditor.min.js"></script>
//<!-- languages (Basic Language: English/en) -->
//<script src="https://cdn.jsdelivr.net/npm/suneditor@latest/src/lang/fr.js"></script>


Aspectize.Extend('SunEditor', {
    //TinyMCE  Properties
    //Properties: { EditMode: true, Value: '', CustomImage: '', CustomLink: '', RelativeUrls: false, Inline: false, MenuBar: false, StatusBar: false, WordCount: false, DisableIFrame: false, RemoveTrailingBrs: true },
    Properties: {
        EditMode: true, Value: '', Mode: 'classic', Language: 'fr', Placeholder: '',
        SpellCheck: false, CloseOnSaveOrCancel: true,
        CustomImageUrl: '', ImageToUpload: null, MaxImageSize:300000,
        FontColors: 'black, white, red, blue, green;navy, orange,yellow',
        Buttons: 'undo,redo;removeFormat;bold,italic,underline,strike;subscript,superscript;font,fontSize,formatBlock,fontColor,hiliteColor,textStyle;outdent,indent;align,horizontalRule,list,lineHeight;table,link,Image; showBlocks,codeView,print;paragraphStyle,blockquote;save, Cancel'
        /*, Math: false */
    },
    Events: ['OnEditModeChanged', 'OnSave', 'OnCancel', 'OnStartEditing', 'OnCustomImage'],
    //'OnValueChanged',

    Init: function (elem) {

        var emptyContent = '<p><br></p>';
        var propOptionMap = {
            Mode: 'mode', Placeholder: 'placeholder', Language: 'lang',
            SpellCheck: 'spellcheck', FontColors: 'colorList', Buttons: 'buttonList'
            //Math: 'math'
        };
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

        function showEditor() {

            if (!started) {
                Aspectize.UiExtensions.Notify(elem, 'OnStartEditing', '');
                started = true;
            }

            var editor = getSunEditor(elem);

            editor.show();
            readOnlyViewer.style.display = 'none';
            Aspectize.UiExtensions.ChangeProperty(elem, 'EditMode', true);

        }
        function hideEditor() {

            if (started) {
                Aspectize.UiExtensions.Notify(elem, 'OnCancel', '');
                started = false;
            }

            var editor = getSunEditor(elem);

            editor.hide();
            readOnlyViewer.style.display = 'block';
            Aspectize.UiExtensions.ChangeProperty(elem, 'EditMode', false);
        }

        function setCustomImageUrl(url) {

            var editor = getSunEditor(elem);
            var htmlImg = '<img src="' + url + '">';
            editor.insertHTML(htmlImg, true, true);
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


        function onChange(contents) {

            if (contents === emptyContent) contents = '';

            readOnlyViewer.innerHTML = contents;
            Aspectize.UiExtensions.ChangeProperty(elem, 'Value', contents);
        }

        function getCancelPlugin(elem) {

            var cancelPlugin = {
                name: 'Cancel',
                display: 'command',
                buttonClass: '',
                title: 'Cancel',
                innerHTML: '<i class="fa-regular fa-rectangle-xmark" style="color:red;"></i>',
                add: function (core, targetElement) {/* Initialize your button here. */ },
                active: function (element) { },
                action: function () {

                    Aspectize.UiExtensions.Notify(elem, 'OnCancel', '');
                    if (Aspectize.UiExtensions.GetProperty(elem, 'CloseOnSaveOrCancel')) hideEditor();
                }
            };

            return cancelPlugin;
        }

        function getImagePlugin(elem) {

            var imagePlugin = {
                name: 'Image',
                display: 'command',
                buttonClass: '',
                title: 'Image',
                innerHTML: '<i class="fa-regular fa-image"></i>',
                add: function (core, targetElement) {/* Initialize your button here. */ },
                active: function (element) { },
                action: function () {

                    var maxSize = Aspectize.UiExtensions.GetProperty(elem, 'MaxImageSize')
                    var sys = Aspectize.GetService('SystemServices');
                    var chosen = sys.ChooseFile('image/*', false);

                    chosen.then(function (files) {

                        var obj = { aasUploadFileArg: true, aasFileUploadControl: elem, Files: files };
                        Aspectize.UiExtensions.ChangeProperty(elem, 'ImageToUpload', obj);
                        Aspectize.UiExtensions.Notify(elem, 'OnCustomImage', obj);

                        var file = files[0];

                        //var editor = elem.aasSunEditor;
                        //editor.insert;
                    });

                }
            };

            return imagePlugin;
        }

        function getSunEditor(elem) {

            if (!elem.aasSunEditor) {

                var html = Aspectize.UiExtensions.GetProperty(elem, 'Value');
                var eMode = Aspectize.UiExtensions.GetProperty(elem, 'EditMode');

                var colors = Aspectize.UiExtensions.GetProperty(elem, 'FontColors');
                var fontColors = getItemLists(colors);

                var buttons = Aspectize.UiExtensions.GetProperty(elem, 'Buttons');
                var buttonList = getItemLists(buttons);

                var cancelPlugin = getCancelPlugin(elem);
                var imagePlugin = getImagePlugin(elem);
                var config = {
                    plugins: [cancelPlugin, imagePlugin],
                    mode: Aspectize.UiExtensions.GetProperty(elem, 'Mode'), // classic, inline, balloon
                    lang: SUNEDITOR_LANG.fr,
                    frameAttrbutes: {
                        spellcheck: Aspectize.UiExtensions.GetProperty(elem, 'SpellCheck')
                    },
                    placeholder: Aspectize.UiExtensions.GetProperty(elem, 'Placeholder'),

                    width: "100%", height: "100%",

                    colorList: fontColors,
                    buttonList: buttonList,

                    // katex: window.katex,  // goes with math button 
                    //imageGalleryUrl: "https://etyswjpn79.execute-api.ap-northeast-1.amazonaws.com/suneditor-demo", // goes with imageGallery button 
                    videoFileInput: false,
                    tabDisable: false,
                    rtl: false
                };

                readOnlyViewer.innerHTML = html;
                elem.aasSunEditor = SUNEDITOR.create(readOnlyViewer, config);

                if (eMode) {
                    showEditor();
                } else hideEditor();

                var input = elem.querySelector('input');
                if (input) input.style.display = 'none';
            }

            elem.aasSunEditor.onChange = onChange;
            elem.aasSunEditor.onSave = function () {
                Aspectize.UiExtensions.Notify(elem, 'OnSave', '');
                if (Aspectize.UiExtensions.GetProperty(elem, 'CloseOnSaveOrCancel')) hideEditor();
            }
            return elem.aasSunEditor;
        }

        function setOptions(options) {

            var eMode = Aspectize.UiExtensions.GetProperty(elem, 'EditMode');
            var editor = getSunEditor(elem);

            var edOptions = {};
            //#region validate and build editor options
            for (var op in options) {
                var value = options[op];
                switch (op) {

                    case 'mode': {
                        var modes = {}
                        if (value) {
                            if (value in { classic: 1, inline: 1, balloon: 1 }) {
                                edOptions[op] = value;
                            } else throw ('SunEditor bad value "' + value + '" for property Mode. Value can be "classic", "inline", or "balloon"');
                        }
                    } break;

                    case 'math': {
                        if (value) { // TODO and Test
                            //editor.options.katex = window.katex;
                            //editor.options.buttonList.push(op);
                        }
                    } break;

                    case 'lang': {
                        var lg = value.split('-')[0].toLowerCase();
                        edOptions[op] = SUNEDITOR_LANG[lg];
                    } break;

                    case 'spellcheck': {
                        edOptions.frameAttrbutes[op] = !!value;
                    } break;

                    case 'buttonList':
                    case 'colorList': {
                        edOptions[op] = getItemLists(value);
                    } break;

                    default: edOptions[op] = value; break;
                }
            }
            //#endregion 

            editor.setOptions(edOptions);
            if (!eMode) hideEditor();
        }

        function setHtmlContent(html) {

            var eMode = Aspectize.UiExtensions.GetProperty(elem, 'EditMode');

            if (eMode) {
                var editor = getSunEditor(elem);

                editor.setContents(html);
            } else readOnlyViewer.innerHTML = html;
        }
        function changeEditMode(eMode) {

            var currentVisibility = getComputedStyle(readOnlyViewer).display === 'none';
            if (currentVisibility === eMode) return;

            if (eMode) {

                showEditor();

            } else hideEditor();
        }

        elem.aasControlInfo.ToggleEditMode = function () {

            var eMode = !Aspectize.UiExtensions.GetProperty(elem, 'EditMode');
            Aspectize.UiExtensions.ChangeProperty(elem, 'EditMode', eMode);

            if (eMode) {

                showEditor();

            } else hideEditor();

        };

        Aspectize.UiExtensions.AddMergedPropertyChangeObserver(elem, function (sender, arg) {

            var options = null;
            var eMode = null;
            var html = null;
            var customImageUrl = null;
            for (var key in arg) {

                var value = arg[key];
                switch (key) {

                    case 'Value': html = value; break;
                    case 'EditMode': eMode = value; break;
                    case 'CustomImageUrl': customImageUrl = value;

                    case 'Mode':
                    case 'Placeholder':
                    case 'Language':
                    case 'Math':
                        if (!options) options = {};
                        var op = propOptionMap[key];
                        options[op] = value;
                        break;
                }
            }

            if (customImageUrl) setCustomImageUrl(customImageUrl);

            if (options) setOptions(options);

            if (eMode !== null) changeEditMode(eMode);
            if (html !== null) setHtmlContent(html);
        });
    }
});


