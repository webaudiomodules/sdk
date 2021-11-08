/** @typedef {import('@webaudiomodules/api').WamParameter} IWamParameter */
/** @typedef {typeof import('@webaudiomodules/api').WamParameter} WamParameterContructor */
/** @typedef {import('@webaudiomodules/api').WamParameterInfo} WamParameterInfo */
/** @typedef {import('@webaudiomodules/api').AudioWorkletGlobalScope} AudioWorkletGlobalScope */

/**
 * @param {string} [moduleId]
 * @returns {WamParameterContructor}
 */
const getWamParameter = (moduleId) => {
	/** @implements {IWamParameter} */
	class WamParameter {
		/** @param {WamParameterInfo} info */
		constructor(info) {
			/** @readonly @type {WamParameterInfo} */
			this.info = info;
			/** @private @type {number} */
			this._value = info.defaultValue;
		}
	
		/**
		 * Set current (denormalized) value
		 * @param {number} value
		*/
		set value(value) {
			this._value = value;
		}
	
		/**
		 * Get current (denormalized) value
		 * @returns {number}
		 */
		get value() {
			return this._value;
		}
	
		/**
		 * Set current value in normalized range
		 * @param {number} valueNorm
		 */
		set normalizedValue(valueNorm) {
			this.value = this.info.denormalize(valueNorm);
		}
	
		/**
		 * Get current value in normalized range
		 * @returns {number}
		 */
		get normalizedValue() {
			return this.info.normalize(this.value);
		}
	}

	/** @type {AudioWorkletGlobalScope} */
	// @ts-ignore
	const audioWorkletGlobalScope = globalThis;
	if (audioWorkletGlobalScope.AudioWorkletProcessor) {
		const { dependencies } = audioWorkletGlobalScope.webAudioModules;
		if (moduleId) {
			if (!dependencies[moduleId]) dependencies[moduleId] = {};
			if (!dependencies[moduleId].WamParameter) dependencies[moduleId].WamParameter = WamParameter;
		}
	}

	return WamParameter;
};

export default getWamParameter;
