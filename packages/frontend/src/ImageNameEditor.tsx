import { useState } from "react";

interface INameEditorProps {
  initialValue: string;
  imageId: string;
  onImageNameChange: (id: string, newName: string) => void;
}

export function ImageNameEditor(props: INameEditorProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [input, setInput] = useState(props.initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmitPressed() {
    setIsLoading(true);
    setError(null);

    try {
      // Get auth token from localStorage
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("Authentication required. Please log in again.");
      }

      // Use the backend API endpoint for updating image names with authorization
      const response = await fetch(`/api/images/${props.imageId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ name: input }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to update name: ${response.statusText}`
        );
      }

      // If successful, update the image name in parent component
      props.onImageNameChange(props.imageId, input);

      // Close the editor on success
      setIsEditingName(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isEditingName) {
    return (
      <div style={{ margin: "1em 0" }}>
        <label>
          New Name{" "}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
        </label>
        <button
          disabled={input.length === 0 || isLoading}
          onClick={handleSubmitPressed}
        >
          Submit
        </button>
        <button onClick={() => setIsEditingName(false)} disabled={isLoading}>
          Cancel
        </button>

        {isLoading && <div>Working...</div>}
        {error && <div style={{ color: "red" }}>{error}</div>}
      </div>
    );
  } else {
    return (
      <div style={{ margin: "1em 0" }}>
        <button onClick={() => setIsEditingName(true)}>Edit name</button>
      </div>
    );
  }
}
