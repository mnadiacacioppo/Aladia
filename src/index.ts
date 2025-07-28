import { Client, GatewayIntentBits, Events, ButtonInteraction } from "discord.js";
import dotenv from "dotenv";
import prisma from "./lib/prisma";
import cards from "./data/cards.json";
import { commands } from "./commands";

dotenv.config();

// ✅ Crea il bot Discord (client)
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

// ✅ Quando il bot è online
client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user?.tag}`);
});

// ✅ Quando qualcuno clicca su un bottone (es. "Claim")
client.on(Events.InteractionCreate, async (interaction) => {
  // Gestione bottoni
  if (interaction.isButton()) {
    const [action, idx, cardName, dropIdStr] = interaction.customId.split("_");
    if (action !== "claim") return;
    const dropId = dropIdStr ? parseInt(dropIdStr) : undefined;

    const user = await prisma.user.upsert({
      where: { discordId: interaction.user.id },
      update: {},
      create: { discordId: interaction.user.id },
    });

    // Cerca la carta nel database, se non esiste la crea
    let card = await prisma.card.findFirst({
      where: { name: cardName },
    });
    if (!card) {
      const cardData = cards.find((c) => c.name === cardName);
      card = await prisma.card.create({
        data: {
          name: cardName,
          imageUrl: cardData?.imageUrl || "",
          anime: cardData?.anime || "?",
        },
      });
    }

    // Genera codice univoco di 6 caratteri (numeri e lettere)
    function generateCode(length = 6) {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let code = '';
      for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    }

    let code;
    let exists = true;
    // Assicurati che il codice sia unico
    do {
      code = generateCode();
      exists = !!(await prisma.userCard.findFirst({ where: { code } }));
    } while (exists);

    await prisma.userCard.create({
      data: {
        userId: user.id,
        cardId: card.id,
        dropId: dropId,
        code: code,
      },
    });

    await interaction.update({
      content: `🎉 ${interaction.user.username} ha claimato **${cardName}**!`,
      components: [],
    });
    return;
  }

  // Gestione slash command
  if (interaction.isChatInputCommand()) {
    const command = commands[interaction.commandName];
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content:
          "Si è verificato un errore durante l'esecuzione del comando.",
        ephemeral: true,
      });
    }
  }
});

// ✅ Avvia il bot con il token dal file .env
client.login(process.env.DISCORD_TOKEN);