async function isDock() {
    return  !(await detectInsideBrowserSource()) || 
            location.hash.substring(1) === 'dock';
}

async function isOverlay() {
    return await detectInsideBrowserSource();
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

export class Overlay extends HTMLElement {

    static template(state) {
        return `
            <slot></slot>
        `;
    }

    constructor() {
        super();

        window.addEventListener('storage', () => this.update());
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
            for(let ele of this.querySelectorAll('[data-state='+key+']')) {
                this.updateElement(ele, key);
            }
        }
    }

    updateElement(ele, stateKey) {
        ele.innerHTML = this.state[stateKey];
        ele.setAttribute(stateKey, this.state[stateKey]);
    }

    render(state) {
        this.shadowRoot.innerHTML = Overlay.template(state);
    }
}

export class Dock extends HTMLElement {

    static styles(state) {
        return `
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
        return `
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
            this.render(this.state);
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
        localStorage.setItem(this.storageId, JSON.stringify(this.state));
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
    render(state) {
        const styles = this.constructor.styles(state);
        const template = this.constructor.template(state);

        if(template) {
            this.shadowRoot.innerHTML = `${styles} ${template}`;
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
