import { WamArrayRingBuffer } from './types';

declare const getWamArrayRingBuffer: (uuid?: string) => typeof WamArrayRingBuffer;

export default getWamArrayRingBuffer;
