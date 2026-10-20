// rest.get(url, callback)
// rest.post(url, body, callback)
// rest.put(url, body, callback)
// rest.delete(url, callback)
// function callback(estado, respuesta) {...}

//var conexion = require("./conexion_mysql.js")
var express = require("express");
var app = express();
var jwt = require('jwt-simple');
var clave = 'miSecretoMasOscuro'; // clave para codificar / decodificar el token

// 1. Importar el cliente de Supabase
const { createClient } = require('@supabase/supabase-js');

// 2. Configurar con tu URL y tu Public Key (anon key)
const supabaseUrl = 'https://dgfcjncfeudptfufxwkf.supabase.co'; 
const supabaseKey = 'sb_publishable_TCoGmWz1FlxhIn3O1OPxNw_Cudh1SdY'; 
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json());
app.use("/appCliente", express.static("cliente_rest"));

/*
var datos = require('./datos.js');
var sanitarios=datos.san
var gestores=datos.ges
var ubicaciones=datos.ubi
var categorias=datos.cat
var modelos=datos.mod
var recursos=datos.rec
var reservas=datos.reserv
var resenyas=datos.reseny

var sig_id = gestores.length + 1;
var sig_rec = recursos.length + 1;
*/
app.use("/appClienteGestor", express.static("cliente_gestor"));
app.use("/appClienteSanitario", express.static("cliente_sanitario"));
app.use(express.json());

/*
Resumen códigos:
200: Éxito
201: recurso creado
400: solicitud incorrecta --> faltan datos o formato erróneo
403: login incorrecto
404: recurso no encontrado
*/

//En este POST se ingresan en el body el user y contra del gestor y se devuelve su id, funciona como un GET
app.post("/api/gestores/login", function (req, res) {

    var user = req.body.user;
    var contra = req.body.contra;

    var sql = "SELECT * FROM gestores WHERE usuario = '" + user + "' AND password = '" + contra + "'";
    console.log(sql)
    conexion.query(sql, function (err, gestores) {
        if (err) {
            console.log("Error al realizar la select", err);
            return res.status(500).json("Error al realizar la consulta");
        } else {
            //
            if (gestores.length != 0) {
                 // Crear un token
                var contenido = { // contenido del token (se puede incluir la información que necesitemos)
                    usuario: gestores[0].id,
                    expira: Date.now() + 60 * 60 * 1000 // expira dentro de 1 hora (en ms)
                };
                var token = jwt.encode(contenido, clave);
                return res.status(200).json({ id: gestores[0].id, token: token });
            } else {
                return res.status(403).json("Login incorrecto");
            }

        }
    });

});

