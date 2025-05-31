import { useParams } from "react-router-dom";
import type { IApiImageData } from "csc437-monorepo-backend/src/common/ApiImageData";
import { ImageNameEditor } from "../ImageNameEditor";

interface ImageDetailsProps {
  images: IApiImageData[];
  isLoading: boolean;
  hasError: boolean;
  onImageNameChange: (id: string, newName: string) => void;
}

export function ImageDetails({
  images,
  isLoading,
  hasError,
  onImageNameChange,
}: ImageDetailsProps) {
  const params = useParams<{ imageId: string }>();
  const image = images.find((image) => image.id === params.imageId);

  if (isLoading) {
    return <div className="loading-message">Loading image details...</div>;
  }

  if (hasError) {
    return (
      <div className="error-message">
        Error loading image details. Please try again later.
      </div>
    );
  }

  if (!image) {
    return <div className="not-found-message">Image not found</div>;
  }

  console.log("Image details:", image);

  return (
    <div>
      <h2>{image.name}</h2>
      <p>By {image.author.name}</p>
      <img className="ImageDetails-img" src={image.src} alt={image.name} />
      <ImageNameEditor
        initialValue={image.name}
        imageId={image.id}
        onImageNameChange={onImageNameChange}
      />
    </div>
  );
}
