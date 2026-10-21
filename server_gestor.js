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
app.use("/appClienteGestor", express.static("cliente_gestor"));
app.use("/appClienteSanitario", express.static("cliente_sanitario"));

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/cliente_gestor/index.html");
});
/*
Resumen códigos:
200: Éxito
201: recurso creado
400: solicitud incorrecta --> faltan datos o formato erróneo
403: login incorrecto
404: recurso no encontrado
*/

// En este POST se ingresan en el body el user y contra del gestor y se devuelve su id
app.post("/api/gestores/login", async function (req, res) {
    var user = req.body.user;
    var contra = req.body.contra;

    try {
        const { data: gestores, error } = await supabase
            .from('gestores')
            .select('*')
            .eq('usuario', user)
            .eq('password', contra);

        if (error) {
            console.log("Error al realizar la select", error);
            return res.status(500).json("Error al realizar la consulta");
        }

        if (gestores && gestores.length != 0) {
            var contenido = {
                usuario: gestores[0].id,
                expira: Date.now() + 60 * 60 * 1000 // expira dentro de 1 hora (en ms)
            };
            var token = jwt.encode(contenido, clave);
            return res.status(200).json({ id: gestores[0].id, token: token });
        } else {
            return res.status(403).json("Login incorrecto");
        }
    } catch (err) {
        console.log("Excepción en login", err);
        return res.status(500).json("Error interno en el servidor");
    }
});

// Antes de este use, los servicios son públicos (no necesitan token)
app.use("/api", function (req, res, next) {
    var token = req.query.token; 
    if (!token) {
        res.status(301).json("No se ha encontrado token");
        return;
    }

    try {
        var contenidoToken = jwt.decode(token, clave);
    } catch (error) {
        res.status(301).json("El token es incorrecto");
        return;
    }

    if (!contenidoToken || !contenidoToken.expira || !contenidoToken.usuario) {
        res.status(301).json("El formato del token no es adecuado");
        return;
    }

    if (contenidoToken.expira < Date.now()) {
        res.status(301).json("El token ha expirado");
        return;
    }
    next();
});

