import { WebAudioModule } from "@webaudiomodules/api"
import { v200_WebAudioModule_shim } from "./shims/v200_imaginary"

/** @param {WebAudioModule} wamInstance */ 
const shim = (wamInstance) => {
    switch(wamInstance.descriptor.apiVersion) {
        case "2.0.0-alpha2":
            // WAM was built against current SDK, no need to shim
            return wamInstance
        case "2.0.0-imaginary":
            // WAM was built against (a pretend) SDK version 2.0.0-imaginary
            // for purpose of demonstrating a shim
            return new v200_WebAudioModule_shim(wamInstance)
        default:
            throw new Error(`SDK version ${wamInstance.descriptor.apiVersion} incompatible with host`)
    }
}

export default shim