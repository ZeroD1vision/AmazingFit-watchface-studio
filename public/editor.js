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

        this.editor.addEventListener('input', () => {
            this.updateLineCounter();
            this.autoSave();
        });

        this.editor.addEventListener('keyup', this.updateLineCounter.bind(this));
        this.editor.addEventListener('click', this.updateLineCounter.bind(this));
    }

    setupSocket() {
        this.socket.on('connect', () => {
            this.socket.emit('join-watchface', this.currentWatchface);
        });

        this.socket.on('code-updated', (code) => {
            if (this.editor.value !== code) {
                this.editor.value = code;
                this.updateLineCounter();
                logToConsole('info', 'Code updated from server');
            }
        });

        this.socket.on('disconnect', () => {
            logToConsole('warn', 'Disconnected from server');
        });
    }

    setupEvents() {
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveWatchface();
        });
        document.getElementById('runBtn').addEventListener('click', () => {
            this.runCode();
        });
        document.getElementById('formatBtn').addEventListener('click', () => {
            this.saveWatchface();
        });
        document.getElementById('newBtn').addEventListener('click', () => {
            this.currentWatchface();
        });
        document.getElementById('watchfaceSelect').addEventListener('click', (e) => {
            this.loadWatchface(e.target.value);
        });

        setInterval(() => this.autoSave(), 30000);
    }
    

    updateLineCounter() {
        const text = this.editor.value;
        const lines = text.substr(0, this.editor.selectionStart).split('\n');
        const line = lines.length;
        const col = lines[lines.length - 1].length + 1;

        document.getElementById('lineCounter').textContent = `Line: ${line}, Col; ${col}`;
    }

    async loadWatchface(name = this.currentWatchface) {
        try {
            const response = await fetch(`/api/watchface/${name}`);
            if(!response.ok) throw new Error('Failed to load');
            
            const data = await response.json();

            this.editor.value = data.code;
            this.currentWatchface = name;

            this.socket.emit('join-watchface', name);
            logToConsole('success', `Loaded watchface: ${name}`);
            this.updateLineCounter();
        } catch (error) {
            logToConsole('error', `Failed to load watchface: ${error.message}`);
        }
    }

    async saveWatchface() {
        try {
            const code = this.editor.value;
            const response = await fetch(`/api/watchface/${this.currentWatchface}`, {
                method: 'POST',
                headers: { 'Content-type': 'application/json' },
                body: JSON.stringify({ code })
            });

            if (!response.ok) throw new Error('Failed to save');

            logToConsole('success', 'Watchface saved successfully');
            document.getElementById('statusText').textContent = 'Saved';

            setTimeout(() => {
                document.getElementById('statusText').textContent = 'Ready';
            });
        } catch (error) {
            logToConsole('error', `Failed to save: ${error.message}`);
        }
    }

    autoSave() {
        if (this.editor.value.trim()) {
            this.socket.emit('code-change', {
                watchfaceName: this.currentWatchface,
                code: this.editor.value
            });

            document.getElementById('statusText').textContent = 'AutoSaving...';
        }
    }
}