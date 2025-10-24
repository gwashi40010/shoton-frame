import html2canvas from "html2canvas";
import React, { useState } from "react";
import * as exifr from "exifr";

export default function App() {
  const handleDownload = async (format = "png") => {
    const frameElement = document.getElementById("capture-area");
    if (!frameElement) return;

    const canvas = await html2canvas(frameElement, {
      useCORS: true,
      backgroundColor: "#ffffff", // JPG用に背景を白に設定
      scale: 2, // 高解像度出力
    });

    const link = document.createElement("a");
    link.download = `shoton-frame.${format}`;
    link.href =
      format === "png"
        ? canvas.toDataURL("image/png")
        : canvas.toDataURL("image/jpeg", 0.95); // 品質95%
    link.click();
  };
  const getLogo = (make) => {
    if (!make) return null;
    const lower = make.toLowerCase();

    if (lower.includes("sony")) return "/logos/sony.png";
    if (lower.includes("canon")) return "/logos/canon.png";
    if (lower.includes("nikon")) return "/logos/nikon.png";
    if (lower.includes("fujifilm") || lower.includes("fuji")) return "/logos/fujifilm.png";
    if (lower.includes("panasonic") || lower.includes("lumix")) return "/logos/panasonic.png";
    if (lower.includes("pentax")) return "/logos/pentax.png";
    if (lower.includes("olympus")) return "/logos/olympus.png";
    if (lower.includes("kodak")) return "/logos/kodak.png";
    if (lower.includes("leica")) return "/logos/leica.png";
    if (lower.includes("sigma")) return "/logos/sigma.png";

    return null;
  };

  const getBlendMode = (frameColor) => {
    const isLight =
      frameColor === "#ffffff" || frameColor === "#f5a623" || frameColor === "#cccccc";
    return isLight ? "multiply" : "screen";
  };

  const [imageSrc, setImageSrc] = useState(null);
  const [cameraInfo, setCameraInfo] = useState({
    model: "",
    lens: "",
    exposure: "",
    iso: "",
    make: "",
  });
  const [showLogo, setShowLogo] = useState(true);
  const [fontFamily, setFontFamily] = useState("Helvetica");
  const [fontSizeLine1, setFontSizeLine1] = useState(18); // ✅ 1行目フォントサイズ
  const [fontSizeLine2, setFontSizeLine2] = useState(14); // ✅ 2行目フォントサイズ
  const [textColor, setTextColor] = useState("#000000");
  const [frameColor, setFrameColor] = useState("#ffffff");
  const [framePadding, setFramePadding] = useState(40); // ← これを追加！
  const [framePaddingBottom, setFramePaddingBottom] = useState(60);
  const [frameRadius, setFrameRadius] = useState(8);
  const [imageRadius, setImageRadius] = useState(0);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => setImageSrc(e.target.result);
    reader.readAsDataURL(file);

    try {
      const exifData = await exifr.parse(file);
      const make = exifData?.Make || "";
      const model = exifData?.Model || "";
      const lens = exifData?.LensModel || "";
      const exposure = exifData?.ExposureTime
        ? `1/${Math.round(1 / exifData.ExposureTime)}s`
        : "";
      const iso = exifData?.ISO ? `ISO${exifData.ISO}` : "";

      setCameraInfo({ make, model, lens, exposure, iso });

      const brand = make.toLowerCase();
      if (brand.includes("sony")) setTextColor("#f36f21");
      else if (brand.includes("canon")) setTextColor("#c00000");
      else if (brand.includes("nikon")) setTextColor("#ffd400");
      else if (brand.includes("fujifilm")) setTextColor("#006241");
      else if (brand.includes("panasonic")) setTextColor("#0072bc");
      else setTextColor("#000000");
    } catch (error) {
      console.error("EXIFデータ取得エラー:", error);
    }
  };

  const handleChange = (e) => {
    setCameraInfo({ ...cameraInfo, [e.target.name]: e.target.value });
  };

  return (
    <div
      style={{
        background: "#eaeaea",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px",
        color: "#000",
        fontFamily,
      }}
    >
      <h2 style={{ marginBottom: "20px" }}>📸 Shoton Frame Customizer</h2>

      <input type="file" accept="image/*" onChange={handleFileChange} />

      {imageSrc && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "40px",
          }}
        >
          {/* ✅ 保存対象：フレーム全体 */}
          <div
            id="capture-area"
            style={{
              background: frameColor,
              paddingTop: `${framePadding}px`,
              paddingLeft: `${framePadding}px`,
              paddingRight: `${framePadding}px`,
              paddingBottom: `${framePaddingBottom}px`,
              borderRadius: `${frameRadius}px`,
              textAlign: "center",
              maxWidth: "800px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            {/* ✅ 写真 */}
            <img
              src={imageSrc}
              alt="preview"
              style={{
                width: "100%",
                borderRadius: `${imageRadius}px`,
                display: "block",
                marginBottom: "20px", // 写真と文字の間
              }}
            />

            {/* ✅ 撮影情報（Shot on ＋ レンズ情報） */}
            <div
              style={{
                color: textColor,
                fontFamily,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                lineHeight: "1.6",
              }}
            >
              {/* ---- 1行目 ---- */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: `${fontSizeLine1}px`,
                  fontWeight: "500",
                }}
              >
                <p style={{ margin: 0 }}>
                  Shot on <strong>{cameraInfo.model || "Model"}</strong>
                </p>
                {showLogo && cameraInfo.make && getLogo(cameraInfo.make) && (
                  <img
                    src={getLogo(cameraInfo.make)}
                    alt="brand logo"
                    style={{
                      height: fontSizeLine1 * 1.3,
                      objectFit: "contain",
                      opacity: 0.85,
                      mixBlendMode: getBlendMode(frameColor),
                    }}
                  />
                )}
              </div>

              {/* ---- 2行目 ---- */}
              <p
                style={{
                  margin: "6px 0 0 0",
                  fontSize: `${fontSizeLine2}px`,
                  fontWeight: "400",
                }}
              >
                {cameraInfo.lens}
                {cameraInfo.lens && (cameraInfo.exposure || cameraInfo.iso) && " · "}
                {cameraInfo.exposure}
                {cameraInfo.exposure && cameraInfo.iso && " · "}
                {cameraInfo.iso}
              </p>
            </div>
          </div>
        </div>
      )}
      {/* ✅ 保存範囲ここまで */}

      {/* 下の編集・設定UIは保存されない */}

      {/* ---- 編集フォーム ---- */}
      <div
        style={{
          marginTop: "30px",
          textAlign: "left",
          fontSize: "13px",
          color: "#333",
        }}
      >
        <h4 style={{ marginBottom: "10px" }}>📝 撮影情報を編集</h4>
        {["model", "lens", "exposure", "iso", "make"].map((key) => (
          <div key={key} style={{ marginBottom: "10px" }}>
            <label
              style={{
                display: "block",
                fontWeight: "bold",
                marginBottom: "4px",
              }}
            >
              {key.toUpperCase()}
            </label>
            <input
              type="text"
              name={key}
              value={cameraInfo[key]}
              onChange={handleChange}
              placeholder={`Enter ${key}`}
              style={{
                width: "100%",
                padding: "6px 10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
          </div>
        ))}
      </div>

      {/* ---- スタイルカスタマイズ ---- */}
      <div style={{ marginTop: "25px", textAlign: "left" }}>
        <label>
          🧩 ロゴ表示
          <input
            type="checkbox"
            checked={showLogo}
            onChange={() => setShowLogo(!showLogo)}
            style={{ marginLeft: "8px" }}
          />
        </label>

        <h4 style={{ marginBottom: "8px" }}>🎨 デザイン設定</h4>

        <div style={{ display: "grid", gap: "10px" }}>
          {/* 1行目フォントサイズ */}
          <label>
            🔠 1行目フォントサイズ
            <input
              type="number"
              value={fontSizeLine1}
              onChange={(e) => setFontSizeLine1(Number(e.target.value))}
              style={{
                marginLeft: "8px",
                padding: "4px 8px",
                width: "60px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
            px
          </label>

          {/* 2行目フォントサイズ */}
          <label>
            🔠 2行目フォントサイズ
            <input
              type="number"
              value={fontSizeLine2}
              onChange={(e) => setFontSizeLine2(Number(e.target.value))}
              style={{
                marginLeft: "8px",
                padding: "4px 8px",
                width: "60px",
                border: "1px solid #ccc",
              }}
            />
            px
          </label>
          {/* フレーム幅 */}
          <label>
            📏 フレームの余白
            <input
              type="number"
              value={framePadding}
              onChange={(e) => setFramePadding(Number(e.target.value))}
              style={{
                marginLeft: "8px",
                padding: "4px 8px",
                width: "70px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
            px
          </label>
          <label>
            📏 下のフレーム幅
            <input
              type="number"
              value={framePaddingBottom}
              onChange={(e) => setFramePaddingBottom(Number(e.target.value))}
              style={{
                marginLeft: "8px",
                padding: "4px 8px",
                width: "70px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
            px
          </label>
          <label>
            🎯 フレーム角の丸み
            <input
              type="number"
              value={frameRadius}
              onChange={(e) => setFrameRadius(Number(e.target.value))}
              style={{
                marginLeft: "8px",
                padding: "4px 8px",
                width: "60px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
            px
          </label>
          <label>
            🖼 写真の角の丸み
            <input
              type="number"
              value={imageRadius}
              onChange={(e) => setImageRadius(Number(e.target.value))}
              style={{
                marginLeft: "8px",
                padding: "4px 8px",
                width: "60px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />
            px
          </label>
        </div>
        {/* ✅ ここに保存ボタンを追加 */}
        <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "center" }}>
          <button
            onClick={() => handleDownload("png")}
            style={{
              padding: "10px 20px",
              background: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            📥 PNGで保存
          </button>

          <button
            onClick={() => handleDownload("jpeg")}
            style={{
              padding: "10px 20px",
              background: "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            📷 JPGで保存
          </button>
        </div>
      </div>
    </div>
  )
}
;

