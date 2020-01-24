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
const clase = /^Clase:\s[A-Z][a-zA-Z_]*(\s<{2}[A-Za-z,]*>{2}|);$/
const relacion = /^[A-Z]*\s[A-Z][a-zA-Z_]*\s->\s[A-Z][a-zA-Z_]*\s/
const atributo;
const metodo;

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
            contenidoDiagrama.push({nombreClase: cadena.split(' ')[1].replace(';',''), atributos: [], metodos: [], relaciones: []})
        }
        else if (clase.test(cadena)){

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