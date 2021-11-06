import { RingBuffer } from './types';

declare const getRingBuffer: (uuid?: string) => typeof RingBuffer;

export default getRingBuffer;
