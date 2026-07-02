const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const scanBtn = document.getElementById("scanBtn");
const debugBtn = document.getElementById("debugBtn");
const resultCard = document.getElementById("result");
const errorCard = document.getElementById("error");
const loading = document.getElementById("loading");
const debugSection = document.getElementById("debugSection");
const debugGrid = document.getElementById("debugGrid");

let currentFile = null;

// Handle File Selection
const handleFile = (file) => {
  if (!file || !file.type.startsWith("image/")) return;
  currentFile = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    preview.src = e.target.result;
    preview.style.display = "block";
    scanBtn.disabled = false;
    debugBtn.disabled = false;
  };
  reader.readAsDataURL(file);
};

// UI Events
dropzone.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => handleFile(e.target.files[0]));

dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("dragover");
});
dropzone.addEventListener("dragleave", () =>
  dropzone.classList.remove("dragover"),
);
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");
  handleFile(e.dataTransfer.files[0]);
});

document.addEventListener("paste", (e) => {
  const items = (e.clipboardData || e.originalEvent.clipboardData).items;
  for (let item of items) {
    if (item.type.indexOf("image") === 0) handleFile(item.getAsFile());
  }
});

// API Call
const processOCR = async (endpoint) => {
  if (!currentFile) return;

  const formData = new FormData();
  formData.append("image", currentFile);

  // Reset UI
  resultCard.classList.add("hidden");
  errorCard.classList.add("hidden");
  debugSection.classList.add("hidden");
  loading.classList.remove("hidden");
  scanBtn.disabled = true;
  debugBtn.disabled = true;

  try {
    const response = await fetch(endpoint, { method: "POST", body: formData });
    const data = await response.json();

    if (!response.ok) throw new Error(data.message || "Processing failed");

    // Populate Results
    document.getElementById("resNumber").textContent = data.meter_number;
    document.getElementById("resConf").textContent =
      `${(data.confidence * 100).toFixed(1)}%`;
    document.getElementById("resBlur").textContent = data.blur_score;
    document.getElementById("resTime").textContent =
      `${data.processing_time_ms}ms`;

    resultCard.classList.remove("hidden");

    // Populate Debug Images
    if (data.debug_images) {
      debugGrid.innerHTML = "";
      for (const [name, base64Str] of Object.entries(data.debug_images)) {
        if (!base64Str) continue;
        const div = document.createElement("div");
        div.className = "debug-item";
        div.innerHTML = `
                    <img src="data:image/jpeg;base64,${base64Str}" alt="${name}">
                    <span>${name}</span>
                `;
        debugGrid.appendChild(div);
      }
      debugSection.classList.remove("hidden");
    }
  } catch (err) {
    errorCard.textContent = `Error: ${err.message}`;
    errorCard.classList.remove("hidden");
  } finally {
    loading.classList.add("hidden");
    scanBtn.disabled = false;
    debugBtn.disabled = false;
  }
};

scanBtn.addEventListener("click", () => processOCR("/scan"));
debugBtn.addEventListener("click", () => processOCR("/debug"));
