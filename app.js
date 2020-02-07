var nomnoml = require('nomnoml');

//objetos HTML
var code = document.getElementById("codeArea");
var output = document.getElementById("output");
var filas = document.getElementById("idFilas");
var canvas = document.getElementById('canvas');
var btn = document.getElementById('button');

//event listener
code.addEventListener('keydown', autosize);
code.addEventListener('input', codeChange);
btn.addEventListener('click', analizarCodigo);

//variables
var numberOfLines;
var lines = [];
var linesCode;
var contenidoDiagrama = [];
var errores = [];

//Expreciones regulares
const clase = /^Clase\s+/
const claseNombre = /^[A-Z][A-Za-z_]*\s*$/
const keyWord = /^<{2}[a-z]([a-z]|,\s*[a-z])*>{2}\s*$/
const relacion = /^[A-Z]+\s+[A-Z][A-Za-z_]*\s+->/
const relacionTipo = /^(ASOCIACION|HERENCIA|AGREGACION|COMPOSICION|DEPENDENCIA|REALIZACION)/
const relacionClases = /^[A-Z]+\s+[A-Z][A-Za-z_]*\s+->\s+[A-Z][A-Za-z_]*(\s+(\(\s*[A-Z][A-Z_]*\s*,\s*[A-Z][A-Z_]*\s*\)\s*(\s<{2}[a-z](,\s*[a-z]|[a-z])*>{2}|)|<{2}[a-z](,\s*[a-z]|[a-z])*>{2})|)\s*$/
const atributo = /^Atributos\s+[A-Z][A-Za-z]*\s+{$/
const declaraAtributo = /^\s*[a-z]+\s+[A-Za-z]+\s+[A-Za-z][0-9A-Za-z_]*\s*(,|)s*/
const cierreBloque = /^}$/
const modificadorAccesoValido = /publico|privado|protegido|paquete|derivado|estático/
const metodo = /^Metodos\s+[A-Z][A-Za-z]*\s+{$/
const declaraMetodo = /[a-z]+\s+[A-Za-z]+\s+[A-Za-z_]+(\s+\(\s*[A-Za-z]+\s+[A-Za-z]+(,\s*[A-Za-z]+\s+[A-Za-z]+)*(\s(\s|,\s*[A-Za-z]+\s+[A-Za-z]+)*|)\)|)\s*(,|)/
const bloqueMetodo = /^{(\s|[a-z]+\s+[A-Za-z]+\s+[A-Za-z_]+(\s+\(\s*[A-Za-z]+\s+[A-Za-z]+(,\s*[A-Za-z]+\s+[A-Za-z]+)*(\s(\s|,\s*[A-Za-z]+\s+[A-Za-z]+)*|)\)|)\s*,)*}$/
const espacio = /\s+/g
const abrirParentesis = /\(/g

//se activa cada que se detecta un cambio en el textarea
//se calcula el numero de final que hay en el texto encontrado en cada uno el salto de linea y contando el numero de saltos encontrados
function codeChange(){
    if(code.value.match(/\n/g) != null) numberOfLines = code.value.match(/\n/g).length + 1;
    else numberOfLines = 1
    enumerarFilas();
}

//enumera las filas de el codigo en el text area tomando el valor de numberOfLines
function enumerarFilas(){
    lines = [];
    for (let f = 0; f < numberOfLines; f++) {
        lines.push(f+1);
    }
    pintarFilas();
}

//pinta los numero de las filas del codigo en el div lateral izquierdo
function pintarFilas() {
    filas.innerHTML = '';
    for (let f = 0; f < lines.length; f++) {
        filas.innerHTML += `<span>${lines[f]}</span><br/>`
    }
}

//haciendo uso de expreciones regulares busca errores linea por linea en el codigo
function analizarCodigo() {
    errores = [];
    contenidoDiagrama = [];
    linesCode = code.value.split('\n');
    for (let i = 0; i < linesCode.length; i++) {
        let cadena = linesCode[i];
        if (clase.test(cadena)){
            cadena = cadena.replace(/\s*,\s*/,',')
            cadena = cadena.split(espacio)
            if(claseNombre.test(cadena[1])){
                if (keyWord.test(cadena[2]) || cadena[2] == undefined){
                    if(cadena.length >= 3) cadena[2] = cadena[2].replace('<<','').replace('>>','').split(',')
                    else cadena.push([])
                    contenidoDiagrama.push({nombreClase: cadena[1], atributos: [], metodos: [], relaciones: [], keyWord: cadena[2]})
                }
                else errores.push({text: `Error de sintaxis de clase - linea ${i+1}`, color: 'danger'})
            } 
            else errores.push({text: `Nombre de clase no valido - linea ${i+1}`, color: 'danger'})
        }
        else if (relacion.test(cadena)){
            let tipoRelacion = null
            if(relacionTipo.test(cadena)){
                if(relacionClases.test(cadena)){
                    let claseRelacion = [], cardinalidad = [], tipoRelacion = null, kw = []
                    cadena = cadena.replace(/\s*,\s*/,',')
                    tipoRelacion = cadena.split(espacio)
                    claseRelacion.push(tipoRelacion[1])
                    claseRelacion.push(tipoRelacion[3])
                    tipoRelacion = tipoRelacion[0]
                    if (cadena.search(/\(/) >= 0){
                        cadena = cadena.split(/\(/)
                        cadena = cadena[1].split(/\)/)
                        cadena[0] = cadena[0].replace(/\(/,'').replace(/\)/,'')
                        cadena[0] = cadena[0].split(',')
                        cardinalidad.push(cadena[0][0])
                        cardinalidad.push(cadena[0][1])
                        cadena = cadena[1]
                    }
                    if (cadena.search(/</) >= 0){
                        cadena = cadena.split(/</)[2]
                        cadena = cadena.replace(/>>/,'')
                        //if(cadena.search(/,/)) kw.push(cadena)
                        //else{
                            cadena = cadena.split(',') 
                            for (let i = 0; i < cadena.length; i++) {
                                const element = cadena[i];
                                kw.push(element)
                            }
                        //}
                    }
                    claseRelacion[0] = contenidoDiagrama.find(diagrama =>  diagrama.nombreClase == claseRelacion[0]);
                    claseRelacion[1] = contenidoDiagrama.find(diagrama =>  diagrama.nombreClase == claseRelacion[1]);
                    if(claseRelacion[0] == undefined || claseRelacion[1] == undefined) errores.push({text: `La clase no ha sido definida - linea ${i+1}`, color: 'danger'})
                    else{
                        claseRelacion[0].relaciones.push({claseRelacionada: claseRelacion[1].nombreClase, tipoRelacion: tipoRelacion, cardinalidad: cardinalidad, keyWord: kw})
                    }
                }
                else{
                    errores.push({text: `Error de sintaxis - declaracion de relacion - linea ${i+1}`, color: 'danger'})
                }
            }
            else errores.push({text: `${tipoRelacion} no es un tipo de relacion - linea ${i+1}`, color: 'danger'})
        }
        else if (atributo.test(cadena)){
            let clase = cadena.split(espacio)[1]
            let cadenaAtributo
            clase = contenidoDiagrama.find(diagrama =>  diagrama.nombreClase == clase);
            if(clase != undefined){
                let estaBloqueCerrado = false
                while(!estaBloqueCerrado){
                    i++;
                    cadena = linesCode[i];
                    cadena.replace(',','');
                    if(declaraAtributo.test(cadena)){
                        cadenaAtributo = cadena.split(espacio)
                        cadenaAtributo.shift()
                        if(modificadorAccesoValido.test(cadenaAtributo[0])){
                            clase.atributos.push({modificadorAcceso: cadenaAtributo[0], tipoAtributo: cadenaAtributo[1], nombreAtributo: cadenaAtributo[2]})
                        }
                        else{
                            errores.push({text: `Modificador de acceso no valido - linea ${i+1}`, color: 'danger'})
                        }
                    }
                    else if (cierreBloque.test(cadena)){
                        estaBloqueCerrado = true
                    }
                    else if (cadena.replace(espacio,'') == ""){
                        i++;
                    }
                    else{
                        errores.push({text: `error de sintaxis - declaracion de atributo - linea ${i+1}`, color: 'danger'})
                    }
                }
            }
            else{
                errores.push({text: `${cadena.split(espacio)[1]} no es una clase - linea ${i+1}`, color: 'danger'})
            }
        }
        else if (metodo.test(cadena)){
            let clase = cadena.split(espacio)[1]
            let cadenaMetodo
            clase = contenidoDiagrama.find(diagrama =>  diagrama.nombreClase == clase);
            if(clase != undefined){
                let estaBloqueCerrado = false
                let parametros
                while(!estaBloqueCerrado){
                    i++;
                    cadena = linesCode[i];
                    if(declaraMetodo.test(cadena)){
                        cadenaMetodo = cadena.split(/\(/)[0]
                        parametros = cadena.split(/\(/)[1]
                        cadenaMetodo = cadenaMetodo.split(espacio)
                        cadenaMetodo.shift()
                        if(parametros != undefined){
                            parametros = parametros.replace(/\s*,\s*/,',').replace(/\)/,'')
                            parametros = parametros.split(',')
                            for (let i = 0; i < parametros.length; i++) {
                                var p = parametros[i];
                                p = p.split(espacio)
                                if(p != '') parametros[i] = {tipoVariable: p[0], variable: p[1]}
                                else parametros.splice(i,1)
                            }
                        }
                        
                        if(modificadorAccesoValido.test(cadenaMetodo[0])){
                            clase.metodos.push({modificadorAcceso: cadenaMetodo[0], tipoMetodo: cadenaMetodo[1], nombreMetodo: cadenaMetodo[2], parametros: parametros})
                        }
                        else{
                            errores.push({text: `Modificador de acceso no valido - linea ${i+1}`, color: 'danger'})
                        }
                    }
                    else if (cierreBloque.test(cadena)){
                        estaBloqueCerrado = true
                    }
                    else if (cadena.replace(espacio,'') == ""){
                        i++;
                    }
                    else{
                        errores.push({text: `error de sintaxis - declaracion de metodo - linea ${i+1}`, color: 'danger'})
                    }
                }
            }
            else{
                errores.push({text: `${cadena.split(espacio)[1]} no es una clase - linea ${i+1}`, color: 'danger'})
            }
        }
        else if (cadena.replace(espacio,'') == ""){
        }
        else{
            errores.push({text: `error de sintaxis en la linea ${i+1}`, color: 'danger'})
        }
    }
    contenidoDiagrama.forEach(clase => {
        if(clase.atributos.length < 1) addError(`La clase ${clase.nombreClase} no tiene atributos asignados`, 'warning')
        if(clase.metodos.length < 1) addError(`La clase ${clase.nombreClase} no tiene metodos asignados`, 'warning')
    });
    console.log(contenidoDiagrama)
    dibujar()
    mostrarSalida();
}

function addError(mensaje, color){
    errores.push({text: mensaje, color: color})
}

//redimeciona la altura del textarea
function autosize(){
  var el = this;
  setTimeout(function(){
    el.style.cssText = 'height:auto; padding:0';
    el.style.cssText = 'height:' + el.scrollHeight + 'px';
  },0);
}

//pinta los numero de las filas del codigo en el div lateral izquierdo
function mostrarSalida() {
    output.innerHTML = '';
    for (let f = 0; f < errores.length; f++) {
        const errorMesage = errores[f];
        output.innerHTML += `<div class="alert alert-${errorMesage.color}" role="alert">${errorMesage.text}</div>`
    }
}

function dibujar(){
    var src = ''
    for (let i = 0; i < contenidoDiagrama.length; i++) {
        const clase = contenidoDiagrama[i];
        src += `[ ${clase.nombreClase} | `
        clase.atributos.forEach(atributo => {
            if(clase.atributos.indexOf(atributo) == clase.atributos.length -1) src += ` ${atributo.nombreAtributo}: ${atributo.tipoAtributo} | `
            else src += ` ${atributo.nombreAtributo}: ${atributo.tipoAtributo} ; `
        });
        clase.metodos.forEach(metodo => {
            if(clase.metodos.indexOf(metodo) == clase.metodos.length -1) src += ` ${metodo.nombreMetodo}() `
            else src += ` ${metodo.nombreMetodo}() ; `
        });
        src += `] \n`
        clase.relaciones.forEach(relacion => {
            let rel
            switch (relacion.tipoRelacion) {
                case 'ASOCIACION':
                    rel = '-'
                    break;
                case 'HERENCIA':
                    rel = '-:>'
                    break;
                case 'AGREGACION':
                    rel = 'o->'
                    break;
                case 'COMPOSICION':
                    rel = '+->'
                    break;
                case 'DEPENDENCIA':
                    rel = '-->'
                    break; 
                case 'REALIZACION':
                    rel = '--:>'
                    break;    
                default:
                    break;
            }
            src += ` [${clase.nombreClase}] ${rel} [${relacion.claseRelacionada}] \n`
        });
    }
    nomnoml.draw(canvas, src);
}