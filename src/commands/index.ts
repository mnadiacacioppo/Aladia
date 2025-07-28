import { CommandInteraction } from "discord.js";
import * as ping from "./ping";
import * as inventory from "./inventory";
import * as drop from "./drop";
import * as view from "./view";

interface Command {
  data: any;
  execute: (interaction: CommandInteraction) => Promise<any>;
}

export const commands: Record<string, Command> = {
  ping,
  inventory,
  drop,
  view,
};