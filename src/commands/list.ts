import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } from "discord.js";
import prisma from "../lib/prisma";
import { combineImages } from "../utils/combineImages";


export const data = new SlashCommandBuilder()
  .setName("list")
  .setDescription("Mostra tutti i personaggi disponibili nel database")
  .addStringOption(option =>
    option.setName("anime")
      .setDescription("Filtra per anime specifico")
      .setRequired(false)
  )
  .addStringOption(option =>
    option.setName("name")
      .setDescription("Filtra per nome del personaggio")
      .setRequired(false)
  );

export async function execute(interaction: any) {
  const animeFilter = interaction.options.getString("anime") || null;
  const nameFilter = interaction.options.getString("name") || null;
  const page = interaction.options.getInteger("page") || 1;
  const pageSize = 10;

  // Costruisci filtro
  const where: any = {};
  if (animeFilter) {
    where.anime = { contains: animeFilter };
  }
  if (nameFilter) {
    where.name = { contains: nameFilter };
  }

  // Conta totale
  const total = await prisma.card.count({ where });
  // Prendi solo la pagina richiesta
  const cards = await prisma.card.findMany({
    where,
    orderBy: [
      { anime: 'asc' },
      { name: 'asc' }
    ],
    skip: (page - 1) * pageSize,
    take: pageSize
  });

  if (cards.length === 0) {
    return interaction.reply({ content: "❌ Nessun personaggio trovato.", flags: 1 << 6 });
  }

  // Raggruppa per anime
  const animeGroups: Record<string, typeof cards> = {};
  cards.forEach(card => {
    if (!animeGroups[card.anime]) {
      animeGroups[card.anime] = [];
    }
    animeGroups[card.anime].push(card);
  });

  // Crea l'embed principale
  const embed = new EmbedBuilder()
    .setTitle("🎴 Lista Personaggi")
    .setColor(0x0099ff)
    .setTimestamp();

  let descrizione = `Totale personaggi trovati: **${total}**\n`;
  if (animeFilter) descrizione += `Filtrati per anime: **${animeFilter}**\n`;
  if (nameFilter) descrizione += `Filtrati per nome: **${nameFilter}**\n`;
  descrizione += `Pagina **${page}** di **${Math.ceil(total / pageSize)}**`;
  embed.setDescription(descrizione);

  // Mostra la lista con la lente accanto
  Object.entries(animeGroups).forEach(([anime, animeCards]) => {
    const characterList = animeCards
      .map(card => `• ${card.name} [🔍](button:view_card_${card.id})`)
      .join('\n');
    embed.addFields({
      name: `${anime} (${animeCards.length})`,
      value: characterList,
      inline: false
    });
  });

  // Pulsanti di navigazione
  const navRow = new ActionRowBuilder<ButtonBuilder>();
  if (page > 1) {
    navRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`list_prev_${page - 1}_${animeFilter || ""}_${nameFilter || ""}`)
        .setLabel("⬅️ Pagina precedente")
        .setStyle(ButtonStyle.Primary)
    );
  }
  if (page < Math.ceil(total / pageSize)) {
    navRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`list_next_${page + 1}_${animeFilter || ""}_${nameFilter || ""}`)
        .setLabel("➡️ Pagina successiva")
        .setStyle(ButtonStyle.Primary)
    );
  }

  // Pulsanti "lente" divisi in righe da massimo 5
  const lensRows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let i = 0; i < cards.length; i += 5) {
    const row = new ActionRowBuilder<ButtonBuilder>();
    for (let j = i; j < i + 5 && j < cards.length; j++) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`view_card_${cards[j].id}`)
          .setLabel("🔍")
          .setStyle(ButtonStyle.Secondary)
      );
    }
    lensRows.push(row);
  }

  // Costruisci array componenti (max 5 righe)
  const components = [navRow, ...lensRows].slice(0, 5);

  // Usa flags per evitare warning ephemeral
  const flags = 0;
  if (interaction.replied || interaction.deferred) {
    await interaction.update({
      embeds: [embed],
      components,
      flags
    });
  } else {
    await interaction.reply({
      embeds: [embed],
      components,
      flags
    });
  }
}
