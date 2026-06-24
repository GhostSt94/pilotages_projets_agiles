import { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

/**
 * Visualiseur d'images (lightbox).
 * @param images        [{ url, name }]
 * @param index         index courant (null/-1 => fermé)
 * @param onIndexChange (i) => void
 * @param onClose       () => void
 */
export function ImageViewer({ images = [], index, onIndexChange, onClose }) {
  const open = index != null && index >= 0 && index < images.length;
  const count = images.length;

  const prev = useCallback(() => onIndexChange((index - 1 + count) % count), [index, count, onIndexChange]);
  const next = useCallback(() => onIndexChange((index + 1) % count), [index, count, onIndexChange]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, prev, next]);

  const current = open ? images[index] : null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">Aperçu de l'image</DialogTitle>
        {current && (
          <div className="relative">
            <img
              src={current.url}
              alt={current.name || 'image'}
              className="max-h-[82vh] w-full rounded-lg bg-white object-contain shadow-2xl"
            />

            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-slate-900/60 text-white transition hover:bg-slate-900/80"
                  aria-label="Image précédente"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-slate-900/60 text-white transition hover:bg-slate-900/80"
                  aria-label="Image suivante"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 rounded-b-lg bg-gradient-to-t from-slate-900/70 to-transparent px-3 py-2 text-xs text-white">
              <span className="truncate">{current.name}</span>
              {count > 1 && <span className="shrink-0">{index + 1} / {count}</span>}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
