import { WebAudioModule } from '@webaudiomodules/api';
/** @typedef {import('@webaudiomodules/api').WamDescriptor} WamDescriptor */
/** @typedef {import('@webaudiomodules/api').WamNode} WamNode */
/** @template T @typedef {import('@webaudiomodules/api').WebAudioModule} IWebAudioModule<T> */

/** @implements {IWebAudioModule<WamNode>} */

export class v200_WebAudioModule_shim {
    /** @type {import('./v200_types').V200_imaginary.WebAudioModule} */
    wam

    constructor(wam) {
        this.wam = wam
    }

	get isWebAudioModule() {
		return true;
	}

	get moduleId() { return this.wam.moduleId }

	get instanceId() { return this.wam.instanceId }

	get descriptor() { 
        return {...this.wam.descriptor, apiVersion: this.wam.descriptor.sdkVersion}
    }

	get name() { return this.wam.name }

	get vendor() { return this.wam.vendor; }

	get audioContext() {
		return this.wam.audioContext;
	}

	get audioNode() {
		return this.wam.audioNode;
	}

	set audioNode(node) {
		this.wam.audioNode = node;
	}

	get initialized() {
		return this.wam.initialized;
	}

	set initialized(value) {
		this.wam.initialized = value;
	}

	/**
	 * @param {any} [initialState]
	 * @returns {Promise<WamNode>}
	 */
	async createAudioNode(initialState) {
		return this.wam.createAudioNode(initialState)
	}

	/**
	 * @param {any} [state]
	 * @returns {Promise<WebAudioModule>}
	 */
	async initialize(state) {
		this.wam.initialize(state)
        return this
	}

	/**
	 * @returns {Promise<HTMLElement>}
	 */
	async createGui() {
		return this.wam.createGui()
	}

	destroyGui() {}
}