// rest.get(url, callback)
// rest.post(url, body, callback)
// rest.put(url, body, callback)
// rest.delete(url, callback)
// function callback(estado, respuesta) {...}
var ip = "192.168.1.36";
var ruta_raiz = "http://" + ip + ":3000";

var login = document.getElementById("login");
var registro = document.getElementById("registro");
var main = document.getElementById("main");
var detalleRecurso = document.getElementById("detalleRecurso");
var actual = login;
var anterior = login;
var id_gestor = null;
var gestorDatos = null;
var id_recurso = null;
var conexion = null;

var categoriaArray = [];

var modeloArray = [];
var areasArray = [];

var ubicacionArray = [];
// modeloCategoriaArray[idModelo] = idCategoria, para poder pintar la
// categoría de un recurso a partir de su modelo
/*var modeloCategoriaArray = [
    "",
    1, // Ecógrafo Doppler SonoScan v4       -> Ecógrafos
    2, // Pulsioxímetro SatuMax 200          -> Pulsioxímetros
    3, // Bomba de Infusión Continua FlowMaster -> Bombas de infusión
    1  // Ecógrafo Portátil PocketView       -> Ecógrafos
];*/


var estadoArray = [
    "Operativo",
    "De baja",
    "En mantenimiento"
];
// JWT: si el servidor responde 401 (token caducado o no válido) se avisa y se vuelve al login
rest.onUnauthorized = function () {
    alert("Tu sesión ha caducado. Inicia sesión de nuevo.");
    cerrarSesion();
};

