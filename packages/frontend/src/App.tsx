import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { AllImages } from "./images/AllImages.tsx";
import { ImageDetails } from "./images/ImageDetails.tsx";
import { UploadPage } from "./UploadPage.tsx";
import { LoginPage } from "./LoginPage.tsx";
import { MainLayout } from "./MainLayout.tsx";
import { fetchDataFromServer } from "./MockAppData.ts";
import { ValidRoutes } from "csc437-monorepo-backend/src/shared/ValidRoutes";

function App() {
  const [imageData, _setImageData] = useState(fetchDataFromServer);

  return (
    <Routes>
      <Route path={ValidRoutes.HOME} element={<MainLayout />}>
        <Route
          path={ValidRoutes.HOME}
          element={<AllImages images={imageData} />}
        />
        <Route path={ValidRoutes.UPLOAD} element={<UploadPage />} />
        <Route path={ValidRoutes.LOGIN} element={<LoginPage />} />
        <Route
          path={ValidRoutes.IMAGE_DETAILS}
          element={<ImageDetails images={imageData} />}
        />
      </Route>
    </Routes>
  );
}

export default App;
