export interface NetworkInterface {
	get(uri: string, qs: any) : Promise<any>;
	post(uri: string, form: any, bearerToken?: string): Promise<any>;

	// These methods use an URL proxy (for CORS)
	get_proxy(uri: string, qs: any) : Promise<any>;
	post_proxy(uri: string, form: any, bearerToken?: string): Promise<any>;
	setProxy(urlProxy: string);

	postjson(uri: string, form: any): Promise<any>;
	getRaw(uri: string, qs: any): Promise<any>;
}