function cambiarVista(vistaNueva) {
    actual.classList.remove("activa");
    actual.classList.add("inactiva");
    anterior = actual;
    actual = vistaNueva;
    actual.classList.remove("inactiva");
    actual.classList.add("activa");
}
function obtenercategoriaId(id) {
    for (var i = 0; i < categoriaArray.length; i++) {
        if (categoriaArray[i].id == id) {
            return categoriaArray[i];
        }
    }
    return null;
}
function obtenerareaId(id) {
    for (var i = 0; i < areasArray.length; i++) {
        if (areasArray[i].id == id) {
            return areasArray[i];
        }
    }
    return null;
}
function obtenerModeloId(id) {
    for (var i = 0; i < modeloArray.length; i++) {
        if (modeloArray[i].id == id) {
            return modeloArray[i];
        }
    }
    return null;
}
function obtenerUbicacionId(id) {
    for (var i = 0; i < ubicacionArray.length; i++) {
        if (ubicacionArray[i].id == id) {
            return ubicacionArray[i];
        }
    }
    return null;
}
function obtenerCategoriaIdPorModelo(idModelo) {

    for (var i = 0; i < modeloArray.length; i++) {
        if (modeloArray[i].id == idModelo) {
            return modeloArray[i].categoria;
        }
    }
    console.log(modeloArray)
    console.log(idModelo)
    return null;
}
function actualizarBuscar(datos) {

    // console.log(datos)
    if (!datos) {
        console.log("reseteo")
        categoriaArray = [];
        modeloArray = [];
        ubicacionArray = [];

        rest.get("/api/categorias", function (estado, categorias) {
            var optionCategorias = "<option value=\"\">Todas</option>";
            for (var i = 0; i < categorias.length; i++) {
                optionCategorias += "<option value=\"" + categorias[i].id + "\">" + categorias[i].nombre + "</option>";
                categoriaArray.push(categorias[i]);
            }
            document.getElementById("categoriaSelect").innerHTML = optionCategorias;
            rest.get("/api/modelos", function (estado, modelos) {

                var optionModelos = "<option value=\"\">Todas</option>";
                for (var i = 0; i < modelos.length; i++) {
                    optionModelos += "<option value=\"" + modelos[i].id + "\">" + modelos[i].nombre + "</option>";
                    modeloArray.push(modelos[i]);
                }
                document.getElementById("modeloSelect").innerHTML = optionModelos;

                rest.get("/api/ubicaciones", function (estado, ubicaciones) {
                    var optionUbicaciones = "<option value=\"\">Todas</option>";
                    for (var i = 0; i < ubicaciones.length; i++) {
                        optionUbicaciones += "<option value=\"" + ubicaciones[i].id + "\">" + ubicaciones[i].nombre + "</option>";
                        ubicacionArray.push(ubicaciones[i]);
                    }
                    document.getElementById("ubicacionSelect").innerHTML = optionUbicaciones;

                    actualizarRecursos(null);

                })
            })

        })
    } else {



        if (document.getElementById("categoriaSelect").value != "") {
            for (var i = 0; i < modeloArray.length; i++) {

                if (obtenerCategoriaIdPorModelo(modeloArray[i].id) == document.getElementById("categoriaSelect").value) {
                    optionModelos += "<option value=\"" + modeloArray[i].id + "\">" + modeloArray[i].nombre + "</option>";
                }

            }
            document.getElementById("modeloSelect").innerHTML = optionModelos;
            document.getElementById("modeloSelect").value = document.getElementById("modeloSelect").options[0].value;
        } else {
            var optionModelos = "<option value=\"\">Todas</option>";
            for (var i = 0; i < modeloArray.length; i++) {

                optionModelos += "<option value=\"" + modeloArray[i].id + "\">" + modeloArray[i].nombre + "</option>";


            }
            document.getElementById("modeloSelect").innerHTML = optionModelos;
            document.getElementById("modeloSelect").value = document.getElementById("modeloSelect").options[0].value;

        }
        cambiarVista(main);



    }


}
function actualizarPantallaPrincipal() {

    rest.get("/api/gestores/" + id_gestor, function (estado, gestor) {
        if (estado != 200) {
            alert(gestor);
            cerrarSesion();
            return

        } else {
            gestorDatos = gestor;
            document.getElementById("nombreGestor").innerHTML = gestorDatos.nombre + " " + gestorDatos.apellidos;

            actualizarBuscar(null);
            cargarRanking();
        }

    })

}
function entrar() {

    var user = document.getElementById("user").value
    var contra = document.getElementById("contra").value

    console.log("Usuario:", user, "Contraseña:", contra);

    rest.post("/api/gestores/login", { user: user, contra: contra }, function (estado, respuesta) {
        console.log("Estado:", estado, "Respuesta:", respuesta);
        if (estado != 200) {
            alert(respuesta);
            return;
        } else {
            id_gestor = parseInt(respuesta.id);
            rest.token = respuesta.token;

            document.getElementById("user").value = "";
            document.getElementById("contra").value = "";

            actualizarPantallaPrincipal();
            conexion = new WebSocket("ws://localhost:4444", "conexion");


            conexion.addEventListener("open", function () {
                console.log("Conexión WebSocket abierta");
                conexion.send(JSON.stringify({
                    operacion: "gestor",
                    id: id_gestor
                }));
            });

            conexion.addEventListener("message", function (msg) {
                msg = JSON.parse(msg.data);
                switch (msg.operacion) {
                    case "resenyas": // 
                        var tablaAvisos = document.getElementById("avisosGestor");
                        tablaAvisos.getElementsByClassName("tabla-body")[0].innerHTML +=
                            "<div class=\"tabla-row\"  style='background-color:" + msg.color + "'>" +
                            "<div data-label=\"Fecha\">" + msg.fecha + "</div>" +
                            "<div data-label=\"Origen\">" + msg.origen + "</div>" +
                            "<div data-label=\"Texto\">" + msg.texto + "</div></div>";
                        break;

                }

            })

            conexion.addEventListener("error", function (err) {
                console.error("Error en WebSocket:", err);
            });

            conexion.addEventListener("close", function (event) {
                console.log("WebSocket cerrado. Código:", event.code, "Razón:", event.reason);
            });

        }

    });

}

