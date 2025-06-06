import React from "react";
import type { IApiImageData } from "csc437-monorepo-backend/src/common/ApiImageData";
import { ImageGrid } from "./ImageGrid.tsx";

interface AllImagesProps {
  images: IApiImageData[];
  isLoading: boolean;
  hasError: boolean;
  searchPanel?: React.ReactNode; // Add the searchPanel prop
}

export function AllImages({
  images,
  isLoading,
  hasError,
  searchPanel,
}: AllImagesProps) {
  if (isLoading) {
    return <div className="loading-message">Loading images...</div>;
  }

  if (hasError) {
    return (
      <div className="error-message">
        Error loading images. Please try again later.
      </div>
    );
  }

  return (
    <>
      <h2>All Images</h2>
      {searchPanel} {/* Render the searchPanel prop here */}
      {images.length === 0 ? (
        <div className="no-images-message">No images found.</div>
      ) : (
        <ImageGrid images={images} />
      )}
    </>
  );
}