// Antes de este use, los servicios son públicos (no necesitan token)
// Con esta función intermedia validamos el token. Si no es correcto terminamos con un error. Si es correcto continuamos.
app.use("/api", function (req, res, next) {
    var token = req.query.token; // obtengo el token de una query de la URL: http://MI_SERVIDOR/MI_RUTA?token=XXXXXXXX
    if (!token) { // no se ha pasado un token
        res.status(301).json("No se ha encontrado token");
        return;
    }

    // Decodificar el token
    try { // capturamos el error por si el token no es correcto
        var contenidoToken = jwt.decode(token, clave); // decodificamos el token para obtener su contenido con la misma clave que se codificó
    } catch (error) {
        res.status(301).json("El token es incorrecto");
        return;
    }
    console.log("El contenido del token es:", contenidoToken);

    // Validar el token
    if (!contenidoToken || !contenidoToken.expira || !contenidoToken.usuario) { // validamos el formato del token
        res.status(301).json("El formato del token no es adecuado")
        return;
    }

    // Comprobar la fecha de expiración
    if (contenidoToken.expira < Date.now()) {
        res.status(301).json("El token ha expirado");
        return
    }
    // Todo ha ido bien. con next hago que express continue con el procesado
    next();
});
function convertirDateToString(fecha) {
    if (!(fecha instanceof Date) || isNaN(fecha)) {
        throw new Error("Parámetro inválido: se requiere un objeto Date válido.");
    }

    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0'); // Mes empieza en 0
    const dia = String(fecha.getDate()).padStart(2, '0');
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    const segundos = String(fecha.getSeconds()).padStart(2, '0');

    return `${año}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
}

app.get("/api/ubicaciones", function (req, res) {
    var sql = "SELECT * FROM ubicaciones";
    conexion.query(sql, function (err, ubicaciones) {
        if (err) {
            console.log("Error al realizar la select", err);
            return res.status(500).json("Error al realizar la consulta");
        } else {
            //console.log("Ubicaciones:", ubicaciones);
            return res.status(200).json(ubicaciones);
        }
    });

});

app.get("/api/areas", function (req, res) {
    var sql = "SELECT * FROM areas";
    conexion.query(sql, function (err, areas) {
        if (err) {
            console.log("Error al realizar la select", err);
            return res.status(500).json("Error al realizar la consulta");
        } else {
            //console.log("areas:", areas);
            return res.status(200).json(areas);
        }
    });

});

app.get("/api/areas/:id/reservas", function (req, res) {
    var id_area = req.params.id;
    var sql = "SELECT S.nombre AS nombre, S.apellidos, C.nombre AS categoria, R.horas_estimadas, R.fecha_peticion AS fec_pet, R.fecha_inicio AS fec_ini, R.fecha_fin FROM reservas R JOIN sanitarios S ON R.sanitario = S.id JOIN recursos RC ON R.recurso = RC.id JOIN modelos M ON RC.modelo = M.id JOIN categorias C ON M.categoria = C.id WHERE R.fecha_fin IS NOT NULL AND S.area = " + id_area ;
    conexion.query(sql, function (err, areas) {
        if (err) {
            console.log("Error al realizar la select", err);
            return res.status(500).json("Error al realizar la consulta");
        } else {
            //console.log("areas:", areas);
            return res.status(200).json(areas);
        }
    });

});
app.get("/api/categorias", function (req, res) {
    var sql = "SELECT * FROM categorias";
    conexion.query(sql, function (err, categorias) {
        if (err) {
            console.log("Error al realizar la select", err);
            return res.status(500).json("Error al realizar la consulta");
        } else {
            //console.log("Categorias:", categorias);
            return res.status(200).json(categorias);
        }
    });
});



app.get("/api/modelos", function (req, res) {
    var sql = "SELECT * FROM modelos";
    conexion.query(sql, function (err, modelos) {
        if (err) {
            console.log("Error al realizar la select", err);
            return res.status(500).json("Error al realizar la consulta");
        } else {
            //console.log("Modelos:", modelos);
            return res.status(200).json(modelos);
        }
    });

});



//Crear gestor 
app.post("/api/gestores", function (req, res) {
    var user = req.body.usuario;
    //comprobar si usuario existe
    var sql = "SELECT * FROM gestores WHERE usuario = '" + user + "' ";
    conexion.query(sql, function (err, gestores) {
        if (err) {
            console.log("Error al realizar la select", err);
            return res.status(500).json("Error al realizar la consulta");
        } else {

            if (gestores.length != 0) {
                return res.status(400).json("Usuario repetido");
            } else {
                var nombre = req.body.nombre;
                var apellidos = req.body.apellidos;
                var password = req.body.password;
                //creo o guardo el nuevo gestor
                var sql2 = "INSERT INTO `gestores`( `nombre`, `apellidos`, `usuario`, `password`) VALUES ('" + nombre + "','" + apellidos + "','" + user + "','" + password + "')";
                conexion.query(sql2, function (err, gestores) {
                    if (err) {
                        console.log("Error al realizar el insert", err);
                        return res.status(500).json("Error al realizar la consulta");
                    } else {
                        return res.status(201).json(gestores.insertId);
                    }
                });

            }
        }
    });

});

//Actualizar gestor
app.put("/api/gestores/:id", function (req, res) {
    var id = parseInt(req.params.id);
      var nombre = req.body.nombre;
    var apellidos = req.body.apellidos;
    var password = req.body.password;
    var usuario = req.body.usuario;
    if (!nombre || !apellidos || !usuario){
        return callback(null);
    }

    var sql = "SELECT * FROM gestores WHERE id = '" + id + "' ";
    conexion.query(sql, function (err, gestores) {
        if (err) {
            console.log("Error al realizar la select", err);
            return res.status(500).json("Error al realizar la consulta");
        } else {
            if (gestores.length == 0) {
                return res.status(404).json("Gestor no existe");
            } else {
              

                var sql2 = "SELECT * FROM gestores WHERE usuario = '" + usuario + "' AND id <> " + id;
                conexion.query(sql2, function (err, gestoresExistentes) {
                    if (err) {
                        console.log("Error al realizar la select", err);
                        return res.status(500).json("Error al realizar la consulta");
                    } else {
                        if (gestoresExistentes.length != 0) {
                            return res.status(400).json("Usuario existente");
                        } else {
                            var queryPassWord ="";
                            if(password !=""){
                                queryPassWord =",`password`='"+ password +"'";
                            }
                            //actualizar el nuevo gestor
                            var sql3 = "UPDATE `gestores` SET `nombre`='" + nombre + "',`apellidos`='" + apellidos + "',`usuario`='" + usuario + "'" + queryPassWord +" WHERE id = " + id;
                            conexion.query(sql3, function (err, gestoresActualizados) {
                                if (err) {
                                    console.log("Error al realizar la select", err);
                                    return res.status(500).json("Error al realizar la consulta");
                                } else {
                                    return res.status(200).json("Datos actualizados correctamente");
                                }
                            });
                        }
                    }
                });
            }
        }
    });

});

app.get("/api/gestores/:id", function (req, res) {
    var id = parseInt(req.params.id);
    var sql = "SELECT nombre,apellidos,usuario FROM gestores WHERE id = '" + id + "'";

    conexion.query(sql, function (err, gestores) {
        if (err) {
            console.log("Error al realizar la select", err);
            return res.status(500).json("Error al realizar la consulta");
        } else {
            if (gestores.length == 0) {
                return res.status(404).json("Gestor no existe");//[]
            }
            else {
                //console.log("Gestores:", gestores);
                return res.status(200).json(gestores[0]);//[{...}] -->{...}
            }
        }

    });
});

app.get("/api/sanitarios/:id", function (req, res) {
    var id = parseInt(req.params.id);
    var sql = "SELECT nombre,apellidos,usuario,area FROM sanitarios WHERE id = '" + id + "'";
    conexion.query(sql, function (err, sanitarios) {
        if (err) {
            console.log("Error al realizar la select", err);
            return res.status(500).json("Error al realizar la consulta");
        } else {
            if (sanitarios.length == 0) {
                return res.status(404).json("Sanitario no encontrado");
            } else {
                //console.log("Sanitarios:", sanitarios);
                return res.status(200).json(sanitarios[0]);
            }
        }
    });
});

//     recursos {
//     id: number;
//     modelo: number;
//     ubicacion: number;
//     numero_serie: string;
//     estado: number;
//TODO hacer con Pablo
app.get("/api/recursos", function (req, res) {
    
    //console.log(req.query)
    if(req.query.categoria){

    }
    var query = "";
    if(req.query.categoria){
        query = "WHERE categoria = " + req.query.categoria;
    }
    if(req.query.modelo){
      query = "WHERE id = " + req.query.modelo;
    }

    var sql = "SELECT * FROM modelos " + query;
    conexion.query(sql, function (err, modelos) {
        if (err) {
            console.log("Select no valido", err);
            return res.status(500).json("Error al realizar la consulta");
        } else {
            var queryRecurso = "";
            if(req.query.ubicacion){
                queryRecurso = "WHERE ubicacion = " + req.query.ubicacion;
            }
            if(req.query.estado){
                if(req.query.ubicacion){
                    queryRecurso += " AND estado = "  +req.query.estado;
                }else{
                    queryRecurso = "WHERE estado = " + req.query.estado;
                }
            }
            var sql2 = "SELECT * FROM recursos " + queryRecurso;
            conexion.query(sql2, function (err, recursos) {
                if (err) {
                    console.log("Select no valido", err);
                    return res.status(500).json("Error al realizar la consulta");
                } else {
                    var recursos_filtrados = [];
                    for(var i = 0; i< recursos.length; i++){
                        for(var j = 0; j< modelos.length; j++){
                            if(recursos[i].modelo == modelos[j].id){
                                recursos_filtrados.push(recursos[i]);
                            }
                        }
                        
                    }
                    //console.log("Recursos:", recursos);
                    return res.status(200).json(recursos_filtrados);
                }
            });
        }
    });
    
});



app.get("/api/recursos/:id", function (req, res) {
    var id = parseInt(req.params.id);
    var sql = "SELECT * FROM recursos WHERE id = '" + id + "'";
    conexion.query(sql, function (err, recursos) {
        if (err) {
            console.log("Select no valido", err);
            return res.status(500).json("Error al realizar la consulta");
        } else {
            if (recursos.length == 0) {
                return res.status(404).json("Recurso no encontrado");
            }
            else {
                //console.log("Recursos:", recursos);
                return res.status(200).json(recursos[0]);
            }
        }

    });
});

app.post("/api/recursos/", function (req, res) {
    //Se crea la variable que se va a comparar para saber si ya existe un recurso igual
    var num_serie = req.body.numero_serie;
    var sql = "SELECT * FROM recursos WHERE numero_serie = '" + num_serie + "'";
    conexion.query(sql, function (err, recursos) {
        if (err) {
            console.log("Select no valido", err);
            return res.status(500).json("Select no valido");
        } else {
            if (recursos.length != 0) {
                return res.status(400).json("Recurso repetido");
            }
            else {
                var modelo = parseInt(req.body.modelo);
                var estado = parseInt(req.body.estado);
                var ubicacion = parseInt(req.body.ubicacion);
                var sql2 = "INSERT INTO `recursos`(`modelo`, `ubicacion`, `numero_serie`, `estado`) VALUES (" + modelo + "," + ubicacion + ",'" + num_serie + "'," + estado + ")";
                //console.log(sql2)
                conexion.query(sql2, function (err, recursos) {
                    if (err) {
                        console.log("Insert no valido", err);
                        return res.status(500).json("Insert no valido");
                    }
                    else {
                        //console.log("Recursos:", recursos);
                        return res.status(201).json("Recurso creado");
                    }
                });
            }
        }
    })
});

app.put("/api/recursos/:id", function (req, res) {
    var id = parseInt(req.params.id);

    //1.comprobar que aquello a hacer UPDATE existe
    //2. si existe actualizo
    //3. si no existe mando mensaje de error 404

    var sql = "SELECT * FROM recursos WHERE id = " + id + "";
        conexion.query(sql, function(err, recursos) {
            if(err) {
                console.log("Recurso no encontrado", err);
                return res.status(500).json("REcurso no encontrado");
            } else {
                if (recursos.length == 0) {
                    return res.status(404).json("Recurso no encontrado");
                }
                else {
                    var numero_serie = req.body.numero_serie
                    var sql2 = "SELECT * FROM recursos WHERE numero_serie = '" + numero_serie + "' AND id <> " + id;
                    conexion.query(sql2, function (err, recursosNumeroSerie) {
                        if (err) {
                            console.log("Insert no valido", err);
                            return res.status(500).json("Insert no valido");
                        }
                        else {
                            if(recursosNumeroSerie.length != 0){
                                return res.status(400).json("Número de serie existente")
                            }else{
                                var modelo = parseInt(req.body.modelo);
                                var estado = parseInt(req.body.estado);
                                var ubicacion = parseInt(req.body.ubicacion);
                                var sql3 = "UPDATE `recursos` SET `modelo`=" + modelo +",`ubicacion`=" + ubicacion + ",`numero_serie`='" + numero_serie +"',`estado`=" + estado +" WHERE id=" + id;
                                conexion.query(sql3, function (err, recursos) {
                                    if (err) {
                                        console.log("Update no valido", err);
                                        return res.status(500).json("Update no valido");
                                    }
                                    else {
                                        //console.log("Recursos:", recursos);
                                        return res.status(200).json("Recurso actualizado correctamente");
                                    }
                                });
                            }
                        
                        }
                    });

                    
                   
                }
            }
        }
    )


});

app.delete("/api/recursos/:id", function (req, res) {
    var id = parseInt(req.params.id);

    var sql = "SELECT * FROM recursos WHERE id = '" + id + "'";
    conexion.query(sql, function (err, recursos) {
        if (err) {
            console.log("Update no valido", err);
            return res.status(500).json("Update no valido");
        }
        else {
            if(recursos.length == 0){
                return res.status(404).json("Recurso no encontrado");
            }else{
                var sql2 = "DELETE FROM `recursos` WHERE `id` = '" + id + "'";
                conexion.query(sql2, function (err, recursos) {
                    if (err) {
                        console.log("Update no valido", err);
                        return res.status(500).json("Update no valido");
                    }
                    else {
                        return res.status(200).json("Recurso eliminado correctamente");
                    }
                });
            }
        }
    });
});

app.get("/api/recursos/:id/reservas", function (req, res) {
    var id = parseInt(req.params.id);
    var sql = "SELECT * FROM `recursos` WHERE `id` = " + id;
    conexion.query(sql, function (err, recursos) {
        if (err) {
            console.log("Update no valido", err);
            return res.status(500).json("Update no valido");
        }
        else {
            if(recursos.length == 0 ){
                return res.status(404).json("Recurso no encontrado");
            }else{
                 var sql2 = "SELECT * FROM `reservas` WHERE `recurso` = " + id;
                conexion.query(sql2, function (err, reservas) {
                    if (err) {
                        console.log("Update no valido", err);
                        return res.status(500).json("Update no valido");
                    }
                    else {
                        return res.status(200).json(reservas);
                    }
                });
            }
        }
    });

   
});

app.get("/api/recursos/:id/resenyas", function (req, res) {
    var id = parseInt(req.params.id);
    var sql = "SELECT * FROM `recursos` WHERE `id` = " + id;
    conexion.query(sql, function (err, recursos) {
        if (err) {
            console.log("Update no valido", err);
            return res.status(500).json("Update no valido");
        }
        else {
            if(recursos.length == 0 ){
                return res.status(404).json("Recurso no encontrado");
            }else{

                var sql2 = "SELECT * FROM `resenyas` WHERE `recurso` = " + id;
                conexion.query(sql2, function (err, resenyas) {
                    if (err) {
                        console.log("Update no valido", err);
                        return res.status(500).json("Get no valido");
                    }
                    else {
                        return res.status(200).json(resenyas);
                    }
                });
            }
        }
    });
});

app.put("/api/recursos/resenyas/:idR", function (req, res) {
    var idR = parseInt(req.params.idR);
    var sql = "SELECT * FROM `resenyas` WHERE `id` = " + idR;
    conexion.query(sql, function (err, resenyas) {
        if (err) {
            console.log("Put no valido", err);
            return res.status(500).json("Put no valido");
        }
        else {
            if(resenyas.length == 0 ){
                return res.status(404).json("Recurso no encontrado");
            }else{ 
                var valor = req.body.valor;

                var sql2 = "UPDATE `resenyas` SET `valor`=" + valor + " WHERE id=" + idR;
                conexion.query(sql2, function (err, resenyasUPDATE) {
                    if (err) {
                        console.log("Update no valido", err);
                        return res.status(500).json("UPDATE no valido");
                    }
                    else{
                        return res.status(200).json("Reseña actualizada correctamente");
                    }
                });
            }
        }
    });
});

app.post("/api/partes_mantenimineto/", function (req, res) {
    var averia = req.body.averia;
    var recurso = req.body.recurso;
    var gestor = req.body.gestor;
    if(!averia || !recurso || ! gestor){
        return res.status(400).json("Los campos no son correctos");
    }


   //comprobar que recurso y gestor existen
   
    var sql = "SELECT * FROM recursos WHERE id = " + recurso ;
    conexion.query(sql, function (err, recursos) {
        if (err) {
            console.log("Select no valido", err);
            return res.status(500).json("Select no valido");
        } else {
            if (recursos.length == 0) {
                return res.status(404).json("Recurso no encontrado");
            }
            else {
               
                var sql2 = "SELECT * FROM gestores WHERE id = " + gestor ;
                //console.log(sql2)
                conexion.query(sql2, function (err, gestores) {
                    if (err) {
                        console.log("Insert no valido", err);
                        return res.status(500).json("Insert no valido");
                    }
                    else {
                        if(gestores.length == 0){
                            return res.status(404).json("Gestor no encontrado");
                        }else{
                            var fecha_creacion = convertirDateToString(new Date());
                            var sql3 = "INSERT INTO `partes_mantenimiento`(`fecha_creacion`, `averia`, `gestor`, `recurso`) VALUES ('"+ fecha_creacion +"','"+ averia +"',"+ gestor +","  + recurso +")";
                            conexion.query(sql3, function (err, partesInsert) {
                            if (err) {
                                console.log("Insert no valido", err);
                                return res.status(500).json("Insert no valido");
                            }
                            else {
                                return res.status(201).json(partesInsert.insertId);
                            }
                        });
                        }
                    }
                });
            }
        }
    })
});

// ===================== PRÁCTICA 3 · PARTE 1: MINISTERIO DE SANIDAD =====================
// URL del servicio del Ministerio. El enunciado trae "undefined.ua.es" como marcador: poner aquí el host real
// (también se puede indicar con la variable de entorno MINISTERIO_URL)
var MINISTERIO_URL = process.env.MINISTERIO_URL || "https://undefined.ua.es/telemedicina/api/datos";
var TIMEOUT_MINISTERIO_MS = 20000;
 
// Versión con promesas de conexion.query para poder usar async/await
function consultar(sql) {
    return new Promise(function (resolve, reject) {
        conexion.query(sql, function (err, resultado) {
            if (err) reject(err);
            else resolve(resultado);
        });
    });
}
 
// Fecha de la BD -> "YYYY-MM-DD HH:MM:SS" (null si la reserva todavía no tiene esa fecha)
function formatearFecha(fecha) {
    if (!fecha) return null;
    return convertirDateToString(new Date(fecha));
}
 
// Llamada HTTP al Ministerio: GET (sin cuerpo) o POST (cuerpo JSON)
async function llamarMinisterio(metodo, cuerpo) {
    var controlador = new AbortController();
    var temporizador = setTimeout(function () { controlador.abort(); }, TIMEOUT_MINISTERIO_MS);
    try {
        var opciones = { method: metodo, headers: { "Accept": "application/json" }, signal: controlador.signal };
        if (cuerpo !== undefined) {
            opciones.headers["Content-Type"] = "application/json";
            opciones.body = JSON.stringify(cuerpo);
        }
        var respuesta = await fetch(MINISTERIO_URL, opciones);
        var texto = await respuesta.text();
        var datos = null;
        try { datos = texto ? JSON.parse(texto) : null; } catch (e) { datos = texto; }
        return { ok: respuesta.ok, status: respuesta.status, datos: datos };
    } finally {
        clearTimeout(temporizador);
    }
}
 
// Reservas realizadas (las que ya se han retirado) con el área médica del sanitario y la categoría del recurso
var SQL_RESERVAS_REALIZADAS =
    "SELECT s.area AS id_area, s.nombre, s.apellidos, c.nombre AS categoria, " +
    "r.horas_estimadas, r.fecha_peticion, r.fecha_inicio, r.fecha_fin " +
    "FROM reservas r " +
    "JOIN sanitarios s ON s.id = r.sanitario " +
    "JOIN recursos rec ON rec.id = r.recurso " +
    "JOIN modelos m ON m.id = rec.modelo " +
    "JOIN categorias c ON c.id = m.categoria " +
    "WHERE r.fecha_inicio IS NOT NULL " +
    "ORDER BY s.area, r.id";
 
// Envía al Ministerio todas las reservas realizadas: un POST por cada área médica
app.post("/api/ministerio/enviar", async function (req, res) {
    try {
        var filas = await consultar(SQL_RESERVAS_REALIZADAS);
        if (filas.length == 0) {
            return res.status(200).json({ total: 0, enviadas: 0, areas: [], mensaje: "No hay reservas realizadas para enviar" });
        }
 
        // Agrupar las reservas por área con el formato que pide el Ministerio
        var porArea = {};
        filas.forEach(function (f) {
            if (!porArea[f.id_area]) porArea[f.id_area] = [];
            porArea[f.id_area].push({
                "nombre": f.nombre,
                "apellidos": f.apellidos,
                "categoría": f.categoria,
                "horas_estimadas": f.horas_estimadas,
                "fec_pet": formatearFecha(f.fecha_peticion),
                "fec_ini": formatearFecha(f.fecha_inicio),
                "fecha_fin": formatearFecha(f.fecha_fin)
            });
        });
 
        var hoy = convertirDateToString(new Date()).substring(0, 10); // YYYY-MM-DD
        var resumen = [];
        var fallos = 0;
        for (var idArea of Object.keys(porArea)) {
            var cuerpo = { "id_area": parseInt(idArea), "fecha": hoy, "datos": porArea[idArea] };
            try {
                var r = await llamarMinisterio("POST", cuerpo);
                resumen.push({ id_area: cuerpo.id_area, reservas: cuerpo.datos.length, enviado: r.ok, estado: r.status });
                if (!r.ok) fallos++;
            } catch (e) {
                fallos++;
                resumen.push({
                    id_area: cuerpo.id_area, reservas: cuerpo.datos.length, enviado: false, estado: 0,
                    error: e.name === "AbortError" ? "Tiempo de espera agotado" : e.message
                });
            }
        }
 
        var enviadas = resumen.filter(function (a) { return a.enviado; })
            .reduce(function (suma, a) { return suma + a.reservas; }, 0);
        return res.status(fallos == 0 ? 200 : 502).json({ total: filas.length, enviadas: enviadas, areas: resumen });
    } catch (err) {
        console.log("Error al enviar las reservas al Ministerio", err);
        return res.status(500).json("Error al enviar las reservas al Ministerio");
    }
});
 
// Cuenta cuántas reservas hay por área en lo que devuelve el GET del Ministerio.
// El enunciado no detalla el formato exacto de la respuesta, así que se aceptan las formas habituales:
//   [ { id_area, fecha, datos: [..] }, ... ]            (lista de envíos)
//   { "1": [ { fecha, datos: [..] } ], "2": [..] }       (agrupado por código de área)
function contarPorArea(datos) {
    var conteo = {};
    function sumar(idArea, cantidad) {
        if (idArea === undefined || idArea === null) return;
        conteo[idArea] = (conteo[idArea] || 0) + cantidad;
    }
    function registrosDe(item) { // un envío con "datos" cuenta tantas reservas como elementos tenga
        return item && Array.isArray(item.datos) ? item.datos.length : 1;
    }
 
    if (datos && !Array.isArray(datos) && typeof datos === "object") {
        var envoltorio = datos.datos || datos.registros || datos.resultado || datos.data;
        if (Array.isArray(envoltorio)) datos = envoltorio; // respuesta envuelta: { datos: [...] }
    }
 
    if (Array.isArray(datos)) {
        datos.forEach(function (item) {
            if (item && item.id_area !== undefined) sumar(item.id_area, registrosDe(item));
        });
    } else if (datos && typeof datos === "object") {
        Object.keys(datos).forEach(function (codigoArea) {
            var contenido = datos[codigoArea];
            if (Array.isArray(contenido)) {
                var total = 0;
                contenido.forEach(function (item) { total += registrosDe(item); });
                sumar(codigoArea, total);
            } else if (contenido && typeof contenido === "object") {
                sumar(codigoArea, registrosDe(contenido));
            }
        });
    }
    return conteo;
}
 
// Ranking de reservas por área médica, calculado con los datos del Ministerio (GET)
app.get("/api/ministerio/ranking", async function (req, res) {
    try {
        var r = await llamarMinisterio("GET");
        if (!r.ok) {
            return res.status(502).json("El Ministerio respondió con el error " + r.status);
        }
        var conteo = contarPorArea(r.datos);
        var areas = await consultar("SELECT id, nombre FROM areas");
        var nombres = {};
        areas.forEach(function (a) { nombres[a.id] = a.nombre; });
 
        var ranking = Object.keys(conteo).map(function (id) {
            return { id_area: parseInt(id), area: nombres[id] || ("Área " + id), total: conteo[id] };
        }).sort(function (a, b) { return b.total - a.total; });
 
        return res.status(200).json(ranking);
    } catch (err) {
        console.log("Error al consultar el Ministerio", err);
        var motivo = err.name === "AbortError" ? "tiempo de espera agotado" : err.message;
        return res.status(502).json("No se pudo consultar al Ministerio: " + motivo);
    }
});
 

app.listen(3000, function () {
    console.log("Servidor sanitario iniciado correctamente en el puerto 3000")
});
