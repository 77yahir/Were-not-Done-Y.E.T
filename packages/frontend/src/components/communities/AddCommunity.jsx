import { useState } from "react";
import { createCommunity } from "../../services/communities";

function AddCommunity() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const result = await createCommunity(name, description);
      setName("");
      setDescription("");
      setMessage("Community created successfully!");
    } catch (error) {
      setMessage("Failed to create community");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {message && <p>{message}</p>}
      <h2>Add Community</h2>

      <form onSubmit={handleSubmit}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Community Name"
          required
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Add Community"}
        </button>
      </form>
    </div>
  );
}

export default AddCommunity;
