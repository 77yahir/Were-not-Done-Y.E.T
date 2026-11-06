import { useEffect, useRef } from "react";
import Modal from "../ui/Modal";
import { CONDITIONS, hideImage } from "./gameDetails";

function conditionLabel(value) {
  const condition = CONDITIONS.find(
    (option) => option.value === value
  );

  return condition ? condition.label : value;
}

function Detail({ label, children }) {
  return (
    <>
      <dt>{label}</dt>
      <dd className="m-0 text-right wrap-anywhere">
        {children}
      </dd>
    </>
  );
}

// Pop-up with everything saved about a game in the Library or
// Wishlist. Picture, age, time and condition aren't always there
function GameDetailsModal({ game, onClose }) {
  const titleRef = useRef(null);

  // Keyboard and screen reader users start on the game's name,
  // and go back to its row when the pop-up closes
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
      <div className="flex w-full flex-col gap-4 text-[16px]">
        {game.image_url && (
          <img
            src={game.image_url}
            alt={`Picture of ${game.title}`}
            onError={hideImage}
            className="h-[220px] w-full object-contain"
          />
        )}

        <h3
          ref={titleRef}
          tabIndex={-1}
          className="text-center text-[28px] wrap-anywhere outline-none">
          {game.title}
        </h3>

        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
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

        <p className="m-0 whitespace-pre-line wrap-anywhere">
          {game.description}
        </p>
      </div>
    </Modal>
  );
}

export default GameDetailsModal;
