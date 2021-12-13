/** @typedef {import('@webaudiomodules/api').WamProcessor} IWamProcessor */
/** @typedef {import('@webaudiomodules/api').AudioWorkletGlobalScope} AudioWorkletGlobalScope */
/** @typedef {import('@webaudiomodules/api').WamEvent} WamEvent */
/** @typedef {import('./types').WamGroup} IWamGroup */

/**
 * @param {string} groupId
 * @param {string} groupKey
 */
const initializeWamGroup = (groupId, groupKey) => {
	/** @type {AudioWorkletGlobalScope} */
	// @ts-ignore
	const audioWorkletGlobalScope = globalThis;

	/** @implements IWamGroup */
	class WamGroup {
		/** 
		 * @param {string} groupId
		 * @param {string} groupKey
		 */
		constructor(groupId, groupKey) {
			// TODO Could just use groupId, groupKey from initializeWamGroup rather than pass as ctor
			// args, since ctor shouldn't really be called directly anyway. That is, with current approach
			// it should always be the case that `groupId == id && groupKey == key` here.
			// but maybe useful for tests to do it this way? Let's discuss

			/** @type {string} */
			this._groupId = groupId;

			// TODO Idea here is to obfuscate the credentials. Not sure if it's airtight, let's discuss
			/** @type {(key: string) => boolean} */
			this._validate = (key) => {
				return key == groupKey;
			}

			/** @type {Map<IWamProcessor, Set<IWamProcessor>[]>} */
			this._eventGraph = new Map();
			/** @type {Map<string, IWamProcessor>} */
			this._processors = new Map();
		}

		get groupId() {
			return this._groupId;
		}

		validate(groupKey) {
			return this._validate(groupKey);
		}

		addWam(wam) {
			this._processors.set(wam.instanceId, wam);
		}

		removeWam(wam) {
			if (this._eventGraph.has(wam)) this._eventGraph.delete(wam);
			this._eventGraph.forEach((outputMap) => {
				outputMap.forEach((set) => {
					if (set && set.has(wam)) set.delete(wam);
				});
			});
			this._processors.delete(wam.instanceId);
		}
	
		/**
		 * @param {string} fromId
		 * @param {string} toId
		 * @param {number} [output]
		 */
		connectEvents(fromId, toId, output) {
			/** @type {IWamProcessor} */
			const from = this._processors.get(fromId);
			/** @type {IWamProcessor} */
			const to = this._processors.get(toId);

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
		}

		/**
		 * @param {string} fromId
		 * @param {string} [toId]
		 * @param {number} [output]
		 */
		disconnectEvents(fromId, toId, output) {
			/** @type {IWamProcessor} */
			const from = this._processors.get(fromId);
			
			if (!this._eventGraph.has(from)) return;
			const outputMap = this._eventGraph.get(from);
			if (typeof toId === 'undefined') {
				outputMap.forEach((set) => {
					if (set) set.clear();
				});
				return;
			} 
			
			/** @type {IWamProcessor} */
			const to = this._processors.get(toId);

			if (typeof output === 'undefined') {
				outputMap.forEach((set) => {
					if (set) set.delete(to);
				});
				return;
			}
			if (!outputMap[output]) return;
			outputMap[output].delete(to);
		}

		/**
		 * @param {IWamProcessor} from
		 * @param {WamEvent[]} events 
		 */
		emitEvents(from, ...events) {
			if (!this._eventGraph.has(from)) return;
			const downstream = this._eventGraph.get(from);
			downstream.forEach((set) => {
				if (set) set.forEach((wam) => wam.scheduleEvents(...events));
			});
		}
	}

	if (audioWorkletGlobalScope.AudioWorkletProcessor) {
		audioWorkletGlobalScope.webAudioModules.addGroup(new WamGroup(groupId, groupKey));
	}
};

export default initializeWamGroup;
