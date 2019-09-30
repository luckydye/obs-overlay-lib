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

    template(state) {
        return `
            <slot></slot>
        `;
    }

    connectedCallback() {
        this.attachShadow({ mode: 'open' });

        this.storageId = location.pathname;
        this.state = {};

        if(!isOverlay()) return;

        this.update();

        window.addEventListener('storage', () => this.update());
    }

    update() {
        this.state = localStorage.getItem(this.storageId);
        this.render(this.state);

        for(let key in this.state) {
            for(let ele of this.querySelectorAll('[data-id='+key+']')) {
                ele.innerText = this.state[key];
            }
        }
    }

    render(state) {
        this.shadowRoot.innerHTML = this.template(state);
    }

}

export class Dock extends HTMLElement {

    template(state) {
        return `
            <style>
                :host {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                }    
            </style>
            <slot></slot>
        `;
    }

    connectedCallback() {
        this.attachShadow({ mode: 'open' });

        this.storageId = location.pathname;
        this.state = {};
        
        if(!isDock()) return;

        this.addEventListener('click', () => {
            const target = e.target;
            const handler = target.dataset.onclick;

            this[handler]();
        });

        this.addEventListener('input', () => {
            const target = e.target;
            const handler = target.dataset.oninput;

            this[handler]();
        });

        this.render(this.state);
    }
    
    update() {

    }

    render(state) {
        this.shadowRoot.innerHTML = this.template(state);
    }

}

customElements.define('widget-overlay', Overlay);
customElements.define('widget-dock', Dock);
