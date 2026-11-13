import Button from "../ui/Button";
import { IconPlus } from "../ui/icons";

// The green button in the Library and Wishlist panels that opens the
// Add Game pop-up
function AddGameButton({ onClick }) {
  return (
    <Button onClick={onClick}>
      <IconPlus className="size-5" />
      Add Game
    </Button>
  );
}

export default AddGameButton;