function mostrarEditarDatos() {
    document.getElementById("nameEditarDatos").value = gestorDatos.nombre;
    document.getElementById("apeEditarDatos").value = gestorDatos.apellidos;
    document.getElementById("userNuevoEditarDatos").value = gestorDatos.usuario;
    //document.getElementById("contraNuevaEditarDatos").value = sanitarioDatos.password;

    cambiarVista(editarDatos);
}

function actualizarDatosGestor() {
    var datos = {
        "nombre": document.getElementById("nameEditarDatos").value,
        "apellidos": document.getElementById("apeEditarDatos").value,
        "usuario": document.getElementById("userNuevoEditarDatos").value,
        "password": document.getElementById("contraNuevaEditarDatos").value
    }
    rest.put("/api/gestores/" + id_gestor, datos, function (estado, respuesta) {
        console.log("Estado:", estado, "Respuesta:", respuesta);
        if (estado != 200) {
            alert(respuesta);
            return;
        } else {
            alert("Usuario actualizado correctamente");
            document.getElementById("nameEditarDatos").value = "";
            document.getElementById("apeEditarDatos").value = "";
            document.getElementById("userNuevoEditarDatos").value = "";
            document.getElementById("contraNuevaEditarDatos").value = "";
            actualizarPantallaPrincipal();
        }
    })

}
function registrar() {
    cambiarVista(registro);
}

function cancelarReg() {
    if (anterior == login) {
        document.getElementById("user").value = "";
        document.getElementById("contra").value = "";
        cambiarVista(login);
    } else {
        actualizarPantallaPrincipal()
    }
}

function cerrarSesion() {
    rest.token = null; // JWT: al cerrar sesión se descarta el token
    id_gestor = null;
    gestorDatos = null;
    id_recurso = null;
    conexion = null;

    categoriaArray = [];

    modeloArray = [];
    areasArray = [];

    ubicacionArray = [];
    conexion.close();
    var tablaAvisos = document.getElementById("avisosGestor");
    tablaAvisos.getElementsByClassName("tabla-body")[0].innerHTML = "";
    cambiarVista(login);
}

function actualizarRecursos(filtros) {
    var url = "/api/recursos";
    if (filtros != null) {
        url += filtros;
    }

    rest.get(url, function (estado, respuesta) {
        console.log("Estado:", estado, "Recursos:", respuesta);
        if (estado != 200) {
            alert("Error cargando los recursos");
            return;
        }
        var tabla = document.getElementById("tablaRecursos");
        tabla.getElementsByClassName("tabla-body")[0].innerHTML = "";
        for (var i = 0; i < respuesta.length; i++) {
            var idCategoria = obtenerCategoriaIdPorModelo(respuesta[i].modelo);
            console.log(idCategoria)
            tabla.getElementsByClassName("tabla-body")[0].innerHTML += "<div class=\"tabla-row\" ><div data-label=\"Número de serie\">" + respuesta[i].numero_serie + "</div><div data-label=\"Categoría\">" + obtenercategoriaId(idCategoria).nombre + "</div><div data-label=\"Modelo\">" + obtenerModeloId(respuesta[i].modelo).nombre + "</div><div data-label=\"Ubicación\">" + obtenerUbicacionId(respuesta[i].ubicacion).nombre + "</div><div data-label=\"Estado\">" + estadoArray[respuesta[i].estado] + "</div><div>" + "<button onclick='abrir(" + respuesta[i].id + ")'>Abrir</button> <button onclick='borrar(" + respuesta[i].id + ")'>X</button></div></div>";
        }
        cambiarVista(main);

    });
}

function buscar() {
    var cate = document.getElementById("categoriaSelect").value;
    var mod = document.getElementById("modeloSelect").value;
    var ubi = document.getElementById("ubicacionSelect").value;
    var est = document.getElementById("estadoSelect").value;

    var filtros = "?";
    if (cate != "") {
        filtros += "categoria=" + cate + "&";
    }
    if (mod != "") {
        filtros += "modelo=" + mod + "&";
    }
    if (ubi != "") {
        filtros += "ubicacion=" + ubi + "&";
    }
    if (est != "") {
        filtros += "estado=" + est + "&";
    }
    console.log("Filtros:", filtros);
    actualizarRecursos(filtros);
}

