import { useId, useState, useCallback, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import "./styles/messages.css";

// Custom hook for handling form submission state
function useCustomState() {
  const [isPending, setIsPending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const startAction = useCallback(() => {
    setIsPending(true);
    setError(null);
    setSuccess(null);
  }, []);

  const endAction = useCallback((success: boolean, message: string) => {
    setIsPending(false);
    if (success) {
      setSuccess(message);
      setError(null);
    } else {
      setError(message);
      setSuccess(null);
    }
  }, []);

  return {
    isPending,
    error,
    success,
    startAction,
    endAction,
  };
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.readAsDataURL(file);
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = (err) => reject(err);
  });
}

export function UploadPage() {
  const fileInputId = useId();
  const titleInputId = useId();
  const messageRegionId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { isPending, error, success, startAction, endAction } =
    useCustomState();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      try {
        const dataUrl = await readAsDataURL(file);
        setPreviewUrl(dataUrl);
      } catch (error) {
        console.error("Error reading file:", error);
      }
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedFile) {
      endAction(false, "Please select a file to upload");
      return;
    }

    const formData = new FormData(e.currentTarget);
    startAction();

    try {
      // Get auth token from localStorage
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        endAction(false, "Authentication required. Please log in again.");
        return;
      }

      const response = await fetch("/api/images", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      if (response.ok) {
        endAction(true, "Image uploaded successfully!");
        setPreviewUrl("");
        setSelectedFile(null);

        try {
          if (formRef.current) {
            formRef.current.reset();
          } else {
            const fileInput = document.getElementById(
              fileInputId
            ) as HTMLInputElement;
            const titleInput = document.getElementById(
              titleInputId
            ) as HTMLInputElement;
            if (fileInput) fileInput.value = "";
            if (titleInput) titleInput.value = "";
          }
        } catch (resetError) {
          console.warn("Could not reset form:", resetError);
        }
      } else {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.message || `Upload failed with status: ${response.status}`;
        endAction(false, errorMessage);
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      endAction(false, "Failed to upload image. Please try again later.");
    }
  };

  return (
    <div>
      <h2>Upload a New Image</h2>
      <form ref={formRef} onSubmit={handleSubmit}>
        <div>
          <label htmlFor={fileInputId}>Choose image to upload: </label>
          <input
            id={fileInputId}
            name="image"
            type="file"
            accept=".png,.jpg,.jpeg"
            required
            onChange={handleFileChange}
            disabled={isPending}
          />
        </div>
        <div>
          <label htmlFor={titleInputId}>
            <span>Image title: </span>
          </label>
          <input id={titleInputId} name="name" required disabled={isPending} />
        </div>

        <div>
          {/* Preview img element */}
          {previewUrl && (
            <img
              style={{ width: "20em", maxWidth: "100%", margin: "1em 0" }}
              src={previewUrl}
              alt="Image preview"
            />
          )}
        </div>

        <input
          type="submit"
          value={isPending ? "Uploading..." : "Confirm upload"}
          disabled={isPending}
        />

        <div id={messageRegionId} aria-live="polite">
          {error && (
            <div className="error-message" style={{ marginTop: "1em" }}>
              {error}
            </div>
          )}
          {success && (
            <div
              className="success-message"
              style={{
                marginTop: "1em",
                backgroundColor: "#d4edda",
                color: "#155724",
                padding: "15px",
                borderRadius: "4px",
              }}
            >
              {success}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
