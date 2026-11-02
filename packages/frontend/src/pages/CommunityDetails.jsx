import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { PendingRequests } from "../components/communities/PendingRequests";
import { getMyCommunityPermissions } from "../services/communities";

function CommunityDetails() {
  const { groupId } = useParams();

  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadPermissions() {
      setLoading(true);
      setPermissions(null);
      setError("");

      try {
        const data = await getMyCommunityPermissions(groupId);

        if (!ignore) {
          setPermissions(data);
        }
      } catch {
        if (!ignore) {
          setError("Failed to load community permissions");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    if (groupId) {
      loadPermissions();
    } else {
      setLoading(false);
      setPermissions(null);
      setError("No community selected");
    }

    return () => {
      ignore = true;
    };
  }, [groupId]);

  return (
    <div>
      <h1>Community Details</h1>

      {loading && <p>Loading community permissions...</p>}

      {error && <p role="alert">{error}</p>}

      {!loading &&
        !error &&
        permissions?.can_review_requests && (
          <PendingRequests key={groupId} groupId={groupId} />
        )}
    </div>
  );
}

export default CommunityDetails;
