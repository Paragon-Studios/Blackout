import { Service } from "@flamework/core";
import { BanReason } from "shared/enums";
import { OnPlayerAdded } from "shared/meta/player-lifecycle-hooks";
import { DiscordService } from "../discord-service";
import { PlayerDataService } from "./data-service";
import { PlayerRemovalService } from "./removal-service";

@Service()
export class BanService implements OnPlayerAdded {
  public constructor(
    private readonly playerData: PlayerDataService,
    private readonly playerRemoval: PlayerRemovalService,
    private readonly discord: DiscordService
  ) {}

  public onPlayerAdded(player: Player): void {
    const profile = this.playerData.getProfile(player.UserId);
    if (!profile) return;
    if (
      !profile.Data.banInfo.banned &&
      profile.Data.banInfo.reason === BanReason.Unbanned
    )
      return;
    this.playerRemoval.removeDueToBan(player, profile.Data.banInfo.reason);
  }

  public async ban(player: Player, reason: BanReason): Promise<void> {
    const profile = this.playerData.getProfile(player.UserId);
    if (!profile) return;
    profile.Data.banInfo.banned = true;
    profile.Data.banInfo.reason = reason;
    this.playerRemoval.removeDueToBan(player, reason);
    this.discord.log(
      player,
      `Player was banned.\nBan Reason: ${reason}`,
      "Player Banned"
    );
  }

  public async unban(userID: number): Promise<void> {
    const profile = await this.playerData.loadProfile(userID);
    if (!profile) return;
    profile.Data.banInfo.banned = false;
    profile.Data.banInfo.reason = BanReason.Unbanned;
  }
}
