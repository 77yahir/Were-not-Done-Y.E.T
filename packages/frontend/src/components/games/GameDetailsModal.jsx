import { useEffect, useRef } from "react";
import Modal from "../ui/Modal";
import { CONDITIONS, hideImage } from "./gameDetails";

function conditionLabel(value) {
  const condition = CONDITIONS.find(
    (option) => option.value === value
  );

  return condition ? condition.label : value;
}

// One row of the details list: the label on the left, the value on
// the right
function Detail({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-3 py-2">
      <dt className="shrink-0 text-ink-700">{label}</dt>
      <dd className="min-w-0 text-right font-bold wrap-anywhere">
        {children}
      </dd>
    </div>
  );
}

// Pop-up with everything saved about a game in the Library or
// Wishlist. Picture, age, time and condition aren't always there
function GameDetailsModal({ game, onClose }) {
  const titleRef = useRef(null);

  // Keyboard and screen reader users start on the game's name,
  // and go back to its card when the pop-up closes
  useEffect(() => {
    const openedFrom = document.activeElement;
    titleRef.current.focus({ preventScroll: true });

    return () => openedFrom?.focus();
  }, []);

  const players =
    game.min_players === game.max_players
      ? game.min_players
      : `${game.min_players}–${game.max_players}`;

  return (
    <Modal title="Details" onClose={onClose}>
      <div className="flex flex-col gap-4">
        {game.image_url && (
          <img
            src={game.image_url}
            alt={`Picture of ${game.title}`}
            onError={hideImage}
            className="h-56 w-full rounded-xl border border-parchment-300 bg-parchment-200 object-contain p-2"
          />
        )}

        <h3
          ref={titleRef}
          tabIndex={-1}
          className="text-center text-3xl leading-tight font-extrabold wrap-anywhere outline-none">
          {game.title}
        </h3>

        <dl className="divide-y divide-parchment-300 rounded-xl border border-parchment-300 bg-parchment-50/70 text-sm">
          <Detail label="Players">{players}</Detail>
          <Detail label="Genre">{game.genre}</Detail>
          {game.min_age && (
            <Detail label="Min age">{game.min_age}+</Detail>
          )}
          {game.avg_playing_time && (
            <Detail label="Average playing time">
              {game.avg_playing_time} min
            </Detail>
          )}
          {game.condition && (
            <Detail label="Condition">
              {conditionLabel(game.condition)}
            </Detail>
          )}
        </dl>

        <p className="leading-relaxed whitespace-pre-line wrap-anywhere">
          {game.description}
        </p>
      </div>
    </Modal>
  );
}

export default GameDetailsModal;
