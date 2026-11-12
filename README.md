# eclose

[![CI](https://github.com/jordankmars/eclose/actions/workflows/ci.yml/badge.svg)](https://github.com/jordankmars/eclose/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

> A dialog or popover that grows out of its trigger.

A card becomes a detail view, a button becomes a menu, a pill becomes a panel. It's live DOM, every morph can be interrupted, and it dismisses with a swipe.

It's about 9 kB gzipped, with no dependencies beyond React.

## Installation

```sh
npm install eclose
```

## Usage

```tsx
import { Eclose } from "eclose/react";

<Eclose.Root>
	<Eclose.Trigger>Share</Eclose.Trigger>
	<Eclose.Content>
		<Eclose.Title>Share this</Eclose.Title>
		<Eclose.Close />
	</Eclose.Content>
</Eclose.Root>;
```

eclose ships no CSS. Style the parts with your own classes, and the motion takes care of itself.

### Parts

| Part                                 | Props                                                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `Eclose.Root`                        | `open`, `defaultOpen`, `onOpenChange`, `placement`, `origin`, `modal`, `swipe`, `container`            |
| `Eclose.Trigger`, `Eclose.Close`     | `asChild`, plus button props                                                                           |
| `Eclose.Content`                     | `initialFocus` ref, plus div props. Without it, focus goes to an `autoFocus` child, or else the dialog |
| `Eclose.Shared`                      | `id` (required), `asChild`                                                                             |
| `Eclose.Overlay`                     | div props. You color it, and it fades on its own                                                       |
| `Eclose.Title`, `Eclose.Description` | Label the dialog for assistive technology                                                              |

Every part also has `data-state`: `closed`, `opening`, `open` or `closing`.

### Placement

`placement="anchored"` is the default. The content rests on top of its trigger, follows it as it moves, and stays usable alongside the page. Set `modal` to opt in to focus trapping, an inert page and scroll lock.

`placement="centered"` puts it in the middle of the viewport, and is modal unless you set `modal={false}`.

### Origin

`origin` sets the point anchored content grows from. That point of the content sits on the same point of the trigger and stays still while the rest grows away from it. It's `center` by default, and can be a side (`top`, `right`, `bottom`, `left`) or a corner (`top-left`, `top-right`, `bottom-left`, `bottom-right`).

Near a viewport edge, it lines up the trigger's other edge if that fits, and otherwise stays on screen. Centered content ignores `origin` and always grows from its center.

### Shared elements

Put an `Eclose.Shared` with the same `id` on each side, and that element flies across on its own while the surface grows around it.

```tsx
<Eclose.Root placement="centered">
	<Eclose.Trigger>
		<Eclose.Shared id="cover" className="thumbnail" />
	</Eclose.Trigger>
	<Eclose.Overlay className="scrim" />
	<Eclose.Content>
		<Eclose.Shared id="cover" className="hero" />
	</Eclose.Content>
</Eclose.Root>;
```

A copy does the flying and the real element appears when it lands, so keep Shared for media-like elements. A copy won't carry over a playing video or a canvas, or CSS scoped under the content's parents.

### Swipe

On touch, dragging down dismisses. Inside a scroller, it only takes over from the top. Pass `swipe={false}` to turn it off, or mark an element with `data-eclose-no-swipe` to exempt it.

### Good to know

- Don't put a CSS `transition` on `Eclose.Content`. It fights the per-frame updates.
- Portals sit at `z-index: 9999`. Set `--eclose-z` to change that.
- A trigger's position is followed through scrolling and resizing, but not through a CSS transform animating on its parent mid-morph. The browser doesn't report those.
- Don't pass a `container` that's scaled. Translated is fine.
- With reduced motion, everything becomes a fade.

## How it works

The engine in `src/core` knows nothing about React. The adapter renders state, and a layout effect hands the elements to the core once they're in the DOM, so a controlled `open` prop takes the same path as a click.

The surface rides five springs: x, y, width, height and corner radius. They're measured in page coordinates rather than the viewport, so a morph keeps pointing at the same place while the page scrolls under it. Each frame, the surface gets a real width and height plus a translate, not a scale, so borders and shadows are drawn exactly while the content inside holds still and is clipped.

Reopening halfway through a close retargets the springs from where they are and keeps their velocity, so the motion bends instead of starting over. Everything that's moving shares one `requestAnimationFrame` loop, which stops on the first frame with nothing left to do.

## Adapters

| Framework | Import path     | Status      |
| --------- | --------------- | ----------- |
| React     | `eclose/react`  | Available   |
| Vue       | `eclose/vue`    | Coming soon |
| Svelte    | `eclose/svelte` | Coming soon |

## Development

```sh
pnpm install
pnpm play   # playground at localhost:5173
pnpm test   # unit tests
pnpm size   # checks the built size against the budget
```

The playground has two halves: demos that drive the core engine directly from
React, and the same demos built with the public components.

## Contributing

Contributions are welcome. Please open an issue to discuss changes before submitting a pull request.

## License

[MIT](./LICENSE)
