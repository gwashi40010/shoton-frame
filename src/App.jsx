import React, { useState, useMemo, useEffect, useRef } from "react";
import * as exifr from "exifr";

const LOGO_MAP = {
  sony: "/logos/sony.png", canon: "/logos/canon.png", nikon: "/logos/nikon.png",
  fujifilm: "/logos/fujifilm.png", fuji: "/logos/fujifilm.png",
  panasonic: "/logos/panasonic.png", lumix: "/logos/panasonic.png",
  apple: "/logos/apple.png", iphone: "/logos/apple.png",
  samsung: "/logos/samsung.png", galaxy: "/logos/samsung.png",
  xiaomi: "/logos/xiaomi.png", google: "/logos/google.png",
  huawei: "/logos/huawei.png", oppo: "/logos/oppo.png", vivo: "/logos/vivo.png",
  oneplus: "/logos/oneplus.png", asus: "/logos/asus.png",
  nothing: "/logos/nothingphone.png", pentax: "/logos/pentax.png",
  olympus: "/logos/olympus.png", kodak: "/logos/kodak.png",
  leica: "/logos/leica.png", sigma: "/logos/sigma.png",
};

const BRAND_COLORS_MAP = {
  sony: "#f36f21", canon: "#c00000", nikon: "#ffd400", fujifilm: "#006241",
  panasonic: "#0072bc", pentax: "#DA291C", olympus: "#00529C",
  leica: "#E20613", sigma: "#000000", apple: "#808080",
};

const DEFAULT_TEXT_COLOR = "#000000";
const DEFAULT_FRAME_COLOR = "#ffffff";

const getLogo = (make) => {
  if (!make) return null;
  const lower = make.toLowerCase();
  for (const key in LOGO_MAP) { if (lower.includes(key)) return LOGO_MAP[key]; }
  return null;
};

const getBrandColor = (make) => {
  if (!make) return DEFAULT_TEXT_COLOR;
  const brand = make.toLowerCase();
  for (const key in BRAND_COLORS_MAP) { if (brand.includes(key)) return BRAND_COLORS_MAP[key]; }
  return DEFAULT_TEXT_COLOR;
};

const getBlendMode = (frameColor) => {
  return (frameColor === "#ffffff" || frameColor === "#cccccc") ? "multiply" : "screen";
};

const parseExifData = (exifData) => {
  const make = exifData?.Make || "";
  const model = exifData?.Model || "";
  const lens = exifData?.LensModel || "";
  const exposure = exifData?.ExposureTime ? `1/${Math.round(1 / exifData.ExposureTime)}s` : "";
  const aperture = exifData?.FNumber ? `f/${exifData.FNumber.toFixed(1)}` : "";
  const iso = exifData?.ISO ? `ISO${exifData.ISO}` : "";
  const focalLength = exifData?.FocalLength
    ? `${Number(exifData.FocalLength).toFixed(exifData.FocalLength % 1 === 0 ? 0 : 1)}mm` : "";
  return { make, model, lens, exposure, aperture, iso, focalLength };
};

const initialCameraInfo = { make: "", model: "", lens: "", exposure: "", aperture: "", iso: "", focalLength: "" };

const defaultSettings = {
  showLogo: true, fontFamily: "Helvetica",
  fontSizeLine1: 18, fontSizeLine2: 14,
  textColor: DEFAULT_TEXT_COLOR, frameColor: DEFAULT_FRAME_COLOR,
  framePadding: 40, bottomBarHeight: 80,
  frameRadius: 8, imageRadius: 0, logoScale: 1.8,
};

const styles = {
  appContainer: { background: "#eaeaea", minHeight: "100vh", display: "block", padding: "60px 0" },
  contentBox: (fontFamily) => ({ background: "#fff", padding: "40px 20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", color: "#000", fontFamily, textAlign: "center", maxWidth: "900px", width: "95%", boxSizing: "border-box", margin: "0 auto" }),
  input: { width: "100%", padding: "6px 10px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" },
  label: { display: "block", fontWeight: "bold", marginBottom: "4px", fontSize: "13px", color: "#333" },
  numberInput: { marginLeft: "8px", padding: "4px 8px", width: "70px", borderRadius: "4px", border: "1px solid #ccc" },
  button: (color) => ({ padding: "10px 20px", background: color, color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }),
};

