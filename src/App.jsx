// App.jsx

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { supabase } from "./Supabase.jsx";
import download from "./assets/download.png";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [files, setFiles] = useState([]);
  const [isDeleting, setIsDeleting] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    const checkBucket = async () => {
      const { data, error } = await supabase.storage
        .from("clientbucket") // ← your bucket name
        .list("", { limit: 1 });

      if (error) {
        console.log("❌ Bucket connection failed", error);
      } else {
        console.log("✅ Bucket connection success — sample item:", data[0]);
      }
    };
    checkBucket();
  }, []); // Only Supabase connection check here
  useEffect(() => {
    async function fetchFiles() {
      const { data: fileList, error } = await supabase.storage
        .from("example")
        .list("", { limit: 100 });
      if (error) console.error(error);
      else setFiles(fileList);
    }
    fetchFiles();
  }, []);
  const onsubmit = async (data) => {
    const file = data.file?.[0];
    if (!file) {
      alert("Choose a file");
    }
    const fileName = `${Date.now()}_${file.name}`;
    console.log(fileName);
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from("example")
      .upload(fileName, file);
    if (uploadErr) {
      console.error("❌ Upload error:", uploadErr);
      return setErrorMsg(uploadErr.message);
    }

    const { data: fileList, error } = await supabase.storage
      .from("example")
      .list("", { limit: 100 });
    if (error) console.error(error);
    else setFiles(fileList);
  };

  const handleDelete = async (fileName) => {
    setIsDeleting(fileName);

    const { error } = await supabase.storage.from("example").remove([fileName]);
    if (error) {
      console.error("❌ Delete error:", error);
    } else {
      const { data: updatedFiles, error: listError } = await supabase.storage
        .from("example")
        .list("", { limit: 100 });

      if (listError) console.error("❌ Error reloading files:", listError);
      else setFiles(updatedFiles);
    }

    setIsDeleting(null);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);

    localStorage.setItem("darkMode", newDarkMode.toString());
    document.documentElement.classList.toggle("dark", newDarkMode);
  };

  return (
    <>
      <button
        onClick={toggleDarkMode}
        className={`fixed top-4 right-4 px-4 py-2 rounded-full text-sm z-50 shadow-md transition-all duration-300 hover:shadow-lg transform hover:scale-105 ${
          isDarkMode
            ? "bg-yellow-400 text-gray-900 hover:bg-yellow-300"
            : "bg-gray-800 text-white hover:bg-gray-700"
        }`}
      >
        {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
      </button>

      <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-start p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-black transition-all duration-500">
        {/* Decorative Circles */}
        <div className="absolute top-[-80px] left-[-80px] w-[200px] h-[200px] bg-blue-400 rounded-full opacity-25 animate-pulse"></div>
        <div className="absolute bottom-[-100px] right-[-100px] w-[250px] h-[250px] bg-rose-400 rounded-full opacity-30 animate-pulse"></div>

        <h1 className="text-4xl font-bold text-blue-700 dark:text-white mb-8">
          📁 Firebase File Uploader
        </h1>

        {/* Upload Form */}
        <form
          className="w-full max-w-md mt-6"
          onSubmit={handleSubmit(onsubmit)}
        >
          <div className="border-2 border-dashed rounded-xl p-6 text-center border-blue-300 hover:bg-blue-50 dark:border-blue-600 dark:hover:bg-blue-900/20 transition-colors duration-300">
            <p className="text-gray-500 dark:text-gray-300 mb-2">
              Drag & Drop file here
            </p>
            <p className="text-sm text-gray-400">or</p>
            <input
              {...register("file")}
              type="file"
              name="file"
              className="mt-2 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 text-sm file:cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
            🚀 Upload
          </button>
        </form>

        {/* File List */}
        <div className="w-full max-w-3xl mt-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-white">
            📦 Uploaded Files
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {files.map((file, index) => {
              const publicUrl = supabase.storage
                .from("example")
                .getPublicUrl(file.name).data.publicUrl;

              return (
                <div
                  key={index}
                  className="bg-white p-4 shadow-md rounded-lg flex flex-col items-center"
                >
                  <p className="text-sm font-medium text-center break-all mb-2">
                    {file.name}
                  </p>
                  <img
                    src={publicUrl ? publicUrl : download}
                    alt={file.name}
                    className="w-32 h-32 object-cover rounded mb-3"
                    onError={(e) => {
                      e.currentTarget.onerror = null; // Prevent recursion
                      e.currentTarget.src = download; // Use default icon
                    }}
                  />
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline text-sm mb-2"
                  >
                    View File
                  </a>
                  {isDeleting  == file.name ? (
                    <p>Deleting...</p>
                  ) : (
                    <button onClick={() => handleDelete(file.name)}>
                      Delete
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
