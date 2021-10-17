/** @typedef {import('@webaudiomodules/api').WamParameter} IWamParameter */
/** @typedef {import('@webaudiomodules/api').WamParameterInfo} WamParameterInfo */

/** @implements {IWamParameter} */
export default class WamParameter {
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

if (globalThis.AudioWorkletGlobalScope) {
	globalThis.WamParameter = WamParameter;
}
