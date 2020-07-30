/** @typedef { import('./api/types').WamParameterInfoMap } WamParameterInfoMap */
/** @typedef { import('./api/types').WamParameterInfo } WamParameterInfo */
/** @typedef { import('./api/types').WamParameterDataMap } WamParameterDataMap */
/** @typedef { import('./api/types').WamParameterData } WamParameterData */
/** @typedef { import('./api/types').WamParameterMap } WamParameterMap */
/** @typedef { import('./api/types').WamEvent } WamEvent */
/** @typedef { import('./api/types').AudioWorkletGlobalScope } AudioWorkletGlobalScope */

/* eslint-disable no-undef */
/* eslint-disable no-empty-function */
/* eslint-disable no-unused-vars */
/* eslint-disable no-plusplus */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */
/* eslint-disable lines-between-class-members */
/* eslint-disable radix */

/**
 * A WamEvent and corresponding message id used to trigger callbacks
 * on the main thread once the event has been processed.
 * @typedef {Object} PendingWamEvent
 * @property {number} id
 * @property {WamEvent} event
*/

/**
 * A range of sample indices and corresponding list of simultaneous
 * WamEvents to be processed at the beginning of the slice.
 * @typedef {Object} ProcessingSlice
 * @property {[number, number]} range
 * @property {WamEvent[]} events
 */

/**
 * @typedef {Object} WamParameterInterpolatorMap
 * @property {string} id
 * @property {WamParameterInterpolator} interpolator
 */


/** @type {AudioWorkletGlobalScope & globalThis} */
// @ts-ignore
const audioWorkletGlobalScope = globalThis;

const {
	AudioWorkletProcessor,
	// @ts-ignore
	WamParameterInfo,
	// @ts-ignore
	WamParameterInterpolator,
	// @ts-ignore
	WamParameterNoSab,
	// @ts-ignore
	WamParameterSab,
} = audioWorkletGlobalScope;

export default class WamProcessor extends AudioWorkletProcessor {
	/**
	 * Override to fetch plugin's params via whatever means desired.
	 * @returns {WamParameterInfoMap}
	 */
	static generateWamParameterInfo() {
		return { gain: new WamParameterInfo('gain') };
	}

	/** @param {AudioWorkletNodeOptions} options */
	constructor(options) {
		super(options);
		const {
			moduleId,
			instanceId,
			useSab,
		} = options.processorOptions;

		if (!moduleId) throw Error('must provide moduleId argument in processorOptions!');
		if (!instanceId) throw Error('must provide instanceId argument in processorOptions!');

		/** @property {string} moduleId */
		this.moduleId = moduleId;
		/** @property {string} instanceId */
		this.instanceId = instanceId;
		/** @property {WamParameterInfoMap} */
		// @ts-ignore
		// TODO I believe this is the correct way to do this but TS is complaining...
		this._parameterInfo = this.constructor.generateWamParameterInfo();
		/** @property {WamParameterMap} _parameterState */
		this._parameterState = {};

		/** @property {WamParameterInterpolatorMap} _parameterInterpolators */
		this._parameterInterpolators = {};
		Object.keys(this._parameterInfo).forEach((parameterId) => {
			const info = this._parameterInfo[parameterId];
			this._parameterInterpolators[parameterId] = new WamParameterInterpolator(info, 256);
		});

		/** @property {boolean} _useSab */
		this._useSab = !!useSab;
		if (this._useSab) {
			const numParameters = Object.keys(this._parameterInfo).length;
			const byteLength = Float32Array.BYTES_PER_ELEMENT * numParameters;
			/** @private @property {SharedArrayBuffer} _parameterBuffer */
			this._parameterBuffer = new SharedArrayBuffer(byteLength);
			/** @private @property {Float32Array} _parameterValues */
			this._parameterValues = new Float32Array(this._parameterBuffer);
			/** @private @property {[paramterId: string]: number} */
			this._parameterIndices = {};
			Object.keys(this._parameterInfo).forEach((parameterId, index) => {
				const info = this._parameterInfo[parameterId];
				this._parameterIndices[parameterId] = index;
				this._parameterState[parameterId] = new WamParameterSab(info, this._parameterValues, index);
			});
			// pass the SAB to main thread
			this.port.postMessage({
				useSab: true,
				parameterIndices: this._parameterIndices,
				parameterBuffer: this._parameterBuffer,
			});
		} else {
			Object.keys(this._parameterInfo).forEach((parameterId) => {
				this._parameterState[parameterId] = new WamParameterNoSab(this._parameterInfo[parameterId]);
			});
		}

		/*
		 * TODO
		 * Maybe this should all be refactored at some point to use a ringbuffer backed
		 * by SAB. Relying heavily on MessagePort for now, but it would be possible to
		 * handle automation / midi events etc without it.
		*/
		/** @property {PendingWamEvent[]} _eventQueue */
		this._eventQueue = [];

		/** @property {number} _compensationDelay */
		this._compensationDelay = 0;
		/** @property {boolean} _destroyed */
		this._destroyed = false;

		if (globalThis.WamProcessors) globalThis.WamProcessors[instanceId] = this;
		else globalThis.WamProcessors = { [instanceId]: this };

		this.port.onmessage = this._onMessage.bind(this);
	}

