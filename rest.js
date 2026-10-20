// Realiza una petición REST con datos codificados en JSON
// Incluir en el HTML con <script src="rest.js"></script>
// uso:
// rest (metodo, url, [requestData], [callback])
// rest.metodo(url, [requestData], [callback])
// Cuando se completa la petición/respuesta se invoca callback con el estado y la respuesta: callback(status, response)
// Si no se pasa callback la petición es síncrona y retorna un objeto {status, response}

(function () {
	function debug(...args) {
		if (rest.debug) console.log("REST", ...args);
	}

	function rest(method, url, data, callback) {
		method = method.toUpperCase(); // método en mayúsculas
		if (typeof data === "function") { // no se ha indicado data, pero sí callback
			callback = data;
			data = null;
		}
		var async = typeof callback === "function"; // ¿es una petición asíncrona?
		if (data && typeof data !== "string") data = JSON.stringify(data); // datos en texto formato JSON

		// Adjuntar el token automáticamente en la URL si está definido
		if (rest.token) {
			var separador = url.indexOf("?") === -1 ? "?" : "&";
			if (url.indexOf("token=") === -1) {
				url += separador + "token=" + encodeURIComponent(rest.token);
			}
		}

		var xhr = new XMLHttpRequest();
		xhr.open(method, url, async);
		if (data) xhr.setRequestHeader("Content-type", "application/json;charset=UTF-8"); // el tipo de la petición es JSON
		debug(">>>", method, url, data);
		xhr.send(data); // Enviar datos

		function end() {
			debug("<<<", xhr.status, xhr.response);
			var response = xhr.response;
			if (xhr.status >= 200 && xhr.status < 300 && response) {
				try {
					response = JSON.parse(response);
				} catch (e) {
					// Si la respuesta no es un JSON válido, se mantiene como texto
				}
			}

			// Control de token caducado o no autorizado (por defecto código 301 o 401)
			if ((xhr.status === 301 || xhr.status === 401) && typeof rest.onUnauthorized === "function") {
				rest.onUnauthorized();
				return;
			}

			if (async) {
				callback(xhr.status, response);
			} else {
				return { status: xhr.status, response: response };
			}
		}

		if (async) {
			xhr.onload = end;
			xhr.onerror = end;
		} else {
			return end();
		}
	};

	rest.debug = false;
	rest.token = null; // Propiedad global para almacenar el token JWT

	rest.get = function (url, callback) { return rest("GET", url, callback); };
	rest.post = function (url, data, callback) { return rest("POST", url, data, callback); };
	rest.put = function (url, data, callback) { return rest("PUT", url, data, callback); };
	rest.delete = function (url, callback) { return rest("DELETE", url, callback); };

	window.rest = rest;
})();