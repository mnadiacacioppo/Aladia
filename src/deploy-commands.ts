import { REST, Routes } from "discord.js";
import { config } from "./config";
import { commands } from "./commands";

const commandsData = Object.values(commands).map((command) => command.data);

const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

type DeployCommandsProps = {
  guildId: string;
};

export async function deployCommands({ guildId }: DeployCommandsProps) {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(
      Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, guildId),
      {
        body: commandsData,
      }
    );

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
}

// Leggi l'ID della guild dagli argomenti della riga di comando
const guildId = process.argv[2];

if (!guildId) {
  console.error("Devi specificare l'ID della guild come argomento. Esempio: npm run deploy:commands -- <ID_TUA_GUILD>");
  process.exit(1);
}

deployCommands({ guildId });