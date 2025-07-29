import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import prisma from "../lib/prisma";
import { combineImages } from "../utils/combineImages";

export const data = new SlashCommandBuilder()
  .setName("view")
  .setDescription("Mostra l'immagine della carta tramite codice")
  .addStringOption(option =>
    option.setName("codice")
      .setDescription("Codice della carta")
      .setRequired(true)
  );

export async function execute(interaction: any) {
  const code = interaction.options.getString("codice");
  const userCard = await prisma.userCard.findFirst({ where: { code } });
  if (!userCard) {
    return interaction.reply({ content: "❌ Codice non trovato.", flags: 1 << 6 });
  }
  const card = await prisma.card.findUnique({ where: { id: userCard.cardId } });
  if (!card) {
    return interaction.reply({ content: "❌ Carta non trovata.", flags: 1 << 6 });
  }
  // Crea l'immagine singola con combineImages
  const buffer = await combineImages([
    {
      imageUrl: card.imageUrl,
      name: card.name,
      anime: card.anime,
      id: userCard.dropId ?? 1,
    }
  ], 230, 360);
  const attachment = new AttachmentBuilder(buffer, { name: "card.png" });
  await interaction.reply({ files: [attachment] });
}
