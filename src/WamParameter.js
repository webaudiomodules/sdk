/** @typedef {import('@webaudiomodules/api').WamParameter} IWamParameter */
/** @typedef {typeof import('@webaudiomodules/api').WamParameter} WamParameterContructor */
/** @typedef {import('@webaudiomodules/api').WamParameterInfo} WamParameterInfo */
/** @typedef {import('./types').AudioWorkletGlobalScope} AudioWorkletGlobalScope */

/**
 * @param {string} [uuid]
 * @returns {WamParameterContructor}
 */
const getWamParameter = (uuid) => {
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
		if (uuid) {
			if (!audioWorkletGlobalScope[uuid]) audioWorkletGlobalScope[uuid] = WamParameter;
		} else {
			if (!audioWorkletGlobalScope.WamParameter) audioWorkletGlobalScope.WamParameter = WamParameter;
		}
	}

	return WamParameter;
};
/** @type {AudioWorkletGlobalScope} */
// @ts-ignore
const audioWorkletGlobalScope = globalThis;
if (audioWorkletGlobalScope.AudioWorkletProcessor) {
	if (!audioWorkletGlobalScope.WamParameter) getWamParameter();
}

export default getWamParameter;
