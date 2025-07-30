
import { createCanvas, loadImage, registerFont, Image } from "canvas";
import path from "path";
import fetch from "node-fetch";

// Puoi aggiungere un font personalizzato se vuoi uno stile anime
// registerFont(path.resolve(__dirname, "../assets/yourfont.ttf"), { family: "AnimeFont" });

export async function combineImages(cards: { imageUrl: string; name: string; id: number }[], width = 230, height = 360) {
  const marginX = 50;
  const marginY = 40;
  const cardCount = cards.length;
  const canvasWidth = cardCount * width + (cardCount + 1) * marginX;
  const canvasHeight = height + 2 * marginY;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  // Carica la cornice
  const framePath = path.resolve(__dirname, "../assets/frame.png");
  const frame = await loadImage(framePath);

  ctx.textAlign = "center";
  ctx.fillStyle = "#222";


  // Placeholder compatibile con Image
  const phCanvas = createCanvas(width, height);
  const phCtx = phCanvas.getContext("2d");
  phCtx.fillStyle = "#eee";
  phCtx.fillRect(0, 0, width, height);
  phCtx.font = "bold 20px Arial";
  phCtx.fillStyle = "#888";
  phCtx.textAlign = "center";
  phCtx.fillText("NO IMG", width / 2, height / 2);
  const placeholder = await loadImage(phCanvas.toBuffer());

  for (let i = 0; i < cardCount; i++) {
    const card = cards[i];
    if (!card) continue;
    const { imageUrl, name, id } = card;
    let img: Image;
    try {
      // Scarica l'immagine da URL esterno con User-Agent
      if (imageUrl.startsWith("http")) {
        const res = await fetch(imageUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
          }
        });
        if (!res.ok) throw new Error(`Impossibile scaricare ${imageUrl}`);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        img = await loadImage(buffer);
      } else {
        img = await loadImage(imageUrl);
      }
    } catch (err) {
      console.error(`Errore caricamento immagine ${imageUrl}:`, err);
      img = placeholder;
    }
    const x = marginX + i * (width + marginX);
    const y = marginY;

    // Calcola il resize mantenendo le proporzioni
    const ratio = Math.min(width / img.width, height / img.height);
    const drawWidth = img.width * ratio;
    const drawHeight = img.height * ratio;
    const offsetX = x + (width - drawWidth) / 2;
    const offsetY = y + (height - drawHeight) / 2;

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    ctx.drawImage(frame, x, y, width, height);

    // Nome centrato nella parte bianca in alto
    ctx.font = "bold 18px Arial";
    ctx.fillText(name, x + width / 2, y + 55);

    // ID carta in basso a destra nel rettangolo
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#222";
    // Posiziona l'id più in alto e più a sinistra per stare dentro il rettangolo
    ctx.fillText(`${id}`, x + width - 28, y + height - 3);
  }

  return canvas.toBuffer();
}