function convertirDateToString(fecha) {
    if (!(fecha instanceof Date) || isNaN(fecha)) {
        throw new Error("Parámetro inválido: se requiere un objeto Date válido.");
    }

    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    const segundos = String(fecha.getSeconds()).padStart(2, '0');

    return `${año}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
}

app.get("/api/ubicaciones", async function (req, res) {
    try {
        const { data: ubicaciones, error } = await supabase.from('ubicaciones').select('*');
        if (error) {
            console.log("Error al realizar la select", error);
            return res.status(500).json("Error al realizar la consulta");
        }
        return res.status(200).json(ubicaciones);
    } catch (err) {
        return res.status(500).json("Error interno");
    }
});

app.get("/api/areas", async function (req, res) {
    try {
        const { data: areas, error } = await supabase.from('areas').select('*');
        if (error) {
            console.log("Error al realizar la select", error);
            return res.status(500).json("Error al realizar la consulta");
        }
        return res.status(200).json(areas);
    } catch (err) {
        return res.status(500).json("Error interno");
    }
});

app.get("/api/areas/:id/reservas", async function (req, res) {
    var id_area = req.params.id;
    try {
        // Equivalente al JOIN complejo con Supabase
        const { data: reservas, error } = await supabase
            .from('reservas')
            .select(`
                horas_estimadas,
                fecha_peticion,
                fecha_inicio,
                fecha_fin,
                sanitarios!inner ( nombre, apellidos, area ),
                recursos!inner (
                    modelos!inner (
                        nombre,
                        categorias!inner ( nombre )
                    )
                )
            `)
            .not('fecha_fin', 'is', null)
            .eq('sanitarios.area', id_area);

        if (error) {
            console.log("Error al realizar la select", error);
            return res.status(500).json("Error al realizar la consulta");
        }

        // Aplanar el resultado para mantener la misma estructura que esperaba tu cliente
        var formateado = reservas.map(r => ({
            nombre: r.sanitarios.nombre,
            apellidos: r.sanitarios.apellidos,
            categoria: r.recursos.modelos.categorias.nombre,
            horas_estimadas: r.horas_estimadas,
            fec_pet: r.fecha_peticion,
            fec_ini: r.fecha_inicio,
            fecha_fin: r.fecha_fin
        }));

        return res.status(200).json(formateado);
    } catch (err) {
        console.log("Excepción", err);
        return res.status(500).json("Error interno");
    }
});

app.get("/api/categorias", async function (req, res) {
    try {
        const { data: categorias, error } = await supabase.from('categorias').select('*');
        if (error) {
            console.log("Error al realizar la select", error);
            return res.status(500).json("Error al realizar la consulta");
        }
        return res.status(200).json(categorias);
    } catch (err) {
        return res.status(500).json("Error interno");
    }
});

app.get("/api/modelos", async function (req, res) {
    try {
        const { data: modelos, error } = await supabase.from('modelos').select('*');
        if (error) {
            console.log("Error al realizar la select", error);
            return res.status(500).json("Error al realizar la consulta");
        }
        return res.status(200).json(modelos);
    } catch (err) {
        return res.status(500).json("Error interno");
    }
});

// Crear gestor 
app.post("/api/gestores", async function (req, res) {
    var user = req.body.usuario;
    try {
        const { data: gestoresExistentes, error: errSel } = await supabase
            .from('gestores')
            .select('*')
            .eq('usuario', user);

        if (errSel) {
            console.log("Error al realizar la select", errSel);
            return res.status(500).json("Error al realizar la consulta");
        }

        if (gestoresExistentes && gestoresExistentes.length != 0) {
            return res.status(400).json("Usuario repetido");
        } else {
            var nombre = req.body.nombre;
            var apellidos = req.body.apellidos;
            var password = req.body.password;

            const { data: nuevoGestor, error: errIns } = await supabase
                .from('gestores')
                .insert([{ nombre, apellidos, usuario: user, password }])
                .select();

            if (errIns) {
                console.log("Error al realizar el insert", errIns);
                return res.status(500).json("Error al realizar la consulta");
            } else {
                return res.status(201).json(nuevoGestor[0].id);
            }
        }
    } catch (err) {
        return res.status(500).json("Error interno");
    }
});

// Actualizar gestor
app.put("/api/gestores/:id", async function (req, res) {
    var id = parseInt(req.params.id);
    var nombre = req.body.nombre;
    var apellidos = req.body.apellidos;
    var password = req.body.password;
    var usuario = req.body.usuario;
    
    if (!nombre || !apellidos || !usuario){
        return res.status(400).json("Faltan datos obligatorios");
    }

    try {
        const { data: gestor, error: err1 } = await supabase.from('gestores').select('*').eq('id', id);
        if (err1 || !gestor || gestor.length == 0) {
            return res.status(404).json("Gestor no existe");
        }

        const { data: gestoresExistentes, error: err2 } = await supabase
            .from('gestores')
            .select('*')
            .eq('usuario', usuario)
            .neq('id', id);

        if (err2) return res.status(500).json("Error al realizar la consulta");

        if (gestoresExistentes && gestoresExistentes.length != 0) {
            return res.status(400).json("Usuario existente");
        }

        let updateData = { nombre, apellidos, usuario };
        if (password && password != "") {
            updateData.password = password;
        }

        const { error: err3 } = await supabase.from('gestores').update(updateData).eq('id', id);
        if (err3) {
            return res.status(500).json("Error al realizar la consulta");
        }

        return res.status(200).json("Datos actualizados correctamente");
    } catch (err) {
        return res.status(500).json("Error interno");
    }
});

app.get("/api/gestores/:id", async function (req, res) {
    var id = parseInt(req.params.id);
    try {
        const { data: gestores, error } = await supabase
            .from('gestores')
            .select('nombre, apellidos, usuario')
            .eq('id', id);

        if (error || !gestores || gestores.length == 0) {
            return res.status(404).json("Gestor no existe");
        }
        return res.status(200).json(gestores[0]);
    } catch (err) {
        return res.status(500).json("Error interno");
    }
});

app.get("/api/sanitarios/:id", async function (req, res) {
    var id = parseInt(req.params.id);
    try {
        const { data: sanitarios, error } = await supabase
            .from('sanitarios')
            .select('nombre, apellidos, usuario, area')
            .eq('id', id);

        if (error || !sanitarios || sanitarios.length == 0) {
            return res.status(404).json("Sanitario no encontrado");
        }
        return res.status(200).json(sanitarios[0]);
    } catch (err) {
        return res.status(500).json("Error interno");
    }
});

app.get("/api/recursos", async function (req, res) {
    try {
        let queryModelos = supabase.from('modelos').select('*');
        if (req.query.categoria) {
            queryModelos = queryModelos.eq('categoria', req.query.categoria);
        }
        if (req.query.modelo) {
            queryModelos = queryModelos.eq('id', req.query.modelo);
        }

        const { data: modelos, error: errMod } = await queryModelos;
        if (errMod) return res.status(500).json("Error al realizar la consulta");

        let queryRecursos = supabase.from('recursos').select('*');
        if (req.query.ubicacion) {
            queryRecursos = queryRecursos.eq('ubicacion', req.query.ubicacion);
        }
        if (req.query.estado) {
            queryRecursos = queryRecursos.eq('estado', req.query.estado);
        }

        const { data: recursos, error: errRec } = await queryRecursos;
        if (errRec) return res.status(500).json("Error al realizar la consulta");

        var recursos_filtrados = [];
        for (var i = 0; i < recursos.length; i++) {
            for (var j = 0; j < modelos.length; j++) {
                if (recursos[i].modelo == modelos[j].id) {
                    recursos_filtrados.push(recursos[i]);
                }
            }
        }
        return res.status(200).json(recursos_filtrados);
    } catch (err) {
        return res.status(500).json("Error interno");
    }
});

app.get("/api/recursos/:id", async function (req, res) {
    var id = parseInt(req.params.id);
    try {
        const { data: recursos, error } = await supabase.from('recursos').select('*').eq('id', id);
        if (error || !recursos || recursos.length == 0) {
            return res.status(404).json("Recurso no encontrado");
        }
        return res.status(200).json(recursos[0]);
    } catch (err) {
        return res.status(500).json("Error interno");
    }
});

app.post("/api/recursos/", async function (req, res) {
    var num_serie = req.body.numero_serie;
    try {
        const { data: recursos, error: err1 } = await supabase.from('recursos').select('*').eq('numero_serie', num_serie);
        if (err1) return res.status(500).json("Select no valido");

        if (recursos && recursos.length != 0) {
            return res.status(400).json("Recurso repetido");
        } else {
            var modelo = parseInt(req.body.modelo);
            var estado = parseInt(req.body.estado);
            var ubicacion = parseInt(req.body.ubicacion);

            const { error: err2 } = await supabase
                .from('recursos')
                .insert([{ modelo, ubicacion, numero_serie: num_serie, estado }]);

            if (err2) return res.status(500).json("Insert no valido");

            return res.status(201).json("Recurso creado");
        }
    } catch (err) {
        return res.status(500).json("Error interno");
    }
});

app.put("/api/recursos/:id", async function (req, res) {
    var id = parseInt(req.params.id);
    try {
        const { data: recursos, error: err1 } = await supabase.from('recursos').select('*').eq('id', id);
        if (err1 || !recursos || recursos.length == 0) {
            return res.status(404).json("Recurso no encontrado");
        }

        var numero_serie = req.body.numero_serie;
        const { data: recursosNumeroSerie, error: err2 } = await supabase
            .from('recursos')
            .select('*')
            .eq('numero_serie', numero_serie)
            .neq('id', id);

        if (err2) return res.status(500).json("Insert no valido");

        if (recursosNumeroSerie && recursosNumeroSerie.length != 0) {
            return res.status(400).json("Número de serie existente");
        } else {
            var modelo = parseInt(req.body.modelo);
            var estado = parseInt(req.body.estado);
            var ubicacion = parseInt(req.body.ubicacion);

            const { error: err3 } = await supabase
                .from('recursos')
                .update({ modelo, ubicacion, numero_serie, estado })
                .eq('id', id);

            if (err3) return res.status(500).json("Update no valido");

            return res.status(200).json("Recurso actualizado correctamente");
        }
    } catch (err) {
        return res.status(500).json("Error interno");
    }
});

app.delete("/api/recursos/:id", async function (req, res) {
    var id = parseInt(req.params.id);
    try {
        const { data: recursos, error: err1 } = await supabase.from('recursos').select('*').eq('id', id);
        if (err1 || !recursos || recursos.length == 0) {
            return res.status(404).json("Recurso no encontrado");
        }

        const { error: err2 } = await supabase.from('recursos').delete().eq('id', id);
        if (err2) return res.status(500).json("Update no valido");

        return res.status(200).json("Recurso eliminado correctamente");
    } catch (err) {
        return res.status(500).json("Error interno");
    }
});

app.get("/api/recursos/:id/reservas", async function (req, res) {
    var id = parseInt(req.params.id);
    try {
        const { data: recursos, error: err1 } = await supabase.from('recursos').select('*').eq('id', id);
        if (err1 || !recursos || recursos.length == 0) {
            return res.status(404).json("Recurso no encontrado");
        }

        const { data: reservas, error: err2 } = await supabase.from('reservas').select('*').eq('recurso', id);
        if (err2) return res.status(500).json("Update no valido");

        return res.status(200).json(reservas);
    } catch (err) {
        return res.status(500).json("Error interno");
    }
});

app.get("/api/recursos/:id/resenyas", async function (req, res) {
    var id = parseInt(req.params.id);
    try {
        const { data: recursos, error: err1 } = await supabase.from('recursos').select('*').eq('id', id);
        if (err1 || !recursos || recursos.length == 0) {
            return res.status(404).json("Recurso no encontrado");
        }

        const { data: resenyas, error: err2 } = await supabase.from('resenyas').select('*').eq('recurso', id);
        if (err2) return res.status(500).json("Get no valido");

        return res.status(200).json(resenyas);
    } catch (err) {
        return res.status(500).json("Error interno");
    }
});

app.put("/api/recursos/resenyas/:idR", async function (req, res) {
    var idR = parseInt(req.params.idR);
    try {
        const { data: resenyas, error: err1 } = await supabase.from('resenyas').select('*').eq('id', idR);
        if (err1 || !resenyas || resenyas.length == 0) {
            return res.status(404).json("Recurso no encontrado");
        }

        var valor = req.body.valor;
        const { error: err2 } = await supabase.from('resenyas').update({ valor }).eq('id', idR);
        if (err2) return res.status(500).json("UPDATE no valido");

        return res.status(200).json("Reseña actualizada correctamente");
    } catch (err) {
        return res.status(500).json("Error interno");
    }
});

app.post("/api/partes_mantenimineto/", async function (req, res) {
    var averia = req.body.averia;
    var recurso = req.body.recurso;
    var gestor = req.body.gestor;
    if (!averia || !recurso || !gestor) {
        return res.status(400).json("Los campos no son correctos");
    }

    try {
        const { data: recursos, error: err1 } = await supabase.from('recursos').select('*').eq('id', recurso);
        if (err1 || !recursos || recursos.length == 0) {
            return res.status(404).json("Recurso no encontrado");
        }

        const { data: gestores, error: err2 } = await supabase.from('gestores').select('*').eq('id', gestor);
        if (err2 || !gestores || gestores.length == 0) {
            return res.status(404).json("Gestor no encontrado");
        }

        var fecha_creacion = convertirDateToString(new Date());
        const { data: partesInsert, error: err3 } = await supabase
            .from('partes_mantenimiento')
            .insert([{ fecha_creacion, averia, gestor, recurso }])
            .select();

        if (err3) return res.status(500).json("Insert no valido");

        return res.status(201).json(partesInsert[0].id);
    } catch (err) {
        return res.status(500).json("Error interno");
    }
});

// ===================== PRÁCTICA 3 · PARTE 1: MINISTERIO DE SANIDAD =====================
var MINISTERIO_URL = process.env.MINISTERIO_URL || "https://undefined.ua.es/telemedicina/api/datos";
var TIMEOUT_MINISTERIO_MS = 20000;

function formatearFecha(fecha) {
    if (!fecha) return null;
    return convertirDateToString(new Date(fecha));
}

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

app.post("/api/ministerio/enviar", async function (req, res) {
    try {
        const { data: filas, error } = await supabase
            .from('reservas')
            .select(`
                id,
                horas_estimadas,
                fecha_peticion,
                fecha_inicio,
                fecha_fin,
                sanitarios!inner ( area, nombre, apellidos ),
                recursos!inner (
                    modelos!inner (
                        categorias!inner ( nombre )
                    )
                )
            `)
            .not('fecha_inicio', 'is', null)
            .order('sanitarios(area)');

        if (error || !filas || filas.length == 0) {
            return res.status(200).json({ total: 0, enviadas: 0, areas: [], mensaje: "No hay reservas realizadas para enviar" });
        }

        var porArea = {};
        filas.forEach(function (f) {
            var id_area = f.sanitarios.area;
            if (!porArea[id_area]) porArea[id_area] = [];
            porArea[id_area].push({
                "nombre": f.sanitarios.nombre,
                "apellidos": f.sanitarios.apellidos,
                "categoría": f.recursos.modelos.categorias.nombre,
                "horas_estimadas": f.horas_estimadas,
                "fec_pet": formatearFecha(f.fecha_peticion),
                "fec_ini": formatearFecha(f.fecha_inicio),
                "fecha_fin": formatearFecha(f.fecha_fin)
            });
        });

        var hoy = convertirDateToString(new Date()).substring(0, 10);
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

// Puerto de escucha para Render
var PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    console.log("Servidor sanitario iniciado correctamente en el puerto " + PORT);
});
