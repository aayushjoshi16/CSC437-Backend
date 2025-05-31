import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { AllImages } from "./images/AllImages.tsx";
import { ImageDetails } from "./images/ImageDetails.tsx";
import { UploadPage } from "./UploadPage.tsx";
import { LoginPage } from "./LoginPage.tsx";
import { MainLayout } from "./MainLayout.tsx";
import { ValidRoutes } from "csc437-monorepo-backend/src/shared/ValidRoutes";
import type { IApiImageData } from "csc437-monorepo-backend/src/common/ApiImageData";

function App() {
  const [imageData, setImageData] = useState<IApiImageData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  // Add a function to handle image name changes
  const handleImageNameChange = (imageId: string, newName: string) => {
    setImageData((prevImages) =>
      prevImages.map((img) =>
        img.id === imageId ? { ...img, name: newName } : img
      )
    );
  };

  useEffect(() => {
    // Code in here will run when App is created
    // (Note in dev mode App is created twice)
    const fetchImages = async () => {
      try {
        const response = await fetch("/api/images");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setImageData(data);
      } catch (error) {
        console.error("Error fetching images:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, []);

  return (
    <Routes>
      <Route path={ValidRoutes.HOME} element={<MainLayout />}>
        <Route
          path={ValidRoutes.HOME}
          element={
            <AllImages
              images={imageData}
              isLoading={isLoading}
              hasError={hasError}
            />
          }
        />
        <Route path={ValidRoutes.UPLOAD} element={<UploadPage />} />
        <Route path={ValidRoutes.LOGIN} element={<LoginPage />} />
        <Route
          path={ValidRoutes.IMAGE_DETAILS}
          element={
            <ImageDetails
              images={imageData}
              isLoading={isLoading}
              hasError={hasError}
              onImageNameChange={handleImageNameChange}
            />
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
