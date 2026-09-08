import { useEffect, useRef, useState, type CSSProperties } from 'react';

/* Powers the sliding pill behind `.mcm-segmented`'s active tab (Numbers
   section only — see `.ident-segmented-indicator` in mcm-page.css). The
   indicator's own width/position can't be known from CSS alone since each
   tab's width depends on its label, so this measures the currently
   `.is-active` element inside the nav and turns that into a transform the
   indicator can transition toward. Re-measures on every `activeKey` change
   (a tab switch) and on resize (the nav's own width — and therefore each
   tab's — can change with the viewport). */
export function useSlidingTabIndicator(activeKey: string) {
  const navRef = useRef<HTMLElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<CSSProperties>({ opacity: 0 });

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const measure = () => {
      const active = nav.querySelector<HTMLElement>('.is-active');
      if (!active) {
        setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
        return;
      }
      setIndicatorStyle({
        opacity: 1,
        width: active.offsetWidth,
        height: active.offsetHeight,
        transform: `translate(${active.offsetLeft}px, ${active.offsetTop}px)`,
      });
    };

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(nav);
    return () => resizeObserver.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  return { navRef, indicatorStyle };
}
