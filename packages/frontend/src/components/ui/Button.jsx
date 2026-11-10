import { Link } from "react-router-dom";
import { buttonClass } from "./styles";

// The app's buttons. variant is "primary" (green, the main action),
// "secondary", "ghost" or "danger"; size is "sm", "md" or "lg".
// type defaults to "button", so a form's submit button needs
// type="submit"
function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, className })}
      {...props}
    />
  );
}

// A link that looks like a button
export function ButtonLink({
  variant,
  size,
  className,
  ...props
}) {
  return (
    <Link
      className={buttonClass({ variant, size, className })}
      {...props}
    />
  );
}

export default Button;
