import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getUserProfile } from "../services/users";
import UserLibrary from "../components/users/UserLibrary";

export default function UserProfile() {
  const { userId } = useParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      setLoading(true);
      setError("");
      setProfile(null);

      try {
        const data = await getUserProfile(userId);

        if (!ignore) {
          setProfile(data.profile);
        }
      } catch {
        if (!ignore) {
          setError("Failed to load user profile");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    if (userId) {
      loadProfile();
    }

    return () => {
      ignore = true;
    };
  }, [userId]);

  return (
    <main>
      <Link to="/friends">Back to Friends</Link>

      <h1>User Profile</h1>

      {loading && <p>Loading profile...</p>}

      {error && <p role="alert">{error}</p>}

      {!loading && !error && profile && (
        <section>
          <div
            aria-label="Default profile avatar"
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "#ddd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40
            }}>
            {profile.username.charAt(0).toUpperCase()}
          </div>

          <UserLibrary userId={userId} />
          <h2>{profile.username}</h2>

          <p>
            Member since:{" "}
            {new Date(profile.created_at).toLocaleDateString()}
          </p>
        </section>
      )}
    </main>
  );
}
