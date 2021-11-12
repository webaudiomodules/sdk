import { WamNode } from "@webaudiomodules/api";

// in the shims/types, we put a copy of the original types for older API versions
// that have been changed in newer APIs
export namespace V200_imaginary {

    export type WamIODescriptor = Record<`has${'Audio' | 'Midi' | 'Sysex' | 'Osc' | 'Mpe' | 'Automation'}${'Input' | 'Output'}`, boolean>;

    export interface WamDescriptor extends WamIODescriptor {
        name: string;
        vendor: string;
        version: string;
        sdkVersion: string;
        thumbnail: string;
        keywords: string[];
        isInstrument: boolean;
        description: string;
        website: string;
    }

    /**
     * Main `WebAudioModule` interface,
     * its constructor should be the `export default` of the ESM of each WAM.
     *
     * @template Node type of the `audioNode` property, could be any `AudioNode` that implements `WamNode`
     */
    export interface WebAudioModule<Node extends WamNode = WamNode> {
        /** should return `true` */
        readonly isWebAudioModule: boolean;
        /** The `AudioContext` where the plugin's node lives in */
        audioContext: BaseAudioContext;
        /** The `AudioNode` that handles audio in the plugin where the host can connect to/from */
        audioNode: Node;
        /** This will return true after calling `initialize()`. */
        initialized: boolean;
        /** The identifier of the current WAM, composed of vender + name */
        readonly moduleId: string;
        /** The unique identifier of the current WAM instance. */
        readonly instanceId: string;
        /** The values from `descriptor.json` */
        readonly descriptor: WamDescriptor;
        /** The WAM's name */
        readonly name: string;
        /** The WAM Vendor's name */
        readonly vendor: string;

        /**
         * This async method must be redefined to get `AudioNode` that
         * will connected to the host.
         * It can be any object that extends `AudioNode` and implements `WamNode`
         */
        createAudioNode(initialState?: any): Promise<WamNode>;
        /**
         * The host will call this method to initialize the WAM with an initial state.
         *
         * In this method, WAM devs should call `createAudioNode()`
         * and store its return `AudioNode` to `this.audioNode`,
         * then set `initialized` to `true` to ensure that
         * the `audioNode` property is available after initialized.
         *
         * These two behaviors are implemented by default in the SDK.
         *
         * The WAM devs can also fetch and preload the GUI Element in while initializing.
         */
        initialize(state?: any): Promise<WebAudioModule>;
        /** Redefine this method to get the WAM's GUI as an HTML `Element`. */
        createGui(): Promise<Element>;
        /** Clean up an element previously returned by `createGui` */
        destroyGui(gui: Element): void
    }
}