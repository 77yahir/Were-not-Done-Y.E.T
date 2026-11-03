// The form inside the Add Game and Wishlist pop-ups.
// Its inputs go in as children, above the submit button
function GameForm({
  error,
  loading,
  submitLabel,
  onSubmit,
  children
}) {
  return (
    <>
      {error && <p className="mt-0 mb-3 text-center">{error}</p>}

      <form
        onSubmit={onSubmit}
        className="flex w-full flex-col items-center gap-4">
        {children}

        <button
          type="submit"
          disabled={loading}
          className="h-[47px] w-[278px] max-w-full text-[30px]">
          {loading ? "Adding..." : submitLabel}
        </button>
      </form>
    </>
  );
}

export default GameForm;
