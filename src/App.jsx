// App.jsx (単一ファイル統合版 - html2canvas書き出しオプション完全最適化版)

import html2canvas from "html2canvas";
import React, { useState, useMemo, useEffect } from "react"; 
import * as exifr from "exifr";

const LOGO_MAP = {
  sony: "/logos/sony.png",
  canon: "/logos/canon.png",
  nikon: "/logos/nikon.png",
  fujifilm: "/logos/fujifilm.png",
  fuji: "/logos/fujifilm.png",
  panasonic: "/logos/panasonic.png",
  lumix: "/logos/panasonic.png",
  apple: "/logos/apple.png",
  iphone: "/logos/apple.png",
  samsung: "/logos/samsung.png",
  galaxy: "/logos/samsung.png",
  xiaomi: "/logos/xiaomi.png",
  google: "/logos/google.png",
  huawei: "/logos/huawei.png",
  oppo: "/logos/oppo.png",
  vivo: "/logos/vivo.png",
  oneplus: "/logos/oneplus.png",
  asus: "/logos/asus.png",
  nothing: "/logos/nothingphone.png",
  pentax: "/logos/pentax.png",
  olympus: "/logos/olympus.png",
  kodak: "/logos/kodak.png",
  leica: "/logos/leica.png",
  sigma: "/logos/sigma.png",
};

const BRAND_COLORS_MAP = {
  sony: "#f36f21",
  canon: "#c00000",
  nikon: "#ffd400",
  fujifilm: "#006241",
  panasonic: "#0072bc",
  pentax: "#DA291C",
  olympus: "#00529C",
  leica: "#E20613",
  sigma: "#000000",
  apple: "#808080",
};

const DEFAULT_TEXT_COLOR = "#000000";
const DEFAULT_FRAME_COLOR = "#ffffff";

const getLogo = (make) => {
  if (!make) return null;
  const lower = make.toLowerCase();
  for (const key in LOGO_MAP) {
    if (lower.includes(key)) return LOGO_MAP[key];
  }
  return null;
};

const getBrandColor = (make) => {
  if (!make) return DEFAULT_TEXT_COLOR;
  const brand = make.toLowerCase();
  for (const key in BRAND_COLORS_MAP) {
    if (brand.includes(key)) return BRAND_COLORS_MAP[key];
  }
  return DEFAULT_TEXT_COLOR;
};

const getBlendMode = (frameColor) => {
  const isLight = frameColor === "#ffffff" || frameColor === "#cccccc";
  return isLight ? "multiply" : "screen";
};

const parseExifData = (exifData) => {
  const make = exifData?.Make || "";
  const model = exifData?.Model || "";
  const lens = exifData?.LensModel || "";
  const exposure = exifData?.ExposureTime ? `1/${Math.round(1 / exifData.ExposureTime)}s` : "";
  const aperture = exifData?.FNumber ? `f/${exifData.FNumber.toFixed(1)}` : "";
  const iso = exifData?.ISO ? `ISO${exifData.ISO}` : "";
  const focalLength = exifData?.FocalLength ? `${Number(exifData.FocalLength).toFixed(exifData.FocalLength % 1 === 0 ? 0 : 1)}mm` : "";
  return { make, model, lens, exposure, aperture, iso, focalLength };
};

const initialCameraInfo = { make: "", model: "", lens: "", exposure: "", aperture: "", iso: "", focalLength: "" };

const defaultSettings = {
  showLogo: true,
  fontFamily: "Helvetica",
  fontSizeLine1: 18,
  fontSizeLine2: 14,
  textColor: DEFAULT_TEXT_COLOR,
  frameColor: DEFAULT_FRAME_COLOR,
  framePadding: 40,
  bottomBarHeight: 80, 
  frameRadius: 8,
  imageRadius: 0,
  logoScale: 1.8, 
};

