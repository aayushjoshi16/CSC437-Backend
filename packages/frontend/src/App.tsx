import { useState, useEffect, useCallback, useRef } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { AllImages } from "./images/AllImages.tsx";
import { ImageDetails } from "./images/ImageDetails.tsx";
import { UploadPage } from "./UploadPage.tsx";
import { LoginPage } from "./LoginPage.tsx";
import { MainLayout } from "./MainLayout.tsx";
import { ImageSearchForm } from "./ImageSearchForm.tsx";
import { ProtectedRoute } from "./ProtectedRoute.tsx";
import { ValidRoutes } from "csc437-monorepo-backend/src/shared/ValidRoutes";
import type { IApiImageData } from "csc437-monorepo-backend/src/common/ApiImageData";

function App() {
  const [imageData, setImageData] = useState<IApiImageData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [searchString, setSearchString] = useState<string>("");
  const [authToken, setAuthToken] = useState<string | null>(
    localStorage.getItem("authToken")
  );
  const navigate = useNavigate();
  
  // Handler for setting auth token
  const handleSetAuthToken = (token: string) => {
    localStorage.setItem("authToken", token);
    setAuthToken(token);
    navigate("/"); // Redirect to home page
  };
  
  // Track the most recent request number
  const latestRequestIdRef = useRef<number>(0);

  // Reusable function to fetch images to handle both initial fetch and search
  const fetchImages = useCallback(async (searchQuery?: string) => {
    // Increment the request counter and keep track of this request's ID
    const thisRequestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = thisRequestId;

    setIsLoading(true);
    setHasError(false);

    try {
      const endpoint = searchQuery
        ? `/api/images/search?name=${encodeURIComponent(searchQuery)}`
        : "/api/images";

      // Headers for the request
      const headers: HeadersInit = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      
      // Auth token to headers if available
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers,
      });

      // Check if this response is from the most recent request
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

      if (thisRequestId === latestRequestIdRef.current) {
        setImageData(data);
        setSearchString("");
      }
    } catch (error) {
      console.error("Error fetching images:", error);
      if (thisRequestId === latestRequestIdRef.current) {
        setHasError(true);
      }
    } finally {
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

  // Function to handle image name changes
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
            <ProtectedRoute authToken={authToken}>
              <AllImages
                images={imageData}
                isLoading={isLoading}
                hasError={hasError}
                searchPanel={searchPanel}
              />
            </ProtectedRoute>
          }
        />
        <Route 
          path={ValidRoutes.UPLOAD} 
          element={
            <ProtectedRoute authToken={authToken}>
              <UploadPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path={ValidRoutes.LOGIN} 
          element={<LoginPage onAuthToken={handleSetAuthToken} />} 
        />
        <Route
          path={ValidRoutes.REGISTER}
          element={<LoginPage isRegistering={true} onAuthToken={handleSetAuthToken} />}
        />
        <Route
          path={ValidRoutes.IMAGE_DETAILS}
          element={
            <ProtectedRoute authToken={authToken}>
              <ImageDetails
                images={imageData}
                isLoading={isLoading}
                hasError={hasError}
                onImageNameChange={handleImageNameChange}
              />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
