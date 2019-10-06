import { html, render } from 'https://unpkg.com/lit-html?module';

async function isDock() {
    return  !(await detectInsideBrowserSource()) || 
            location.hash.substring(1) === 'debug';
}

async function isOverlay() {
    return await detectInsideBrowserSource() || 
                 location.hash.substring(1) === 'debug';
}

async function detectInsideBrowserSource() {

    const check = () => {
        for(let { href } of document.styleSheets) {
            if(href && href.match('data:text/css')) {
                return true;
            }
        }
        return false;
    }

    return new Promise((resolve, reject) => {
        if(performance.timing.loadEventEnd === 0) {
            // if window is not loaded yet
            window.addEventListener('load', () => {
                setTimeout(() => resolve(check()), 10);
            });
        } else {
            resolve(check());
        }
    });
}

/**
 * TODO:
 *   - "Overlay" class for the logic.
 *   - The "obs-oock" element can control/change the state of the overlay.
 *   - The "obs-overlay" element can display the current state.
 *   - The Overlay class gets initialiezd and runs on the browser source.
 **/

export class Overlay extends HTMLElement {

    static template(state) {
        return html`
            <style>
                :host {
                    position: absolute;
                    top: 0;
                    left: 0;
                    z-index: 100;
                }
            </style>
            <slot></slot>
        `;
    }

    constructor() {
        super();

        window.addEventListener('storage', () => this.update());
        window.addEventListener('overlay', () => this.update());
    }

    async connectedCallback() {
        this.attachShadow({ mode: 'open' });

        this.storageId = location.pathname;
        this.state = {};

        if(await this.shouldRender()) {
            this.update();
            this.render();
        }
    }

    async shouldRender() {
        return await isOverlay();
    }

    update() {
        const storage = localStorage.getItem(this.storageId);

        if(storage) {
            this.state = JSON.parse(storage);
        }

        for(let key in this.state) {
            this.setAttribute(key, this.state[key]);

            for(let ele of this.querySelectorAll('[data-html='+key+']')) {
                this.updateElement(ele, key);
            }
        }
    }

    updateElement(ele, stateKey) {
        ele.innerHTML = this.state[stateKey];
        ele.setAttribute(stateKey, this.state[stateKey]);
    }

    render(state) {
        render(Overlay.template(state), this.shadowRoot);
    }
}

export class Dock extends HTMLElement {

    static styles(instance) {
        return html`
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
            <style>
                :host {
                    display: grid;
                    grid-gap: 8px;
                    grid-auto-flow: row;
                    grid-auto-rows: auto;
                    justify-content: center;
                    justify-items: center;
                    align-content: center;
                    background: #272727;
                    width: 100%;
                    height: 100%;
                    position: absolute;
                    top: 0;
                    left: 0;
                }

                .material-icons {
                    font-size: 18px;
                    width: 35px;
                }
                
                input {
                    user-select: text;
                    display: inline-block;
                    border: none;
                    background: #1c1c1c;
                    border-radius: 4px;
                    padding: 6px 8px;
                    color: white;
                    outline: none;
                    max-width: 145px;
                }
                                
                input:focus {
                    background: #202020;
                }

                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                }

                input[type="number"] {
                    width: 25px;
                    font-size: 16px;
                    text-align: center;
                    letter-spacing: 2px;
                }

                button {
                    margin: 0;
                    padding: 8px;
                    line-height: 100%;
                    border: none;
                    border-radius: 4px;
                    outline: none;
                    font-size: 12px;
                    cursor: pointer;
                    transition: .15s ease-out;
                    background: #353535;
                    box-shadow: 1px 2px 8px rgba(0, 0, 0, 0.25);
                    color: #d4d4d4;
                }

                button:hover {
                    background: #424242;
                    box-shadow: 1px 2px 8px rgba(0, 0, 0, 0.25);
                    color: white;
                }

                button[active] {
                    transition-duration: 0s;
                    background: #555555;
                }

                button:active {
                    transition-duration: 0s;
                    background: #353535;
                    box-shadow: 0 0 2px rgba(0, 0, 0, 0.25);
                }
            </style>
        `;
    }
    
    static template(instance) {
        return html`
            <slot></slot>
        `;
    }

    // returns initial state
    static get state() {
        return {};
    }
    
    async connectedCallback() {
        this.attachShadow({ mode: 'open' });
        
        this.storageId = location.pathname;
        this.state = this.getOverlayState();
        
        if(await this.shouldRender()) {
            this.setup();
            this.render();
        }
    }

    async shouldRender() {
        return await isDock();
    }

    // setup dock
    setup() {

    }

    // push state to overlay
    updateOverlay() {
        for(let key in this.state) {
            this.setAttribute(key, this.state[key]);
        }

        localStorage.setItem(this.storageId, JSON.stringify(this.state));
        window.dispatchEvent(new Event('overlay'));

        this.render();
    }

    // return saved overlay state
    getOverlayState() {
        const item = localStorage.getItem(this.storageId);
        if(item) {
            return JSON.parse(item);
        }
        return this.constructor.state || {};
    }

    // render dock element
    render() {
        const styles = this.constructor.styles(this);
        const template = this.constructor.template(this);

        if(template) {
            render(html`${styles} ${template}`, this.shadowRoot);
        } else {
            throw 'Missing Template';
        }
    }

}

window.addEventListener('load', () => {
    document.body.setAttribute('loaded', '');
});

customElements.define('obs-overlay', Overlay);
customElements.define('obs-dock', Dock);

window.OBSOverlay = {
    Dock,
    Overlay,
    isDock,
    isOverlay,
}