function guardar() {
    var datos = {
        nombre: document.getElementById("name").value,
        apellidos: document.getElementById("ape").value,
        usuario: document.getElementById("userNuevo").value,
        password: document.getElementById("contraNueva").value
    };




    rest.post("/api/gestores", datos, function (estado, respuesta) {
        alert(respuesta);
        if (estado == 201) {
            document.getElementById("name").value = "";
            document.getElementById("ape").value = "";
            document.getElementById("userNuevo").value = "";
            document.getElementById("contraNueva").value = "";
            alert("Usuario creado correctamente")
            cambiarVista(login);
        } else {
            alert(respuesta)
            return;
        }
    })

}

function abrir(idRecurso) {
    id_recurso = idRecurso;

    rest.get("/api/recursos/" + idRecurso, function (estado, respuestaRecurso) {
        if (estado == 200) {
            respuestaRecurso.categoria = obtenerCategoriaIdPorModelo(respuestaRecurso.modelo);
            actualizarSelectsRecurso(respuestaRecurso);
            document.getElementById("detalleNumeroSerie").value = respuestaRecurso.numero_serie;
            document.getElementById("detalleEstado").value = respuestaRecurso.estado;
        }
    });

    actualizarReservas(idRecurso);
    actualizarResenyas(idRecurso);
    cambiarVista(detalleRecurso);
}

function borrar(id) {
    rest.delete("/api/recursos/" + id, function (estado, respuesta) {
        alert(respuesta);
    });
    actualizarRecursos(null);
}

function añadirRecurso() {
    document.getElementById("detalleCategoria").value = "";
    document.getElementById("detalleModelo").value = "";
    document.getElementById("detalleNumeroSerie").value = "";
    document.getElementById("detalleUbicacion").value = "";
    document.getElementById("detalleEstado").value = "";
    actualizarSelectsRecurso();
}

function actualizarSelectsRecurso(datos) {
    console.log("entra")
    console.log(datos)
    var select = document.getElementById("detalleCategoria");
    if (datos && datos != 'recargar' || !datos) {

        select.innerHTML = "";
        for (var i = 0; i < categoriaArray.length; i++) {
            select.innerHTML += "<option value='" + categoriaArray[i].id + "'>" + categoriaArray[i].nombre + "</option>";
        }
    }
    // datos si se llama desde abrir, null si desde añadirRecurso
    if (datos && datos != 'recargar') {
        select.value = datos.categoria;
    } else if (!datos) {
        select.value = select.options[0].value;
    }



    var select = document.getElementById("detalleModelo");
    select.innerHTML = "";
    for (var i = 0; i < modeloArray.length; i++) {
        if (document.getElementById("detalleCategoria").value == modeloArray[i].categoria) {
            select.innerHTML += "<option value='" + modeloArray[i].id + "'>" + modeloArray[i].nombre + "</option>";

        }
    }
    if (datos && datos != 'recargar') {
        select.value = datos.modelo;
    } else {
        select.value = select.options[0].value;
    }

    var select = document.getElementById("detalleUbicacion");
    select.innerHTML = "";
    for (var i = 0; i < ubicacionArray.length; i++) {
        select.innerHTML += "<option value='" + ubicacionArray[i].id + "'>" + ubicacionArray[i].nombre + "</option>";
    }
    if (datos && datos != 'recargar') {
        select.value = datos.ubicacion;
    } else {
        select.value = select.options[0].value;
    }

    var select = document.getElementById("detalleEstado");
    if (datos && datos != 'recargar') {
        select.value = datos.estado;
    } else {
        select.value = select.options[0].value;
    }
    cambiarVista(detalleRecurso);


}

