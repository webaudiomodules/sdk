/* eslint-disable lines-between-class-members */

const defaultLoadOptions = {
	noGui: false,
};
/**
 * Loads the json plugin descriptor from url
 */
export const getDescriptorFromUrl = async (url) => {
	url = new URL(url, window.location.href);
	const descriptor = await fetch(url).then((res) => res.json());
	descriptor.url = url;
	return descriptor;
};

export const loadModuleFromDescriptor = async (descriptor, optionsIn) => {
	const {
		entry = './index.js',
		gui = './gui.js',
		url,
	} = descriptor;
	const entryModuleUrl = new URL(entry, url);
	const guiModuleUrl = gui === 'none' ? undefined : new URL(gui, url);
	// @ts-ignore
	const { default: WamClass } = await import(/* webpackIgnore: true */entryModuleUrl);

	const options = { ...defaultLoadOptions, ...optionsIn };
	// if gui wanted, we load it right now
	// if not wanted, the gui will be loaded when calling plugin.createGui()
	// @ts-ignore
	if (!options.noGui && guiModuleUrl) { await import(/* webpackIgnore: true */guiModuleUrl); }

	/**
	 * Extends Plugin with actual descriptor and gui module url
	 */
	WamClass.descriptor = descriptor;
	WamClass.guiModuleUrl = guiModuleUrl;

	return WamClass;
};

export const loadModuleFromUrl = async (url, options) => {
	const descriptor = await getDescriptorFromUrl(url);
	const WamClass = await loadModuleFromDescriptor(descriptor, options);
	return WamClass;
};
