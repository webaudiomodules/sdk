/** @typedef {import('@webaudiomodules/api').WamProcessor} IWamProcessor */
/** @typedef {import('@webaudiomodules/api').WamEnv} IWamEnv */
/** @typedef {import('@webaudiomodules/api').WamGroup} IWamGroup */
/** @typedef {import('@webaudiomodules/api').AudioWorkletGlobalScope} AudioWorkletGlobalScope */

/**
 * @param {string} apiVersion
 */
const initializeWamEnv = (apiVersion) => {
	/** @type {AudioWorkletGlobalScope} */
	// @ts-ignore
	const audioWorkletGlobalScope = globalThis;
	if (audioWorkletGlobalScope.AudioWorkletProcessor 
		&& audioWorkletGlobalScope.webAudioModules) return; // already initialized
	
	/** @type {Map<string, IWamGroup>}] */
	const groups = new Map();
	
	/**
	 * @implements {IWamEnv}
	 */
	class WamEnv {
		constructor() {}

		get apiVersion() {
			return apiVersion;
		}

		/** 
		 * @param {string} groupId
		 * @param {string} groupKey
		 */
		getGroup(groupId, groupKey) {
			const group = groups.get(groupId);
			if (group.validate(groupKey)) return group;
			else throw 'Invalid key';
		}

		/**
		 * @param {IWamGroup} group
		 */
		addGroup(group) {
			if (!groups.has(group.groupId)) groups.set(group.groupId, group);
		}

		/**
		 * @param {IWamGroup} group
		 */
		removeGroup(group) {
			groups.delete(group.groupId);
		}

		/**
		 * @param {IWamProcessor} wam
		 */
		addWam(wam) {
			/** @type {IWamGroup} */
			const group = groups.get(wam.groupId);
			group.getProcessors().set(wam.instanceId, wam);
		}

		/**
		 * @param {IWamProcessor} wam
		 */
		removeWam(wam) {
			/** @type {IWamGroup} */
			const group = groups.get(wam.groupId);
			const eventGraph = group.getEventGraph();
			const processors = group.getProcessors();

			if (eventGraph.has(wam)) eventGraph.delete(wam);
			eventGraph.forEach((outputMap) => {
				outputMap.forEach((set) => {
					if (set && set.has(wam)) set.delete(wam);
				});
			});
			processors.delete(wam.instanceId);
		}

		/**
		 * 
		 * @param {string} moduleId 
		 * @returns {Record<string, any>}
		 */
		getModuleScope(groupId, moduleId) {
			/** @type {IWamGroup} */
			const group = groups.get(groupId);
			return group.getModuleScope(moduleId);
		}

		/**
		 * @param {string} groupId
		 * @param {string} fromId
		 * @param {string} toId
		 * @param {number} [output]
		 */
		connectEvents(groupId, fromId, toId, output = 0) {
			/** @type {IWamGroup} */
			const group = groups.get(groupId);
			const eventGraph = group.getEventGraph();
			const processors = group.getProcessors();

			/** @type {IWamProcessor} */
			const from = processors.get(fromId);
			/** @type {IWamProcessor} */
			const to = processors.get(toId);

			/** @type {Set<IWamProcessor>[]} */
			let outputMap;
			if (eventGraph.has(from)) {
				outputMap = eventGraph.get(from);
			} else {
				outputMap = [];
				eventGraph.set(from, outputMap);
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
		 * @param {string} groupId
		 * @param {string} fromId
		 * @param {string} [toId]
		 * @param {number} [output]
		 */
		disconnectEvents(groupId, fromId, toId, output) {
			/** @type {IWamGroup} */
			const group = groups.get(groupId);
			const eventGraph = group.getEventGraph();
			const processors = group.getProcessors();
			/** @type {IWamProcessor} */
			const from = processors.get(fromId);
			
			if (!eventGraph.has(from)) return;
			const outputMap = eventGraph.get(from);
			if (typeof toId === 'undefined') {
				outputMap.forEach((set) => {
					if (set) set.clear();
				});
				return;
			} 
			
			/** @type {IWamProcessor} */
			const to = processors.get(toId);

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
		 * @param  {...any} events 
		 */
		emitEvents(from, ...events) {
			/** @type {IWamGroup} */
			const group = groups.get(from.groupId);
			const eventGraph = group.getEventGraph();

			if (!eventGraph.has(from)) return;
			const downstream = eventGraph.get(from);
			downstream.forEach((set) => {
				if (set) set.forEach((wam) => wam.scheduleEvents(...events));
			});
		}
	}

	if (audioWorkletGlobalScope.AudioWorkletProcessor) {
		if (!audioWorkletGlobalScope.webAudioModules) audioWorkletGlobalScope.webAudioModules = new WamEnv();
	}
};

export default initializeWamEnv;
