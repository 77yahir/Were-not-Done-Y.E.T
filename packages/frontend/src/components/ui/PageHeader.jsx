// A page's title in big letters on the wood, with an optional line
// under it and an action on the right
function PageHeader({
  title,
  subtitle,
  icon,
  action,
  className = ""
}) {
  return (
    <div
      className={`mb-5 flex flex-wrap items-end justify-between gap-3 ${className}`}>
      <div className="min-w-0">
        <h1 className="flex items-center gap-3 text-3xl font-extrabold text-parchment-50 [text-shadow:0_2px_0_rgb(0_0_0/0.45)] sm:text-4xl">
          {icon && (
            <span className="shrink-0 text-gold-400">
              {icon}
            </span>
          )}
          {title}
        </h1>

        {subtitle && (
          <p className="mt-1 text-parchment-200">{subtitle}</p>
        )}
      </div>

      {action}
    </div>
  );
}

export default PageHeader;
