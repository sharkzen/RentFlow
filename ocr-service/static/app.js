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
const candBody = document.getElementById("candBody");
const rawBody = document.getElementById("rawBody");
const resReview = document.getElementById("resReview");

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

// ค่าจำนวนหลัก/ค่าเดือนก่อน จำไว้ข้ามการรีเฟรช จะได้ไม่ต้องกรอกใหม่ทุกรูป
const PARAM_IDS = ["expectedDigits", "prevValue", "maxUsage"];
for (const id of PARAM_IDS) {
  const input = document.getElementById(id);
  try {
    input.value = localStorage.getItem(`ocr-debug-${id}`) ?? "";
  } catch {}
  input.addEventListener("input", () => {
    try {
      localStorage.setItem(`ocr-debug-${id}`, input.value);
    } catch {}
  });
}

const escapeHtml = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );

const flag = (v) =>
  v === true
    ? '<span class="yes">✓</span>'
    : v === false
      ? '<span class="no">✗</span>'
      : "–";

const renderDebug = (data) => {
  debugGrid.innerHTML = "";
  const images = Object.entries(data.debug_images || {});
  // กล่องที่ตรวจจับได้แสดงก่อนและเต็มความกว้าง เพราะดูบ่อยสุด
  images.sort(([a], [b]) => (b === "Detected_Boxes") - (a === "Detected_Boxes"));
  for (const [name, base64Str] of images) {
    if (!base64Str) continue;
    const div = document.createElement("div");
    div.className = name === "Detected_Boxes" ? "debug-item wide" : "debug-item";
    div.innerHTML = `
                <img src="data:image/jpeg;base64,${base64Str}" alt="${escapeHtml(name)}">
                <span>${escapeHtml(name)}${name === "Detected_Boxes" ? ` (${(data.boxes || []).length} boxes, ${escapeHtml(data.box_source ?? "")})` : ""}</span>
            `;
    debugGrid.appendChild(div);
  }

  const cands = data.all_candidates || [];
  candBody.innerHTML = cands.length
    ? cands
        .map(
          (c, i) => `
      <tr class="${i === 0 && data.success ? "best" : ""}">
        <td>${i + 1}</td>
        <td class="mono">${escapeHtml(c.text)}</td>
        <td class="mono">${escapeHtml(c.raw)}</td>
        <td>${c.score?.toFixed(3) ?? "–"}</td>
        <td>${(c.conf * 100).toFixed(1)}%</td>
        <td>${c.height_ratio ?? "–"}</td>
        <td>${flag(c.length_ok)}</td>
        <td>${flag(c.plausible)}</td>
        <td>${escapeHtml(c.source)}</td>
        <td>${escapeHtml(c.pass)}</td>
      </tr>`,
        )
        .join("")
    : '<tr><td colspan="10">No candidates (every read was filtered out)</td></tr>';

  rawBody.innerHTML = (data.raw_reads || [])
    .map(
      (r) => `
      <tr>
        <td>${escapeHtml(r.pass)}</td>
        <td class="mono">${r.boxes.map((t) => `"${escapeHtml(t)}"`).join(" · ") || "–"}</td>
        <td class="mono">${r.full.map((t) => `"${escapeHtml(t)}"`).join(" · ") || "–"}</td>
      </tr>`,
    )
    .join("");

  debugSection.classList.remove("hidden");
};

// API Call
const processOCR = async (endpoint) => {
  if (!currentFile) return;

  const formData = new FormData();
  formData.append("image", currentFile);
  const paramNames = {
    expectedDigits: "expected_digits",
    prevValue: "prev_value",
    maxUsage: "max_usage",
  };
  for (const id of PARAM_IDS) {
    const value = document.getElementById(id).value.trim();
    if (value) formData.append(paramNames[id], value);
  }

  // Reset UI
  resultCard.classList.add("hidden");
  errorCard.classList.add("hidden");
  debugSection.classList.add("hidden");
  resReview.classList.add("hidden");
  loading.classList.remove("hidden");
  scanBtn.disabled = true;
  debugBtn.disabled = true;

  try {
    const response = await fetch(endpoint, { method: "POST", body: formData });
    const data = await response.json();

    // โหมด debug คืน success:false พร้อมภาพ/ข้อความดิบเมื่ออ่านไม่ได้ ให้แสดงทั้ง error และ debug
    if (data.debug_images) renderDebug(data);

    if (!response.ok || !data.success)
      throw new Error(data.message || "Processing failed");

    // Populate Results
    document.getElementById("resNumber").textContent = data.meter_number;
    document.getElementById("resConf").textContent =
      `${(data.confidence * 100).toFixed(1)}%`;
    document.getElementById("resBlur").textContent = data.blur_score;
    document.getElementById("resTime").textContent =
      `${data.processing_time_ms}ms`;

    if (data.needs_review) {
      resReview.textContent = `⚠️ Needs review: ${(data.review_reasons || []).join(", ")}`;
      resReview.classList.remove("hidden");
    }

    resultCard.classList.remove("hidden");
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
