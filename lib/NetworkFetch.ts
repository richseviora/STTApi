// an implemention of NetworkInterface using the native browser fetch functionality
import { NetworkInterface } from "./NetworkInterface";
import 'url-search-params-polyfill';
import CONFIG from "./CONFIG";

export class NetworkFetch implements NetworkInterface {
	post(uri: string, form: any, bearerToken: string | undefined = undefined, getjson: boolean = true): Promise<any> {
		let searchParams: URLSearchParams = new URLSearchParams();
		for (const prop of Object.keys(form)) {
			searchParams.set(prop, form[prop]);
		}

		let headers: any = {
			"Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
		};

		if (bearerToken !== undefined) {
			headers.Authorization = "Bearer " + btoa(bearerToken);
		}

		let promiseFetch = window.fetch(uri, {
			method: "post",
			headers: headers,
			body: searchParams
		});

		if (getjson) {
			return promiseFetch.then((response: Response) => response.json());
		} else {
			return promiseFetch.then((response: Response) => response.text());
		}
	}

	get(uri: string, qs: any): Promise<any> {
		let searchParams: URLSearchParams = new URLSearchParams();
		for (const prop of Object.keys(qs)) {
			if (Array.isArray(qs[prop])) {
				qs[prop].forEach((entry: any): void => {
					searchParams.append(prop + '[]', entry);
				});
			}
			else {
				searchParams.set(prop, qs[prop]);
			}
		}

		return window.fetch(uri + "?" + searchParams.toString()).then((response: Response) => response.json());
	}

	getRaw(uri: string, qs: any): Promise<any> {
		// TODO: this should not be in here (networkfetch should be agnostic of its callers)
		let headers: any = {
			'Origin': CONFIG.URL_SERVER,
			'Referer': CONFIG.URL_SERVER,
			'Accept': '*/*',
			'Accept-Encoding': 'gzip, deflate, br'
		};

		return window.fetch(uri, {
			method: "get",
			headers: headers
		}).then((response: Response) => {
			if (response && response.ok && response.body) {
				var reader = response.body.getReader();
				let buffers: Buffer[] = [];
				let getAllData = (): Promise<any> => {
					return reader.read().then(function (result) {
						if (!result.done) {
							buffers.push(new Buffer(result.value));
							return getAllData();
						}

						return Promise.resolve(Buffer.concat(buffers));
					});
				}

				return getAllData();
			}

			return Promise.reject("Fail loading data");
		});
	}
}