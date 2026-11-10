// A parchment card, the building block of every page. With a title
// it gets a header row with an optional icon, and action on the
// right (e.g. an Add button). Pass className for the card and
// bodyClassName for the area below the header, e.g. to let a list
// scroll inside it
function Panel({
  as: Tag = "section",
  title,
  titleAs: Heading = "h2",
  icon,
  action,
  className = "",
  bodyClassName = "",
  children,
  ...props
}) {
  return (
    <Tag
      className={`bg-parchment rounded-2xl border border-parchment-300 text-ink-900 shadow-panel [--focus-color:var(--color-ink-900)] ${className}`}
      {...props}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-parchment-300 px-4 py-3 sm:px-5">
          {title && (
            <Heading className="flex min-w-0 items-center gap-2 text-xl font-bold">
              {icon && (
                <span className="shrink-0 text-wood-600">
                  {icon}
                </span>
              )}
              {title}
            </Heading>
          )}

          {action}
        </div>
      )}

      <div className={`p-4 sm:p-5 ${bodyClassName}`}>
        {children}
      </div>
    </Tag>
  );
}

export default Panel;
