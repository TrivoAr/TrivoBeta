import { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/firebaseConfig";

const UploadImage = ({ folder, onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleUpload = () => {
    if (!file) {
      setError("No file selected");
      return;
    }

    setError(""); // Reset error
    const storageRef = ref(storage, `${folder}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setProgress(progress);
      },
      (error) => {
        console.error("Upload failed:", error);
        setError("Failed to upload image. Please try again.");
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          console.log("File available at:", downloadURL);
          onUploadComplete(downloadURL); // Notify parent about the uploaded file's URL
          setFile(null); // Reset file input
          setProgress(0); // Reset progress
        });
      }
    );
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload}>Upload</button>
      {progress > 0 && <p>Upload progress: {progress}%</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default UploadImage;