export default function App() {
  const [imageSrc, setImageSrc] = useState(null);
  const [imageNaturalSize, setImageNaturalSize] = useState({ w: 0, h: 0 });
  const [cameraInfo, setCameraInfo] = useState(initialCameraInfo);
  const imgRef = useRef(null);

  const [settings, setSettings] = useState(() => {
    try {
      const s = localStorage.getItem("shotonSettings");
      if (s) return { ...defaultSettings, ...JSON.parse(s) };
    } catch (e) {}
    return defaultSettings;
  });

  useEffect(() => {
    try { localStorage.setItem("shotonSettings", JSON.stringify(settings)); } catch (e) {}
  }, [settings]);

  const handleChangeCameraInfo = (e) => setCameraInfo({ ...cameraInfo, [e.target.name]: e.target.value });
  const handleChangeSetting = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  const line2Text = useMemo(() => {
    const { lens, focalLength, aperture, exposure, iso } = cameraInfo;
    return [lens, focalLength, aperture, exposure, iso].filter(Boolean).join(" · ");
  }, [cameraInfo]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target.result);
      const img = new Image();
      img.onload = () => setImageNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    try {
      const exifData = await exifr.parse(file);
      setCameraInfo(parseExifData(exifData));
    } catch (e) {
      setCameraInfo(initialCameraInfo);
      alert("EXIFデータが見つからないか、読み取れませんでした。手動で情報を入力してください。");
    }
  };

  const handleDownload = async (format = "png") => {
    if (!imageSrc || !imageNaturalSize.w) return;

    const scale = 3;
    const imgW = imageNaturalSize.w;
    const imgH = imageNaturalSize.h;
    const pad = settings.framePadding * scale;
    const barH = settings.bottomBarHeight * scale;
    const canvasW = imgW + pad * 2;
    const canvasH = imgH + pad + barH;

    const canvas = document.createElement("canvas");
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = settings.frameColor;
    ctx.fillRect(0, 0, canvasW, canvasH);

    const photo = new Image();
    await new Promise((res) => { photo.onload = res; photo.src = imageSrc; });

    if (settings.imageRadius > 0) {
      const r = settings.imageRadius * scale;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pad + r, pad);
      ctx.lineTo(pad + imgW - r, pad);
      ctx.quadraticCurveTo(pad + imgW, pad, pad + imgW, pad + r);
      ctx.lineTo(pad + imgW, pad + imgH - r);
      ctx.quadraticCurveTo(pad + imgW, pad + imgH, pad + imgW - r, pad + imgH);
      ctx.lineTo(pad + r, pad + imgH);
      ctx.quadraticCurveTo(pad, pad + imgH, pad, pad + imgH - r);
      ctx.lineTo(pad, pad + r);
      ctx.quadraticCurveTo(pad, pad, pad + r, pad);
      ctx.closePath();
      ctx.clip();
    }
    ctx.drawImage(photo, pad, pad, imgW, imgH);
    if (settings.imageRadius > 0) ctx.restore();

    const barCenterY = imgH + pad + barH / 2;
    const line1Size = settings.fontSizeLine1 * scale;
    const line2Size = settings.fontSizeLine2 * scale;
    const gap = 6 * scale;
    const line1Y = barCenterY - gap / 2 - line2Size / 2;
    const line2Y = barCenterY + gap / 2 + line2Size / 2;

    ctx.textBaseline = "middle";
    const shotOnText = "Shot on ";
    const modelText = cameraInfo.model || "Model";
    ctx.font = `500 ${line1Size}px ${settings.fontFamily}, Helvetica, sans-serif`;
    const shotOnWidth = ctx.measureText(shotOnText).width;
    ctx.font = `bold ${line1Size}px ${settings.fontFamily}, Helvetica, sans-serif`;
    const modelWidth = ctx.measureText(modelText).width;

    let logoImg = null;
    const logoSrc = settings.showLogo && cameraInfo.make ? getLogo(cameraInfo.make) : null;
    if (logoSrc) {
      logoImg = new Image();
      await new Promise((res) => { logoImg.onload = res; logoImg.onerror = res; logoImg.src = logoSrc; });
    }
    const logoH = line1Size * (settings.logoScale || 1.8);
    const logoW = logoImg && logoImg.naturalWidth > 0 ? (logoImg.naturalWidth / logoImg.naturalHeight) * logoH : 0;
    const logoGap = logoW > 0 ? 12 * scale : 0;
    const totalLine1W = shotOnWidth + modelWidth + logoGap + logoW;
    let x = (canvasW - totalLine1W) / 2;

    ctx.font = `500 ${line1Size}px ${settings.fontFamily}, Helvetica, sans-serif`;
    ctx.fillStyle = settings.textColor;
    ctx.fillText(shotOnText, x, line1Y);
    x += shotOnWidth;

    ctx.font = `bold ${line1Size}px ${settings.fontFamily}, Helvetica, sans-serif`;
    ctx.fillStyle = getBrandColor(cameraInfo.make);
    ctx.fillText(modelText, x, line1Y);
    x += modelWidth + logoGap;

    if (logoImg && logoImg.naturalWidth > 0) {
      ctx.save();
      ctx.globalCompositeOperation = (settings.frameColor === "#ffffff" || settings.frameColor === "#cccccc") ? "multiply" : "screen";
      ctx.globalAlpha = 0.9;
      ctx.drawImage(logoImg, x, line1Y - logoH / 2, logoW, logoH);
      ctx.restore();
    }

    ctx.font = `400 ${line2Size}px ${settings.fontFamily}, Helvetica, sans-serif`;
    ctx.fillStyle = settings.textColor;
    ctx.textBaseline = "middle";
    const line2W = ctx.measureText(line2Text).width;
    ctx.fillText(line2Text, (canvasW - line2W) / 2, line2Y);

    const link = document.createElement("a");
    link.download = `shoton-frame.${format}`;
    link.href = format === "png" ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.95);
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
              style={{
                background: settings.frameColor,
                paddingTop: `${settings.framePadding}px`,
                paddingLeft: `${settings.framePadding}px`,
                paddingRight: `${settings.framePadding}px`,
                borderRadius: `${settings.frameRadius}px`,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="preview"
                style={{ display: "block", borderRadius: `${settings.imageRadius}px`, maxWidth: "100%", maxHeight: "none" }}
              />
              <div style={{ color: settings.textColor, fontFamily: settings.fontFamily, height: `${settings.bottomBarHeight}px`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxSizing: "border-box", width: "100%", minWidth: "max-content" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: `${settings.fontSizeLine1}px`, fontWeight: "500", whiteSpace: "nowrap", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <p style={{ margin: 0 }} translate="no">
                      Shot on&nbsp;
                      <strong style={{ color: getBrandColor(cameraInfo.make) }}>{cameraInfo.model || "Model"}</strong>
                    </p>
                    {settings.showLogo && cameraInfo.make && getLogo(cameraInfo.make) && (
                      <div style={{ display: "inline-flex", alignItems: "center", height: "0px" }}>
                        <img src={getLogo(cameraInfo.make)} alt="brand logo" style={{ height: `${settings.fontSizeLine1 * (settings.logoScale || 1.8)}px`, objectFit: "contain", opacity: 0.9, mixBlendMode: getBlendMode(settings.frameColor) }} />
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ margin: 0, fontSize: `${settings.fontSizeLine2}px`, fontWeight: "400", whiteSpace: "nowrap" }}>
                  {line2Text}
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
                  <label htmlFor={key} style={styles.label}>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                  <input id={key} type="text" name={key} value={cameraInfo[key]} onChange={handleChangeCameraInfo} placeholder={`Enter ${key}`} style={styles.input} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: "25px", textAlign: "left" }}>
            <label style={{ display: "block", marginBottom: "15px" }}>
              🧩 ロゴ表示
              <input type="checkbox" checked={settings.showLogo} onChange={(e) => handleChangeSetting("showLogo", e.target.checked)} style={{ marginLeft: "8px" }} />
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
                  <input type={type} value={settings[key]} step={step || "1"} onChange={(e) => handleChangeSetting(key, type === "number" ? Number(e.target.value) : e.target.value)} style={{ ...styles.numberInput, width: type === "color" ? "40px" : "70px" }} />
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
