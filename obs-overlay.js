import { html, render } from 'lit-html';

function isDock() {
    return location.hash.substring(1) === 'dock';
}

function isOverlay() {
    return location.hash.substring(1) === 'overlay' || !location.hash;
}

window.addEventListener('load', () => {
    document.body.setAttribute('loaded', '');
});

export class Overlay extends HTMLElement {

    static template(state) {
        return html`<slot></slot>`;
    }

    constructor() {
        super();

        window.addEventListener('storage', () => this.update());
    }

    connectedCallback() {
        this.attachShadow({ mode: 'open' });

        this.storageId = location.pathname;
        this.state = {};

        if(!isOverlay()) return;

        this.update();
        this.render();
    }

    update() {
        const storage = localStorage.getItem(this.storageId);

        if(storage) {
            this.state = JSON.parse(storage);
        }

        for(let key in this.state) {
            for(let ele of this.querySelectorAll('[data-state='+key+']')) {
                ele.innerHTML = this.state[key];
            }
        }
    }

    render(state) {
        render(Overlay.template(state), this.shadowRoot);
    }
}

export default class Dock extends HTMLElement {

    static styles(state) {
        return html`
            <style>
                :host {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                }
            </style>
        `;
    }
    
    static template() {
        return html`<slot></slot>`;
    }
    
    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        
        this.storageId = location.pathname;
        this.state = {};
        
        if(!isDock()) return;
        
        this.setup();
        
        this.render(this.state);
    }

    setup() {
        // setup dock
    }

    updateOverlay() {
        localStorage.setItem(this.storageId, JSON.stringify(this.state));
    }

    render(state) {
        const styles = this.constructor.styles(state);
        const template = this.constructor.template(state);

        if(template) {
            render(html`${styles} ${template}`, this.shadowRoot);
        } else {
            throw 'Missing Template';
        }
    }

}

customElements.define('obs-overlay', Overlay);
customElements.define('obs-dock', Dock);

window.OBSOverlay = {
    Dock,
    Overlay,
}
