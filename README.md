# OBS Overlay Lib

## The custom Dock

This library uses custom elements to render elements.

```javascript
class CustomDock extends OBSOverlay.Dock {

    // setup() gets called in connectedCallback of the Dock class.
    setup() {
        // initialize state
        this.state = {
            text: 'default text',
        };

        // call to push updated state to overlay
        this.updateOverlay();
    }

    setText(text) {
        this.state.text = text;
        this.updateOverlay();
    }

}

// register custom element
customElements.define('custom-dock', CustomDock);
```

Use the custom element in html:

```html
<custom-dock id="dock">
    <input oninput="dock.setText(this.value);"/>
</custom-dock>
```

## The custom overlay

The overlay markup only needs a html element to work.

```html
<widget-overlay>
    <div data-state="text"></div>
</widget-overlay>
```

## Example

- [Timer example](./examples/timer.html)

## How to use

- Add the URL (for example "timer.html") as an browser source in your obs.
- Add the same URL but with "#dock" at the end ("timer.html#dock") as a custom browser dock in your obs.
