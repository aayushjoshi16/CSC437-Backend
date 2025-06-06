import { useState, useEffect, useCallback, useRef } from "react";
import { Routes, Route } from "react-router-dom";
import { AllImages } from "./images/AllImages.tsx";
import { ImageDetails } from "./images/ImageDetails.tsx";
import { UploadPage } from "./UploadPage.tsx";
import { LoginPage } from "./LoginPage.tsx";
import { MainLayout } from "./MainLayout.tsx";
import { ImageSearchForm } from "./ImageSearchForm.tsx";
import { ValidRoutes } from "csc437-monorepo-backend/src/shared/ValidRoutes";
import type { IApiImageData } from "csc437-monorepo-backend/src/common/ApiImageData";

function App() {
  const [imageData, setImageData] = useState<IApiImageData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [searchString, setSearchString] = useState<string>("");
  // Add a ref to track the most recent request number
  const latestRequestIdRef = useRef<number>(0);

  // Reusable function to fetch images - handles both initial fetch and search
  const fetchImages = useCallback(async (searchQuery?: string) => {
    // Increment the request counter and keep track of this request's ID
    const thisRequestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = thisRequestId;

    setIsLoading(true);
    setHasError(false);

    try {
      // Determine the endpoint based on whether there's a search query
      const endpoint = searchQuery
        ? `/api/images/search?name=${encodeURIComponent(searchQuery)}`
        : "/api/images";

      // Setting proper headers for the request
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      // Check if this response is from the most recent request
      // If not, ignore it to prevent race conditions
      if (thisRequestId !== latestRequestIdRef.current) {
        console.log(
          `Ignoring stale response from request #${thisRequestId}, current request is #${latestRequestIdRef.current}`
        );
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      // Only update state if this is still the most recent request
      if (thisRequestId === latestRequestIdRef.current) {
        setImageData(data);
        setSearchString("");
      }
    } catch (error) {
      console.error("Error fetching images:", error);
      // Only update error state if this is still the most recent request
      if (thisRequestId === latestRequestIdRef.current) {
        setHasError(true);
      }
    } finally {
      // Only update loading state if this is still the most recent request
      if (thisRequestId === latestRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Function to handle image search
  const handleImageSearch = () => {
    if (!searchString.trim()) {
      fetchImages();
    } else {
      fetchImages(searchString);
    }
  };

  // Add a function to handle image name changes
  const handleImageNameChange = (imageId: string, newName: string) => {
    setImageData((prevImages) =>
      prevImages.map((img) =>
        img.id === imageId ? { ...img, name: newName } : img
      )
    );
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Create the search panel component to pass to AllImages
  const searchPanel = (
    <ImageSearchForm
      searchString={searchString}
      onSearchStringChange={setSearchString}
      onSearchRequested={handleImageSearch}
    />
  );

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
              searchPanel={searchPanel}
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
