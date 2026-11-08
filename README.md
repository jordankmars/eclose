# eclose

> A dialog or popover that grows out of its trigger.

A card becomes a detail view, a button becomes a menu, a pill becomes a panel. It's live DOM, every morph can be interrupted, and it dismisses with a swipe.

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
| `Eclose.Root`                        | `open`, `defaultOpen`, `onOpenChange`, `placement`, `modal`, `swipe`, `container`                      |
| `Eclose.Trigger`, `Eclose.Close`     | `asChild`, plus button props                                                                           |
| `Eclose.Content`                     | `initialFocus` ref, plus div props. Without it, focus goes to an `autoFocus` child, or else the dialog |
| `Eclose.Shared`                      | `id` (required), `asChild`                                                                             |
| `Eclose.Overlay`                     | div props. You color it, and it fades on its own                                                       |
| `Eclose.Title`, `Eclose.Description` | Label the dialog for assistive technology                                                              |

Every part also has `data-state`: `closed`, `opening`, `open` or `closing`.

### Placement

`placement="anchored"` is the default. The content rests on top of its trigger, follows it as it moves, and stays usable alongside the page. Set `modal` to opt in to focus trapping, an inert page and scroll lock.

`placement="centered"` puts it in the middle of the viewport, and is modal unless you set `modal={false}`.

### Shared elements

Put an `Eclose.Shared` with the same `id` on each side, and that element flies across on its own while the surface fades around it.

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
- With reduced motion, everything becomes a fade.

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
