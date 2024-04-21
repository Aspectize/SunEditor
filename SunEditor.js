/// <reference path="S:\Delivery\Aspectize.core\AspectizeIntellisense.js" />

//<link href="https://cdn.jsdelivr.net/npm/suneditor@latest/dist/css/suneditor.min.css" rel="stylesheet">
//<script src="https://cdn.jsdelivr.net/npm/suneditor@latest/dist/suneditor.min.js"></script>
//<!-- languages (Basic Language: English/en) -->
//<script src="https://cdn.jsdelivr.net/npm/suneditor@latest/src/lang/fr.js"></script>


Aspectize.Extend('SunEditor', {
    Properties: { HtmlContent: '', EditMode: false, Placeholder: '', Mode: 'classic', Language: 'fr', SpellCheck: false, Math: false },
    Events: ['OnHtmlContentChanged'],


    Init: function (elem) {

        var readOnlyViewer = document.createElement('div');
        readOnlyViewer.id = 'rov-' + elem.id;
        readOnlyViewer.style.width = '100%';
        readOnlyViewer.style.height = '100%';
        readOnlyViewer.classList.add('se-wrapper-inner');
        readOnlyViewer.classList.add('se-wrapper-wysiwyg');
        readOnlyViewer.classList.add('sun-editor-editable');

        var html = Aspectize.UiExtensions.GetProperty(elem, 'HtmlContent');
        readOnlyViewer.innerHTML = html;

        elem.appendChild(readOnlyViewer);

        function buildSunEditor(elem) {


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

        function setLanguage(lg) {
            lg = lg.split('-')[0].toLowerCase();
            editor.options.lang = SUNEDITOR_LANG[lg];
        }
        function setMath(enable) {

            if (enable) {

                editor.options.katex = window.katex;
                editor.options.buttonList.push('math');
            }
        }

        function addTemplate(name, html) {

            editor.options.templates.push({ 'name': name, 'html': html });

            if (editor.options.templates.length === 1) {
                editor.options.buttonList.push('template');
            }
        }

        function showEditor() {

            var editor = buildSunEditor(elem);

            editor.show();
            readOnlyViewer.style.display = 'none';
        }

        function hideEditor() {

            var editor = buildSunEditor(elem);

            var html = editor.getContents();
            readOnlyViewer.innerHTML = html;
            editor.hide();
            readOnlyViewer.style.display = 'block';

        }

        elem.aasControlInfo.ToggleEditMode = function () {

            var eMode = !Aspectize.UiExtensions.GetProperty(elem, 'EditMode');
            Aspectize.UiExtensions.ChangeProperty(elem, 'EditMode', eMode);

            if (eMode) {

                showEditor();

            } else hideEditor();

        };

        //var lg = Aspectize.UiExtensions.GetProperty(elem, 'Language');
        //setLanguage(lg);

        Aspectize.UiExtensions.AddMergedPropertyChangeObserver(elem, function (sender, arg) {

            var editor = buildSunEditor(elem);

            var htmlContent = arg.HtmlContent || '';

            if ('EditMode' in arg) {

                var eMode = Aspectize.UiExtensions.GetProperty(elem, 'EditMode');

                if (eMode) {

                    showEditor();

                } else hideEditor();
            }
        });
    }
});


