//objetos HTML
var code = document.getElementById("codeArea");
var output = document.getElementById("output");
var filas = document.getElementById("idFilas");

//event listener
code.addEventListener('keydown', autosize);

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
const relacion = /^[A-Z]+/
const relacionTipo = /^(ASOCIACION|HERENCIA|AGREGACION|COMPOSICION|DEPENDENCIA|REALIZACION)/
const relacionClases = /\s+[A-Z][A-Za-z_]*\s+->\s+[A-Z][A-Za-z_]*(\s+(\(\s*[A-Z][A-Z_]*\s*,\s*[A-Z][A-Z_]*\s*\)\s*(\s<{2}[a-z](,\s*[a-z]|[a-z])*>{2}|)|<{2}[a-z](,\s*[a-z]|[a-z])*>{2})|)\s*;$/
const atributo = /^Atributos\s+[A-Z][A-Za-z]*\s+{$/
const bloqueAtributo = /^\{(\s|[a-z]+\s+[A-Za-z]+\s+[A-Za-z][A-Za-z_]*\s*,)*[a-z]+\s+[A-Za-z]+\s+[A-Za-z][A-Za-z_]*\s*\}$/
const metodo = /^Metodos\s+[A-Z][A-Za-z]*\s+{$/
const bloqueMetodo = /^{(\s|[a-z]+\s+[A-Za-z]+\s+[A-Za-z_]+(\s+\(\s*[A-Za-z]+\s+[A-Za-z]+(,\s*[A-Za-z]+\s+[A-Za-z]+)*(\s(\s|,\s*[A-Za-z]+\s+[A-Za-z]+)*|)\)|)\s*,)*[a-z]+\s+[A-Za-z]+\s+[A-Za-z_]+(\s+\(\s*[A-Za-z]+\s+[A-Za-z]+(,\s*[A-Za-z]+\s+[A-Za-z]+)*(\s(\s|,\s*[A-Za-z]+\s+[A-Za-z]+)*|)\)|)\s*}$/
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
function analizarCodigoPass() {
    errores = [];
    contenidoDiagrama = [];
    linesCode = code.value.split('\n');
    for (let i = 0; i < linesCode.length; i++) {
        let cadena = linesCode[i];
        if (relacion.test(cadena)){
            let relacion = [];
            let claseRelacion
            let propiedadRelacion = []
            cadena = cadena.replace(';','')
            relacion = cadena.split(abrirParentesis);
            if (cadena.search(/</) >= 0){
                relacion.push(relacion[relacion.length-1].split(/<</)[1])
                relacion[relacion.length-2] = relacion[relacion.length-2].split(/</)[0]
            }
            claseRelacion = relacion[0].split(espacio)
            claseRelacion.splice(2,1);
            if(claseRelacion[claseRelacion.length-1] == "")claseRelacion.pop();
            claseRelacion[1] = contenidoDiagrama.find(diagrama =>  diagrama.nombreClase == claseRelacion[1]);
            claseRelacion[2] = contenidoDiagrama.find(diagrama =>  diagrama.nombreClase == claseRelacion[2]);
            if(claseRelacion[1] == undefined || claseRelacion[2] == undefined) errores.push({text: `La clase no ha sido definida - linea ${i+1}`, color: 'danger'})
            else{
                try {
                    if (relacion[1].search(/\)/) >= 0){
                        propiedadRelacion.push(relacion[1].replace(/\)/,'').replace(espacio,'').split(','))
                        if (relacion.length > 2) propiedadRelacion.push(relacion[2].replace(/>>/,'').replace(espacio,'').split(','))
                        else propiedadRelacion.push([])
                    }else {
                        propiedadRelacion.push([])
                        propiedadRelacion.push(relacion[1].replace(/>>/,'').replace(espacio,'').split(','))
                    }
                } catch (error) {
                    propiedadRelacion.push([])
                    propiedadRelacion.push([])
                }
                claseRelacion[1].relaciones.push({claseRelacionada: claseRelacion[2].nombreClase, tipoRelacion: claseRelacion[0], cardinalidad: propiedadRelacion[0], keyWord: propiedadRelacion[1]})
            }
        }
        else if (atributo.test(cadena)){
            let cierraBloque = false;
            cadena = cadena.split(espacio)
            cadena[1] = contenidoDiagrama.find(diagrama =>  diagrama.nombreClase == cadena[1]);
            if(cadena[1] == undefined) errores.push({text: `La clase no ha sido definida - linea ${i+1}`, color: 'danger'})

            for (let j = i+1; j < linesCode.length;) {
                const line = linesCode[j];
                cadena[2] = cadena[2] +" "+ line
                linesCode.splice(j,1);                
                if (line.search(/}/) >= 0){
                    cierraBloque = true
                    break;
                }
            }
            if (!cierraBloque) errores.push({text: `Se esperaba '}' - linea ${i+1}`, color: 'danger'})

            if (bloqueAtributo.test(cadena[2])){
                cadena[2] = cadena[2].replace(/{/,'').replace(/}/,'').split(',')

                for (let j = 0; j < cadena[2].length; j++) {
                    const element = cadena[2][j].split(espacio);
                    for (let k = 0; k < element.length; k++) {
                        const word = element[k];
                        if(word == "") element.splice(k,1)
                    }
                    cadena[1].atributos.push({nombreAtributo: element[2], modificadorAcceso: element[0], tipoAtributo: element[1]})
                }
            }
            else{
                errores.push({text: `Error de sintaxis en bloque de atributo - linea ${i+1}`, color: 'danger'})
            }

            
        }
        else if (metodo.test(cadena)){
            let cierraBloque = false;
            cadena = cadena.split(espacio)
            cadena[1] = contenidoDiagrama.find(diagrama =>  diagrama.nombreClase == cadena[1]);
            if(cadena[1] == undefined) errores.push({text: `La clase no ha sido definida - linea ${i+1}`, color: 'danger'})

            for (let j = i+1; j < linesCode.length;) {
                const line = linesCode[j];
                cadena[2] = cadena[2] +"\n"+ line
                linesCode.splice(j,1);                
                if (line.search(/}/) >= 0){
                    cierraBloque = true
                    break;
                }
            }
            if (!cierraBloque) errores.push({text: `Se esperaba '}' - linea ${i+1}`, color: 'danger'})

            if (bloqueMetodo.test(cadena[2])){
                cadena[2] = cadena[2].replace(/{/,'').replace(/}/,'').split('\n')
                cadena[2].pop()
                cadena[2].shift()
                
                for (let j = 0; j < cadena[2].length; j++) {
                    const element = cadena[2][j].split(/\(/);
                    let word = element[0];
                    word = word.split(espacio)
                    for (let k = 0; k < word.length; k++) {
                        if(word[k] == "") word.splice(k,1) 
                    }
                    console.log(word);
                    element[0] = word
                    if(element.length > 1){
                        let params = element[1];
                        params = params.replace(/\s*/,'').replace(/\)/,'').split(',')
                        for (let k = 0; k < params.length; k++) {
                            if(params[k] == "") params.splice(k,1)   
                        }
                        for (let k = 0; k < params.length; k++) {
                            params[k] = params[k].split(/\s+/)  
                        }
                        element[1] = params
                    }
                    console.log(element)
                }
            }
            else{
                errores.push({text: `Error de sintaxis en bloque de metodo - linea ${i+1}`, color: 'danger'})
            }

            console.log(cadena);
        }
        else if (cadena.replace(espacio,'') == ""){
            console.log('linea en blanco');
        }
        else{
            console.log(`error en la linea ${i+1}`)
            errores.push({text: `error de sintaxis en la linea ${i+1}`, color: 'danger'})
        }
    }
    console.log(contenidoDiagrama)
    mostrarSalida();
}

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
            cadena = cadena.split(/\(/);
            let tipoAsociacion = cadena[0].split(espacio)[0]
            let kw
            if(relacionTipo.test(cadena)){
                if (cadena.search(/</) >= 0){
                    relacion.push(relacion[relacion.length-1].split(/<</)[1])
                    kw = relacion[relacion.length-2].split(/</)[0]
                }
            }
            else errores.push({text: `${tipoAsociacion} no es un tipo de relacion - linea ${i+1}`, color: 'danger'})
        }
        else if (atributo.test(cadena)){
            
        }
        else if (metodo.test(cadena)){
            
        }
        else if (cadena.replace(espacio,'') == ""){
            console.log('linea en blanco');
        }
        else{
            console.log(`error en la linea ${i+1}`)
            errores.push({text: `error de sintaxis en la linea ${i+1}`, color: 'danger'})
        }
    }
    console.log(contenidoDiagrama)
    mostrarSalida();
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