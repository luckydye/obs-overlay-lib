import { html, render } from 'https://unpkg.com/lit-html?module';

async function isDock() {
    return  !(await detectInsideBrowserSource()) || 
            location.hash.substring(1) === 'debug';
}

async function isOverlay() {
    return await detectInsideBrowserSource() || 
                 location.hash.substring(1) === 'debug';
}

const initialStyles = document.head.querySelectorAll('style').length;

async function detectInsideBrowserSource() {

    const check = () => {
        const currentStyles = document.head.querySelectorAll('style').length;
        return currentStyles > initialStyles;
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

const overlays = new Map();

export class Overlay {

    static getOverlay(id) {
        return overlays.get(id);
    }

    static get state() {
        return {
            time: 0
        }
    }

    get timestamp() {
        return this.state.metadata ? this.state.metadata.timestamp : Date.now();
    }

    constructor(id) {
        this.id = id || location.pathname;
        this.updaterate = 1000 / 4;

        this.state = this.constructor.state || {};

        overlays.set(id, this);

        this.run();
    }

    async run() {
        console.error('starting overlay');
        console.error('state', await detectInsideBrowserSource());

        const tick = async () => {
            this.fetchState();
            this.update(this.state, Date.now() - this.timestamp);
            this.postState(this.state);

            setTimeout(() => tick(), this.updaterate);
        }

        tick();
    }
    
    update(state, ms) {
        // called on tick
    }  

    fetchState() {
        const item = localStorage.getItem(this.id);
        this.state = Object.assign(this.state, JSON.parse(item) || {});
    }

    postState(state) {
        const metadata = {
            metadata: {
                id: this.id,
                timestamp: Date.now()
            }
        };

        const newState = Object.assign(this.state, state);
        
        this.state = Object.assign(newState, metadata);

        localStorage.setItem(this.id, JSON.stringify(this.state));

        window.dispatchEvent(new Event('overlay.update'));
    }  

    getState() {
        return this.state;
    }
}

export class OverlayElement extends HTMLElement {

    static template() {
        return html`
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
            <style>
                :host {
                    position: absolute;
                    top: 0;
                    left: 0;
                    z-index: 1000;
                }
            </style>
            <slot></slot>
        `;
    }

    async connectedCallback() {
        this.attachShadow({ mode: 'open' });

        if(await this.shouldRender()) {
            this.overlay = Overlay.getOverlay(this.getAttribute('overlay'));

            if(!this.overlay) {
                throw '"overlay" not defined';
            }

            window.addEventListener('overlay.update', () => this.render());
            this.render();
        }
    }

    async shouldRender() {
        return await isOverlay();
    }

    render() {
        const state = this.overlay.getState() || {};

        render(OverlayElement.template(), this.shadowRoot);
        
        for(let key in state) {
            if(typeof state[key] != 'object') {
                this.setAttribute(key, state[key]);
            }

            for(let ele of this.querySelectorAll('[data-html='+key+']')) {
                ele.innerHTML = state[key];
            }

            for(let ele of this.querySelectorAll('[data-attribute='+key+']')) {
                ele.setAttribute(key, state[key]);
            }
        }
    }
}

export class DockElement extends HTMLElement {

    static styles() {
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
    
    static template(dock) {
        return html`
            <slot></slot>
        `;
    }
    
    async connectedCallback() {
        this.attachShadow({ mode: 'open' });
        
        if(await this.shouldRender()) {
            this.overlay = Overlay.getOverlay(this.getAttribute('overlay'));

            if(!this.overlay) {
                throw '"overlay" not defined';
            }

            window.addEventListener('overlay.update', () => this.render());
            this.render();
        }
    }

    async shouldRender() {
        return await isDock();
    }

    // render dock element
    render() {
        const state = this.overlay.getState() || {};

        const styles = this.constructor.styles();
        const template = this.constructor.template(this);

        render(html`${styles} ${template}`, this.shadowRoot);

        for(let key in state) {
            this.setAttribute(key, state[key]);
        }
    }

}

customElements.define('obs-overlay', OverlayElement);
customElements.define('obs-dock', DockElement);

window.OBSOverlay = {
    DockElement,
    OverlayElement,
    Overlay,
    isDock,
    isOverlay,
}
