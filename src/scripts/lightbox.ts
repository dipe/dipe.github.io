// src/scripts/lightbox.ts
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import type PhotoSwipe from 'photoswipe';

export interface LightboxOptions {
  /**
   * Selector for the gallery container(s). Every matching element becomes an
   * independent group, so one page can hold several galleries.
   */
  gallery: string;
  /** Selector for the zoomable anchors inside a gallery container. */
  children: string;
}

/** History entry pushed while the lightbox is open. */
const LIGHTBOX_HASH = '#lightbox';

/**
 * Mirrors the on-page caption of the current slide into the lightbox.
 *
 * The content is read from the `[data-pswp-caption]` element inside the
 * thumbnail's `<figure>` rather than duplicated into a data attribute, so the
 * lightbox always shows exactly what is printed below the thumbnail — markup
 * included.
 */
function registerCaption(pswp: PhotoSwipe): void {
  pswp.ui?.registerElement({
    name: 'caption',
    className: 'pswp__figcaption',
    appendTo: 'root',
    order: 9,
    onInit: (element) => {
      pswp.on('change', () => {
        const trigger: HTMLElement | undefined = pswp.currSlide?.data.element;
        const caption = trigger
          ?.closest('figure')
          ?.querySelector('[data-pswp-caption]');
        element.innerHTML = caption?.innerHTML ?? '';
        element.hidden = !caption;
      });
    },
  });
}

/**
 * Wires up a PhotoSwipe lightbox for `gallery`/`children` and keeps it working
 * across Starlight's view transitions.
 *
 * Starlight navigates client-side, so the elements a lightbox bound its click
 * handlers to are gone after every `astro:page-load` — the instance has to be
 * torn down and rebuilt instead of created once.
 */
export function registerLightbox({ gallery, children }: LightboxOptions): void {
  let lightbox: PhotoSwipeLightbox | null = null;
  let onPopState: (() => void) | null = null;

  const dropPopStateHandler = (): void => {
    if (!onPopState) return;
    window.removeEventListener('popstate', onPopState);
    onPopState = null;
  };

  const init = (): void => {
    lightbox?.destroy();
    lightbox = null;
    dropPopStateHandler();

    if (!document.querySelector(children)) return;

    lightbox = new PhotoSwipeLightbox({
      gallery,
      children,
      pswpModule: () => import('photoswipe'),
      imageClickAction: 'close',
      tapAction: 'close',
    });

    // PhotoSwipe 5 dropped v4's built-in `history` option, so we push a
    // throwaway entry ourselves. Without it the browser's (and Android's) back
    // button would leave the page instead of closing the lightbox.
    lightbox.on('beforeOpen', () => {
      history.pushState({ pswp: true }, '', LIGHTBOX_HASH);
      dropPopStateHandler();
      onPopState = () => {
        onPopState = null; // the listener is `once`, so it has removed itself
        lightbox?.pswp?.close();
      };
      window.addEventListener('popstate', onPopState, { once: true });
    });

    lightbox.on('close', () => {
      // Closed from inside the lightbox: drop our history entry, which in turn
      // triggers the popstate handler above. Closed via the back button: the
      // entry is already gone and the handler has already run.
      if (location.hash === LIGHTBOX_HASH) history.back();
      else dropPopStateHandler();
    });

    lightbox.on('uiRegister', () => {
      if (lightbox?.pswp) registerCaption(lightbox.pswp);
    });

    lightbox.init();
  };

  init();
  document.addEventListener('astro:page-load', init);
}