function volverListado() {
    var tabla = document.getElementById("tablaReservas");
    tabla.getElementsByClassName("tabla-body")[0].innerHTML = "";

    var tabla = document.getElementById("tablaResenyas");
    tabla.getElementsByClassName("tabla-body")[0].innerHTML = "";

    id_recurso = null;
    console.log("Volviendo al listado. ID recurso:", id_recurso);
    actualizarPantallaPrincipal()
}

function guardarRecurso() {
    var datos = {
        categoria: document.getElementById("detalleCategoria").value,
        modelo: document.getElementById("detalleModelo").value,
        numero_serie: document.getElementById("detalleNumeroSerie").value,
        ubicacion: document.getElementById("detalleUbicacion").value,
        estado: document.getElementById("detalleEstado").value
    };
    console.log("Datos del nuevo recurso:", datos);

    var entero = true;
    for (var clave in datos) {
        if (datos[clave] == "") {
            entero = false;
            break;
        }
    }
    console.log("¿Datos completos?", entero, "ID recurso:", id_recurso);
    if (entero && id_recurso == null) {
        rest.post("/api/recursos", datos, function (estado, respuesta) {
            alert(respuesta);
            if (estado == 201) {
                conexion.send(JSON.stringify({
                    operacion: "recursos",
                    datos: datos,
                    idGestor: id_gestor
                }));
                volverListado();
            }
        });
    } else {
        if (id_recurso == null) {
            alert("Rellena todos los campos!");
            return;
        }
        rest.put("/api/recursos/" + id_recurso, datos, function (estado, respuesta) {
            alert(respuesta);
        });
        id_recurso = null;
        volverListado();
    }
}

function actualizarReservas(id_rec) {
    rest.get("/api/recursos/" + id_rec + "/reservas", function (estado, respuesta) {
        var tabla = document.getElementById("tablaReservas");
        tabla.getElementsByClassName("tabla-body")[0].innerHTML = "";
        for (let i = 0; i < respuesta.length; i++) {
            let color = cogerColor(respuesta[i].horas_estimadas, respuesta[i].fecha_peticion, respuesta[i].fecha_inicio, respuesta[i].fecha_fin);
            let sanitario = respuesta[i].sanitario;
            let horas = respuesta[i].horas_estimadas;
            let fpet = respuesta[i].fecha_peticion ? new Date(respuesta[i].fecha_peticion).toLocaleString('es-ES') : "";
            let fi = respuesta[i].fecha_inicio ? new Date(respuesta[i].fecha_inicio).toLocaleString('es-ES') : "";
            let ff = respuesta[i].fecha_fin ? new Date(respuesta[i].fecha_fin).toLocaleString('es-ES') : "";

            rest.get("/api/sanitarios/" + sanitario, function (estado, respuestaSanitario) {
                if (estado == 200) {
                    var nombre_sanitario = respuestaSanitario.nombre + " " + respuestaSanitario.apellidos;
                } else {
                    console.log("Error cargando datos del sanitario con id " + sanitario);
                }

                tabla.getElementsByClassName("tabla-body")[0].innerHTML += '<div class=\"tabla-row\"  class="' + color + '"> <div data-label=\"Nombre sanitario\">' + nombre_sanitario + '</div><div data-label=\"Texto\">' + horas + '</div><div data-label=\"Fecha petición\">' + fpet + '</div><div data-label=\"Fecha inicio\">' + fi + '</div><div data-label=\"Fecha fin\">' + ff + '</div></div>';
            });

        }
    });
}