	/**
	 * Compensation delay hint in seconds.
	 * @returns {number}
	 */
	getCompensationDelay() { return this._compensationDelay; }

	/**
	 * From the audio thread, schedule a WamEvent.
	 * Listeners will be triggered when the event is processed.
	 * @param {WamEvent} event
	 */
	scheduleEvent(event) {
		// no need for ids if scheduled from audio thread
		this._eventQueue.push({ id: 0, event });
	}

	/** From the audio thread, clear all pending WamEvents. */
	clearEvents() {
		this._eventQueue = [];
	}

	/**
	 * Messages from main thread appear here.
	 * @param {MessageEvent} message
	 */
	_onMessage(message) {
		if (message.data.request) {
			const { id, request, content } = message.data;
			const response = { id, response: request };
			const requestComponents = request.split('/');
			const verb = requestComponents[0];
			const noun = requestComponents[1];
			response.content = 'error';
			if (verb === 'get') {
				if (noun === 'parameterInfo') {
					let { parameterIdQuery } = content;
					if (!parameterIdQuery.length) parameterIdQuery = Object.keys(this._parameterInfo);
					const parameterInfo = {};
					parameterIdQuery.forEach((parameterId) => {
						parameterInfo[parameterId] = this._parameterInfo[parameterId];
					});
					response.content = parameterInfo;
				} else if (noun === 'parameterValues') {
					/*eslint-disable-next-line prefer-const */
					let { normalized, parameterIdQuery } = content;
					response.content = this._getParameterValues(normalized, parameterIdQuery);
				} else if (noun === 'state') {
					response.content = { parameterValues: this._getParameterValues(false) };
					// ...additional state?
				} else if (noun === 'compensationDelay') {
					response.content = this.getCompensationDelay();
				}
			} else if (verb === 'set') {
				if (noun === 'parameterValues') {
					const { parameterValues } = content;
					this._setParameterValues(parameterValues, true);
					delete response.content;
				} else if (noun === 'state') {
					const { state } = content;
					if (state.parameterValues) this._setParameterValues(state.parameterValues, false);
					// ...additional state?
					delete response.content;
				}
			} else if (verb === 'add') {
				if (noun === 'event') {
					const { event } = content;
					this._eventQueue.push({ id, event });
					return; // defer postMessage until event is processed
				}
			} else if (verb === 'remove') {
				if (noun === 'events') {
					const ids = this._eventQueue.map((queued) => queued.id);
					this.clearEvents();
					response.content = ids;
				}
			}
			this.port.postMessage(response);
		}
	}

	/**
	 * @param {boolean} normalized
	 * @param {string[]=} parameterIdQuery
	 * @returns {WamParameterDataMap}
	 */
	_getParameterValues(normalized, parameterIdQuery) {
		/** @type {WamParameterDataMap} */
		const parameterValues = {};
		if (!parameterIdQuery) parameterIdQuery = [];
		if (!parameterIdQuery.length) parameterIdQuery = Object.keys(this._parameterState);
		parameterIdQuery.forEach((id) => {
			const parameter = this._parameterState[id];
			if (!parameter) return;
			parameterValues[id] = {
				id,
				value: normalized ? parameter.normalizedValue : parameter.value,
				normalized,
			};
		});
		return parameterValues;
	}

	/**
	 * @param {WamParameterDataMap} parameterUpdates
	 * @param {boolean} interpolate
	 */
	_setParameterValues(parameterUpdates, interpolate) {
		Object.keys(parameterUpdates).forEach((parameterId) => {
			const parameterUpdate = parameterUpdates[parameterId];
			this._setParameterValue(parameterUpdate, interpolate);
		});
	}

