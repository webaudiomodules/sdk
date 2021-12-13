/** @typedef {import('@webaudiomodules/api').WamProcessor} IWamProcessor */
/** @typedef {import('@webaudiomodules/api').AudioWorkletGlobalScope} AudioWorkletGlobalScope */
/** @typedef {import('./types').WamSDKBaseModuleScope} WamSDKBaseModuleScope */
/** @typedef {import('./types').WamGroup} IWamGroup */
/** @typedef {typeof import('./types').WamGroup} WamGroupConstructor */

/**
 * @param {string} groupId
 * @param {string} groupKey
 */
const initializeWamGroup = (groupId, groupKey) => {
	/** @type {AudioWorkletGlobalScope} */
	// @ts-ignore
	const audioWorkletGlobalScope = globalThis;

	class WamGroup {
		/** 
		 * @param {string} id 
		 * @param {string} key 
		 */
		constructor(id, key) {
			// TODO Could just use groupId, groupKey from initializeWamGroup rather than pass as ctor
			// args, since ctor shouldn't really be called directly anyway. That is, with current approach
			// it should always be the case that `groupId == id && groupKey == key` here.
			// but maybe useful for tests to do it this way? Let's discuss

			/** @type {string} */
			this.groupId = id;

			// TODO Idea here is to obfuscate the credentials. Not sure if it's airtight, let's discuss
			/** @type {(key: string) => boolean} */
			this._validate = (k) => {
				return k == key;
			}

			/** @type {Map<string, any>} */
			this._moduleScopes = new Map();
			/** @type {Map<IWamProcessor, Set<IWamProcessor>[]>} */
			this._eventGraph = new Map();
			/** @type {Map<string, IWamProcessor>} */
			this._processors = new Map();
		}

		validate(key) {
			return this._validate(key);
		}
	
		getModuleScope(moduleId) {
			if (!this._moduleScopes.has(moduleId)) this._moduleScopes.set(moduleId, {});
			return this._moduleScopes.get(moduleId);
		}
	
		getEventGraph() {
			return this._eventGraph;
		}
	
		getProcessors() {
			return this._processors;
		}
	}

	if (audioWorkletGlobalScope.AudioWorkletProcessor) {
		audioWorkletGlobalScope.webAudioModules.addGroup(new WamGroup(groupId, groupKey));
	}
};

export default initializeWamGroup;
