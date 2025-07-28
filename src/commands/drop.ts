import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, AttachmentBuilder } from "discord.js";
import prisma from "../lib/prisma";
import { combineImages } from "../utils/combineImages";

// Il conteggio ora è gestito dal database tramite Prisma

export const data = new SlashCommandBuilder()
  .setName("drop")
  .setDescription("Fa apparire una carta casuale!");

// Mappa per tenere traccia dei cooldown degli utenti
const dropCooldowns = new Map<string, number>();

export async function execute(interaction: any) {
  let claimed = false;
  const userId = interaction.user.id;
  const now = Date.now();
  const cooldown = 10 * 60 * 1000; // 10 minuti in ms
  const lastDrop = dropCooldowns.get(userId) || 0;

  // --- COOLDOWN DISATTIVATO PER TEST ---
  // if (now - lastDrop < cooldown) {
  //   const minuti = Math.ceil((cooldown - (now - lastDrop)) / 60000);
  //   return interaction.reply({
  //     content: `⏳ Devi aspettare ancora ${minuti} minuto/i prima di poter droppare altre carte!`,
  //     ephemeral: true,
  //   });
  // }

  dropCooldowns.set(userId, now);

  const allCards = await prisma.card.findMany();
  // Scegli 3 carte casuali e diverse
  const carteDisponibili = [...allCards];
  const carteScelte = [];
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(Math.random() * carteDisponibili.length);
    carteScelte.push(carteDisponibili[idx]);
    carteDisponibili.splice(idx, 1);
  }

  // Calcola l'id progressivo globale per ogni carta usando il database
  const carteConAnime = [];
  for (const c of carteScelte) {
    // Trova o crea il contatore per la carta
    let dropCount = await prisma.cardDropCount.findUnique({ where: { name: c.name } });
    if (!dropCount) {
      dropCount = await prisma.cardDropCount.create({ data: { name: c.name, count: 1 } });
    } else {
      dropCount = await prisma.cardDropCount.update({ where: { name: c.name }, data: { count: dropCount.count + 1 } });
    }
    carteConAnime.push({
      imageUrl: c.imageUrl,
      name: c.name,
      anime: c.anime,
      id: dropCount.count,
    });
  }

  // Prima rispondi in modo deferito per avere tempo
  await interaction.deferReply();

  // Unisci le immagini delle 3 carte in una sola
  const combinedBuffer = await combineImages(carteConAnime);
  const attachment = new AttachmentBuilder(combinedBuffer, { name: "cards.png" });

  // Crea un embed unico con l'immagine combinata
  const embed = new EmbedBuilder()
    .setTitle("Scegli una carta tra queste:")
    .setImage("attachment://cards.png");

  // Crea 3 bottoni, uno per ogni carta, includendo il dropId
  const buttons = carteConAnime.map((card, i) =>
    new ButtonBuilder()
      .setCustomId(`claim_${i}_${card.name}_${card.id}`)
      .setLabel(`${i + 1}`)
      .setStyle(ButtonStyle.Primary)
  );

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);

  await interaction.editReply({
    embeds: [embed],
    components: [row],
    files: [attachment],
  });
  // Recupera il messaggio appena inviato
  const replyMessage = await interaction.fetchReply();

  // Listener temporaneo per claim
  const collector = replyMessage.createMessageComponentCollector({
    filter: (i: any) => i.customId.startsWith("claim_"),
    time: 10000,
    max: 1,
  });
  collector.on("collect", () => {
    claimed = true;
  });

  // Timeout: dopo 10 secondi disabilita i bottoni e mostra il messaggio solo se nessuno ha claimato
  setTimeout(async () => {
    try {
      // Recupera il messaggio aggiornato
      const latestMessage = await interaction.fetchReply();
      if (latestMessage.editable && latestMessage.components[0]?.components.some((b: any) => !b.disabled)) {
        const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          buttons.map((b) => b.setDisabled(true))
        );
        await latestMessage.edit({
          content: claimed
            ? latestMessage.content ?? undefined
            : `⏳ Tempo scaduto! Nessuno ha claimato una carta.`,
          embeds: [embed],
          components: claimed ? [disabledRow] : [],
          files: [attachment],
        });
      }
    } catch (e) {
      // Ignora errori se il messaggio è già stato aggiornato
    }
  }, 10000);
}