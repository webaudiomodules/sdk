/** @typedef {import('@webaudiomodules/api').WamProcessor} IWamProcessor */
/** @typedef {import('@webaudiomodules/api').WamEnv} IWamEnv */
/** @typedef {import('@webaudiomodules/api').AudioWorkletGlobalScope} AudioWorkletGlobalScope */

/**
 * @param {string} apiVersion
 */
const initializeWamEnv = (apiVersion) => {
	/**
	 * @implements {IWamEnv}
	 */
	class WamEnv {
		constructor() {
			/** @type {Record<string, any>} */
			this._dependencies = {};
			/** @type {Map<IWamProcessor, Set<IWamProcessor>[]>} */
			this._eventGraph = new Map();
			/** @type {Record<string, IWamProcessor>} */
			this._processors = {};
		}

		get apiVersion() {
			return apiVersion;
		}

		/**
		 * @param {IWamProcessor} wam
		 */
		create(wam) {
			this._processors[wam.instanceId] = wam;
			// console.log('create', this);
		}

		/**
		 * 
		 * @param {string} moduleId 
		 * @returns {Record<string, any>}
		 */
		getModuleScope(moduleId) {
			return this._dependencies[moduleId];
		}

		/**
		 * @param {string} fromId
		 * @param {string} toId
		 * @param {number} [output]
		 */
		connectEvents(fromId, toId, output = 0) {
			/** @type {IWamProcessor} */
			const from = this._processors[fromId];
			/** @type {IWamProcessor} */
			const to = this._processors[toId];

			/** @type {Set<IWamProcessor>[]} */
			let outputMap;
			if (this._eventGraph.has(from)) {
				outputMap = this._eventGraph.get(from);
			} else {
				outputMap = [];
				this._eventGraph.set(from, outputMap);
			}
			if (outputMap[output]) {
				outputMap[output].add(to);
			} else {
				const set = new Set();
				set.add(to);
				outputMap[output] = set;
			}
			// console.log('connectEvents', this);
		}

		/**
		 * @param {string} fromId
		 * @param {string} [toId]
		 * @param {number} [output]
		 */
		disconnectEvents(fromId, toId, output) {
			/** @type {IWamProcessor} */
			const from = this._processors[fromId];
			
			if (!this._eventGraph.has(from)) return;
			const outputMap = this._eventGraph.get(from);
			if (typeof toId === 'undefined') {
				outputMap.forEach((set) => {
					if (set) set.clear();
				});
				return;
			} 
			
			/** @type {IWamProcessor} */
			const to = this._processors[toId];

			if (typeof output === 'undefined') {
				outputMap.forEach((set) => {
					if (set) set.delete(to);
				});
				return;
			}
			if (!outputMap[output]) return;
			outputMap[output].delete(to);
			// console.log('disconnectEvents', this);
		}

		/**
		 * @param {IWamProcessor} from
		 * @param  {...any} events 
		 */
		emitEvents(from, ...events) {
			if (!this._eventGraph.has(from)) return;
			const downstream = this._eventGraph.get(from);
			downstream.forEach((set) => {
				if (set) set.forEach((wam) => wam.scheduleEvents(...events));
			});
		}

		/**
		 * @param {IWamProcessor} wam
		 */
		destroy(wam) {
			if (this._eventGraph.has(wam)) this._eventGraph.delete(wam);
			this._eventGraph.forEach((outputMap) => {
				outputMap.forEach((set) => {
					if (set && set.has(wam)) set.delete(wam);
				});
			});
			// console.log('destroy', this);
		}
	}

	/** @type {AudioWorkletGlobalScope} */
	// @ts-ignore
	const audioWorkletGlobalScope = globalThis;
	if (audioWorkletGlobalScope.AudioWorkletProcessor) {
		if (!audioWorkletGlobalScope.webAudioModules) audioWorkletGlobalScope.webAudioModules = new WamEnv();
	}

	return WamEnv;
};

/** @type {AudioWorkletGlobalScope} */
// @ts-ignore
const audioWorkletGlobalScope = globalThis;
if (audioWorkletGlobalScope.AudioWorkletProcessor) {
	if (!audioWorkletGlobalScope.webAudioModules) initializeWamEnv("2.0.0");
}

export default initializeWamEnv;