	/**
	 * @param {WamParameterData} parameterUpdate
	 * @param {boolean} interpolate
	 */
	_setParameterValue(parameterUpdate, interpolate) {
		const { id, value, normalized } = parameterUpdate;
		const parameter = this._parameterState[id];
		if (!parameter) return;
		if (!normalized) parameter.value = value;
		else parameter.normalizedValue = value;
		const interpolator = this._parameterInterpolators[id];
		if (interpolate) interpolator.setEndValue(parameter.value);
		else interpolator.setStartValue(parameter.value);
	}

	/**
	 * @param {number} startIndex
	 * @param {number} endIndex
	 */
	_interpolateParameterValues(startIndex, endIndex) {
		Object.keys(this._parameterInterpolators).forEach((parameterId) => {
			const interpolator = this._parameterInterpolators[parameterId];
			interpolator.process(startIndex, endIndex);
		});
	}

	/**
	 * Example implementation of custom sample accurate event scheduling.
	 * @returns {ProcessingSlice[]}
	 * */
	_getProcessingSlices() {
		const response = 'add/event';
		const samplesPerQuantum = 128;
		/** @ts-ignore */
		const { currentTime, sampleRate } = globalThis;
		/** @type {{[sampleIndex: number]: WamEvent[]}} */
		const eventsBySampleIndex = {};
		// assumes events arrive sorted by time
		while (this._eventQueue.length) {
			const { id, event } = this._eventQueue[0];
			const sampleIndex = event.time ? Math.round((event.time - currentTime) * sampleRate) : 0;
			if (sampleIndex < samplesPerQuantum) {
				if (eventsBySampleIndex[sampleIndex]) eventsBySampleIndex[sampleIndex].push(event);
				else eventsBySampleIndex[sampleIndex] = [event];
				// notify main thread
				if (id) this.port.postMessage({ id, response });
				else this.port.postMessage({ event });
				this._eventQueue.shift();
			} else break;
		}

		/** @type {ProcessingSlice[]} */
		const processingSlices = [];
		const keys = Object.keys(eventsBySampleIndex);
		if (keys[0] !== '0') keys.unshift('0');
		const lastIndex = keys.length;
		keys.forEach((key, index) => {
			const startSample = parseInt(key);
			const endSample = (index < lastIndex) ? parseInt(keys[index + 1]) : samplesPerQuantum;
			processingSlices.push({ range: [startSample, endSample], events: eventsBySampleIndex[key] });
		});
		return processingSlices;
	}

	/** @param {WamEvent} event */
	_processEvent(event) {
		switch (event.type) {
		case 'automation': this._setParameterValue(event.data, true); break;
		case 'midi': /*...*/ break;
		default: break;
		}
	}

	/**
	 * Override this to implement custom DSP.
	 * @param {number} startSample beginning of processing slice
	 * @param {number} endSample end of processing slice
	 * @param {Float32Array[][]} inputs
	 * @param {Float32Array[][]} outputs
	 * @param {{[x: string]: Float32Array}} parameters
	 */
	_process(startSample, endSample, inputs, outputs, parameters) {
		const input = inputs[0];
		const output = outputs[0];
		if (input.length !== output.length) return;
		const gain = this._parameterInterpolators.gain.values;
		for (let c = 0; c < output.length; ++c) {
			const x = input[c];
			const y = output[c];
			for (let n = startSample; n < endSample; ++n) {
				y[n] = x[n] * gain[n];
			}
		}
	}

	/**
	 * @param {Float32Array[][]} inputs
	 * @param {Float32Array[][]} outputs
	 * @param {{[x: string]: Float32Array}} parameters
	 */
	process(inputs, outputs, parameters) {
		if (this._destroyed) return false;
		const processingSlices = this._getProcessingSlices();
		processingSlices.forEach(({ range, events }) => {
			const [startSample, endSample] = range;
			// pause to process events at proper sample
			events.forEach((event) => this._processEvent(event));
			// perform parameter interpolation
			this._interpolateParameterValues(startSample, endSample);
			// continue processing
			this._process(startSample, endSample, inputs, outputs, parameters);
		});
		return true;
	}

	/** Stop processing and remove the node from the graph. */
	destroy() {
		this._destroyed = true;
	}
}

// @ts-ignore
if (typeof AudioWorkletGlobalScope !== 'undefined') { AudioWorkletGlobalScope.WamProcessor = WamProcessor; }
