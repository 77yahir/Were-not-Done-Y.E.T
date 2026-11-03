import plusIcon from "../../assets/icons/plus.svg";

function AddGameButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[46px] w-full items-center justify-center gap-3 text-[20px]">
      <img
        src={plusIcon}
        alt=""
        width="22"
        height="22"
        className="size-[22px]"
      />
      Add Game
    </button>
  );
}

export default AddGameButton;
