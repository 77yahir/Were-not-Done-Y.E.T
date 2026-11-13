import { useState } from "react";
import { createCommunity } from "../../services/communities";
import Button from "../ui/Button";
import Notice from "../ui/Notice";
import Panel from "../ui/Panel";
import { IconPlus } from "../ui/icons";
import { fieldClass } from "../ui/styles";

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
    <Panel
      title="Create A Community"
      icon={<IconPlus className="size-5" />}>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3">
        <input
          className={fieldClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Community Name"
          required
        />
        <textarea
          className={fieldClass}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
        />
        <Button
          type="submit"
          disabled={loading}
          className="w-full">
          {loading ? "Creating..." : "Add Community"}
        </Button>
      </form>

      {message && (
        <Notice
          tone={
            message === "Community created successfully!"
              ? "success"
              : "error"
          }
          className="mt-3">
          {message}
        </Notice>
      )}
    </Panel>
  );
}

export default AddCommunity;
