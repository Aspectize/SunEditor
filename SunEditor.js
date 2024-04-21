/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisense.js" />

//<link href="https://cdn.jsdelivr.net/npm/suneditor@latest/dist/css/suneditor.min.css" rel="stylesheet">
//<script src="https://cdn.jsdelivr.net/npm/suneditor@latest/dist/suneditor.min.js"></script>
//<!-- languages (Basic Language: English/en) -->
//<script src="https://cdn.jsdelivr.net/npm/suneditor@latest/src/lang/fr.js"></script>


Aspectize.Extend('SunEditor', {
    Properties: { HtmlContent: '', EditMode: false, Placeholder: '', Mode: 'classic', Language: 'fr', SpellCheck: false, Math: false },
    Events: ['OnHtmlContentChanged'],


    Init: function (elem) {

        var propOptionMap = { Mode: 'mode', Placeholder: 'placeholder', Language: 'lang', SpellCheck: 'spellcheck', Math: 'math' };

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

        function getSunEditor(elem) {

            if (!elem.aasSunEditor) {

                var html = Aspectize.UiExtensions.GetProperty(elem, 'HtmlContent');
                var eMode = Aspectize.UiExtensions.GetProperty(elem, 'EditMode');

                var config = {

                    mode: Aspectize.UiExtensions.GetProperty(elem, 'Mode'), // classic, inline, balloon
                    "rtl": false,
                    lang: SUNEDITOR_LANG.fr,
                    frameAttrbutes: {
                        spellcheck: Aspectize.UiExtensions.GetProperty(elem, 'SpellCheck')
                    },
                    placeholder: Aspectize.UiExtensions.GetProperty(elem, 'Placeholder'),

                    width: "100%", height: "100%",
                    // katex: window.katex,  // goes with math button 
                    "colorList": [
                        [
                            "#ff0000",
                            "#ff5e00",
                            "#ffe400",
                            "#abf200"
                        ],
                        [
                            "#00d8ff",
                            "#0055ff",
                            "#6600ff",
                            "#ff00dd"
                        ]
                    ],
                    //"imageGalleryUrl": "https://etyswjpn79.execute-api.ap-northeast-1.amazonaws.com/suneditor-demo", // goes with imageGallery button 
                    "videoFileInput": false,
                    "tabDisable": false,

                    buttonList: [
                            ['undo', 'redo'],
                            ['font', 'fontSize', 'formatBlock'],
                            ['bold', 'underline', 'italic', 'strike', 'subscript', 'superscript'],
                            ['removeFormat'],
                            ['outdent', 'indent'],
                            ['align', 'horizontalRule', 'list', 'lineHeight'],
                            ['table', 'link', 'image' /*, 'video', 'audio', */],
                            ['fullScreen', 'showBlocks', 'codeView', 'preview', 'print', 'save', 'template'],
                            //['math', 'imageGallery'],
                            ["paragraphStyle", "blockquote", "fontColor", "hiliteColor", "textStyle", "table", "link", "image"]
                    ]

                };

                if (!eMode) readOnlyViewer.innerHTML = html;

                elem.aasSunEditor = SUNEDITOR.create(readOnlyViewer, config);

                if (!eMode) {
                    elem.aasSunEditor.hide();
                    readOnlyViewer.style.display = 'block';
                }

                var input = elem.querySelector('input');
                if (input) input.style.display = 'none';
            }

            return elem.aasSunEditor;
        }

        function setOption(property, value) {

            var op = propOptionMap[property];
            if (op) {
                switch (op) {

                    case 'mode': {
                        var modes = {}
                        if (value) { 
                            if (value in { classic: 1, inline: 1, balloon: 1 }) {
                                editor.options[op] = value;
                            } else throw ('SunEditor bad value "' + value + '" for property Mode. Value can be "classic", "inline", or "balloon"');
                        }
                    } break;

                    case 'math': {
                        if (value) { // ToTest
                            editor.options.katex = window.katex;
                            editor.options.buttonList.push(op);
                        }
                    } break;

                    case 'lang' : {
                        var lg = value.split('-')[0].toLowerCase();
                        editor.options[op] = SUNEDITOR_LANG[lg];
                    } break;

                    case 'spellcheck': {
                      
                        editor.options.frameAttrbutes[op] = !!value;
                    } break;

                    default: editor.options[op] = value; break;        
                }
            } 
        }
     
        function setHtmlContent(html) {

            var editor = getSunEditor(elem);
            var eMode = Aspectize.UiExtensions.GetProperty(elem, 'EditMode');

            if (eMode) {

                editor.setContents(html);
            } else readOnlyViewer.innerHTML = html;
        }
        function changeEditMode(eMode) {

            var currentVisibility = getComputedStyle(readOnlyViewer).display === 'none';
            if (currentVisibility === eMode) return;

            var editor = getSunEditor(elem);
            if (eMode) {

                editor.show();
                readOnlyViewer.style.display = 'none';

            } else {

                editor.hide();
                readOnlyViewer.style.display = 'block';
            }
        }

        function addTemplate(name, html) {

            editor.options.templates.push({ 'name': name, 'html': html });

            if (editor.options.templates.length === 1) {
                editor.options.buttonList.push('template');
            }
        }

        function showEditor() {

            var editor = getSunEditor(elem);

            editor.show();
            readOnlyViewer.style.display = 'none';
        }

        function hideEditor() {

            var editor = getSunEditor(elem);

            var html = editor.getContents();
            readOnlyViewer.innerHTML = html;
            editor.hide();
            readOnlyViewer.style.display = 'block';

        }

        var editor = getSunEditor(elem);

        elem.aasControlInfo.ToggleEditMode = function () {

            var eMode = !Aspectize.UiExtensions.GetProperty(elem, 'EditMode');
            Aspectize.UiExtensions.ChangeProperty(elem, 'EditMode', eMode);

            if (eMode) {

                showEditor();

            } else hideEditor();

        };

        Aspectize.UiExtensions.AddMergedPropertyChangeObserver(elem, function (sender, arg) {

            for (var key in arg) {

                var value = arg[key];
                switch (key) {

                    case 'HtmlContent': setHtmlContent(value); break;
                    case 'EditMode': changeEditMode(value); break;

                    case 'Mode':
                    case 'Placeholder':
                    case 'Language':
                    case 'Math': setOption(key, value); break;
                }
            }
        });
    }
});


