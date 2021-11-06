import { WamEventRingBuffer } from './types';

declare const getWamEventRingBuffer: (uuid?: string) => typeof WamEventRingBuffer;

export default getWamEventRingBuffer;
