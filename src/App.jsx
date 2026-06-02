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
  const exposure = exifData?.ExposureTime
    ? `1/${Math.round(1 / exifData.ExposureTime)}s`
    : "";
  const aperture = exifData?.FNumber ? `f/${exifData.FNumber.toFixed(1)}` : "";
  const iso = exifData?.ISO ? `ISO${exifData.ISO}` : "";
  const focalLength = exifData?.FocalLength
    ? `${Number(exifData.FocalLength).toFixed(exifData.FocalLength % 1 === 0 ? 0 : 1)}mm`
    : "";
  return { make, model, lens, exposure, aperture, iso, focalLength };
};

const initialCameraInfo = {
  make: "", model: "", lens: "", exposure: "", aperture: "", iso: "", focalLength: "",
};

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

const styles = {
  appContainer: {
    background: "#eaeaea",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "60px 0",
    overflowY: "auto",
  },
  contentBox: (fontFamily) => ({
    background: "#fff",
    padding: "40px 20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    color: "#000",
    fontFamily,
    textAlign: "center",
    maxWidth: "900px",
    width: "95%",
    boxSizing: "border-box",
  }),
  input: {
    width: "100%",
    padding: "6px 10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
  },
  label: {
    display: "block",
    fontWeight: "bold",
    marginBottom: "4px",
    fontSize: "13px",
    color: "#333",
  },
  numberInput: {
    marginLeft: "8px",
    padding: "4px 8px",
    width: "70px",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  button: (color) => ({
    padding: "10px 20px",
    background: color,
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  }),
};

export default function App() {
  const [imageSrc, setImageSrc] = useState(null);
  const [cameraInfo, setCameraInfo] = useState(initialCameraInfo);

  const [settings, setSettings] = useState(() => {
    try {
      const savedSettings = localStorage.getItem("shotonSettings");
      if (savedSettings) return { ...defaultSettings, ...JSON.parse(savedSettings) };
    } catch (error) {
      console.error("localStorageの読み込みに失敗:", error);
    }
    return defaultSettings;
  });

  useEffect(() => {
    try {
      localStorage.setItem("shotonSettings", JSON.stringify(settings));
    } catch (error) {
      console.error("localStorageへの保存に失敗:", error);
    }
  }, [settings]);

  const handleChangeCameraInfo = (e) => {
    setCameraInfo({ ...cameraInfo, [e.target.name]: e.target.value });
  };

  const handleChangeSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

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
      console.error("EXIFデータ取得エラー:", error);
      setCameraInfo(initialCameraInfo);
      alert("EXIFデータが見つからないか、読み取れませんでした。手動で情報を入力してください。");
    }
  };

  const handleDownload = async (format = "png") => {
    const frameElement = document.getElementById("capture-area");
    if (!frameElement) return;

    await new Promise((r) => setTimeout(r, 150));

    const canvas = await html2canvas(frameElement, {
      useCORS: true,
      backgroundColor: settings.frameColor,
      scale: 3,
      scrollX: 0,
      scrollY: 0,
      width: frameElement.scrollWidth,
      height: frameElement.scrollHeight,
    });

    const link = document.createElement("a");
    link.download = `shoton-frame.${format}`;
    link.href = format === "png"
      ? canvas.toDataURL("image/png")
      : canvas.toDataURL("image/jpeg", 0.95);
    link.click();
  };

  const cameraInfoFields = ["make", "model", "lens", "aperture", "exposure", "iso", "focalLength"];

  return (
    <div style={styles.appContainer}>
      <div style={styles.contentBox(settings.fontFamily)}>
        <h2 style={{ marginBottom: "20px" }}>📸 Shoton Frame Customizer</h2>
        <input type="file" accept="image/*" onChange={handleFileChange} />

        {imageSrc && (
          <div style={{ maxWidth: "100%", overflowX: "auto", marginTop: "40px", padding: "10px" }}>
            <div
              id="capture-area"
              style={{
                background: settings.frameColor,
                paddingTop: `${settings.framePadding}px`,
                paddingLeft: `${settings.framePadding}px`,
                paddingRight: `${settings.framePadding}px`,
                borderRadius: `${settings.frameRadius}px`,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                boxSizing: "content-box",
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                overflow: "visible",
              }}
            >
              <img
                src={imageSrc}
                alt="preview"
                style={{
                  display: "block",
                  borderRadius: `${settings.imageRadius}px`,
                  maxHeight: "65vh",
                  maxWidth: "100%",
                }}
              />

              <div
                style={{
                  color: settings.textColor,
                  fontFamily: settings.fontFamily,
                  height: `${settings.bottomBarHeight}px`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  boxSizing: "border-box",
                  width: "100%",
                  minWidth: "max-content",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: `${settings.fontSizeLine1}px`,
                    fontWeight: "500",
                    whiteSpace: "nowrap",
                    marginBottom: "6px",
                    height: `${settings.fontSizeLine1}px`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <p style={{ margin: 0 }} translate="no">
                      Shot on&nbsp;
                      <strong style={{ color: getBrandColor(cameraInfo.make) }}>
                        {cameraInfo.model || "Model"}
                      </strong>
                    </p>
                    {settings.showLogo && cameraInfo.make && getLogo(cameraInfo.make) && (
                      <div style={{ display: "inline-flex", alignItems: "center", height: "0px" }}>
                        <img
                          src={getLogo(cameraInfo.make)}
                          alt="brand logo"
                          style={{
                            height: `${settings.fontSizeLine1 * (settings.logoScale || 1.8)}px`,
                            objectFit: "contain",
                            opacity: 0.9,
                            mixBlendMode: getBlendMode(settings.frameColor),
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    margin: 0,
                    fontSize: `${settings.fontSizeLine2}px`,
                    fontWeight: "400",
                    whiteSpace: "nowrap",
                    display: "flex",
                    justifyContent: "center",
                    width: "100%",
                  }}
                >
                  {line2Parts.join(" · ")}
                </div>
              </div>
            </div>
          </div>
        )}

        <>
          <div style={{ marginTop: "30px", textAlign: "left" }}>
            <h4 style={{ marginBottom: "10px" }}>📝 撮影情報を編集</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px 20px" }}>
              {cameraInfoFields.map((key) => (
                <div key={key}>
                  <label htmlFor={key} style={styles.label}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </label>
                  <input
                    id={key}
                    type="text"
                    name={key}
                    value={cameraInfo[key]}
                    onChange={handleChangeCameraInfo}
                    placeholder={`Enter ${key}`}
                    style={styles.input}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: "25px", textAlign: "left" }}>
            <label style={{ display: "block", marginBottom: "15px" }}>
              🧩 ロゴ表示
              <input
                type="checkbox"
                checked={settings.showLogo}
                onChange={(e) => handleChangeSetting("showLogo", e.target.checked)}
                style={{ marginLeft: "8px" }}
              />
            </label>

            <h4 style={{ marginBottom: "8px" }}>🎨 デザイン設定</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px 20px" }}>
              {[
                { label: "🔠 1行目サイズ", key: "fontSizeLine1", unit: "px", type: "number" },
                { label: "🔠 2行目サイズ", key: "fontSizeLine2", unit: "px", type: "number" },
                { label: "📐 ロゴ倍率", key: "logoScale", unit: "倍", type: "number", step: "0.1" },
                { label: "📏 フレーム余白 (上/横)", key: "framePadding", unit: "px", type: "number" },
                { label: "📏 下部バー高さ", key: "bottomBarHeight", unit: "px", type: "number" },
                { label: "🎯 フレーム丸み", key: "frameRadius", unit: "px", type: "number" },
                { label: "🖼 写真の丸み", key: "imageRadius", unit: "px", type: "number" },
                { label: "🖍 テキストカラー", key: "textColor", type: "color" },
                { label: "⬜ フレームカラー", key: "frameColor", type: "color" },
              ].map(({ label, key, unit, type, step }) => (
                <label key={key}>
                  {label}
                  <input
                    type={type}
                    value={settings[key]}
                    step={step || "1"}
                    onChange={(e) => handleChangeSetting(key, type === "number" ? Number(e.target.value) : e.target.value)}
                    style={{ ...styles.numberInput, width: type === "color" ? "40px" : "70px" }}
                  />
                  {unit}
                </label>
              ))}
            </div>

            <div style={{ marginTop: "30px", display: "flex", gap: "15px", justifyContent: "center" }}>
              <button onClick={() => handleDownload("png")} style={styles.button("#007bff")}>📥 PNGで保存</button>
              <button onClick={() => handleDownload("jpeg")} style={styles.button("#28a745")}>📷 JPGで保存</button>
            </div>
          </div>
        </>
      </div>
    </div>
  );
}
