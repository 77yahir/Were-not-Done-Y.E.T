import Pill from "../ui/Pill";

// Owners stand out in gold and admins in blue. Anything else, such as
// "member", gets the plain pill
const ROLE_TONES = {
  owner: "gold",
  admin: "blue"
};

// Someone's role in a community as a small label, e.g. "Owner".
// "Role: " is only read out by screen readers
function RolePill({ role }) {
  return (
    <Pill tone={ROLE_TONES[role]} className="capitalize">
      <span className="sr-only">Role: </span>
      {role}
    </Pill>
  );
}

export default RolePill;
