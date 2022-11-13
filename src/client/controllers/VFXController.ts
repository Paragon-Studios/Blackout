import { Controller } from "@flamework/core";
import { Debris, ReplicatedStorage as Replicated, Workspace as World } from "@rbxts/services";
import { WaitFor } from "shared/modules/utility/WaitFor";
import { WeaponModel } from "client/classes/WeaponModel";


@Controller({})
export class VFXController {
    public createMuzzleFlash(model: WeaponModel): void {
        const muzzleFlash = model.Trigger.Muzzle.Clone();
        muzzleFlash.Parent = model.Trigger;
        
        for (const v of <(ParticleEmitter | Light)[]>muzzleFlash.GetChildren()) {
            v.Enabled = true;
            task.delay(v.Name === "BarrelSmoke" ? .15 : .1, () => {
                v.Enabled = false
            });
        }
        task.delay(2.5, () => muzzleFlash.Destroy());

        const chamberSmoke = model.Trigger.Chamber.Smoke;
        chamberSmoke.Enabled = true;
        task.delay(.1, () => chamberSmoke.Enabled = false);
    }

    public createEjectedShell(shellType: string, weapon: WeaponModel): void {
        const vfx = Replicated.WaitForChild("VFX");
        const shell = WaitFor<Part>(vfx.WaitForChild("Shells"), shellType).Clone();
        shell.CFrame = weapon.Trigger.Chamber.WorldCFrame;
        shell.Parent = World.Debris;

        
        const r = new Random;
        const mod = r.NextNumber(-1, 1);
        const ejectForce = weapon.Trigger.CFrame.RightVector.Unit.div(50).add(new Vector3(0, .02, 0)); // fling right and up
        const ejectTorque = weapon.Trigger.CFrame.LookVector.Unit.div(10).mul(mod);
        shell.ApplyImpulseAtPosition(ejectForce, shell.CFrame.Position.add(ejectTorque));
        Debris.AddItem(shell, 5);
    }
}