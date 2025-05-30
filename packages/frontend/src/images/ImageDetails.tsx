import { useParams } from "react-router-dom";
import type { IImageData } from "../MockAppData.ts";

interface ImageDetailsProps {
  images: IImageData[];
}

export function ImageDetails({ images }: ImageDetailsProps) {
  const params = useParams<{ imageId: string }>();
  const image = images.find((image) => image.id === params.imageId);

  if (!image) {
    return <h2>Image not found</h2>;
  }

  return (
    <div>
      <h2>{image.name}</h2>
      <p>By {image.author.username}</p>
      <img className="ImageDetails-img" src={image.src} alt={image.name} />
    </div>
  );
}
