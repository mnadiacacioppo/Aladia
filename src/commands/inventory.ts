import { SlashCommandBuilder } from "discord.js";
import prisma from "../lib/prisma";

export const data = new SlashCommandBuilder()
  .setName("inventory")
  .setDescription("Mostra le carte che hai collezionato");

export async function execute(interaction: any) {
  const user = await prisma.user.findUnique({
    where: { discordId: interaction.user.id },
    include: {
      cards: true,
    },
  });

  if (!user || !user.cards || user.cards.length === 0) {
    return interaction.reply("Non hai ancora claimato nessuna carta.");
  }

  const lista = await Promise.all(user.cards.map(async (uc: any) => {
    const card = await prisma.card.findUnique({
      where: { id: uc.cardId },
      select: { name: true }
    });
    if (!card) return "";
    return `• ${uc.code ?? "------"} | #${uc.dropId ?? "?"} - ${card.name}`;
  }));
  await interaction.reply(`📦 Ecco le tue carte:\n${lista.filter(Boolean).join("\n")}`);
}
