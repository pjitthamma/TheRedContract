import { assetUrl } from "./preloadAssets";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function EventPoster({ onDismiss }: { onDismiss: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="event-poster-modal"
      aria-label="The Red Contract event poster"
      onClose={onDismiss}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom) onDismiss();
      }}
    >
      <button className="event-poster-close" type="button" autoFocus
        aria-label="Close event poster / ปิดโปสเตอร์" onClick={onDismiss}>
        <X size={22} aria-hidden="true" />
      </button>
      <img src={assetUrl("/assets/event_poster.jpg")} alt="The Red Contract — Host Spanking Campaign, 27 June, members only"
        width={1055} height={1491} fetchPriority="high" onError={onDismiss} />
    </dialog>
  );
}