function actualizarResenyas(id_rec) {
    rest.get("/api/recursos/" + id_rec + "/resenyas", function (estado, respuesta) {
        var tabla = document.getElementById("tablaResenyas");
        tabla.getElementsByClassName("tabla-body")[0].innerHTML = "";

        var filas = new Array(respuesta.length);
        var pendientes = respuesta.length;

        if (pendientes === 0) return;

        for (let i = 0; i < respuesta.length; i++) {
            let id_valoracion = respuesta[i].id;
            let sanitario = respuesta[i].sanitario;
            let valoracion = respuesta[i].valor;
            let comentario = respuesta[i].descripcion;
            let fecha = respuesta[i].fecha ? new Date(respuesta[i].fecha).toLocaleString('es-ES') : "";

            rest.get("/api/sanitarios/" + sanitario, function (estado, respuestaSanitario) {
                var nombre_sanitario = estado == 200
                    ? respuestaSanitario.nombre + " " + respuestaSanitario.apellidos
                    : "Desconocido";

                filas[i] = "<div class=\"tabla-row\" ><div data-label=\"Fecha\">" + fecha + "</div><div data-label=\"Nombre sanitario\" >" + nombre_sanitario + "</div><div data-label=\"Valoración\">" + valoracion +
                    "</div><div data-label=\"Descripción\">" + comentario + "</div><div><button onclick='subirValoracion(" + id_rec + "," + id_valoracion + ")'>Subir valoración</button></div></div>";

                pendientes--;
                if (pendientes === 0) {
                    tabla.getElementsByClassName("tabla-body")[0].innerHTML = filas.join("");
                }
            });
        }
    });
}

function cogerColor(horas, fpet, fi, ff) {
    const ahora = new Date();
    fpet = fpet ? new Date(fpet) : null;
    fi = fi ? new Date(fi) : null;
    ff = ff ? new Date(ff) : null;
    let horasUsando = ((ahora - fi) / (1000 * 60 * 60)).toFixed(0);
    console.log("ff:", ff);
    if (ff) {
        console.log("blanco");
        return "blanco"
    } else if (!fi) {
        console.log("verde");
        return "verde"
    } else if (horasUsando > horas) {
        console.log("rojo");
        return "rojo"
    } else {
        console.log("azul");
        return "azul"
    }
}

function subirValoracion(id_rec, id_valoracion) {
    rest.get("/api/recursos/" + id_rec + "/resenyas/", function (estado, respuesta) {
        if (estado == 200) {
            var valoracion = respuesta.find(r => r.id == id_valoracion)
            console.log("Reseñas del recurso " + id_valoracion, valoracion.valor);
            if (valoracion.valor < 5) {
                var valor = valoracion.valor + 1;
                rest.put("/api/recursos/resenyas/" + id_valoracion, { "valor": valor }, function (estado, respuesta) {
                    console.log("Estado:", estado, "Respuesta al subir valoración:", respuesta);
                });
            }
            actualizarResenyas(id_rec);
        }
    });
}

function guardarParte() {
    var averia = document.getElementById("descripcionAveria").value;
    var datos = {
        "averia": averia,
        "gestor": id_gestor,
        "recurso": id_recurso
    }
    rest.post("/api/partes_mantenimineto", datos, function (estado, respuesta) {
        if (estado != 201) {
            alert(respuesta);
        } else {
            document.getElementById("descripcionAveria").value = "";
            alert("Se ha creado el parte correctamente");
        }

    })

}

// ===================== PRÁCTICA 3 · MINISTERIO DE SANIDAD =====================
function convertDateToStringDay(fecha) {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}
// Botón "Enviar reservas al Ministerio": el servidor envía todas las reservas realizadas, agrupadas por área médica
function enviarReservasMinisterio() {
    if (!confirm("¿Enviar al Ministerio de Sanidad todas las reservas realizadas?")) {
        return;
    }

    var ahora = new Date();

    rest.get("/api/areas/7/reservas", function (estado, reservasArea) {
        var registroDato = {
            "id_area": 7,
            "fecha": convertDateToStringDay(ahora),
            "datos": reservasArea
        }
        console.log("kjnlkalkwfkal")
        rest.post("https://undefined.ua.es/telemedicina/api/datos", registroDato, function (estado, respuesta) {
            console.log("eeeeeeeeeeeeeeeeee")
            console.log(respuesta)
            console.log(estado)
            if (estado == 201) {


                alert("Reservas registradas correctamente en el Ministerio")
                cargarRanking();
            }
        })

    })


}

