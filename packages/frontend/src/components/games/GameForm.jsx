import Button from "../ui/Button";

// The form inside the Add Game and Wishlist pop-ups.
// Its inputs go in as children, above the submit button. An error
// shows just above the button, so it's in view after pressing it
// even when the form is scrolled down on a phone
function GameForm({
  error,
  loading,
  submitLabel,
  onSubmit,
  children
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      {children}

      {error && (
        <p className="rounded-lg bg-berry-100 px-3 py-2 text-center text-sm font-bold text-berry-700">
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={loading}
        className="mt-1 w-full">
        {loading ? "Adding..." : submitLabel}
      </Button>
    </form>
  );
}

export default GameForm;
