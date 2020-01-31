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
const clase = /^Clase\s+[A-Z][A-Za-z_]*(\s+<{2}[a-z]([a-z]|,\s*[a-z])*>{2}|)\s*;$/
const relacion = /^[A-Z]+\s+[A-Z][A-Za-z_]*\s+->\s+[A-Z][A-Za-z_]*(\s+(\(\s*[A-Z][A-Z_]*\s*,\s*[A-Z][A-Z_]*\s*\)\s*(\s<{2}[a-z](,\s*[a-z]|[a-z])*>{2}|)|<{2}[a-z](,\s*[a-z]|[a-z])*>{2})|)\s*;$/
const atributo = /^\{(\s|[a-z]+\s+[A-Za-z]+\s+[A-Za-z][A-Za-z_]*\s*,)*[a-z]+\s+[A-Za-z]+\s+[A-Za-z][A-Za-z_]*\s*\}$/
const metodo = /^{(\s|[A-Z]+\s+[A-Za-z]+\s+[A-Za-z_]+(\s+\(\s*[A-Za-z]+\s+[A-Za-z]+(,\s*[A-Za-z]+\s+[A-Za-z]+)*(\s(\s|,\s*[A-Za-z]+\s+[A-Za-z]+)*|)\)|))/
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
    linesCode = code.value.split('\n');
    console.log(linesCode);
    for (let i = 0; i < linesCode.length; i++) {
        const cadena = linesCode[i];
        if (clase.test(cadena)){
            contenidoDiagrama.push({nombreClase: cadena.split(espacio)[1].replace(';',''), atributos: [], metodos: [], relaciones: []})
        }
        else if (relacion.test(cadena)){
            let rel = cadena.split(abrirParentesis);
            let claseRelacion = rel[0].split(espacio)
            console.log(claseRelacion);
            claseRelacion.splice(0,1);
            claseRelacion.splice(1,1);
            claseRelacion.pop();
            claseRelacion[0] = contenidoDiagrama.find(diagrama =>  diagrama.nombreClase == claseRelacion[0]);
            claseRelacion[1] = contenidoDiagrama.find(diagrama =>  diagrama.nombreClase == claseRelacion[1]);
            if(claseRelacion[0] == undefined || claseRelacion[1] == undefined) errores.push({text: `La clase no ha sido definida - la linea ${i+1}`, color: 'danger'})
            else{
                let propiedadRelacion = rel[1].replace(espacio,'').replace(');','').split(',')
                claseRelacion[0].relaciones.push({claseRelacionada: claseRelacion[1].nombreClase,tipoRelacion: propiedadRelacion[0]})
            }
        }
        // else if (atributo.test(cadena)){
        //     let rel = cadena.split(espacio);
        //     console.log(rel);
        // }
        // else if (metodo.test(cadena)){
        //     console.log('relacioon correcta');
        // }
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