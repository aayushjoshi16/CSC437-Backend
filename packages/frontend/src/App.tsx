import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { AllImages } from "./images/AllImages.tsx";
import { ImageDetails } from "./images/ImageDetails.tsx";
import { UploadPage } from "./UploadPage.tsx";
import { LoginPage } from "./LoginPage.tsx";
import { MainLayout } from "./MainLayout.tsx";
import { fetchDataFromServer } from "./MockAppData.ts";

function App() {
  // Lift up state to App component
  const [imageData, _setImageData] = useState(fetchDataFromServer);

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route path="/" element={<AllImages images={imageData} />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/images/:imageId"
          element={<ImageDetails images={imageData} />}
        />
      </Route>
    </Routes>
  );
}

export default App;
