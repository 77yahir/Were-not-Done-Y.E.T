function SettingsRow({ icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-4 rounded-xl border border-parchment-300 bg-parchment-50 px-4 py-4 text-left transition-colors hover:bg-parchment-200">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-parchment-200 text-wood-700">
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg font-bold">
          {title}
        </span>
        <span className="block text-sm text-ink-700">
          {description}
        </span>
      </span>

      <span
        className="text-xl text-wood-600"
        aria-hidden="true">
        ›
      </span>
    </button>
  );
}

export default SettingsRow;
