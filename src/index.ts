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
    const [action, type, ...params] = interaction.customId.split("_");

    // Paginazione comando list
    if (action === "list" && (type === "prev" || type === "next")) {
      // Estraggo i parametri
      const page = parseInt(params[0]);
      const nameFilter = params[2] || null;

      // Eseguo la funzione del comando list
      const { execute } = require("./commands/list");
      // Creo un oggetto options simulato
      const fakeOptions = {
        getString: (key: string) => {
          if (key === "name") return nameFilter && nameFilter !== "" ? nameFilter : null;
          return null;
        },
        getInteger: (key: string) => {
          if (key === "page") return page;
          return null;
        }
      };
      // Passo options simulato e forzo update
      await execute({
        ...interaction,
        options: fakeOptions,
        replied: true,
        deferred: false,
        update: interaction.update.bind(interaction)
      });
      return;
    }

    // Visualizzazione carta tramite lente
    if (action === "view" && type === "card") {
      const cardId = parseInt(params[0]);
      const card = await prisma.card.findUnique({ where: { id: cardId } });
      if (!card) {
        return interaction.reply({ content: "❌ Carta non trovata.", flags: 1 << 6 });
      }
      const { combineImages } = await import("./utils/combineImages");
      const { AttachmentBuilder } = await import("discord.js");
      try {
        const buffer = await combineImages([
          {
            imageUrl: card.imageUrl,
            name: card.name,
            id: 1,
          }
        ], 230, 360);
        const attachment = new AttachmentBuilder(buffer, { name: "card.png" });
        await interaction.reply({
          content: `🎴 **${card.name}**`,
          files: [attachment],
          flags: 1 << 6
        });
      } catch (error) {
        console.error("Errore nella creazione dell'immagine:", error);
        await interaction.reply({
          content: `🎴 **${card.name}**\n\n*Anteprima immagine non disponibile*`,
          flags: 1 << 6
        });
      }
      return;
    }

    // ...gestione claim e altri bottoni...
    if (action === "claim") {
      // ...existing code...
    }
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
        flags: 1 << 6,
      });
    }
  }
});

// ✅ Avvia il bot con il token dal file .env
client.login(process.env.DISCORD_TOKEN);