// Ranking de reservas por área médica (datos del Ministerio), de mayor a menor
function cargarRanking() {
    areasArray = [];
    rest.get("/api/areas", function (estado, areas) {
        for (var i = 0; i < areas.length; i++) {
            areasArray.push(areas[i])
        }


        var cuerpo = document.getElementById("tablaRanking").getElementsByClassName("tabla-body")[0];
        // var estadoRanking = document.getElementById("estadoRanking");
        cuerpo.innerHTML = "";
        // estadoRanking.innerHTML = "Cargando ranking...";

        rest.get("https://undefined.ua.es/telemedicina/api/datos ", function (estado, respuesta) {
            if (estado != 200) {
                alert("No se pudo cargar el ranking: ");
                return;
            } else {
                if (respuesta.length == 0) {
                    estadoRanking.innerHTML = "El Ministerio todavía no tiene reservas registradas.";
                    return;
                }

                /*{
                 "1" :0,
                 "2": 0,
                 "3":0
                
                }*/
                // 1. Inicializar las 18 áreas médicas
                var areas_reservas = {};

                for (var i = 1; i <= 18; i++) {
                    areas_reservas[i] = 0;
                }

                /*{
                 "1" :41,
                 "2": 25,
                 "3": 78
                
                }*/
                // 2. Recorrer la respuesta de la API y sumar las reservas por área
                for (var i = 0; i < respuesta.length; i++) {
                    var json = respuesta[i];
                    var id_area = json.id_area;
                    var num_reservas = json.datos.length;

                    areas_reservas[id_area] += num_reservas;
                }

                /*
                [
                    [1,41],
                    [2,25],
                    [3,78]
                ]*/
                // 3. Convertir el objeto en un array de pares
                var ranking = Object.entries(areas_reservas);

                /*
                [
                    [3,78]
                    [1,41],
                    [2,25],
                    
                ]*/
                // 4. Ordenar de mayor a menor mediante el método de burbuja
                for (var i = 0; i < ranking.length - 1; i++) {
                    for (var j = 0; j < ranking.length - 1 - i; j++) {

                        if (ranking[j][1] < ranking[j + 1][1]) {
                            var aux = ranking[j];
                            ranking[j] = ranking[j + 1];
                            ranking[j + 1] = aux;
                        }
                    }
                }

                /*
               [
                   {"id_area" : 3, "total_reservas": 78},
                   {"id_area" : 1, "total_reservas": 41},
                   {"id_area" : 2, "total_reservas": 25},
                   
               ]*/
                // 5. Crear el array final de objetos
                var resultado_ordenado = [];

                for (var i = 0; i < ranking.length; i++) {
                    resultado_ordenado.push({
                        id_area: Number(ranking[i][0]),
                        total_reservas: ranking[i][1]
                    });
                }

                console.log(areas_reservas);
                estadoRanking.innerHTML = "";
                var medallas = ["🥇", "🥈", "🥉"];
                var filas = "";
                for (var i = 0; i < resultado_ordenado.length; i++) {
                    var posicion = i < 3 ? medallas[i] + " " + (i + 1) : (i + 1);
                    var area = obtenerareaId(resultado_ordenado[i].id_area);
                    console.log(area);
                    if (area == null) {
                        continue;
                    }
                    console.log(areasArray)
                    var nombre_area = area.nombre;
                    filas += "<div class=\"tabla-row\">" +
                        "<div data-label=\"#\">" + posicion + "</div>" +
                        "<div data-label=\"Área médica\">" + nombre_area + "</div>" +
                        "<div data-label=\"Reservas totales\">" + resultado_ordenado[i].total_reservas + "</div>" +
                        "</div>";
                }
                cuerpo.innerHTML = filas;
            }

        });

    })

}