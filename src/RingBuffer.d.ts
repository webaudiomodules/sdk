import { RingBuffer } from './types';

declare const getRingBuffer: (groupId?: string, moduleId?: string) => typeof RingBuffer;

export default getRingBuffer;
