// import ob-overlay lib
import { html } from 'https://unpkg.com/lit-html?module';
import { Overlay, DockElement } from '../lib/obs-overlay.js';

class Timer extends Overlay {

    static get state() {
        return {
            time: 0,
            title: "",
            hours: "00",
            minutes: "00",
            seconds: "00",
            playing: false,
            countdown: false,
        }
    }

    update(state, delta) {
        if(state.playing) {
            if(state.countdown) {
                if(state.time > 1) {
                    state.time -= delta;
                } else {
                    state.time = 0;
                    this.pause();
                }
            } else {
                state.time += delta;
            }
        }

        const s = Math.floor(state.time / 1000) % 60;
        const m = Math.floor(state.time / 1000 / 60) % 60;
        const h = Math.floor(state.time / 1000 / 60 / 60) % 60;

        state.hours = h.toString().padStart(2, '0');
        state.minutes = m.toString().padStart(2, '0');
        state.seconds = s.toString().padStart(2, '0');
    }

    setTitle(title) {
        this.postState({ title });
    }

    setTime(h, m, s) {
        this.postState({
            time: (parseInt(s) * 1000) + (parseInt(m) * 60 * 1000) + (parseInt(h) * 60 * 60 * 1000)
        });
    }

    pause() {
        this.postState({ playing: false });
    }

    play() {
        this.postState({ playing: true });
    }

    togglePlay() {
        if(this.state.playing) {
            this.pause();
        } else {
            this.play();
        }
    }

    toggleCountdown() {
        this.postState({ countdown: !this.state.countdown });
    }

    reset() {
        this.postState({ time: 0 });
    }

}

class TimerDock extends DockElement {

    static template(dock) {
        const overlay = dock.overlay;
        const state = overlay.getState();

        const serializeTimeForm = (form) => {
            const formData = new FormData(form);
            
            const h = +formData.get('hours');
            const m = +formData.get('minutes');
            const s = +formData.get('seconds');

            overlay.setTime(h, m, s);
        }

        return html`
            <div>
                <input type="text" value="${state.title}" @input=${e => overlay.setTitle(e.target.value)} placeholder="Title"/>
            </div>

            <form @input=${(function() { serializeTimeForm(this); })}>
                <input type="number" .value="${state.hours}" name="hours" max="99" step="1"/>
                <span>:</span>
                <input type="number" .value="${state.minutes}" name="minutes" max="99" step="1"/>
                <span>:</span>
                <input type="number" .value="${state.seconds}" name="seconds" max="99" step="1"/>
            </form>
        
            <div class="controls">
                <style>
                    :host([countdown="true"]) .countdown {
                        background: #555555;
                    }
                    :host([playing="true"]) .playpause::after {
                        content: "pause";
                    }
                    :host([playing="false"]) .playpause::after {
                        content: "play_arrow";
                    }
                    :host([playing="true"]) .playpause {
                        background: #555555;
                    }
                    [obsdragndrop] {
                        text-decoration: none;
                    }
                </style>

                <button @click=${() => overlay.reset()} class="material-icons">restore</button>
                <a obsdragndrop @click="${e => e.preventDefault()}" href="${location.origin}${location.pathname}?layer-width=400&layer-height=180&layer-name=Timer">
                    <button @click=${() => overlay.togglePlay()} class="material-icons playpause"></button>
                </a>
                <button @click=${() => overlay.toggleCountdown()} class="material-icons countdown">timer</button>
            </div>
        `;
    }

}

customElements.define('timer-dock', TimerDock);

const timer = new Timer('timer');
