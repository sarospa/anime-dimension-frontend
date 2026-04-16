baseURL = "https://anime-dimension-production.up.railway.app"

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(uri, tries = 10) {
	function onError(err) {
		triesLeft = tries - 1;
		if(!triesLeft){
			throw err;
		}
		return sleep(1000).then(() => fetchWithRetry(uri, triesLeft));
	}
    return fetch(uri).catch(onError);
}