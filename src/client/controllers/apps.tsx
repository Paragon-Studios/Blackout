import { Controller, Modding, OnInit, OnStart } from '@flamework/core';
import { SceneController } from './scene';
import { Scene } from 'shared/enums';
import { Constructor } from '@flamework/core/out/types';
import Roact from '@rbxts/roact';
import { ClientStore, StoreActions } from 'client/rodux/rodux';
import Rodux from '@rbxts/rodux';
import RoactRodux, { StoreProvider } from '@rbxts/roact-rodux';
import { Players } from '@rbxts/services';

type StoreDispatch = Rodux.Dispatch<StoreActions>;

interface AppConfig {
	name: string;
	requiredScene?: Scene;
	ignoreGuiInset?: boolean;
	mapStateToProps?: (state: ClientStore) => unknown;
	mapDispatchToProps?: (dispatch: StoreDispatch) => unknown;
}

export const App = Modding.createMetaDecorator<[AppConfig]>('Class');

const noop = () => {};

@Controller()
export class AppController implements OnStart, OnInit {
	private apps = new Map<Constructor<Roact.Component>, AppConfig>();
	private appHandles = new Map<Constructor<Roact.Component>, Roact.Tree>();

	private playerGui = Players.LocalPlayer.FindFirstChildOfClass('PlayerGui')!;

	constructor(private readonly scene: SceneController) {}

	public onInit(): void {
		this.scene.OnSceneChanged.Connect((n, o) => this.onSceneChanged(n, o));
	}

	onStart(): void {
		const constructors = Modding.getDecorators<typeof App>();
		for (const { object, arguments: args } of constructors) {
			const config = args[0];

			this.apps.set(object as Constructor<Roact.Component>, config);
		}
	}

	private onSceneChanged(newScene: Scene, oldScene?: Scene) {
		for (const [app, config] of this.apps) {
			if (!config.requiredScene) continue;

			const usedToBeOpen = config.requiredScene === oldScene;
			const shouldBeOpen = config.requiredScene === newScene;

			if (usedToBeOpen && !shouldBeOpen) {
				this.hideApp(app);
			} else if (!usedToBeOpen && shouldBeOpen) {
				this.showApp(app);
			}
		}
	}

	private showApp(app: Constructor<Roact.Component>) {
		const config = this.apps.get(app)!;

		let component = app as unknown as Roact.FunctionComponent;
		if (config.mapStateToProps || config.mapDispatchToProps) {
			const mapStateToProps = config.mapStateToProps ?? noop;
			const mapDispatchToProps = config.mapDispatchToProps ?? noop;

			component = RoactRodux.connect(
				(state: ClientStore) => mapStateToProps(state),
				(dispatch: StoreDispatch) => mapDispatchToProps(dispatch)
			)(component);
		}

		const content = (
			<StoreProvider store={ClientStore}>
				{Roact.createElement(component)}
			</StoreProvider>
		);

		const handle = Roact.mount(
			<screengui
				Key={config.name}
				IgnoreGuiInset={config.ignoreGuiInset}
				ResetOnSpawn={false}
				ZIndexBehavior={Enum.ZIndexBehavior.Sibling}
			>
				{content}
			</screengui>,
			this.playerGui,
			config.name
		);

		this.appHandles.set(app, handle);
	}

	private hideApp(app: Constructor<Roact.Component>) {
		const handle = this.appHandles.get(app);
		if (handle) {
			Roact.unmount(handle);
			this.appHandles.delete(app);
		}
	}
}
