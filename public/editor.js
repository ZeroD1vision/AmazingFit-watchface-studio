class CodeEditor {
    constructor() {
        this.editor = document.getElementById('codeEditor');
        this.currentWatchface = 'default.watchface.js';
        this.socket = io();

        this.init();
    }

    init() {
        this.setupEditor();
        this.setupSocket();
        this.setupEvents();
        this.loadWatchface();
    }

    setupEditor() {
        this.editor.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.editor.selectionStart;
                const end = this.editor.selectionEnd;

                this.editor.value = this.editor.value.substring(0, start) 
                    + '  '
                    + this.editor.value.substring(end);
                this.editor.selectionStart = this.editor.selectionEnd = start + 2;
                
                this.updateLineCounter();
            }
        });
    }
}