export default function App() {
  const [imageSrc, setImageSrc] = useState(null);
  const [cameraInfo, setCameraInfo] = useState(initialCameraInfo);
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("shotonSettings");
      if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
    } catch (e) {}
    return defaultSettings;
  });

  useEffect(() => {
    try { localStorage.setItem("shotonSettings", JSON.stringify(settings)); } catch (e) {}
  }, [settings]);

  const handleChangeCameraInfo = (e) => setCameraInfo({ ...cameraInfo, [e.target.name]: e.target.value });
  const handleChangeSetting = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));
  
  const line2Parts = useMemo(() => {
    const { lens, focalLength, aperture, exposure, iso } = cameraInfo;
    return [lens, focalLength, aperture, exposure, iso].filter(Boolean);
  }, [cameraInfo]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setImageSrc(e.target.result);
    reader.readAsDataURL(file);
    try {
      const exifData = await exifr.parse(file);
      setCameraInfo(parseExifData(exifData));
    } catch (error) {
      setCameraInfo(initialCameraInfo);
    }
  };

  const handleDownload = async (format = "png") => {
    const frameElement = document.getElementById("capture-area");
    if (!frameElement) return;

    const canvas = await html2canvas(frameElement, {
      useCORS: true,
      backgroundColor: settings.frameColor,
      scale: 3,
      windowWidth: frameElement.scrollWidth,  
      windowHeight: frameElement.scrollHeight,
      width: frameElement.offsetWidth,        
      height: frameElement.offsetHeight,
      x: 0,
      y: 0
    });

    const link = document.createElement("a");
    link.download = `shoton-frame.${format}`;
    link.href = format === "png" ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.95);
    link.click();
  };

  return (
    <div style={{ background: "#eaeaea", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: "60px 0" }}>
      <div style={{ background: "#fff", padding: "40px 20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontFamily: settings.fontFamily, textAlign: "center", maxWidth: "900px", width: "95%", boxSizing: "border-box" }}>
        <h2>📸 Shoton Frame Customizer</h2>
        <input type="file" accept="image/*" onChange={handleFileChange} />

        {imageSrc && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "40px", maxWidth: "100%", overflowX: "auto" }}>
            <div
              id="capture-area"
              style={{
                background: settings.frameColor,
                padding: `${settings.framePadding}px`,
                paddingBottom: "0px",
                borderRadius: `${settings.frameRadius}px`,
                boxSizing: "border-box",
                display: "inline-block",
                textAlign: "center"
              }}
            >
              <img src={imageSrc} alt="preview" style={{ display: "block", borderRadius: `${settings.imageRadius}px`, maxHeight: "65vh" }} />
              <div style={{ color: settings.textColor, height: `${settings.bottomBarHeight}px`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxSizing: "border-box", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: `${settings.fontSizeLine1}px`, fontWeight: "500", whiteSpace: "nowrap", marginBottom: "6px", height: `${settings.fontSizeLine1}px` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <p style={{ margin: 0 }} translate="no">Shot on&nbsp;<strong style={{ color: getBrandColor(cameraInfo.make) }}>{cameraInfo.model || "Model"}</strong></p>
                    {settings.showLogo && cameraInfo.make && getLogo(cameraInfo.make) && (
                      <div style={{ display: "inline-flex", alignItems: "center", height: "0px" }}>
                        <img src={getLogo(cameraInfo.make)} alt="logo" style={{ height: `${settings.fontSizeLine1 * settings.logoScale}px`, objectFit: "contain", mixBlendMode: getBlendMode(settings.frameColor) }} />
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ margin: 0, fontSize: `${settings.fontSizeLine2}px`, fontWeight: "400", whiteSpace: "nowrap" }}>{line2Parts.join(" · ")}</div>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: "30px", textAlign: "left" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px 20px" }}>
            {["make", "model", "lens", "aperture", "exposure", "iso", "focalLength"].map((key) => (
              <div key={key}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "4px", fontSize: "13px" }}>{key.toUpperCase()}</label>
                <input type="text" name={key} value={cameraInfo[key]} onChange={handleChangeCameraInfo} style={{ width: "100%", padding: "6px 10px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: "25px", textAlign: "left" }}>
          <label>🧩 ロゴ表示<input type="checkbox" checked={settings.showLogo} onChange={(e) => handleChangeSetting("showLogo", e.target.checked)} style={{ marginLeft: "8px" }} /></label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px 20px", marginTop: "15px" }}>
            {[
              { label: "🔠 1行目サイズ", key: "fontSizeLine1", unit: "px", type: "number" },
              { label: "🔠 2行目サイズ", key: "fontSizeLine2", unit: "px", type: "number" },
              { label: "📐 ロゴ倍率", key: "logoScale", unit: "倍", type: "number", step: "0.1" },
              { label: "📏 フレーム余白", key: "framePadding", unit: "px", type: "number" },
              { label: "📏 下部バー高さ", key: "bottomBarHeight", unit: "px", type: "number" },
              { label: "🎯 フレーム丸み", key: "frameRadius", unit: "px", type: "number" },
              { label: "🖼 写真の丸み", key: "imageRadius", unit: "px", type: "number" },
              { label: "🖍 テキストカラー", key: "textColor", type: "color" },
              { label: "⬜ フレームカラー", key: "frameColor", type: "color" },
            ].map(({ label, key, unit, type, step }) => (
              <label key={key}>{label}
                <input type={type} value={settings[key]} step={step || "1"} onChange={(e) => handleChangeSetting(key, type === "number" ? Number(e.target.value) : e.target.value)} style={{ marginLeft: "8px", padding: "4px 8px", width: type === "color" ? "40px" : "70px", borderRadius: "4px", border: "1px solid #ccc" }} />
                {unit}
              </label>
            ))}
          </div>
          <div style={{ marginTop: "30px", display: "flex", gap: "15px", justifyContent: "center" }}>
            <button onClick={() => handleDownload("png")} style={{ padding: "10px 20px", background: "#007bff", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>📥 PNGで保存</button>
            <button onClick={() => handleDownload("jpeg")} style={{ padding: "10px 20px", background: "#28a745", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>📷 JPGで保存</button>
          </div>
        </div>
      </div>
    </div>
  );
}
